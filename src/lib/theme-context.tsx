'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react'

type Theme = 'dark' | 'light' | 'auto'
type MoodColor = 'lime' | 'purple' | 'blue' | 'rose' | 'amber' | 'cyan' | 'emerald'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  moodColor: MoodColor
  setMoodColor: (color: MoodColor) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const MOOD_COLORS: Record<MoodColor, { primary: string; secondary: string; accent: string; gradient: string }> = {
  lime: {
    primary: '#84CC16',
    secondary: '#22C55E',
    accent: '#10B981',
    gradient: 'from-lime-400 via-white to-black'
  },
  purple: {
    primary: '#A855F7',
    secondary: '#8B5CF6',
    accent: '#7C3AED',
    gradient: 'from-purple-500 via-violet-400 to-indigo-600'
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    accent: '#2563EB',
    gradient: 'from-blue-500 via-cyan-400 to-blue-600'
  },
  rose: {
    primary: '#F43F5E',
    secondary: '#FB7185',
    accent: '#E11D48',
    gradient: 'from-rose-500 via-pink-400 to-red-500'
  },
  amber: {
    primary: '#F59E0B',
    secondary: '#FBBF24',
    accent: '#D97706',
    gradient: 'from-amber-500 via-yellow-400 to-orange-500'
  },
  cyan: {
    primary: '#06B6D4',
    secondary: '#22D3EE',
    accent: '#0891B2',
    gradient: 'from-cyan-500 via-teal-400 to-cyan-600'
  },
  emerald: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#059669',
    gradient: 'from-emerald-500 via-green-400 to-teal-500'
  }
}

function getResolvedThemeValue(theme: Theme): 'dark' | 'light' {
  if (theme === 'auto') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [moodColor, setMoodColorState] = useState<MoodColor>('lime')

  // Subscribe to localStorage changes for syncing across tabs
  useEffect(() => {
    const handleChange = (e: StorageEvent) => {
      try {
        if (e.key === 'kaicommand-theme' && e.newValue && ['dark', 'light', 'auto'].includes(e.newValue)) {
          setThemeState(e.newValue as Theme)
        }
        if (e.key === 'kaicommand-mood' && e.newValue && Object.keys(MOOD_COLORS).includes(e.newValue)) {
          setMoodColorState(e.newValue as MoodColor)
        }
      } catch {
        // Ignore errors
      }
    }
    window.addEventListener('storage', handleChange)
    return () => window.removeEventListener('storage', handleChange)
  }, [])

  const resolvedTheme = useMemo<'dark' | 'light'>(() => {
    return getResolvedThemeValue(theme)
  }, [theme])

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    const root = document.documentElement
    const resolved = getResolvedThemeValue(theme)
    
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    
    const colors = MOOD_COLORS[moodColor]
    root.style.setProperty('--mood-primary', colors.primary)
    root.style.setProperty('--mood-secondary', colors.secondary)
    root.style.setProperty('--mood-accent', colors.accent)
    root.style.setProperty('--mood-gradient', colors.gradient)
  }, [theme, moodColor])

  // Listen for system theme changes in auto mode
  useEffect(() => {
    if (theme !== 'auto') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const root = document.documentElement
      const resolved = mediaQuery.matches ? 'dark' : 'light'
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('kaicommand-theme', newTheme)
    } catch {
      // Ignore errors
    }
  }, [])

  const setMoodColor = useCallback((newColor: MoodColor) => {
    setMoodColorState(newColor)
    try {
      localStorage.setItem('kaicommand-mood', newColor)
    } catch {
      // Ignore errors
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, moodColor, setMoodColor, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export { MOOD_COLORS }
export type { MoodColor }
