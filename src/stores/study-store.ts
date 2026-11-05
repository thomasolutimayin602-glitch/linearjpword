import { create } from 'zustand'
import { db } from '../db/schema'
import { WORDS, WORDS_BY_ID } from '../data/words'
import { DEFAULT_BOOK_ID } from '../content/books'
import { contentProvider } from '../content/provider'
import type {
  DailyPlan, DrillMode, GuestTrial, SenseState, SessionProgress, SessionRecord, Settings, UserProfile, WordBook,
} from '../types'
import { DEFAULT_SETTINGS, DRILL_ORDER, GUEST_TRIAL_LIMIT } from '../types'
import {
  advanceLadder, buildOptions, buildStudyPlan, freshState,
  noteMode, resetLadder, REVIEW_LADDER,
  type Question,
} from '../engine/review-scheduler'
import { gradeKana, gradeSpelling } from '../engine/romaji'
import { resolveSessionCursor } from '../engine/session-resume'
import { dayKey } from '../lib/date'

export type RunningState = 'idle' | 'drill' | 'summary'

interface Snapshot {
  recBefore: SenseState
  passWrongBefore: boolean
  doneBefore: { correct: number; wrong: number; sensePasses: number }
  sessionBefore: SessionRecord | null
}

interface Runtime {
  state: RunningState
  queue: number[]
  current: number | null
  modePos: number          // index into DRILL_ORDER for `current`
  passWrong: boolean       // this sense's pass has had a mistake
  question: Question | null
  questionAt: number | null
  feedback: { correct: boolean; guessed?: boolean; picked?: number } | null
  lastUndo: Snapshot | null
  done: { correct: number; wrong: number; sensePasses: number }
}

interface StudyState {
  states: Map<number, SenseState>
  settings: Settings
  books: WordBook[]
  bookId: string
  hydrated: boolean
  profile: UserProfile | null
  plan: DailyPlan | null
  pausedSession: SessionRecord | null
  guest: GuestTrial
  policyAccepted: boolean
  bootstrapped: boolean
  runtime: Runtime
  session: SessionRecord | null

  hydrate: () => Promise<void>
  bootstrap: () => Promise<void>
  acceptPolicy: () => Promise<void>
  saveProfile: (draft: ProfileDraft) => Promise<UserProfile>
  setCurrentBook: (bookId: string) => Promise<void>
  ensureTodayPlan: (regenerate?: boolean) => Promise<DailyPlan>
  refreshTodayPlan: () => Promise<DailyPlan>
  startSession: () => Promise<boolean>
  startPractice: (senseId: number) => Promise<boolean>
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<boolean>
  _completeMode: (mode: DrillMode, correct: boolean, guessed?: boolean, picked?: number) => void
  answerMeaningWord: (index: number) => void
  answerSpelling: (text: string) => void
  answerExample: (correct: boolean) => void
  notSure: () => void
  undo: () => void
  proceed: () => void
  finish: () => Promise<void>
  quit: () => Promise<void>
  togglePin: (id: number) => Promise<void>
  archiveSense: (id: number, graduated?: boolean) => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
}

export type ProfileDraft = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>

const LOCAL_PROFILE_ID = 'local-profile'
const META_POLICY = 'policyAcceptedAt'
const META_GUEST = 'guestTrial'
const META_BOOK = 'currentBookId'

const EMPTY: Runtime = {
  state: 'idle', queue: [], current: null, modePos: 0,
  passWrong: false, question: null, questionAt: null,
  feedback: null, lastUndo: null,
  done: { correct: 0, wrong: 0, sensePasses: 0 },
}

function progressFrom(runtime: Runtime): SessionProgress {
  return {
    queue: [...runtime.queue],
    current: runtime.current,
    modePos: runtime.modePos,
    passWrong: runtime.passWrong,
    question: runtime.question ? { ...runtime.question, options: [...runtime.question.options] } : null,
    feedback: runtime.feedback ? { ...runtime.feedback } : null,
    done: { ...runtime.done },
  }
}

function withProgress(
  session: SessionRecord,
  runtime: Runtime,
  status: NonNullable<SessionRecord['status']> = 'running',
): SessionRecord {
  return {
    ...session,
    status,
    progress: progressFrom(runtime),
    lastActiveAt: Date.now(),
  }
}

async function closeOpenSessions(): Promise<void> {
  const open = await db.sessions.filter(session => session.finishedAt === null).toArray()
  if (open.length === 0) return
  const now = Date.now()
  await db.sessions.bulkPut(open.map(session => ({
    ...session,
    finishedAt: now,
    durationMs: Math.max(session.durationMs, now - session.startedAt),
    checkedIn: false,
    status: 'finished' as const,
    lastActiveAt: now,
  })))
}

function speak(kana: string) {
  try {
    const sy = window.speechSynthesis
    if (!sy) return
    const doSpeak = () => {
      const u = new SpeechSynthesisUtterance(kana)
      u.lang = 'ja-JP'
      u.rate = 0.9
      sy.speak(u)
      sy.resume()
    }
    if (sy.speaking || sy.pending) {
      sy.cancel()
      setTimeout(doSpeak, 80)
    } else {
      doSpeak()
    }
  } catch {
    /* noop */
  }
}

/** Mode at a given position — listen is skipped (it is a pass-through step). */
function modeAt(pos: number): DrillMode {
  return DRILL_ORDER[Math.min(pos, DRILL_ORDER.length - 1)]
}

function buildQuestionFor(senseId: number, pos: number, mastery: number, useNoneMin: number): Question {
  const mode = modeAt(pos)
  if (mode === 'meaning') return buildOptions(senseId, 'meaning', mastery >= useNoneMin)
  if (mode === 'word') return buildOptions(senseId, 'kana', mastery >= useNoneMin)
  return { options: [], correct: -1 }
}

function persist(rec: SenseState) {
  void db.states.put(rec)
}

export const useStudyStore = create<StudyState>((set, get) => ({
  states: new Map(),
  settings: DEFAULT_SETTINGS,
  books: [],
  bookId: DEFAULT_BOOK_ID,
  hydrated: false,
  profile: null,
  plan: null,
  pausedSession: null,
  guest: { answered: 0, limit: GUEST_TRIAL_LIMIT },
  policyAccepted: false,
  bootstrapped: false,
  runtime: EMPTY,
  session: null,

  hydrate: async () => {
    if (get().hydrated) return
    const [rows, settingsRows, books] = await Promise.all([
      db.states.toArray(),
      db.settings.toArray(),
      contentProvider.listBooks(),
    ])
    const states = new Map<number, SenseState>()
    for (const r of rows) {
      states.set(r.senseId, {
        ...r,
        modeStats: {
          ...freshState(r.senseId).modeStats,
          ...r.modeStats,
        },
      })
    }
    for (const w of WORDS) {
      if (!states.has(w.id)) states.set(w.id, freshState(w.id))
    }
    await db.states.bulkPut([...states.values()])
    const settings: Settings =
      settingsRows.length > 0 ? { ...DEFAULT_SETTINGS, ...settingsRows[0] } : DEFAULT_SETTINGS
    set({ states, settings, books, hydrated: true })
  },

  bootstrap: async () => {
    if (get().bootstrapped) return
    await get().hydrate()
    const [profile, metaRows, openSessions] = await Promise.all([
      db.profiles.get(LOCAL_PROFILE_ID),
      db.meta.toArray(),
      db.sessions.filter(session => session.finishedAt === null).toArray(),
    ])
    const meta = new Map(metaRows.map(row => [row.key, row.value]))
    const storedGuest = meta.get(META_GUEST) as Partial<GuestTrial> | undefined
    const guest: GuestTrial = {
      answered: Math.max(0, Number(storedGuest?.answered) || 0),
      limit: Math.max(1, Number(storedGuest?.limit) || GUEST_TRIAL_LIMIT),
    }
    const books = get().books
    const storedBookId = typeof meta.get(META_BOOK) === 'string' ? meta.get(META_BOOK) as string : null
    const selectedBookId = [profile?.bookId, storedBookId, DEFAULT_BOOK_ID]
      .find(id => id && books.some(book => book.id === id)) ?? DEFAULT_BOOK_ID
    const normalizedProfile = profile
      ? { ...profile, bookId: selectedBookId }
      : null
    if (normalizedProfile && profile?.bookId !== selectedBookId) {
      await db.profiles.put(normalizedProfile)
    }
    openSessions.sort((a, b) => a.startedAt - b.startedAt)
    const pausedSession = openSessions.at(-1) ?? null
    const staleSessions = openSessions.slice(0, -1)
    if (staleSessions.length > 0) {
      const now = Date.now()
      await db.sessions.bulkPut(staleSessions.map(session => ({
        ...session,
        finishedAt: now,
        durationMs: Math.max(session.durationMs, now - session.startedAt),
        checkedIn: false,
        status: 'finished' as const,
        lastActiveAt: now,
      })))
    }
    set({
      profile: normalizedProfile,
      bookId: selectedBookId,
      pausedSession,
      guest,
      policyAccepted: Boolean(meta.get(META_POLICY)),
      bootstrapped: true,
    })
    await get().ensureTodayPlan()
  },

  acceptPolicy: async () => {
    const acceptedAt = Date.now()
    await db.meta.put({ key: META_POLICY, value: acceptedAt })
    set({ policyAccepted: true })
  },

  saveProfile: async (draft) => {
    const existing = get().profile
    const now = Date.now()
    const bookId = get().books.some(book => book.id === draft.bookId) ? draft.bookId : DEFAULT_BOOK_ID
    const profile: UserProfile = {
      ...draft,
      bookId,
      id: LOCAL_PROFILE_ID,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    await db.profiles.put(profile)
    await get().updateSettings({ dailyNewWords: profile.dailyNewWords })
    set({ profile, bookId })
    await get().ensureTodayPlan(true)
    return profile
  },

  setCurrentBook: async (bookId) => {
    const book = get().books.find(item => item.id === bookId)
    if (!book) return

    const existing = get().profile
    if (existing) {
      const profile = { ...existing, bookId, updatedAt: Date.now() }
      await db.profiles.put(profile)
      set({ profile, bookId })
    } else {
      await db.meta.put({ key: META_BOOK, value: bookId })
      set({ bookId })
    }
    await get().ensureTodayPlan(true)
  },

  ensureTodayPlan: async (regenerate = false) => {
    await get().hydrate()
    const date = dayKey()
    const { states, settings, profile, bookId, books } = get()
    const planId = `plan-${date}-${bookId}`
    const legacyPlanId = `plan-${date}`
    const stored = await db.plans.get(planId)
    const current = get().plan
    if (!regenerate) {
      const existing = current?.id === planId ? current : stored ?? null
      if (existing) {
        if (existing !== current) set({ plan: existing })
        return existing
      }
      if (bookId === DEFAULT_BOOK_ID) {
        const legacy = await db.plans.get(legacyPlanId)
        if (legacy?.date === date) {
          const migrated: DailyPlan = { ...legacy, bookId, id: planId }
          await db.plans.put(migrated)
          set({ plan: migrated })
          return migrated
        }
      }
    }
    const book = books.find(item => item.id === bookId)
    const allowedIds = new Set(book?.wordIds ?? WORDS.map(word => word.id))
    const built = buildStudyPlan(states, settings.dailyNewWords, Date.now(), allowedIds)
    const previous = [
      current?.id === planId ? current : null,
      stored ?? null,
    ].find(item => item?.date === date) ?? null
    const now = Date.now()
    const plan: DailyPlan = {
      id: planId,
      date,
      profileId: profile?.id ?? null,
      bookId,
      queue: built.queue,
      newIds: built.newIds,
      dueIds: built.dueIds,
      completedIds: previous?.completedIds ?? [],
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }
    await db.plans.put(plan)
    set({ plan })
    return plan
  },

  refreshTodayPlan: async () => {
    const expectedId = `plan-${dayKey()}-${get().bookId}`
    const current = get().plan
    if (current?.id === expectedId) return current
    return get().ensureTodayPlan()
  },

  startSession: async () => {
    await get().hydrate()
    const { states, settings, guest, profile } = get()
    if (!profile && guest.answered >= guest.limit) return false
    const dailyPlan = await get().ensureTodayPlan()
    const sessionIds = dailyPlan.queue.filter(id => {
      const rec = states.get(id)
      return rec && rec.status !== 'archived' && !dailyPlan.completedIds.includes(id)
    })
    if (sessionIds.length === 0) return false
    const [first, ...queue] = sessionIds

    const now = Date.now()
    await closeOpenSessions()
    const rec = states.get(first)!
    const question = buildQuestionFor(first, 0, rec.mastery, settings.noneOptionMinMastery)
    const runtime: Runtime = {
      ...EMPTY,
      state: 'drill',
      queue,
      current: first,
      modePos: 0,
      question,
      questionAt: now,
    }
    const newSenses = sessionIds.filter(id => states.get(id)?.status === 'new').length
    const session = withProgress({
      id: `s-${now}`,
      date: dayKey(),
      startedAt: now,
      finishedAt: null,
      checkedIn: false,
      newSenses,
      reviewedSenses: sessionIds.length - newSenses,
      correct: 0,
      wrong: 0,
      durationMs: 0,
      completedSenses: 0,
      senseIds: sessionIds,
      wrongSenseIds: [],
    }, runtime)
    await db.sessions.put(session)

    set({
      session,
      pausedSession: null,
      runtime,
    })
    return true
  },

  startPractice: async (senseId: number) => {
    await get().hydrate()
    const { states, settings, guest, profile } = get()
    if (!profile && guest.answered >= guest.limit) return false
    const rec = states.get(senseId)
    if (!rec || rec.status === 'archived') return false
    const now = Date.now()
    await closeOpenSessions()
    const question = buildQuestionFor(senseId, 0, rec.mastery, settings.noneOptionMinMastery)
    const runtime: Runtime = {
      ...EMPTY,
      state: 'drill',
      current: senseId,
      question,
      questionAt: now,
    }
    const session = withProgress({
      id: `practice-${now}`,
      date: dayKey(),
      startedAt: now,
      finishedAt: null,
      checkedIn: false,
      newSenses: rec.status === 'new' ? 1 : 0,
      reviewedSenses: rec.status === 'new' ? 0 : 1,
      correct: 0,
      wrong: 0,
      durationMs: 0,
      completedSenses: 0,
      senseIds: [senseId],
      wrongSenseIds: [],
    }, runtime)
    await db.sessions.put(session)
    set({
      session,
      pausedSession: null,
      runtime,
    })
    return true
  },

  pauseSession: async () => {
    const runtime = get().runtime
    const currentSession = get().session
    if (runtime.state !== 'drill' || !currentSession) {
      set({ runtime: { ...EMPTY } })
      return
    }
    const now = Date.now()
    const paused = withProgress({
      ...currentSession,
      durationMs: Math.max(currentSession.durationMs, now - currentSession.startedAt),
    }, runtime, 'paused')
    await db.sessions.put(paused)
    set({ session: paused, pausedSession: paused, runtime: { ...EMPTY } })
  },

  resumeSession: async () => {
    await get().hydrate()
    const paused = get().pausedSession
    if (!paused || paused.finishedAt !== null) {
      set({ pausedSession: null })
      return false
    }

    const { states, settings } = get()
    const completed = new Set(get().plan?.completedIds ?? [])
    const resumable = (id: number) => !completed.has(id) && states.get(id)?.status !== 'archived'
    const saved = paused.progress
    const { queue, current, modePos, passWrong, feedback, done } = resolveSessionCursor(
      paused,
      id => states.has(id) && resumable(id),
    )

    if (current === null) {
      const now = Date.now()
      const finished: SessionRecord = {
        ...paused,
        finishedAt: now,
        durationMs: Math.max(paused.durationMs, now - paused.startedAt),
        checkedIn: false,
        status: 'finished',
        lastActiveAt: now,
      }
      await db.sessions.put(finished)
      set({ pausedSession: null, session: finished })
      return false
    }

    const rec = states.get(current)
    const question = saved?.question
      ? { ...saved.question, options: [...saved.question.options] }
      : buildQuestionFor(current, modePos, rec?.mastery ?? 0, settings.noneOptionMinMastery)
    const runtime: Runtime = {
      ...EMPTY,
      state: 'drill',
      queue,
      current,
      modePos,
      passWrong,
      question,
      questionAt: feedback ? null : Date.now(),
      feedback,
      done,
    }
    const session = withProgress({ ...paused, status: 'running' }, runtime)
    await db.sessions.put(session)
    set({ session, pausedSession: null, runtime })
    return true
  },

  _completeMode: (mode: DrillMode, correct: boolean, guessed = false, picked?: number) => {
    const r = get().runtime
    const cur = r.current
    if (cur == null) return

    const rec = get().states.get(cur)!
    if (!get().profile) {
      const guest = get().guest
      const nextGuest = { ...guest, answered: Math.min(guest.limit, guest.answered + 1) }
      set({ guest: nextGuest })
      void db.meta.put({ key: META_GUEST, value: nextGuest })
    }
    const effective = guessed ? false : correct
    const updated = noteMode(rec, mode, effective)
    const states = new Map(get().states).set(cur, updated)
    const passWrong = r.passWrong || !effective
    const lastUndo: Snapshot = {
      recBefore: rec,
      passWrongBefore: r.passWrong,
      doneBefore: r.done,
      sessionBefore: get().session,
    }

    const nextRuntime: Runtime = {
      ...r,
      passWrong,
      feedback: { correct: effective, guessed: guessed && correct, picked },
      lastUndo,
      questionAt: null,
      done: {
        correct: r.done.correct + (effective ? 1 : 0),
        wrong: r.done.wrong + (effective ? 0 : 1),
        sensePasses: r.done.sensePasses,
      },
    }
    const currentSession = get().session
    const session = currentSession ? withProgress({
      ...currentSession,
      correct: currentSession.correct + (effective ? 1 : 0),
      wrong: currentSession.wrong + (effective ? 0 : 1),
      wrongSenseIds: effective
        ? currentSession.wrongSenseIds
        : [...new Set([...(currentSession.wrongSenseIds ?? []), cur])],
    }, nextRuntime) : null

    set({
      states,
      session,
      runtime: nextRuntime,
    })
    persist(updated)
    if (session) void db.sessions.put(session)
  },

  answerMeaningWord: (index: number) => {
    const r = get().runtime
    if (r.feedback || r.question == null || r.current == null) return
    const mode: DrillMode = modeAt(r.modePos)
    if (mode !== 'meaning' && mode !== 'word') return
    const isCorrect = index === r.question.correct
    let guessed = false
    if (isCorrect && get().settings.guessAsWrong && r.questionAt != null) {
      guessed = Date.now() - r.questionAt < 1200
    }
    get()._completeMode(mode, isCorrect, guessed, index)
  },

  answerSpelling: (text: string) => {
    const r = get().runtime
    if (r.feedback || r.current == null) return
    if (modeAt(r.modePos) !== 'spell') return
    const w = WORDS_BY_ID.get(r.current)!
    const kanaGrade = gradeKana(text, w.kana, get().settings.strictSpelling)
    const romajiGrade = gradeSpelling(text, w.kana, get().settings.strictSpelling)
    const correct = kanaGrade.correct || romajiGrade.correct
    let guessed = false
    if (correct && get().settings.guessAsWrong && r.questionAt != null && Date.now() - r.questionAt < 1200) {
      guessed = true
    }
    get()._completeMode('spell', correct, guessed)
  },

  answerExample: (correct: boolean) => {
    const r = get().runtime
    if (r.feedback || r.current == null || modeAt(r.modePos) !== 'example') return
    get()._completeMode('example', correct)
  },

  notSure: () => {
    const r = get().runtime
    if (r.feedback || r.current == null) return
    const mode: DrillMode = modeAt(r.modePos)
    if (mode === 'listen') return
    get()._completeMode(mode, false)
  },

  undo: () => {
    const r = get().runtime
    if (!r.feedback || !r.lastUndo || r.current == null) return
    const { recBefore, passWrongBefore, doneBefore, sessionBefore } = r.lastUndo
    const cur = r.current
    if (!get().profile && get().guest.answered > 0) {
      const nextGuest = { ...get().guest, answered: get().guest.answered - 1 }
      set({ guest: nextGuest })
      void db.meta.put({ key: META_GUEST, value: nextGuest })
    }
    const states = new Map(get().states).set(cur, recBefore)
    const nextRuntime: Runtime = {
      ...r,
      passWrong: passWrongBefore,
      done: doneBefore,
      feedback: null,
      lastUndo: null,
      questionAt: Date.now(),
    }
    const session = sessionBefore ? withProgress(sessionBefore, nextRuntime) : null
    set({
      states,
      session,
      runtime: nextRuntime,
    })
    persist(recBefore)
    if (session) void db.sessions.put(session)
  },

  proceed: () => {
    const r = get().runtime
    if (r.state !== 'drill' || r.current == null) return
    // Listen mode advances without an answer
    if (!r.feedback && modeAt(r.modePos) === 'listen') {
      const nextPos = 1
      const cur = r.current
      const rec = get().states.get(cur)!
      const question = buildQuestionFor(cur, nextPos, rec.mastery, get().settings.noneOptionMinMastery)
      const runtime: Runtime = { ...r, modePos: nextPos, feedback: null, lastUndo: null, question, questionAt: Date.now() }
      const currentSession = get().session
      const session = currentSession ? withProgress(currentSession, runtime) : null
      set({ session, runtime })
      if (session) void db.sessions.put(session)
      return
    }
    if (!r.feedback) return
    const cur = r.current
    const rec = get().states.get(cur)!

    const isLastMode = r.modePos === DRILL_ORDER.length - 1
    if (!isLastMode) {
      const nextPos = r.modePos + 1
      const question = buildQuestionFor(cur, nextPos, rec.mastery, get().settings.noneOptionMinMastery)
      const runtime: Runtime = {
        ...r,
        modePos: nextPos,
        feedback: null,
        lastUndo: null,
        question,
        questionAt: Date.now(),
      }
      const currentSession = get().session
      const session = currentSession ? withProgress(currentSession, runtime) : null
      set({ session, runtime })
      if (session) void db.sessions.put(session)
      return
    }

    // ===== pass finished =====
    let nextRec: SenseState
    let queue = [...r.queue]
    const done = { ...r.done, sensePasses: r.done.sensePasses + 1 }
    const dailyPlan = get().plan
    if (!r.passWrong && dailyPlan && dailyPlan.date === dayKey() && dailyPlan.queue.includes(cur) && !dailyPlan.completedIds.includes(cur)) {
      const updatedPlan: DailyPlan = {
        ...dailyPlan,
        completedIds: [...dailyPlan.completedIds, cur],
        updatedAt: Date.now(),
      }
      set({ plan: updatedPlan })
      void db.plans.put(updatedPlan)
    }

    if (!r.passWrong) {
      nextRec = advanceLadder(rec)
    } else {
      nextRec = resetLadder(rec)
      queue.push(cur)  // short-term repetition
    }

    const states = new Map(get().states).set(cur, nextRec)
    void db.states.put(nextRec)

    const next = queue.shift() ?? null
    const currentSession = get().session

    if (next === null) {
      const now = Date.now()
      const summaryRuntime: Runtime = { ...EMPTY, state: 'summary', done }
      const finished = currentSession ? {
        ...withProgress({
          ...currentSession,
          completedSenses: (currentSession.completedSenses ?? 0) + 1,
        }, summaryRuntime, 'finished'),
        finishedAt: now,
        durationMs: Math.max(currentSession.durationMs, now - currentSession.startedAt),
        checkedIn: true,
        lastActiveAt: now,
      } : null
      if (finished) void db.sessions.put(finished)
      set({ states, session: finished, pausedSession: null, runtime: summaryRuntime })
      return
    }

    const nextRecState = get().states.get(next)!
    const question = buildQuestionFor(next, 0, nextRecState.mastery, get().settings.noneOptionMinMastery)
    const runtime: Runtime = {
      ...r,
      queue,
      current: next,
      modePos: 0,
      passWrong: false,
      feedback: null,
      lastUndo: null,
      question,
      questionAt: Date.now(),
      done,
    }
    const session = currentSession ? withProgress({
      ...currentSession,
      completedSenses: (currentSession.completedSenses ?? 0) + 1,
    }, runtime) : null
    set({
      states,
      session,
      runtime,
    })
    if (session) void db.sessions.put(session)
  },

  finish: async () => {
    await get().quit()
  },

  quit: async () => {
    const s = get().session
    if (s && s.finishedAt === null) {
      const finished: SessionRecord = {
        ...s,
        finishedAt: Date.now(),
        durationMs: Math.max(s.durationMs, Date.now() - s.startedAt),
        checkedIn: false,
        status: 'finished',
        lastActiveAt: Date.now(),
      }
      await db.sessions.put(finished)
      set({ session: finished, pausedSession: null })
    }
    set({ runtime: { ...EMPTY }, pausedSession: null })
  },

  togglePin: async (id: number) => {
    const rec = get().states.get(id)
    if (!rec) return
    const next = { ...rec, pinned: !rec.pinned }
    await db.states.put(next)
    set({ states: new Map(get().states).set(id, next) })
  },

  archiveSense: async (id: number, graduated = false) => {
    const rec = get().states.get(id)
    if (!rec) return
    const next: SenseState = {
      ...rec,
      status: 'archived',
      ladderStep: REVIEW_LADDER.length,
      mastery: graduated ? 100 : rec.mastery,
      dueAt: null,
    }
    await db.states.put(next)
    set({ states: new Map(get().states).set(id, next) })
  },

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch }
    await db.settings.clear()
    await db.settings.put(settings)
    set({ settings })
  },
}))

export { speak }
