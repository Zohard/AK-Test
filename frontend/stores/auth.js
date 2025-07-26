import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useRuntimeConfig } from '#app'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)

  // API configuration - only on client side
  const API_BASE = process.client 
    ? (useRuntimeConfig()?.public?.apiBase || 'http://localhost:3001')
    : 'http://localhost:3001'

  // Initialize from localStorage on client side
  const initializeAuth = () => {
    if (process.client) {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      
      if (storedToken && storedUser) {
        try {
          token.value = storedToken
          user.value = JSON.parse(storedUser)
          isAuthenticated.value = true
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          clearAuth()
        }
      }
    }
  }

  // Login action
  const login = async (authToken, userData) => {
    try {
      token.value = authToken
      user.value = userData
      isAuthenticated.value = true

      // Store in localStorage
      if (process.client) {
        localStorage.setItem('auth_token', authToken)
        localStorage.setItem('auth_user', JSON.stringify(userData))
      }

      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  // Logout action
  const logout = async () => {
    try {
      // Call logout endpoint if authenticated and on client
      if (token.value && process.client) {
        try {
          await $fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token.value}`
            }
          })
        } catch (error) {
          // Ignore logout endpoint errors, clear local data anyway
          console.warn('Logout endpoint error:', error)
        }
      }

      clearAuth()
      return true
    } catch (error) {
      console.error('Logout error:', error)
      clearAuth() // Clear local data even if logout fails
      return false
    }
  }

  // Clear authentication data
  const clearAuth = () => {
    token.value = null
    user.value = null
    isAuthenticated.value = false

    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  // Verify token with server
  const verifyToken = async () => {
    if (!token.value || !process.client) {
      return false
    }

    loading.value = true
    try {
      const response = await $fetch(`${API_BASE}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (response.success && response.user) {
        // Update user data from server
        user.value = { ...user.value, ...response.user }
        
        if (process.client) {
          localStorage.setItem('auth_user', JSON.stringify(user.value))
        }
        
        return true
      } else {
        clearAuth()
        return false
      }
    } catch (error) {
      console.error('Token verification error:', error)
      clearAuth()
      return false
    } finally {
      loading.value = false
    }
  }

  // Refresh user profile
  const refreshProfile = async () => {
    if (!token.value || !process.client) {
      return false
    }

    try {
      const response = await $fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (response.user) {
        user.value = response.user
        
        if (process.client) {
          localStorage.setItem('auth_user', JSON.stringify(response.user))
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error('Profile refresh error:', error)
      return false
    }
  }

  // Get authorization headers for API calls
  const getAuthHeaders = () => {
    if (!token.value) {
      return {}
    }
    
    return {
      'Authorization': `Bearer ${token.value}`
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user.value) return false
    return user.value.role === role
  }

  // Check if user is admin
  const isAdmin = computed(() => {
    return user.value && (user.value.isAdmin === true || user.value.id === 1 || user.value.id === 17667)
  })

  // Initialize on store creation
  initializeAuth()

  return {
    // State
    user: readonly(user),
    token: readonly(token),
    isAuthenticated: readonly(isAuthenticated),
    loading: readonly(loading),
    isAdmin,
    
    // Actions
    login,
    logout,
    clearAuth,
    verifyToken,
    refreshProfile,
    getAuthHeaders,
    hasRole,
    initializeAuth
  }
})