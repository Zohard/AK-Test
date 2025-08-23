export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  
  // Get user session/auth token
  const authToken = getCookie(event, 'auth-token') || getHeader(event, 'authorization')
  
  if (!authToken) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to delete a review'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  if (!id) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Review ID is required'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Call the NestJS backend
    const backendUrl = `${config.public.apiBase}/critiques/${id}`
    
    await $fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
      }
    })
    
    return {
      success: true,
      message: 'Review deleted successfully',
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Delete Review API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'DELETE_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to delete review'
    
    // Handle specific error cases
    if (statusCode === 401) {
      errorCode = 'UNAUTHORIZED'
      errorMessage = 'Invalid or expired authentication token'
    } else if (statusCode === 403) {
      errorCode = 'FORBIDDEN'
      errorMessage = 'You do not have permission to delete this review'
    } else if (statusCode === 404) {
      errorCode = 'NOT_FOUND'
      errorMessage = 'Review not found'
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