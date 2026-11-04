import Dexie, { type Table } from 'dexie'
import type { SenseState, SessionRecord, Settings, UserProfile, DailyPlan } from '../types'
import { DEFAULT_SETTINGS } from '../types'

export interface MetaRecord {
  key: string
  value: unknown
}

class TowordJpDB extends Dexie {
  states!: Table<SenseState, number>       // per-sense learning state
  sessions!: Table<SessionRecord, string>  // daily session logs
  settings!: Table<Settings, number>       // single row
  favorites!: Table<{ id: string; senseId: number; createdAt: number }, string>
  profiles!: Table<UserProfile, string>
  plans!: Table<DailyPlan, string>
  meta!: Table<MetaRecord, string>

  constructor() {
    super('toword-jp-v2')
    this.version(1).stores({
      states: 'senseId, status, mastery, dueAt, pinned, ladderStep',
      sessions: 'id, date, checkedIn',
      settings: '++id',
    })
    this.version(2).stores({
      states: 'senseId, status, mastery, dueAt, pinned, ladderStep',
      sessions: 'id, date, checkedIn',
      settings: '++id',
      favorites: 'id, senseId, createdAt',
    })
    this.version(3).stores({
      states: 'senseId, status, mastery, dueAt, pinned, ladderStep',
      sessions: 'id, date, checkedIn',
      settings: '++id',
      favorites: 'id, senseId, createdAt',
      profiles: 'id, updatedAt',
      plans: 'id, date',
      meta: 'key',
    })
  }
}

export const db = new TowordJpDB()

/** Safe bootstrap: seed defaults when empty; never delete user data. */
export async function initDb(): Promise<void> {
  if ((await db.settings.count()) === 0) {
    await db.settings.put(DEFAULT_SETTINGS)
  }
}
