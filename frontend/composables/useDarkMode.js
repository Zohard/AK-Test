// Theme modes enum
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

// Enhanced theme composable with React-inspired patterns
export const useDarkMode = () => {
  // Reactive state
  const themeMode = ref(THEME_MODES.SYSTEM)
  const isDarkMode = ref(false)
  const isSystemDark = ref(false)
  const isHydrated = ref(false)

  // Local storage key
  const STORAGE_KEY = 'anime-kun-theme'

  // Get system preference
  const getSystemPreference = () => {
    if (process.client && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  }

  // Update theme state
  const updateThemeState = () => {
    const systemDark = getSystemPreference()
    isSystemDark.value = systemDark
    
    switch (themeMode.value) {
      case THEME_MODES.DARK:
        isDarkMode.value = true
        break
      case THEME_MODES.LIGHT:
        isDarkMode.value = false
        break
      case THEME_MODES.SYSTEM:
      default:
        isDarkMode.value = systemDark
        break
    }
  }

  // Apply theme to DOM
  const applyTheme = (darkMode = isDarkMode.value) => {
    if (process.client) {
      const root = document.documentElement
      const body = document.body
      
      // Remove existing theme classes
      body.classList.remove('light-mode', 'dark-mode')
      root.classList.remove('light-mode', 'dark-mode')
      
      // Add appropriate theme class
      const themeClass = darkMode ? 'dark-mode' : 'light-mode'
      body.classList.add(themeClass)
      root.classList.add(themeClass)
      
      // Update meta theme-color for mobile browsers
      const themeColorMeta = document.querySelector('meta[name="theme-color"]')
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', darkMode ? '#0f1419' : '#ffffff')
      }
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('theme-changed', {
        detail: { isDarkMode: darkMode, themeMode: themeMode.value }
      }))
    }
  }

  // Save preference to localStorage
  const savePreference = (mode = themeMode.value) => {
    if (process.client) {
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch (error) {
        console.warn('Failed to save theme preference:', error)
      }
    }
  }

  // Load preference from localStorage
  const loadPreference = () => {
    if (process.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && Object.values(THEME_MODES).includes(stored)) {
          return stored
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error)
      }
    }
    return THEME_MODES.SYSTEM
  }

  // Set theme mode
  const setThemeMode = (mode) => {
    if (!Object.values(THEME_MODES).includes(mode)) {
      console.warn(`Invalid theme mode: ${mode}`)
      return
    }
    
    themeMode.value = mode
    updateThemeState()
    applyTheme()
    savePreference(mode)
  }

  // Toggle between light and dark (skip system)
  const toggleTheme = () => {
    const newMode = themeMode.value === THEME_MODES.DARK 
      ? THEME_MODES.LIGHT 
      : THEME_MODES.DARK
    setThemeMode(newMode)
  }

  // Cycle through all modes: light -> dark -> system
  const cycleTheme = () => {
    const modes = [THEME_MODES.LIGHT, THEME_MODES.DARK, THEME_MODES.SYSTEM]
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setThemeMode(modes[nextIndex])
  }

  // Initialize theme
  const initializeTheme = () => {
    if (process.client && !isHydrated.value) {
      // Load saved preference
      const savedMode = loadPreference()
      themeMode.value = savedMode

      // Update state
      updateThemeState()
      applyTheme()

      // Listen for system preference changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        
        const handleSystemThemeChange = (e) => {
          isSystemDark.value = e.matches
          if (themeMode.value === THEME_MODES.SYSTEM) {
            updateThemeState()
            applyTheme()
          }
        }

        // Modern browsers
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleSystemThemeChange)
        } else {
          // Fallback for older browsers
          mediaQuery.addListener(handleSystemThemeChange)
        }

        // Cleanup function
        onBeforeUnmount(() => {
          if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handleSystemThemeChange)
          } else {
            mediaQuery.removeListener(handleSystemThemeChange)
          }
        })
      }

      isHydrated.value = true
    }
  }

  // Computed properties
  const currentThemeLabel = computed(() => {
    switch (themeMode.value) {
      case THEME_MODES.LIGHT:
        return 'Clair'
      case THEME_MODES.DARK:
        return 'Sombre'
      case THEME_MODES.SYSTEM:
        return `Système (${isSystemDark.value ? 'Sombre' : 'Clair'})`
      default:
        return 'Système'
    }
  })

  const themeIcon = computed(() => {
    switch (themeMode.value) {
      case THEME_MODES.LIGHT:
        return '☀️'
      case THEME_MODES.DARK:
        return '🌙'
      case THEME_MODES.SYSTEM:
        return '⚙️'
      default:
        return '⚙️'
    }
  })

  // Initialize on mount
  onMounted(() => {
    initializeTheme()
  })

  // Server-side rendering support
  if (process.server) {
    // Set default values for SSR
    isDarkMode.value = false
    themeMode.value = THEME_MODES.SYSTEM
  }

  return {
    // State (readonly to prevent external mutation)
    isDarkMode: readonly(isDarkMode),
    themeMode: readonly(themeMode),
    isSystemDark: readonly(isSystemDark),
    isHydrated: readonly(isHydrated),
    
    // Computed
    currentThemeLabel: readonly(currentThemeLabel),
    themeIcon: readonly(themeIcon),
    
    // Methods
    toggleTheme,
    cycleTheme,
    setThemeMode,
    
    // Constants
    THEME_MODES
  }
}