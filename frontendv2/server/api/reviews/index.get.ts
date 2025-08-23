export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    // Build query parameters for the backend API
    const params = new URLSearchParams()
    
    if (query.page) params.append('page', query.page as string)
    if (query.limit) params.append('limit', query.limit as string)
    if (query.search) params.append('search', query.search as string)
    if (query.type) params.append('type', query.type as string)
    if (query.sortBy) params.append('sortBy', query.sortBy as string)
    if (query.sortOrder) params.append('sortOrder', query.sortOrder as string)
    if (query.rating) params.append('minNotation', query.rating as string)
    if (query.author) params.append('author', query.author as string)
    if (query.idAnime) params.append('idAnime', query.idAnime as string)
    if (query.idManga) params.append('idManga', query.idManga as string)
    if (query.statut) params.append('statut', query.statut as string)
    if (query.estPublique !== undefined) params.append('estPublique', query.estPublique as string)
    
    // Call the NestJS backend
    const backendUrl = `${config.public.apiBase}/critiques?${params.toString()}`
    
    const response = await $fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    // Transform backend response to frontend format
    return {
      success: true,
      data: response.data || response.critiques || response || [],
      meta: {
        total: response.total || 0,
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 20,
        hasMore: response.hasMore || false
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Reviews API Error:', error)
    
    // Return structured error response
    setResponseStatus(event, error.response?.status || 500)
    return {
      success: false,
      error: {
        code: error.response?.data?.code || 'FETCH_ERROR',
        message: error.response?.data?.message || error.message || 'Failed to fetch reviews',
        details: error.response?.data
      },
      timestamp: new Date().toISOString()
    }
  }
})