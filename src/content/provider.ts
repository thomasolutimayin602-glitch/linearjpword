import { WORDS_BY_ID } from '../data/words'
import type { WordBook, WordSense } from '../types'
import { BOOKS } from './books'

/**
 * Content boundary for bundled and future remote vocabulary sources.
 * A remote provider can implement the same contract without changing study
 * state or pages. The bundled provider never claims network availability.
 */
export interface ContentProvider {
  listBooks(): Promise<WordBook[]>
  getBook(bookId: string): Promise<WordBook | null>
  listWords(bookId: string): Promise<WordSense[]>
  getWord(senseId: number): Promise<WordSense | null>
}

class BundledContentProvider implements ContentProvider {
  async listBooks(): Promise<WordBook[]> {
    return BOOKS.map(book => ({ ...book, wordIds: [...book.wordIds] }))
  }

  async getBook(bookId: string): Promise<WordBook | null> {
    const book = BOOKS.find(item => item.id === bookId)
    return book ? { ...book, wordIds: [...book.wordIds] } : null
  }

  async listWords(bookId: string): Promise<WordSense[]> {
    const book = BOOKS.find(item => item.id === bookId)
    if (!book) return []
    return book.wordIds.flatMap(id => {
      const word = WORDS_BY_ID.get(id)
      return word ? [word] : []
    })
  }

  async getWord(senseId: number): Promise<WordSense | null> {
    return WORDS_BY_ID.get(senseId) ?? null
  }
}

export const contentProvider: ContentProvider = new BundledContentProvider()
