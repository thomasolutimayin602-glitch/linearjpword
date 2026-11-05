import { describe, expect, it } from 'vitest'
import { resolveSessionCursor } from './session-resume'
import type { SessionRecord } from '../types'

function paused(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 's-test',
    date: '2026-11-05',
    startedAt: 1,
    finishedAt: null,
    checkedIn: false,
    newSenses: 0,
    reviewedSenses: 2,
    correct: 3,
    wrong: 1,
    durationMs: 1000,
    completedSenses: 1,
    senseIds: [1, 2],
    wrongSenseIds: [],
    status: 'paused',
    ...overrides,
  }
}

describe('resolveSessionCursor', () => {
  it('restores the saved question, mode and feedback in place', () => {
    const progress = {
      queue: [2, 3],
      current: 1,
      modePos: 3,
      passWrong: true,
      question: { options: ['A', 'B', 'C', 'D'], correct: 2 },
      feedback: { correct: false, picked: 0 },
      done: { correct: 4, wrong: 2, sensePasses: 1 },
    }

    expect(resolveSessionCursor(paused({ progress }), () => true)).toEqual({
      queue: [2, 3],
      current: 1,
      modePos: 3,
      passWrong: true,
      feedback: { correct: false, picked: 0 },
      done: { correct: 4, wrong: 2, sensePasses: 1 },
    })
  })

  it('advances to the next resumable sense and drops completed queue entries', () => {
    const progress = {
      queue: [3, 4, 5],
      current: 1,
      modePos: 2,
      passWrong: true,
      question: null,
      feedback: null,
      done: { correct: 4, wrong: 2, sensePasses: 1 },
    }
    const resumable = new Set([4, 5])

    expect(resolveSessionCursor(paused({ progress }), id => resumable.has(id))).toEqual({
      queue: [5],
      current: 4,
      modePos: 0,
      passWrong: false,
      feedback: null,
      done: { correct: 3, wrong: 1, sensePasses: 1 },
    })
  })

  it('reconstructs an old paused session without saved progress', () => {
    const session = paused({ senseIds: [7, 8], completedSenses: 2, correct: 6, wrong: 1 })

    expect(resolveSessionCursor(session, () => true)).toEqual({
      queue: [8],
      current: 7,
      modePos: 0,
      passWrong: false,
      feedback: null,
      done: { correct: 6, wrong: 1, sensePasses: 2 },
    })
  })

  it('returns no cursor when every sense is no longer resumable', () => {
    const result = resolveSessionCursor(paused(), () => false)

    expect(result.current).toBeNull()
    expect(result.queue).toEqual([])
  })
})
