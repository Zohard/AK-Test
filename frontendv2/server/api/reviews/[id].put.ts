export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  // Get user session/auth token
  const authToken = getCookie(event, 'auth-token') || getHeader(event, 'authorization')
  
  if (!authToken) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to update a review'
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
    // Validate rating if provided
    if (body.notation !== undefined && (body.notation < 0 || body.notation > 10)) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 0 and 10'
        },
        timestamp: new Date().toISOString()
      }
    }
    
    // Transform frontend request to backend format
    const backendData: any = {}
    
    if (body.titre !== undefined) backendData.titre = body.titre
    if (body.contenu !== undefined) backendData.contenu = body.contenu
    if (body.content !== undefined) backendData.contenu = body.content
    if (body.critique !== undefined) backendData.critique = body.critique
    if (body.notation !== undefined) backendData.notation = body.notation
    if (body.rating !== undefined) backendData.notation = body.rating
    if (body.tags !== undefined) backendData.tags = body.tags
    if (body.estPublique !== undefined) backendData.estPublique = body.estPublique
    if (body.isPublic !== undefined) backendData.estPublique = body.isPublic
    if (body.allowComments !== undefined) backendData.allowComments = body.allowComments
    if (body.metaTitle !== undefined) backendData.metaTitle = body.metaTitle
    if (body.metaDescription !== undefined) backendData.metaDescription = body.metaDescription
    if (body.statut !== undefined) backendData.statut = body.statut
    
    // Call the NestJS backend
    const backendUrl = `${config.public.apiBase}/critiques/${id}`
    
    const response = await $fetch(backendUrl, {
      method: 'PUT',
      body: backendData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
      }
    })
    
    return {
      success: true,
      data: response,
      message: 'Review updated successfully',
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Update Review API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'UPDATE_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to update review'
    
    // Handle specific error cases
    if (statusCode === 401) {
      errorCode = 'UNAUTHORIZED'
      errorMessage = 'Invalid or expired authentication token'
    } else if (statusCode === 403) {
      errorCode = 'FORBIDDEN'
      errorMessage = 'You do not have permission to update this review'
    } else if (statusCode === 404) {
      errorCode = 'NOT_FOUND'
      errorMessage = 'Review not found'
    } else if (statusCode === 400) {
      errorCode = 'VALIDATION_ERROR'
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