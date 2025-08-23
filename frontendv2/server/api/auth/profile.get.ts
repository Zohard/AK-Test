export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Get auth token from header or cookie
  const authToken = getHeader(event, 'authorization') || getCookie(event, 'auth-token')
  
  if (!authToken) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Call the NestJS backend to get user profile
    const backendUrl = `${config.public.apiBase}/auth/profile`
    
    const response = await $fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
      }
    })
    
    // Transform backend response to frontend format
    const userProfile = {
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
    }
    
    return {
      success: true,
      data: userProfile,
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Profile API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'PROFILE_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile'
    
    if (statusCode === 401) {
      errorCode = 'TOKEN_INVALID'
      errorMessage = 'Invalid or expired authentication token'
    } else if (statusCode === 404) {
      errorCode = 'USER_NOT_FOUND'
      errorMessage = 'User account not found'
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