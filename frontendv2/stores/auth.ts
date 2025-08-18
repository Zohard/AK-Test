import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  email: string
  pseudo: string
  isAdmin?: boolean
  role?: string
  created_at: string
  updated_at: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  pseudo: string
  password: string
  confirmPassword: string
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)

  // API configuration
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  // Enhanced login with refresh token support
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    loading.value = true
    try {
      const response = await $fetch<AuthResponse>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: credentials
      })
      
      accessToken.value = response.access_token
      refreshToken.value = response.refresh_token
      user.value = response.user
      isAuthenticated.value = true

      // Store tokens securely
      if (process.client) {
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('refresh_token', response.refresh_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
      }

      return response
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.data?.message || 'Erreur de connexion')
    } finally {
      loading.value = false
    }
  }

  // Register new user
  const register = async (data: RegisterData): Promise<AuthResponse> => {
    loading.value = true
    try {
      const response = await $fetch<AuthResponse>(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: data
      })
      
      accessToken.value = response.access_token
      refreshToken.value = response.refresh_token
      user.value = response.user
      isAuthenticated.value = true

      // Store tokens securely
      if (process.client) {
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('refresh_token', response.refresh_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
      }

      return response
    } catch (error: any) {
      console.error('Register error:', error)
      throw new Error(error.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      loading.value = false
    }
  }

  // Auto refresh token when needed
  const refreshAccessToken = async (): Promise<AuthResponse> => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await $fetch<AuthResponse>(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      })

      accessToken.value = response.access_token
      user.value = response.user

      if (process.client) {
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      // Refresh failed, logout user
      await logout()
      throw error
    }
  }

  // Enhanced logout with server cleanup
  const logout = async (): Promise<void> => {
    try {
      if (accessToken.value) {
        await $fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.value}`
          }
        })
      }
    } catch (error) {
      console.warn('Logout endpoint error:', error)
    } finally {
      clearAuth()
    }
  }

  const clearAuth = () => {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    isAuthenticated.value = false

    if (process.client) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('auth_user')
    }
  }

  // Verify token with server
  const verifyToken = async (): Promise<boolean> => {
    if (!accessToken.value) {
      return false
    }

    try {
      const response = await $fetch(`${API_BASE}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      })

      if ((response as any).valid && (response as any).user) {
        user.value = { ...user.value, ...(response as any).user }
        
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
    }
  }

  // Get user profile
  const getProfile = async (): Promise<User | null> => {
    if (!accessToken.value) {
      return null
    }

    try {
      const response = await $fetch<{ user: User }>(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      })

      if (response.user) {
        user.value = response.user
        
        if (process.client) {
          localStorage.setItem('auth_user', JSON.stringify(response.user))
        }
        
        return response.user
      }
      return null
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }

  // Get headers for authenticated requests
  const getAuthHeaders = () => {
    if (!accessToken.value) return {}
    return {
      'Authorization': `Bearer ${accessToken.value}`
    }
  }

  // Initialize auth state from storage
  const initializeAuth = () => {
    if (process.client) {
      const storedAccessToken = localStorage.getItem('access_token')
      const storedRefreshToken = localStorage.getItem('refresh_token')
      const storedUser = localStorage.getItem('auth_user')

      if (storedAccessToken && storedRefreshToken && storedUser) {
        try {
          accessToken.value = storedAccessToken
          refreshToken.value = storedRefreshToken
          user.value = JSON.parse(storedUser)
          isAuthenticated.value = true
          
          // Verify token is still valid
          verifyToken()
        } catch (error) {
          console.error('Error initializing auth:', error)
          clearAuth()
        }
      }
    }
  }

  // Forgot password
  const forgotPassword = async (email: string): Promise<void> => {
    loading.value = true
    try {
      await $fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        body: { email }
      })
    } catch (error: any) {
      console.error('Forgot password error:', error)
      throw new Error(error.data?.message || 'Erreur lors de la demande de réinitialisation')
    } finally {
      loading.value = false
    }
  }

  // Reset password
  const resetPassword = async (token: string, password: string): Promise<void> => {
    loading.value = true
    try {
      await $fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        body: { token, password }
      })
    } catch (error: any) {
      console.error('Reset password error:', error)
      throw new Error(error.data?.message || 'Erreur lors de la réinitialisation du mot de passe')
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const isAdmin = computed(() => {
    return user.value && (user.value.isAdmin === true || user.value.role === 'admin')
  })

  const userDisplayName = computed(() => {
    return user.value?.pseudo || user.value?.email || 'Utilisateur'
  })

  return {
    // State
    user: readonly(user),
    accessToken: readonly(accessToken),
    refreshToken: readonly(refreshToken),
    isAuthenticated: readonly(isAuthenticated),
    loading: readonly(loading),
    
    // Computed
    isAdmin,
    userDisplayName,
    
    // Actions
    login,
    register,
    logout,
    refreshAccessToken,
    clearAuth,
    verifyToken,
    getProfile,
    getAuthHeaders,
    initializeAuth,
    forgotPassword,
    resetPassword
  }
})