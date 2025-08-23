export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    // Build query parameters
    const params = new URLSearchParams()
    
    if (query.limit) params.append('limit', query.limit as string)
    if (query.period) params.append('period', query.period as string) // day, week, month, year, all
    if (query.type) params.append('type', query.type as string) // anime, manga, both
    
    // Call the NestJS backend for top reviews
    const backendUrl = `${config.public.apiBase}/critiques/top?${params.toString()}`
    
    const response = await $fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    // Transform backend response if needed
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
        total: reviews.length,
        limit: parseInt(query.limit as string) || 10,
        period: query.period as string || 'week'
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Top Reviews API Error:', error)
    
    // For top reviews, we can return empty array on error instead of failing
    const statusCode = error.response?.status || 500
    
    if (statusCode >= 500) {
      // Server error - return empty but valid response
      return {
        success: true,
        data: [],
        meta: {
          total: 0,
          limit: parseInt(query.limit as string) || 10,
          period: query.period as string || 'week'
        },
        timestamp: new Date().toISOString()
      }
    }
    
    // Client error - return error response
    setResponseStatus(event, statusCode)
    return {
      success: false,
      error: {
        code: error.response?.data?.code || 'FETCH_ERROR',
        message: error.response?.data?.message || error.message || 'Failed to fetch top reviews',
        details: error.response?.data
      },
      timestamp: new Date().toISOString()
    }
  }
})