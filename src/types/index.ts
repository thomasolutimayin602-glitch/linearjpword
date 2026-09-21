// ===== 日语单词核心类型 =====

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export type WordClass = 'noun' | 'verb' | 'adj-i' | 'adj-na' | 'adv' | 'part' | 'expr'

export interface Example {
  japanese: string
  chinese: string
}

export interface WordEntry {
  id: number
  kanji: string        // 汉字表记（可为空）
  kana: string         // 平假名读音（核心字段）
  accent: string       // 音调核，如 "[0]", "[1]"
  definition: string   // 中文释义
  examples: Example[]
  jlptLevel: JlptLevel
  wordClass: WordClass
  tags: string[]
  difficulty: number   // 1-5
}

// ===== 学习记录 =====

export type WordStatus = 'new' | 'learning' | 'mastered' | 'filtered'

export interface StudyRecord {
  wordId: number
  status: WordStatus
  masteryLevel: number      // 0-100
  consecutiveCorrect: number
  consecutiveWrong: number
  totalCorrect: number
  totalWrong: number
  sessionWrong: number      // 当前session答错
  sessionCorrect: number    // 当前session答对
  lastCorrectAt: number | null    // timestamp
  lastWrongAt: number | null
  nextReviewAt: number | null     // 下一个遗忘点(7d/15d/30d)
  pinned: boolean
  isInCurrentSession: boolean
}

// ===== 训练模式 =====

export type TrainingMode = 'listen' | 'select-meaning' | 'select-word' | 'spelling'

export interface StudySession {
  id: string
  date: string
  newWordsCount: number
  reviewWordsCount: number
  wordsLearned: number[]
  wordsMastered: number[]
  wordsWrong: number[]
  checkedIn: boolean
  studyDuration: number
}

// ===== 当前训练状态 =====

export interface QuizState {
  word: WordEntry
  mode: TrainingMode
  options: string[]          // 选择题的选项
  correctIndex: number       // 正确选项索引
  startTime: number
  attemptCount: number       // 当前词尝试次数
  isCorrect: boolean | null
  showAnswer: boolean
  showContext: boolean       // 是否展示释义
}

// ===== 设置 =====

export interface AppSettings {
  dailyNewWords: number
  selectMeaningTimer: number  // 秒
  selectWordTimer: number
  autoPronounce: boolean
  definitionPronounce: boolean
  hideChinese: boolean
  guessAsWrong: boolean
  noneOptionThreshold: number // 0-100 掌握度阈值
  reviewReminder: string      // HH:mm
  reviewDays: number[]        // [7, 15, 30]
  voiceSpeed: number
  accentStrictness: 'easy' | 'normal' | 'strict'
}
