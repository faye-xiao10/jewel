import { useState, useEffect } from 'react'

export interface CanvasSettings {
  h1Size: number
  h2Size: number
  h3Size: number
  defaultSize: number
  questionColor: string
  nodeColor: string
  edgeColor: string
  wrapLength: number
  tabIndentX: number
  tabIndentY: number
  shiftEnterIndentY: number
}

export const DEFAULT_SETTINGS: CanvasSettings = {
  h1Size: 60,
  h2Size: 45,
  h3Size: 30,
  defaultSize: 13,
  questionColor: '#f59e0b',
  nodeColor: '#6366f1',
  edgeColor: '#6366f1',
  wrapLength: 40,
  tabIndentX: 50,
  tabIndentY: 50,
  shiftEnterIndentY: 40,
}

const SETTINGS_KEY = 'jewel_settings'

export function useSettings() {
  const [settings, setSettings] = useState<CanvasSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  function updateSetting<K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
  }

  return { settings, updateSetting, resetSettings }
}