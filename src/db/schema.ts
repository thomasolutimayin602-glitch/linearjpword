import Dexie, { type Table } from 'dexie'
import type { WordEntry, StudyRecord, StudySession } from '../types'

class TowordJpDB extends Dexie {
  words!: Table<WordEntry, number>
  records!: Table<StudyRecord, number>
  sessions!: Table<StudySession, string>
  settings!: Table<{ key: string; value: unknown }, string>

  constructor() {
    super('toword-jp')
    this.version(1).stores({
      words: 'id, jlptLevel, kana, tags',
      records: 'wordId, status, masteryLevel, nextReviewAt, pinned',
      sessions: 'id, date, checkedIn',
      settings: 'key',
    })
  }
}

export const db = new TowordJpDB()
export type { Table }
