// ===== Core domain types (mirrors Towords' data model) =====

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export interface Example {
  ja: string
  en: string
}

/** A single word *sense* (one meaning). Towords studies one sense at a time. */
export interface WordSense {
  id: number
  word: string          // 漢字表記 (may equal kana when no kanji)
  kana: string          // かな reading
  romaji: string        // rōmaji reading
  accent: string        // pitch accent, e.g. "[1]"
  meaning: string       // English definition
  pos: string           // part of speech
  examples: Example[]
  level: JLPTLevel
  tags: string[]
}

/** Per-sense learning state, stored locally. */
export interface SenseState {
  senseId: number
  /** new = never studied, learning = in rotation, mastered = filtered out */
  status: 'new' | 'learning' | 'mastered' | 'archived'
  /** 0..100 mastery score */
  mastery: number
  streak: number            // consecutive correct
  totalCorrect: number
  totalWrong: number
  lastSeenAt: number | null
  lastWrongAt: number | null
  /** epoch ms when this sense next becomes due for long-term review */
  dueAt: number | null
  /** index into REVIEW_LADDER */
  ladderStep: number
  pinned: boolean
  /** per-mode history: how the user has done on each drill */
  modeStats: Record<DrillMode, { correct: number; wrong: number }>
}

export type DrillMode = 'listen' | 'meaning' | 'word' | 'spell'

export const DRILL_ORDER: DrillMode[] = ['listen', 'meaning', 'word', 'spell']

export const DRILL_LABEL: Record<DrillMode, string> = {
  listen: 'Listening',
  meaning: 'Meaning',
  word: 'Word',
  spell: 'Spelling',
}

/** A word presented during a session, with its generated question set. */
export interface QueueItem {
  senseId: number
  mode: DrillMode
  /** retry = re-queued after a mistake */
  retry: boolean
}

export interface SessionRecord {
  id: string
  date: string           // YYYY-MM-DD
  startedAt: number
  finishedAt: number | null
  checkedIn: boolean
  newSenses: number
  reviewedSenses: number
  correct: number
  wrong: number
  durationMs: number
}

export interface Settings {
  dailyNewWords: number
  meaningTimer: number     // seconds
  wordTimer: number
  autoPronounce: boolean
  showRomaji: boolean
  guessAsWrong: boolean     // "猜对算答错"
  noneOptionMinMastery: number  // mastery at which the 4th option becomes "None of the above"
  strictSpelling: boolean    // require ー / small kana exactly
  dailyGoalMinutes: number
  soundEffects: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  dailyNewWords: 12,
  meaningTimer: 8,
  wordTimer: 10,
  autoPronounce: true,
  showRomaji: true,
  guessAsWrong: true,
  noneOptionMinMastery: 60,
  strictSpelling: false,
  dailyGoalMinutes: 15,
  soundEffects: true,
}
