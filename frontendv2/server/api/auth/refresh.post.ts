export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  // Get refresh token from body or cookie
  const refreshToken = body.refreshToken || getCookie(event, 'refresh-token')
  
  if (!refreshToken) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: {
        code: 'NO_REFRESH_TOKEN',
        message: 'Refresh token is required'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Call the NestJS backend to refresh the token
    const backendUrl = `${config.public.apiBase}/auth/refresh`
    
    const response = await $fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        refreshToken
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
          bio: response.user?.bio || response.bio || '',
          isVerified: response.user?.isVerified || response.verified || false,
          joinDate: response.user?.joinDate || response.createdAt,
          reviewsCount: response.user?.reviewsCount || response.stats?.reviewsCount || 0,
          averageRating: response.user?.averageRating || response.stats?.averageRating || 0,
          permissions: response.user?.permissions || response.permissions || [],
          preferences: response.user?.preferences || response.preferences || {
            receiveNotifications: true,
            profilePublic: true,
            allowComments: true,
            theme: 'auto'
          }
        },
        token: response.token || response.accessToken,
        refreshToken: response.refreshToken || refreshToken // Use new refresh token if provided, otherwise keep current
      },
      timestamp: new Date().toISOString()
    }
    
    // Update auth token cookie
    setCookie(event, 'auth-token', authResponse.data.token, {
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: false
    })
    
    // Update refresh token cookie if a new one was provided
    if (response.refreshToken && response.refreshToken !== refreshToken) {
      setCookie(event, 'refresh-token', response.refreshToken, {
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true
      })
    }
    
    return authResponse
    
  } catch (error: any) {
    console.error('Token Refresh API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'REFRESH_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to refresh token'
    
    if (statusCode === 401) {
      errorCode = 'INVALID_REFRESH_TOKEN'
      errorMessage = 'Invalid or expired refresh token'
      
      // Clear invalid refresh token
      setCookie(event, 'refresh-token', '', {
        secure: true,
        sameSite: 'lax',
        maxAge: 0,
        httpOnly: true
      })
    }
    
    setResponseStatus(event, statusCode)
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: error.response?.data
      },
      timestamp: new Date().toISOString()
    }
  }
})