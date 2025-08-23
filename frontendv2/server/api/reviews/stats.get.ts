export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    // Build query parameters for stats
    const params = new URLSearchParams()
    
    if (query.period) params.append('period', query.period as string) // day, week, month, year
    if (query.type) params.append('type', query.type as string) // anime, manga, both
    
    // Call the NestJS backend for review stats
    const backendUrl = `${config.public.apiBase}/critiques/stats?${params.toString()}`
    
    const response = await $fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    // Ensure consistent response structure
    const stats = {
      totalReviews: response.totalReviews || response.total || 0,
      publishedReviews: response.publishedReviews || response.published || 0,
      draftReviews: response.draftReviews || response.drafts || 0,
      averageRating: response.averageRating || response.avgRating || 0,
      totalViews: response.totalViews || response.views || 0,
      totalLikes: response.totalLikes || response.likes || 0,
      totalComments: response.totalComments || response.comments || 0,
      
      // Top reviewers
      topReviewers: response.topReviewers || [],
      
      // Popular media
      popularMedia: response.popularMedia || [],
      
      // Recent activity
      recentActivity: response.recentActivity || [],
      
      // Additional stats
      topTags: response.topTags || [],
      ratingDistribution: response.ratingDistribution || [],
      monthlyStats: response.monthlyStats || []
    }
    
    return {
      success: true,
      data: stats,
      meta: {
        period: query.period as string || 'all',
        type: query.type as string || 'both',
        generatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('Review Stats API Error:', error)
    
    // For stats, we can provide fallback data
    const fallbackStats = {
      totalReviews: 0,
      publishedReviews: 0,
      draftReviews: 0,
      averageRating: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      topReviewers: [],
      popularMedia: [],
      recentActivity: [],
      topTags: [],
      ratingDistribution: [],
      monthlyStats: []
    }
    
    const statusCode = error.response?.status || 500
    
    if (statusCode >= 500) {
      // Server error - return fallback data
      console.warn('Using fallback stats due to server error')
      return {
        success: true,
        data: fallbackStats,
        meta: {
          period: query.period as string || 'all',
          type: query.type as string || 'both',
          generatedAt: new Date().toISOString(),
          fallback: true
        },
        timestamp: new Date().toISOString()
      }
    }
    
    // Client error - return error response
    setResponseStatus(event, statusCode)
    return {
      success: false,
      error: {
        code: error.response?.data?.code || 'STATS_ERROR',
        message: error.response?.data?.message || error.message || 'Failed to fetch review statistics',
        details: error.response?.data
      },
      timestamp: new Date().toISOString()
    }
  }
})