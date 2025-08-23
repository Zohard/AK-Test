export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  
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
    // Determine if ID is numeric or slug
    const isNumeric = /^\d+$/.test(id)
    const endpoint = isNumeric 
      ? `${config.public.apiBase}/critiques/${id}`
      : `${config.public.apiBase}/critiques/slug/${id}`
    
    const response = await $fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    // If response is null or empty, review not found
    if (!response) {
      setResponseStatus(event, 404)
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found'
        },
        timestamp: new Date().toISOString()
      }
    }
    
    // Transform backend response if needed
    const reviewData = {
      ...response,
      // Ensure consistent field naming
      contenu: response.contenu || response.critique,
      critique: response.critique || response.contenu,
      notation: response.notation || response.note,
      note: response.note || response.notation,
      dateCritique: response.dateCritique || response.dateCreation,
      dateCreation: response.dateCreation || response.dateCritique,
      nbVues: response.nbVues || response.nbClics || 0,
      nbClics: response.nbClics || response.nbVues || 0
    }
    
    // Increment view count (fire and forget)
    try {
      $fetch(`${config.public.apiBase}/critiques/${response.idCritique || response.id}/view`, {
        method: 'POST'
      }).catch(() => {
        // Ignore view count errors
      })
    } catch {
      // Ignore view count errors
    }
    
    return {
      success: true,
      data: reviewData,
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Review Detail API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = 'FETCH_ERROR'
    let errorMessage = 'Failed to fetch review'
    
    if (statusCode === 404) {
      errorCode = 'NOT_FOUND'
      errorMessage = 'Review not found'
    } else if (statusCode === 403) {
      errorCode = 'FORBIDDEN'
      errorMessage = 'You do not have permission to view this review'
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