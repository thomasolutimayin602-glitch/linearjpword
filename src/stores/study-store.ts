import { create } from 'zustand'
import { db } from '../db/schema'
import { WORDS, WORDS_BY_ID } from '../data/words'
import type { DrillMode, SenseState, SessionRecord, Settings } from '../types'
import { DEFAULT_SETTINGS, DRILL_ORDER } from '../types'
import {
  advanceLadder, buildOptions, buildStudyPlan, freshState,
  noteMode, resetLadder, REVIEW_LADDER,
  type Question,
} from '../engine/review-scheduler'
import { gradeKana, gradeSpelling } from '../engine/romaji'

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
  hydrated: boolean
  runtime: Runtime
  session: SessionRecord | null

  hydrate: () => Promise<void>
  startSession: () => Promise<boolean>
  startPractice: (senseId: number) => Promise<boolean>
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

const EMPTY: Runtime = {
  state: 'idle', queue: [], current: null, modePos: 0,
  passWrong: false, question: null, questionAt: null,
  feedback: null, lastUndo: null,
  done: { correct: 0, wrong: 0, sensePasses: 0 },
}

const dayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  hydrated: false,
  runtime: EMPTY,
  session: null,

  hydrate: async () => {
    if (get().hydrated) return
    const [rows, settingsRows] = await Promise.all([
      db.states.toArray(),
      db.settings.toArray(),
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
    set({ states, settings, hydrated: true })
  },

  startSession: async () => {
    await get().hydrate()
    const { states, settings } = get()
    const plan = buildStudyPlan(states, settings.dailyNewWords)
    if (plan.total === 0) return false
    const [first, ...queue] = plan.queue

    const now = Date.now()
    const sessionIds = plan.queue
    const newSenses = sessionIds.filter(id => states.get(id)?.status === 'new').length
    const session: SessionRecord = {
      id: `s-${now}`,
      date: dayStr(),
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
    }
    await db.sessions.put(session)

    const rec = states.get(first)!
    const question = buildQuestionFor(first, 0, rec.mastery, settings.noneOptionMinMastery)

    set({
      session,
      runtime: {
        ...EMPTY,
        state: 'drill',
        queue,
        current: first,
        modePos: 0,
        question,
        questionAt: Date.now(),
      },
    })
    return true
  },

  startPractice: async (senseId: number) => {
    await get().hydrate()
    const { states, settings } = get()
    const rec = states.get(senseId)
    if (!rec || rec.status === 'archived') return false
    const now = Date.now()
    const session: SessionRecord = {
      id: `practice-${now}`,
      date: dayStr(),
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
    }
    await db.sessions.put(session)
    set({
      session,
      runtime: {
        ...EMPTY,
        state: 'drill',
        current: senseId,
        question: buildQuestionFor(senseId, 0, rec.mastery, settings.noneOptionMinMastery),
        questionAt: now,
      },
    })
    return true
  },

  _completeMode: (mode: DrillMode, correct: boolean, guessed = false, picked?: number) => {
    const r = get().runtime
    const cur = r.current
    if (cur == null) return

    const rec = get().states.get(cur)!
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

    const currentSession = get().session
    const session = currentSession ? {
      ...currentSession,
      correct: currentSession.correct + (effective ? 1 : 0),
      wrong: currentSession.wrong + (effective ? 0 : 1),
      wrongSenseIds: effective
        ? currentSession.wrongSenseIds
        : [...new Set([...(currentSession.wrongSenseIds ?? []), cur])],
    } : null

    set({
      states,
      session,
      runtime: {
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
      },
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
    const states = new Map(get().states).set(cur, recBefore)
    set({
      states,
      session: sessionBefore,
      runtime: {
        ...r,
        passWrong: passWrongBefore,
        done: doneBefore,
        feedback: null,
        lastUndo: null,
        questionAt: Date.now(),
      },
    })
    persist(recBefore)
    if (sessionBefore) void db.sessions.put(sessionBefore)
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
      set({ runtime: { ...r, modePos: nextPos, feedback: null, lastUndo: null, question, questionAt: Date.now() } })
      return
    }
    if (!r.feedback) return
    const cur = r.current
    const rec = get().states.get(cur)!

    const isLastMode = r.modePos === DRILL_ORDER.length - 1
    if (!isLastMode) {
      const nextPos = r.modePos + 1
      const question = buildQuestionFor(cur, nextPos, rec.mastery, get().settings.noneOptionMinMastery)
      set({
        runtime: {
          ...r,
          modePos: nextPos,
          feedback: null,
          lastUndo: null,
          question,
          questionAt: Date.now(),
        },
      })
      return
    }

    // ===== pass finished =====
    let nextRec: SenseState
    let queue = [...r.queue]
    const done = { ...r.done, sensePasses: r.done.sensePasses + 1 }

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
    const session = currentSession ? {
      ...currentSession,
      completedSenses: (currentSession.completedSenses ?? 0) + 1,
    } : null

    if (next === null) {
      const finished: SessionRecord = session
        ? { ...session, finishedAt: Date.now(), durationMs: Date.now() - session.startedAt, checkedIn: true }
        : session!
      if (finished) void db.sessions.put(finished)
      set({ states, session: finished, runtime: { ...EMPTY, state: 'summary', done } })
      return
    }

    const nextRecState = get().states.get(next)!
    const question = buildQuestionFor(next, 0, nextRecState.mastery, get().settings.noneOptionMinMastery)
    set({
      states,
      session,
      runtime: {
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
      },
    })
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
        durationMs: Date.now() - s.startedAt,
        checkedIn: false,
      }
      await db.sessions.put(finished)
      set({ session: finished })
    }
    set({ runtime: { ...EMPTY } })
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
