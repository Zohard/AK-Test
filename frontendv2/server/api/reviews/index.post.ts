export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  // Get user session/auth token from headers or cookies
  const authToken = getCookie(event, 'auth-token') || getHeader(event, 'authorization')
  
  if (!authToken) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to create a review'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Validate required fields
    if (!body.titre || !body.contenu || body.notation === undefined) {
      setResponseStatus(event, 400)
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title, content, and rating are required',
          details: {
            missingFields: [
              !body.titre && 'titre',
              !body.contenu && 'contenu', 
              body.notation === undefined && 'notation'
            ].filter(Boolean)
          }
        },
        timestamp: new Date().toISOString()
      }
    }
    
    // Validate rating range
    if (body.notation < 0 || body.notation > 10) {
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
    const backendData = {
      titre: body.titre,
      critique: body.contenu || body.content, // Handle both field names
      contenu: body.contenu || body.content,
      notation: body.notation || body.rating,
      idAnime: body.idAnime,
      idManga: body.idManga,
      tags: body.tags,
      estPublique: body.estPublique ?? body.isPublic ?? true,
      allowComments: body.allowComments ?? true,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription
    }
    
    // Call the NestJS backend
    const backendUrl = `${config.public.apiBase}/critiques`
    
    const response = await $fetch(backendUrl, {
      method: 'POST',
      body: backendData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
      }
    })
    
    // Return success response
    return {
      success: true,
      data: response,
      message: 'Review created successfully',
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Create Review API Error:', error)
    
    // Handle specific error cases
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'CREATE_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to create review'
    
    // Handle validation errors from backend
    if (statusCode === 400) {
      errorCode = 'VALIDATION_ERROR'
    } else if (statusCode === 401) {
      errorCode = 'UNAUTHORIZED'
      errorMessage = 'Invalid or expired authentication token'
    } else if (statusCode === 403) {
      errorCode = 'FORBIDDEN'
      errorMessage = 'You do not have permission to create reviews'
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