import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  dailyNewWords: 10,
  selectMeaningTimer: 8,
  selectWordTimer: 10,
  autoPronounce: true,
  definitionPronounce: true,
  hideChinese: false,
  guessAsWrong: true,
  noneOptionThreshold: 60,
  reviewReminder: '08:00',
  reviewDays: [7, 15, 30],
  voiceSpeed: 1,
  accentStrictness: 'normal',
}

interface SettingsStore {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    { name: 'toword-jp-settings' }
  )
)
