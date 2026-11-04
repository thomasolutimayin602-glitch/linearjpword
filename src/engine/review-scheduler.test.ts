import { describe, expect, it } from 'vitest'
import {
  REVIEW_LADDER,
  advanceLadder,
  buildOptions,
  buildStudyPlan,
  freshState,
  resetLadder,
} from './review-scheduler'
import type { SenseState } from '../types'
import { WORDS } from '../data/words'

const DAY = 24 * 60 * 60 * 1000

function learningState(senseId: number, dueAt: number | null): SenseState {
  return { ...freshState(senseId), status: 'learning', ladderStep: 1, dueAt }
}

describe('freshState', () => {
  it('starts new with an empty per-mode history', () => {
    const state = freshState(7)
    expect(state.status).toBe('new')
    expect(state.mastery).toBe(0)
    expect(state.ladderStep).toBe(0)
    expect(state.dueAt).toBeNull()
    expect(state.modeStats.listen).toEqual({ correct: 0, wrong: 0 })
    expect(state.modeStats.spell).toEqual({ correct: 0, wrong: 0 })
  })
})

describe('review ladder', () => {
  it('schedules the first review one day later after a clean pass', () => {
    const before = Date.now()
    const next = advanceLadder(freshState(1))
    expect(next.status).toBe('learning')
    expect(next.ladderStep).toBe(1)
    expect(next.mastery).toBe(25)
    expect(next.dueAt).toBeGreaterThanOrEqual(before + REVIEW_LADDER[0] * DAY)
  })

  it('archives after the final rung', () => {
    const state: SenseState = { ...freshState(2), status: 'learning', ladderStep: REVIEW_LADDER.length - 1, dueAt: Date.now() }
    const next = advanceLadder(state)
    expect(next.status).toBe('archived')
    expect(next.mastery).toBe(100)
    expect(next.dueAt).toBeNull()
  })

  it('resets to the bottom and becomes immediately due after a mistake', () => {
    const state: SenseState = { ...freshState(3), status: 'learning', ladderStep: 3, dueAt: Date.now() + 7 * DAY }
    const next = resetLadder(state)
    expect(next.ladderStep).toBe(0)
    expect(next.status).toBe('learning')
    expect(next.dueAt).toBeLessThanOrEqual(Date.now())
    expect(next.totalWrong).toBe(1)
  })
})

describe('buildStudyPlan', () => {
  it('limits new words and includes every due review exactly once', () => {
    const now = Date.now()
    const states = new Map<number, SenseState>()
    for (let id = 1; id <= 10; id++) states.set(id, freshState(id))
    states.set(11, learningState(11, now - 1000))
    states.set(12, learningState(12, now - 2000))
    states.set(13, learningState(13, now + DAY))
    states.set(14, { ...learningState(14, now - 3000), pinned: true })

    const plan = buildStudyPlan(states, 4, now)
    expect(plan.newIds).toHaveLength(4)
    expect(plan.dueIds).toEqual(expect.arrayContaining([11, 12, 14]))
    expect(plan.pinnedIds).toContain(14)
    expect(plan.total).toBe(plan.queue.length)
    expect(new Set(plan.queue).size).toBe(plan.queue.length)
    expect(plan.queue).not.toContain(13)
    expect(plan.queue).toContain(14)
  })

  it('never plans archived senses', () => {
    const states = new Map<number, SenseState>()
    states.set(1, { ...freshState(1), status: 'archived' })
    expect(buildStudyPlan(states, 10).total).toBe(0)
  })

  it('only plans senses in the active book', () => {
    const now = Date.now()
    const states = new Map<number, SenseState>()
    states.set(1, freshState(1))
    states.set(2, freshState(2))
    states.set(3, learningState(3, now - 1000))
    states.set(4, learningState(4, now - 2000))
    states.set(5, { ...freshState(5), pinned: true })
    states.set(6, { ...learningState(6, now - 3000), pinned: true })

    const plan = buildStudyPlan(states, 5, now, new Set([2, 4, 6]))
    expect(plan.newIds).toEqual([2])
    expect(plan.dueIds).toEqual(expect.arrayContaining([4, 6]))
    expect(plan.pinnedIds).toEqual([6])
    expect(new Set(plan.queue)).toEqual(new Set([2, 4, 6]))
  })
})

describe('buildOptions', () => {
  it('always returns four choices with the answer at the correct index', () => {
    for (const word of WORDS.slice(0, 20)) {
      for (const field of ['meaning', 'kana'] as const) {
        const question = buildOptions(word.id, field, false)
        expect(question.options).toHaveLength(4)
        expect(question.correct).toBeGreaterThanOrEqual(0)
        expect(question.correct).toBeLessThan(4)
        expect(question.options[question.correct]).toBe(field === 'meaning' ? word.meaning : word.kana)
        expect(new Set(question.options).size).toBe(4)
      }
    }
  })

  it('adds the mastery-gated fourth option', () => {
    for (const word of WORDS.slice(0, 10)) {
      const question = buildOptions(word.id, 'meaning', true)
      expect(question.options).toHaveLength(4)
      expect(question.options).toContain('以上都不对')
    }
  })
})
