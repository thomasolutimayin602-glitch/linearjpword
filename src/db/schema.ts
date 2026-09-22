import Dexie, { type Table } from 'dexie'
import type { SenseState, SessionRecord, Settings } from '../types'

class TowordJpDB extends Dexie {
  states!: Table<SenseState, number>       // per-sense learning state
  sessions!: Table<SessionRecord, string>  // daily session logs
  settings!: Table<Settings, number>       // single row

  constructor() {
    super('toword-jp-v2')
    this.version(1).stores({
      states: 'senseId, status, mastery, dueAt, pinned, ladderStep',
      sessions: 'id, date, checkedIn',
      settings: '++id',
    })
  }
}

export const db = new TowordJpDB()

export async function initDb(): Promise<void> {
  await db.settings.toCollection().delete()
  // seeding happens in the store when states table is empty
}
