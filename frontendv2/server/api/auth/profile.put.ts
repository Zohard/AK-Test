export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
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
  
  // Validate allowed fields for profile updates
  const allowedFields = ['pseudo', 'bio', 'avatar', 'preferences']
  const updateData: any = {}
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }
  
  // Validate username if being updated
  if (updateData.pseudo) {
    if (updateData.pseudo.length < 3 || updateData.pseudo.length > 20) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username must be between 3 and 20 characters',
          field: 'pseudo'
        },
        timestamp: new Date().toISOString()
      }
    }
  }
  
  // Validate bio length if being updated
  if (updateData.bio && updateData.bio.length > 500) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'BIO_TOO_LONG',
        message: 'Bio must be 500 characters or less',
        field: 'bio'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Call the NestJS backend to update profile
    const backendUrl = `${config.public.apiBase}/auth/profile`
    
    const response = await $fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
      },
      body: updateData
    })
    
    // Transform backend response to frontend format
    const updatedProfile = {
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
      data: updatedProfile,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Profile Update API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'UPDATE_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to update profile'
    let errorField = error.response?.data?.field
    
    if (statusCode === 401) {
      errorCode = 'TOKEN_INVALID'
      errorMessage = 'Invalid or expired authentication token'
    } else if (statusCode === 409) {
      if (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('pseudo')) {
        errorCode = 'USERNAME_EXISTS'
        errorMessage = 'This username is already taken'
        errorField = 'pseudo'
      }
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