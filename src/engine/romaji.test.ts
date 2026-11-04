import { describe, expect, it } from 'vitest'
import { gradeKana, gradeSpelling, romajiToKana, splitMorae, toHiragana } from './romaji'

describe('romajiToKana', () => {
  it('accepts IME-style alternative romanisations', () => {
    expect(romajiToKana('shi')).toBe('し')
    expect(romajiToKana('si')).toBe('し')
    expect(romajiToKana('sya')).toBe('しゃ')
    expect(romajiToKana('sha')).toBe('しゃ')
    expect(romajiToKana('tu')).toBe('つ')
    expect(romajiToKana('tsu')).toBe('つ')
  })

  it('handles sokuon and standalone n', () => {
    expect(romajiToKana('kitte')).toBe('きって')
    expect(romajiToKana('gakkou')).toBe('がっこう')
    expect(romajiToKana('hon')).toBe('ほん')
    expect(romajiToKana("n'ya")).toBe('んや')
  })
})

describe('grading', () => {
  it('grades romaji by the kana it produces', () => {
    expect(gradeSpelling('si', 'し', false).correct).toBe(true)
    expect(gradeSpelling('shi', 'し', true).correct).toBe(true)
    expect(gradeSpelling('chi', 'ち', true).correct).toBe(true)
    expect(gradeSpelling('ji', 'じ', true).correct).toBe(true)
    expect(gradeSpelling('ka', 'き', false).correct).toBe(false)
  })

  it('accepts katakana for hiragana targets only in lenient mode', () => {
    expect(gradeKana('シ', 'し', false).correct).toBe(true)
    expect(gradeKana('シ', 'し', true).correct).toBe(false)
    expect(gradeKana('し', 'し', true).correct).toBe(true)
  })

  it('allows a missing long-vowel mark in lenient mode', () => {
    expect(gradeKana('りょこ', 'りょこう', false).correct).toBe(false)
    expect(gradeKana('りょこ', 'りょこー', false).correct).toBe(true)
  })
})

describe('kana helpers', () => {
  it('converts katakana to hiragana', () => {
    expect(toHiragana('カタカナ')).toBe('かたかな')
    expect(toHiragana('ひらがな')).toBe('ひらがな')
  })

  it('splits morae with small kana attached', () => {
    expect(splitMorae('きょう')).toEqual(['きょ', 'う'])
    expect(splitMorae('がっこう')).toEqual(['が', 'っ', 'こ', 'う'])
  })
})
