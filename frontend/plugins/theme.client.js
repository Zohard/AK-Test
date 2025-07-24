// Theme initialization plugin for client-side
export default defineNuxtPlugin(() => {
  // This plugin only runs on the client
  if (process.client) {
    // Initialize theme as soon as possible to prevent FOUC
    const initializeTheme = () => {
      const STORAGE_KEY = 'anime-kun-theme'
      const THEME_MODES = {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
      }
      
      // Get system preference
      const getSystemPreference = () => {
        if (window.matchMedia) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return false
      }
      
      // Get saved preference
      const getSavedPreference = () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved && Object.values(THEME_MODES).includes(saved)) {
            return saved
          }
        } catch (error) {
          console.warn('Failed to load theme preference:', error)
        }
        return THEME_MODES.SYSTEM
      }
      
      // Apply theme to DOM immediately
      const applyThemeImmediate = (isDark) => {
        const root = document.documentElement
        const body = document.body
        
        // Remove any existing theme classes
        body.classList.remove('light-mode', 'dark-mode')
        root.classList.remove('light-mode', 'dark-mode')
        
        // Add the correct theme class
        const themeClass = isDark ? 'dark-mode' : 'light-mode'
        body.classList.add(themeClass)
        root.classList.add(themeClass)
        
        // Update meta theme-color for mobile browsers
        let themeColorMeta = document.querySelector('meta[name="theme-color"]')
        if (!themeColorMeta) {
          themeColorMeta = document.createElement('meta')
          themeColorMeta.name = 'theme-color'
          document.head.appendChild(themeColorMeta)
        }
        themeColorMeta.setAttribute('content', isDark ? '#0f1419' : '#ffffff')
        
        // Add color-scheme meta for better browser integration
        let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')
        if (!colorSchemeMeta) {
          colorSchemeMeta = document.createElement('meta')
          colorSchemeMeta.name = 'color-scheme'
          document.head.appendChild(colorSchemeMeta)
        }
        colorSchemeMeta.setAttribute('content', isDark ? 'dark' : 'light')
      }
      
      // Determine initial theme
      const savedMode = getSavedPreference()
      const systemDark = getSystemPreference()
      
      let isDark = false
      switch (savedMode) {
        case THEME_MODES.DARK:
          isDark = true
          break
        case THEME_MODES.LIGHT:
          isDark = false
          break
        case THEME_MODES.SYSTEM:
        default:
          isDark = systemDark
          break
      }
      
      // Apply theme immediately
      applyThemeImmediate(isDark)
      
      // Store the initialization flag
      window.__ANIME_KUN_THEME_INITIALIZED__ = true
    }
    
    // Initialize immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeTheme)
    } else {
      initializeTheme()
    }
    
    // Also run on hydration to ensure consistency
    if (window.__NUXT_DEVTOOLS__) {
      // Development mode - ensure theme is applied after HMR
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const hasThemeClass = document.body.classList.contains('light-mode') || 
                                 document.body.classList.contains('dark-mode')
            if (!hasThemeClass && window.__ANIME_KUN_THEME_INITIALIZED__) {
              initializeTheme()
            }
          }
        })
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: false
      })
      
      // Clean up observer after a reasonable time
      setTimeout(() => {
        observer.disconnect()
      }, 5000)
    }
  }
})