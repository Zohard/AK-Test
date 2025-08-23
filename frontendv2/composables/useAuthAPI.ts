export interface User {
  id: number
  pseudo: string
  email?: string
  avatar?: string
  bio?: string
  isVerified?: boolean
  joinDate?: string
  reviewsCount?: number
  averageRating?: number
  permissions?: string[]
  preferences?: {
    receiveNotifications?: boolean
    profilePublic?: boolean
    allowComments?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterData {
  pseudo: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
    refreshToken?: string
  }
  error?: {
    code: string
    message: string
    field?: string
  }
}

export function useAuthAPI() {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const config = useRuntimeConfig()
  
  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value)
  
  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user.value?.permissions) return false
    return user.value.permissions.includes(permission) || user.value.permissions.includes('admin')
  }
  
  // Check if user can perform review actions
  const canCreateReview = computed(() => isAuthenticated.value)
  const canEditReview = (reviewUserId: number) => {
    if (!user.value) return false
    return user.value.id === reviewUserId || hasPermission('moderate_reviews')
  }
  const canDeleteReview = (reviewUserId: number) => {
    if (!user.value) return false
    return user.value.id === reviewUserId || hasPermission('moderate_reviews')
  }
  
  // Get authentication token from cookie
  const getAuthToken = (): string | null => {
    const token = useCookie('auth-token', { 
      default: () => null,
      secure: true,
      sameSite: 'lax'
    })
    return token.value
  }
  
  // Set authentication token
  const setAuthToken = (token: string, remember = false) => {
    const tokenCookie = useCookie('auth-token', {
      default: () => null,
      secure: true,
      sameSite: 'lax',
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 // 30 days or 1 day
    })
    tokenCookie.value = token
  }
  
  // Clear authentication token
  const clearAuthToken = () => {
    const tokenCookie = useCookie('auth-token')
    tokenCookie.value = null
  }
  
  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      if (response.success && response.data) {
        user.value = response.data.user
        setAuthToken(response.data.token, credentials.remember)
        
        // Store refresh token if provided
        if (response.data.refreshToken) {
          const refreshTokenCookie = useCookie('refresh-token', {
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
          })
          refreshTokenCookie.value = response.data.refreshToken
        }
        
        // Redirect to reviews page after successful login
        await navigateTo('/reviews')
      }
      
      return response
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Login failed'
      error.value = errorMessage
      
      return {
        success: false,
        error: {
          code: err.response?.data?.error?.code || 'LOGIN_ERROR',
          message: errorMessage,
          field: err.response?.data?.error?.field
        }
      }
    } finally {
      loading.value = false
    }
  }
  
  // Register function
  const register = async (data: RegisterData): Promise<AuthResponse> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: data
      })
      
      if (response.success && response.data) {
        user.value = response.data.user
        setAuthToken(response.data.token)
        
        // Redirect to reviews page after successful registration
        await navigateTo('/reviews')
      }
      
      return response
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Registration failed'
      error.value = errorMessage
      
      return {
        success: false,
        error: {
          code: err.response?.data?.error?.code || 'REGISTER_ERROR',
          message: errorMessage,
          field: err.response?.data?.error?.field
        }
      }
    } finally {
      loading.value = false
    }
  }
  
  // Logout function
  const logout = async () => {
    loading.value = true
    
    try {
      // Call logout endpoint to invalidate token server-side
      await $fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
    } catch (err) {
      // Continue with client-side logout even if server call fails
      console.warn('Server logout failed:', err)
    } finally {
      // Clear client-side auth data
      user.value = null
      clearAuthToken()
      
      // Clear refresh token
      const refreshTokenCookie = useCookie('refresh-token')
      refreshTokenCookie.value = null
      
      loading.value = false
      
      // Redirect to login page
      await navigateTo('/auth/login')
    }
  }
  
  // Get current user profile
  const fetchProfile = async (): Promise<User | null> => {
    const token = getAuthToken()
    if (!token) return null
    
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<{ success: boolean; data: User }>('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.success) {
        user.value = response.data
        return response.data
      }
      
      return null
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token is invalid, clear it
        await logout()
      } else {
        error.value = 'Failed to fetch profile'
      }
      return null
    } finally {
      loading.value = false
    }
  }
  
  // Update user profile
  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    const token = getAuthToken()
    if (!token) return false
    
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<{ success: boolean; data: User }>('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: profileData
      })
      
      if (response.success) {
        user.value = response.data
        return true
      }
      
      return false
      
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to update profile'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const token = getAuthToken()
    if (!token) return false
    
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<{ success: boolean }>('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: {
          currentPassword,
          newPassword
        }
      })
      
      return response.success
      
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to change password'
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Refresh authentication token
  const refreshAuthToken = async (): Promise<boolean> => {
    const refreshTokenCookie = useCookie('refresh-token')
    const refreshToken = refreshTokenCookie.value
    
    if (!refreshToken) return false
    
    try {
      const response = await $fetch<{ success: boolean; data: { token: string; user: User } }>('/api/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken
        }
      })
      
      if (response.success && response.data) {
        setAuthToken(response.data.token)
        user.value = response.data.user
        return true
      }
      
      return false
      
    } catch (err) {
      // Refresh failed, clear tokens
      await logout()
      return false
    }
  }
  
  // Initialize authentication state (call this in app.vue or layout)
  const initAuth = async () => {
    const token = getAuthToken()
    if (token) {
      const profile = await fetchProfile()
      if (!profile) {
        // Try to refresh token
        const refreshed = await refreshAuthToken()
        if (!refreshed) {
          clearAuthToken()
        }
      }
    }
  }
  
  return {
    // State
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    
    // Permissions
    hasPermission,
    canCreateReview,
    canEditReview,
    canDeleteReview,
    
    // Auth actions
    login,
    register,
    logout,
    
    // Profile management
    fetchProfile,
    updateProfile,
    changePassword,
    
    // Token management
    getAuthToken,
    refreshAuthToken,
    initAuth
  }
}