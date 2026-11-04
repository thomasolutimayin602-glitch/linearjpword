import { describe, expect, it } from 'vitest'
import { dayKey, dayKeyOffset } from './date'

describe('local day keys', () => {
  it('formats with local calendar fields', () => {
    expect(dayKey(new Date(2026, 10, 5, 0, 30))).toBe('2026-11-05')
    expect(dayKey(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09')
  })

  it('offsets across month and year boundaries', () => {
    expect(dayKeyOffset(1, new Date(2026, 10, 5))).toBe('2026-11-04')
    expect(dayKeyOffset(5, new Date(2026, 10, 3))).toBe('2026-10-29')
    expect(dayKeyOffset(1, new Date(2027, 0, 1))).toBe('2026-12-31')
  })
})
