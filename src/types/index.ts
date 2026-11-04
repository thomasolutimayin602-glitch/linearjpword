// ===== Core domain types (mirrors Towords' data model) =====

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export interface Example {
  ja: string
  zh: string
  en?: string
}

/** A single word *sense* (one meaning). Towords studies one sense at a time. */
export interface WordSense {
  id: number
  word: string          // 漢字表記 (may equal kana when no kanji)
  kana: string          // かな reading
  romaji: string        // rōmaji reading
  accent: string        // pitch accent, e.g. "[1]"
  meaning: string       // Chinese definition (primary UI text)
  meaningEn: string     // English reference, kept for provenance only
  pos: string           // part of speech
  examples: Example[]
  level: JLPTLevel
  tags: string[]
}

/** A study vocabulary book. Content is bundled for offline use in this version. */
export interface WordBook {
  id: string
  title: string
  subtitle: string
  description: string
  level: JLPTLevel
  wordIds: number[]
  version: string
  source: 'bundled'
  availability: 'offline'
  isDevelopmentContent: boolean
  accent: string
  icon: string
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

export type DrillMode = 'listen' | 'meaning' | 'word' | 'spell' | 'example'

export const DRILL_ORDER: DrillMode[] = ['listen', 'meaning', 'word', 'spell', 'example']

export const DRILL_LABEL: Record<DrillMode, string> = {
  listen: '听读',
  meaning: '选义',
  word: '选词',
  spell: '假名拼写',
  example: '例句',
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
  /** number of word passes finished in this session */
  completedSenses?: number
  /** unique senses included in the session */
  senseIds?: number[]
  /** unique senses answered wrong at least once */
  wrongSenseIds?: number[]
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

export type LearningIdentity = 'student' | 'adult' | 'exam'
export type LearningGoal = 'jlpt' | 'travel' | 'anime' | 'work' | 'habit'

/** Local learning profile. Cloud accounts are a later Provider concern. */
export interface UserProfile {
  id: string
  nickname: string
  identity: LearningIdentity
  level: JLPTLevel
  goal: LearningGoal
  examDate: string | null
  dailyMinutes: number
  dailyNewWords: number
  bookId: string
  createdAt: number
  updatedAt: number
}

/** Today's persisted plan, so every page sees the same queue and progress. */
export interface DailyPlan {
  id: string
  date: string
  profileId: string | null
  bookId: string
  queue: number[]
  newIds: number[]
  dueIds: number[]
  completedIds: number[]
  createdAt: number
  updatedAt: number
}

export interface GuestTrial {
  answered: number
  limit: number
}

export const GUEST_TRIAL_LIMIT = 10

export const IDENTITY_LABEL: Record<LearningIdentity, string> = {
  student: '学生',
  adult: '成人兴趣',
  exam: '考试冲刺',
}

export const GOAL_LABEL: Record<LearningGoal, string> = {
  jlpt: '通过 JLPT',
  travel: '旅行会话',
  anime: '动漫 / 追剧',
  work: '工作使用',
  habit: '养成习惯',
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
