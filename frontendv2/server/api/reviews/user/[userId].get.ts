export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const userId = getRouterParam(event, 'userId')
  const query = getQuery(event)
  
  if (!userId) {
    setResponseStatus(event, 400)
    return {
      success: false,
      error: {
        code: 'INVALID_USER_ID',
        message: 'User ID is required'
      },
      timestamp: new Date().toISOString()
    }
  }
  
  try {
    // Build query parameters
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page as string)
    if (query.limit) params.append('limit', query.limit as string)
    if (query.sortBy) params.append('sortBy', query.sortBy as string)
    if (query.sortOrder) params.append('sortOrder', query.sortOrder as string)
    
    // Only show public reviews for other users (unless it's the same user)
    params.append('estPublique', 'true')
    params.append('statut', '1') // Only approved reviews
    
    // Call the NestJS backend
    const backendUrl = `${config.public.apiBase}/critiques/user/${userId}?${params.toString()}`
    
    const response = await $fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    // Transform backend response
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
        hasMore: response.hasMore || false,
        userId: parseInt(userId)
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('User Reviews API Error:', error)
    
    let statusCode = error.response?.status || 500
    let errorCode = error.response?.data?.code || 'FETCH_ERROR'
    let errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user reviews'
    
    if (statusCode === 404) {
      errorCode = 'USER_NOT_FOUND'
      errorMessage = 'User not found'
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