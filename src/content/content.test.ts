import { describe, expect, it } from 'vitest'
import { WORDS, WORDS_BY_ID } from '../data/words'
import { BOOKS, DEFAULT_BOOK_ID } from './books'
import { contentProvider } from './provider'

const CHINESE = /[\u3400-\u9fff]/

describe('vocabulary content', () => {
  it('ships Chinese meanings and translated examples for every sense', () => {
    expect(WORDS.length).toBeGreaterThan(100)
    for (const word of WORDS) {
      expect(word.meaning.trim(), `meaning for ${word.id}`).toMatch(CHINESE)
      expect(word.meaningEn.trim(), `source meaning for ${word.id}`).not.toBe('')
      expect(word.examples.length, `examples for ${word.id}`).toBeGreaterThan(0)
      for (const example of word.examples) {
        expect(example.ja.trim(), `Japanese example for ${word.id}`).not.toBe('')
        expect(example.zh.trim(), `Chinese example for ${word.id}`).toMatch(CHINESE)
      }
    }
  })
})

describe('bundled word books', () => {
  it('has unique book and word identifiers with non-empty content', () => {
    expect(new Set(BOOKS.map(book => book.id)).size).toBe(BOOKS.length)
    expect(BOOKS[0]?.id).toBe(DEFAULT_BOOK_ID)
    for (const book of BOOKS) {
      expect(book.wordIds.length, book.id).toBeGreaterThan(0)
      expect(new Set(book.wordIds).size, book.id).toBe(book.wordIds.length)
      expect(book.wordIds.every(id => WORDS_BY_ID.has(id)), book.id).toBe(true)
      expect(book.version).not.toBe('')
      expect(book.source).toBe('bundled')
      expect(book.availability).toBe('offline')
    }
  })

  it('keeps provider queries consistent with the bundled catalog', async () => {
    const books = await contentProvider.listBooks()
    expect(books).toHaveLength(BOOKS.length)
    for (const book of books) {
      const fetched = await contentProvider.getBook(book.id)
      expect(fetched?.id).toBe(book.id)
      const words = await contentProvider.listWords(book.id)
      expect(words.map(word => word.id)).toEqual(book.wordIds)
      const first = WORDS_BY_ID.get(book.wordIds[0])
      expect(await contentProvider.getWord(book.wordIds[0])).toEqual(first)
    }
    expect(await contentProvider.getBook('missing-book')).toBeNull()
    expect(await contentProvider.listWords('missing-book')).toEqual([])
  })
})
