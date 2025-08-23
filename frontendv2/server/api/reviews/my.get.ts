export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  // Get user session/auth token
  const authToken = getCookie(event, 'auth-token') || getHeader(event, 'authorization')
  
  if (!authToken) {
    setResponseStatus(event, 401)
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to view your reviews'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Build query parameters
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page as string)
    if (query.limit) params.append('limit', query.limit as string)
    if (query.search) params.append('search', query.search as string)
    if (query.sortBy) params.append('sortBy', query.sortBy as string)
    if (query.sortOrder) params.append('sortOrder', query.sortOrder as string)
    if (query.statut !== undefined) params.append('statut', query.statut as string)
    if (query.estPublique !== undefined) params.append('estPublique', query.estPublique as string)
    
    // Call the NestJS backend for current user's reviews
    const backendUrl = `${config.public.apiBase}/critiques/my?${params.toString()}`
    
    const response = await $fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`
      }
    })
    
    // Transform backend response to frontend format
    const reviews = (response.data || response.critiques || response || []).map((review: any) => ({
      ...review,
      // Ensure consistent field naming
      contenu: review.contenu || review.critique,
      critique: review.critique || review.contenu,
      notation: review.notation || review.note,
      note: review.note || review.notation,
      dateCritique: review.dateCritique || review.dateCreation,
      dateCreation: review.dateCreation || review.dateCritique,
      nbVues: review.nbVues || review.nbClics || 0,
      nbClics: review.nbClics || review.nbVues || 0
    }))
    
    return {
      success: true,
      data: reviews,
      meta: {
        total: response.total || reviews.length,
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 20,
        hasMore: response.hasMore || false
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('My Reviews API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'FETCH_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to fetch your reviews'
    
    if (statusCode === 401) {
      errorCode = 'UNAUTHORIZED'
      errorMessage = 'Invalid or expired authentication token'
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