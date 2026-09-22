import type { DrillMode, SenseState } from '../types'
import { WORDS, WORDS_BY_ID } from '../data/words'

/**
 * Review scheduling — a local-only port of Towords' strategy.
 *
 * HOW A SESSION WORKS
 *   A session holds a queue of senses. Each sense is drilled through the full
 *   mode chain (listen → meaning → word → spelling) — we call that one *pass*.
 *
 *   · a pass with zero mistakes graduates the sense one rung up the ladder
 *   · a pass with any mistake resets the ladder and re-queues the sense
 *     at the back of the queue for another pass (short-term repetition)
 *
 * THE LADDER (Ebbinghaus forgetting curve)
 *   1 day → 7 days → 15 days → 30 days → archived (never shown again)
 *
 * A sense is only put back into a future session once its `dueAt` arrives.
 */

export const REVIEW_LADDER = [1, 7, 15, 30]

const DAY = 24 * 60 * 60 * 1000

export function freshState(senseId: number): SenseState {
  return {
    senseId,
    status: 'new',
    mastery: 0,
    streak: 0,
    totalCorrect: 0,
    totalWrong: 0,
    lastSeenAt: null,
    lastWrongAt: null,
    dueAt: null,
    ladderStep: 0,
    pinned: false,
    modeStats: {
      listen: { correct: 0, wrong: 0 },
      meaning: { correct: 0, wrong: 0 },
      word: { correct: 0, wrong: 0 },
      spell: { correct: 0, wrong: 0 },
    },
  }
}

/** Mastery shown to the user, derived from ladder progress. */
function masteryFor(ladderStep: number, clean: boolean): number {
  const base = Math.round((ladderStep / REVIEW_LADDER.length) * 100)
  return Math.max(0, Math.min(100, clean ? base : base - 10))
}

export function isDue(rec: SenseState, now: number = Date.now()): boolean {
  if (rec.status === 'archived') return false
  if (rec.status === 'new') return true
  return rec.dueAt !== null && rec.dueAt <= now
}

/** Update the per-mode hit counters. */
export function noteMode(rec: SenseState, mode: DrillMode, correct: boolean): SenseState {
  const cur = rec.modeStats[mode]
  return {
    ...rec,
    modeStats: {
      ...rec.modeStats,
      [mode]: correct
        ? { correct: cur.correct + 1, wrong: cur.wrong }
        : { correct: cur.correct, wrong: cur.wrong + 1 },
    },
  }
}

/** A pass finished with no mistakes → climb the ladder. */
export function advanceLadder(rec: SenseState): SenseState {
  const step = rec.ladderStep + 1
  const now = Date.now()
  if (step >= REVIEW_LADDER.length) {
    return {
      ...rec,
      ladderStep: step,
      status: 'archived',
      mastery: 100,
      streak: 0,
      dueAt: null,
      lastSeenAt: now,
      totalCorrect: rec.totalCorrect + 1,
    }
  }
  return {
    ...rec,
    ladderStep: step,
    status: 'learning',
    mastery: masteryFor(step, true),
    streak: 0,
    dueAt: now + REVIEW_LADDER[step] * DAY,
    lastSeenAt: now,
    totalCorrect: rec.totalCorrect + 1,
  }
}

/** A pass finished with mistakes → drop back to the bottom of the ladder. */
export function resetLadder(rec: SenseState): SenseState {
  const now = Date.now()
  return {
    ...rec,
    ladderStep: 0,
    status: 'learning',
    mastery: masteryFor(0, false),
    streak: 0,
    dueAt: null,                 // due again as soon as this session ends
    lastSeenAt: now,
    lastWrongAt: now,
    totalWrong: rec.totalWrong + 1,
  }
}

/**
 * Build the queue for a fresh session:
 * `newCount` unseen senses, then every sense whose review is due.
 */
export function buildSessionQueue(
  states: Map<number, SenseState>,
  newCount: number,
  now: number = Date.now(),
): number[] {
  const fresh: number[] = []
  const due: number[] = []

  for (const rec of states.values()) {
    if (rec.status === 'archived') continue
    if (rec.status === 'new') {
      if (fresh.length < newCount) fresh.push(rec.senseId)
    } else if (isDue(rec, now)) {
      due.push(rec.senseId)
    }
  }

  // pinned senses always jump the queue
  const pinned = [...states.values()]
    .filter(r => r.pinned && r.status !== 'archived')
    .map(r => r.senseId)

  const seen = new Set<number>()
  const out: number[] = []
  for (const id of [...pinned, ...fresh, ...due]) {
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return shuffle(out)
}

/** Fisher–Yates shuffle. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export interface Question {
  options: string[]
  correct: number
}

/**
 * Build the four choices for a multiple-choice drill.
 * The 4th option becomes "None of the above" once a sense is well known,
 * which is Towords' difficulty ratchet.
 */
export function buildOptions(
  senseId: number,
  field: 'meaning' | 'kana',
  useNoneOption: boolean,
): Question {
  const target = WORDS_BY_ID.get(senseId)
  if (!target) return { options: [], correct: -1 }

  const answer = field === 'meaning' ? target.meaning : target.kana
  const distractors = shuffle(
    WORDS.filter(w => w.id !== senseId && (field === 'meaning' ? w.meaning !== answer : w.kana !== answer)),
  )
    .slice(0, 3)
    .map(w => (field === 'meaning' ? w.meaning : w.kana))

  const slots: string[] = [...distractors]
  if (useNoneOption) slots.push('None of the above')

  const correct = Math.floor(Math.random() * 4)
  const options: string[] = new Array(4).fill('')
  let di = 0
  for (let i = 0; i < 4; i++) {
    if (i === correct) options[i] = answer
    else options[i] = slots[di++] ?? '—'
  }
  return { options, correct }
}
