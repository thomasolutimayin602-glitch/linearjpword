import { create } from 'zustand'
import type { WordEntry, TrainingMode, QuizState, StudyRecord } from '../types'
import { n5Words } from '../data/n5-words'
import { db } from '../db/schema'

interface StudyStore {
  // Session state
  isActive: boolean
  currentIndex: number
  currentMode: TrainingMode
  modeOrder: TrainingMode[]
  sessionWords: WordEntry[]
  sessionQueue: WordEntry[]
  completedWords: number[]
  wrongWords: number[]
  
  // Current quiz
  quiz: QuizState | null
  
  // Records
  records: Map<number, StudyRecord>
  
  // Actions
  startSession: () => Promise<void>
  nextWord: () => void
  answerQuiz: (selectedIndex: number) => void
  markUnsure: () => void
  skipWord: () => void
  setMode: (mode: TrainingMode) => void
  endSession: () => Promise<void>
  loadRecords: () => Promise<void>
  getRecord: (wordId: number) => StudyRecord | undefined
}

function createDefaultRecord(wordId: number): StudyRecord {
  return {
    wordId,
    status: 'new',
    masteryLevel: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    totalCorrect: 0,
    totalWrong: 0,
    sessionWrong: 0,
    sessionCorrect: 0,
    lastCorrectAt: null,
    lastWrongAt: null,
    nextReviewAt: null,
    pinned: false,
    isInCurrentSession: false,
  }
}

function buildQuiz(word: WordEntry, mode: TrainingMode): QuizState {
  const correctIndex = Math.floor(Math.random() * 4)
  const options: string[] = ['', '', '', '']
  
  if (mode === 'select-meaning') {
    // 选义：显示假名/汉字，选中文释义
    const distractors = n5Words
      .filter(w => w.id !== word.id && w.definition !== word.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.definition)
    options[correctIndex] = word.definition
    let di = 0
    for (let i = 0; i < 4; i++) {
      if (i !== correctIndex) options[i] = distractors[di++]
    }
  } else if (mode === 'select-word') {
    // 选词：显示中文释义，选假名
    const distractors = n5Words
      .filter(w => w.id !== word.id && w.kana !== word.kana)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.kana)
    options[correctIndex] = word.kana
    let di = 0
    for (let i = 0; i < 4; i++) {
      if (i !== correctIndex) options[i] = distractors[di++]
    }
  }

  return {
    word,
    mode,
    options,
    correctIndex,
    startTime: Date.now(),
    attemptCount: 0,
    isCorrect: null,
    showAnswer: false,
    showContext: false,
  }
}

export const useStudyStore = create<StudyStore>((set, get) => ({
  isActive: false,
  currentIndex: 0,
  currentMode: 'select-meaning',
  modeOrder: ['listen', 'select-meaning', 'select-word', 'spelling'],
  sessionWords: [],
  sessionQueue: [],
  completedWords: [],
  wrongWords: [],
  quiz: null,
  records: new Map(),

  loadRecords: async () => {
    const recordsData = await db.records.toArray()
    const map = new Map<number, StudyRecord>()
    for (const r of recordsData) {
      map.set(r.wordId, r)
    }
    set({ records: map })
  },

  getRecord: (wordId: number) => {
    return get().records.get(wordId)
  },

  startSession: async () => {
    await get().loadRecords()
    const records = get().records
    
    // Get new words that don't have records yet
    const allRecordIds = new Set(records.keys())
    const newWords = n5Words.filter(w => !allRecordIds.has(w.id)).slice(0, 10)
    
    // Get review due words
    const now = Date.now()
    const reviewWords = n5Words.filter(w => {
      const rec = records.get(w.id)
      return rec && rec.nextReviewAt && rec.nextReviewAt <= now
    }).slice(0, 10)
    
    const sessionWords = [...newWords, ...reviewWords].sort(() => Math.random() - 0.5)
    
    // Create records for new words
    for (const w of newWords) {
      const rec = createDefaultRecord(w.id)
      records.set(w.id, rec)
      await db.records.put(rec)
    }

    set({
      isActive: true,
      sessionWords,
      sessionQueue: [...sessionWords],
      currentIndex: 0,
      completedWords: [],
      wrongWords: [],
      currentMode: 'select-meaning',
    })
    
    get().nextWord()
  },

  nextWord: () => {
    const state = get()
    if (state.sessionQueue.length === 0) return
    
    const word = state.sessionQueue[0]
    const newQueue = state.sessionQueue.slice(1)
    
    const quiz = buildQuiz(word, state.currentMode)
    
    set({
      sessionQueue: newQueue,
      currentIndex: state.currentIndex,
      quiz,
    })
  },

  answerQuiz: (selectedIndex: number) => {
    const state = get()
    if (!state.quiz) return
    
    const isCorrect = selectedIndex === state.quiz.correctIndex
    const record = get().records.get(state.quiz.word.id) || createDefaultRecord(state.quiz.word.id)
    
    if (isCorrect) {
      const updated: StudyRecord = {
        ...record,
        masteryLevel: Math.min(100, record.masteryLevel + 5),
        consecutiveCorrect: record.consecutiveCorrect + 1,
        consecutiveWrong: 0,
        totalCorrect: record.totalCorrect + 1,
        sessionCorrect: record.sessionCorrect + 1,
        lastCorrectAt: Date.now(),
        status: (record.masteryLevel + 5 >= 80 ? 'mastered' : 'learning') as StudyRecord['status'],
      }
      // Calculate next review
      const dayMs = 24 * 60 * 60 * 1000
      if (updated.consecutiveCorrect < 3) updated.nextReviewAt = Date.now() + dayMs
      else if (updated.consecutiveCorrect < 5) updated.nextReviewAt = Date.now() + 7 * dayMs
      else updated.nextReviewAt = Date.now() + 15 * dayMs
      
      get().records.set(state.quiz.word.id, updated)
      db.records.put(updated)
      
      set({
        quiz: { ...state.quiz, isCorrect: true, showAnswer: true },
        completedWords: [...state.completedWords, state.quiz.word.id],
      })
    } else {
      const updated: StudyRecord = {
        ...record,
        masteryLevel: Math.max(0, record.masteryLevel - 10),
        consecutiveCorrect: 0,
        consecutiveWrong: record.consecutiveWrong + 1,
        totalWrong: record.totalWrong + 1,
        sessionWrong: record.sessionWrong + 1,
        lastWrongAt: Date.now(),
        status: 'learning',
        isInCurrentSession: true,
      }
      
      get().records.set(state.quiz.word.id, updated)
      db.records.put(updated)
      
      set({
        quiz: { ...state.quiz, isCorrect: false, showAnswer: true },
        wrongWords: [...state.wrongWords, state.quiz.word.id],
      })
      
      // Wrong word goes back to queue
      setTimeout(() => {
        get().nextWord()
      }, 1500)
      return
    }
  },

  markUnsure: () => {
    const state = get()
    if (!state.quiz) return
    // Treat as wrong
    state.answerQuiz(-1)
  },

  skipWord: () => {
    get().nextWord()
  },

  setMode: (mode: TrainingMode) => {
    set({ currentMode: mode })
  },

  endSession: async () => {
    set({ isActive: false, quiz: null })
  },
}))
