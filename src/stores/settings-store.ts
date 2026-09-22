import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface SettingsStore {
  settings: Settings
  updateSettings: (partial: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    { name: 'jp-settings' }
  )
)
