export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  // Validate input
  if (!body.email || !body.password) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
        field: !body.email ? 'email' : 'password'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid email address',
        field: 'email'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Call the NestJS backend for authentication
    const backendUrl = `${config.public.apiBase}/auth/login`
    
    const response = await $fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        email: body.email,
        password: body.password,
        remember: body.remember || false
      }
    })
    
    // Transform backend response to frontend format
    const authResponse = {
      success: true,
      data: {
        user: {
          id: response.user?.id || response.id,
          pseudo: response.user?.pseudo || response.pseudo || response.username,
          email: response.user?.email || response.email,
          avatar: response.user?.avatar || response.avatar,
          bio: response.user?.bio || response.bio,
          isVerified: response.user?.isVerified || response.verified || false,
          joinDate: response.user?.joinDate || response.createdAt,
          reviewsCount: response.user?.reviewsCount || 0,
          averageRating: response.user?.averageRating || 0,
          permissions: response.user?.permissions || response.permissions || [],
          preferences: response.user?.preferences || {
            receiveNotifications: true,
            profilePublic: true,
            allowComments: true,
            theme: 'auto'
          }
        },
        token: response.token || response.accessToken,
        refreshToken: response.refreshToken
      },
      timestamp: new Date().toISOString()
    }
    
    // Set secure cookies
    setCookie(event, 'auth-token', authResponse.data.token, {
      secure: true,
      sameSite: 'lax',
      maxAge: body.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days or 1 day
      httpOnly: false // Allow client access for API calls
    })
    
    if (authResponse.data.refreshToken) {
      setCookie(event, 'refresh-token', authResponse.data.refreshToken, {
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true // Keep refresh token httpOnly for security
      })
    }
    
    return authResponse
    
  } catch (error: any) {
    console.error('Login API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'LOGIN_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Login failed'
    let errorField = error.response?.data?.field
    
    // Handle specific error cases
    if (statusCode === 401) {
      errorCode = 'INVALID_CREDENTIALS'
      errorMessage = 'Invalid email or password'
    } else if (statusCode === 429) {
      errorCode = 'TOO_MANY_ATTEMPTS'
      errorMessage = 'Too many login attempts. Please try again later.'
    } else if (statusCode === 403) {
      errorCode = 'ACCOUNT_SUSPENDED'
      errorMessage = 'Your account has been suspended. Please contact support.'
    }
    
    setResponseStatus(event, statusCode)
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        field: errorField,
        details: error.response?.data
      },
      timestamp: new Date().toISOString()
    }
  }
})