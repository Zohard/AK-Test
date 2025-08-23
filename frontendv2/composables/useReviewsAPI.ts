import type { ApiResponse } from '~/types'

export interface ReviewData {
  idCritique: number
  niceUrl?: string
  titre?: string
  critique?: string
  contenu?: string
  notation?: number
  note?: number
  dateCritique?: string
  dateCreation?: string
  statut: number
  estPublique?: boolean
  idMembre: number
  idAnime: number
  idManga: number
  nbClics?: number
  nbVues?: number
  nbClicsDay?: number
  nbClicsWeek?: number
  nbClicsMonth?: number
  tags?: string[]
  slug?: string
  // Relations
  anime?: {
    id: number
    titre: string
    image?: string
    annee?: number
    studio?: string
    genres?: string[]
  }
  manga?: {
    id: number
    titre: string
    image?: string
    annee?: number
    auteur?: string
    genres?: string[]
  }
  membre?: {
    id: number
    pseudo: string
    avatar?: string
    bio?: string
    isVerified?: boolean
    joinDate?: string
    reviewsCount?: number
    averageRating?: number
  }
}

interface APIError {
  message: string
  status: number
  code?: string
  details?: any
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
}

interface OptimisticUpdate {
  id: string
  type: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  size(): number {
    return this.cache.size
  }
}

const apiCache = new APICache()
const optimisticUpdates = reactive(new Map<string, OptimisticUpdate>())

export interface ReviewQueryParams {
  page?: number
  limit?: number
  search?: string
  idAnime?: number
  idManga?: number
  idMembre?: number
  statut?: number
  minNotation?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  type?: 'anime' | 'manga' | 'both'
}

export function useReviewsAPI() {
  const loading = ref(false)
  const error = ref<APIError | null>(null)
  const config = useRuntimeConfig()
  const router = useRouter()

  // Enhanced error handling
  const handleAPIError = (err: any): APIError => {
    if (err.response) {
      return {
        message: err.response._data?.message || err.response.statusText || 'API Error',
        status: err.response.status,
        code: err.response._data?.code,
        details: err.response._data
      }
    } else if (err.request) {
      return {
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR'
      }
    } else {
      return {
        message: err.message || 'Unknown error occurred',
        status: 500,
        code: 'UNKNOWN_ERROR'
      }
    }
  }

  // Enhanced fetch with caching, retries, and error handling
  const enhancedFetch = async <T>(
    endpoint: string,
    options: {
      method?: string
      body?: any
      cache?: boolean
      cacheTTL?: number
      retries?: number
      timeout?: number
      optimistic?: boolean
    } = {}
  ): Promise<T> => {
    const {
      method = 'GET',
      body,
      cache = method === 'GET',
      cacheTTL = 5 * 60 * 1000, // 5 minutes
      retries = 3,
      timeout = 10000,
      optimistic = false
    } = options

    const cacheKey = `${method}:${endpoint}:${JSON.stringify(body || {})}`

    // Try cache first for GET requests
    if (cache && method === 'GET') {
      const cached = apiCache.get<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    let lastError: any
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const fetchOptions: any = {
          method,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        }

        if (body && method !== 'GET') {
          fetchOptions.body = JSON.stringify(body)
        }

        let fetchUrl = endpoint
        if (endpoint.startsWith('/api/proxy/')) {
          // Use proxy endpoint
          fetchUrl = endpoint
        } else {
          // Use direct API
          fetchUrl = `${config.public.apiBase}${endpoint}`
        }

        const response = await $fetch<T>(fetchUrl, fetchOptions)
        
        clearTimeout(timeoutId)

        // Cache successful GET responses
        if (cache && method === 'GET') {
          apiCache.set(cacheKey, response, cacheTTL)
        }

        return response
        
      } catch (err) {
        lastError = err
        
        // Don't retry on client errors (4xx)
        if (err.response?.status >= 400 && err.response?.status < 500) {
          break
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    throw handleAPIError(lastError)
  }

  // Apply optimistic updates to data
  const applyOptimisticUpdates = <T>(data: T[], type: string): T[] => {
    const updatedData = [...data]
    
    for (const [id, update] of optimisticUpdates.entries()) {
      if (!id.startsWith(type)) continue
      
      switch (update.type) {
        case 'create':
          updatedData.unshift(update.data)
          break
        case 'update':
          const updateIndex = updatedData.findIndex((item: any) => item.id === update.data.id || item.idCritique === update.data.id)
          if (updateIndex >= 0) {
            updatedData[updateIndex] = { ...updatedData[updateIndex], ...update.data }
          }
          break
        case 'delete':
          const deleteIndex = updatedData.findIndex((item: any) => item.id === update.data.id || item.idCritique === update.data.id)
          if (deleteIndex >= 0) {
            updatedData.splice(deleteIndex, 1)
          }
          break
      }
    }
    
    return updatedData
  }

  // Add optimistic update
  const addOptimisticUpdate = (id: string, type: 'create' | 'update' | 'delete', data: any): void => {
    optimisticUpdates.set(id, {
      id,
      type,
      data,
      timestamp: Date.now()
    })
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      optimisticUpdates.delete(id)
    }, 30000)
  }

  const fetchReviews = async (params?: ReviewQueryParams) => {
    loading.value = true
    error.value = null
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.idAnime) queryParams.append('idAnime', params.idAnime.toString())
      if (params?.idManga) queryParams.append('idManga', params.idManga.toString())
      if (params?.idMembre) queryParams.append('idMembre', params.idMembre.toString())
      if (params?.statut !== undefined) queryParams.append('statut', params.statut.toString())
      if (params?.minNotation) queryParams.append('minNotation', params.minNotation.toString())
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params?.type) queryParams.append('type', params.type)
      
      const endpoint = `/api/reviews?${queryParams.toString()}`
      const response = await enhancedFetch<any>(endpoint, {
        cache: true,
        cacheTTL: 2 * 60 * 1000 // 2 minutes cache for reviews list
      })
      
      // NestJS shape: { reviews, pagination }
      if (response && (response.reviews || response.pagination)) {
        const data = Array.isArray(response.reviews) ? response.reviews : []
        const meta = response.pagination || {}
        const updatedData = applyOptimisticUpdates(data, 'review')
        return {
          data: updatedData,
          total: meta.total || updatedData.length || 0,
          page: meta.page || params?.page || 1,
          limit: meta.limit || params?.limit || 20,
          hasMore: meta.total ? ((meta.page || 1) * (meta.limit || 20) < meta.total) : false
        }
      }

      // Fallback: { success, data, meta }
      const data = response?.data || []
      const updatedData = applyOptimisticUpdates(data, 'review')
      return {
        data: updatedData,
        total: response?.meta?.total || updatedData.length || 0,
        page: response?.meta?.page || params?.page || 1,
        limit: response?.meta?.limit || params?.limit || 20,
        hasMore: response?.meta?.hasMore || false
      }
      
    } catch (err: any) {
      const apiError = handleAPIError(err)
      error.value = apiError
      console.error('Reviews API Error:', apiError)
      throw apiError
    } finally {
      loading.value = false
    }
  }

  const fetchReviewById = async (id: number | string) => {
    loading.value = true
    error.value = null
    
    try {
      const isNumeric = typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))
      const endpoint = isNumeric ? `/api/reviews/${id}` : `/api/reviews/slug/${encodeURIComponent(id as string)}`
      let response = await enhancedFetch<any>(endpoint, {
        cache: true,
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache for individual reviews
      })
      // If slug endpoint not available or returned an error string, try a search fallback
      if (!isNumeric && (!response || typeof response === 'string' || (response as any)?.message?.includes('Cannot GET'))) {
        const searchRes: any = await enhancedFetch<any>(`/api/reviews?search=${encodeURIComponent(id as string)}&limit=1`, { cache: true })
        const arr = (searchRes?.reviews || searchRes?.data || []) as any[]
        if (arr.length) return arr[0]
      }
      // NestJS returns the review object directly
      if (response && (response.id || response.idCritique)) {
        return response
      }
      // Fallback to wrapped shape
      return (response as any)?.data
    } catch (err: any) {
      const apiError = handleAPIError(err)
      error.value = apiError
      console.error('Review detail API Error:', apiError)
      throw apiError
    } finally {
      loading.value = false
    }
  }

  const getTopReviews = async (limit = 10, period = 'week', type?: 'anime' | 'manga' | 'both') => {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('limit', limit.toString())
      queryParams.append('period', period)
      if (type) queryParams.append('type', type)
      
      const response = await enhancedFetch<any>(`/api/reviews/top?${queryParams.toString()}`, {
        cache: true,
        cacheTTL: 15 * 60 * 1000 // 15 minutes cache for top reviews
      })
      
      // NestJS shape: { topReviews }
      if (response?.topReviews) {
        return { data: response.topReviews }
      }
      // Fallback
      return { data: response?.data || [] }
    } catch (err: any) {
      console.error('Error fetching top reviews:', handleAPIError(err))
      return { data: [] }
    }
  }

  const getUserReviews = async (userId: number, limit = 20) => {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('limit', limit.toString())
      
      const response = await enhancedFetch<any>(`/api/reviews/user/${userId}?${queryParams.toString()}`, {
        cache: true,
        cacheTTL: 5 * 60 * 1000 // 5 minutes cache for user reviews
      })
      
      const data = response?.reviews || response?.data || []
      
      // Apply optimistic updates
      const updatedData = applyOptimisticUpdates(data, 'review')

      return { data: updatedData }
    } catch (err: any) {
      console.error('Error fetching user reviews:', handleAPIError(err))
      return { data: [] }
    }
  }

  const getMyReviews = async (params: { page?: number; limit?: number } = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      
      // NestJS endpoint is /api/reviews/my-reviews
      const response = await enhancedFetch<any>(`/api/reviews/my-reviews?${queryParams.toString()}`, {
        cache: false // Don't cache personal data
      })
      
      const data = response?.reviews || response?.data || []
      const total = response?.total || response?.meta?.total || data.length || 0

      // Apply optimistic updates
      const updatedData = applyOptimisticUpdates(data, 'review')

      return {
        data: updatedData,
        total,
        page: params.page || 1,
        limit: params.limit || 20,
        hasMore: total ? ((params.page || 1) * (params.limit || 20) < total) : false
      }
    } catch (err: any) {
      const apiError = handleAPIError(err)
      error.value = apiError
      console.error('My reviews API Error:', apiError)
      throw apiError
    } finally {
      loading.value = false
    }
  }

  const createReview = async (reviewData: {
    titre: string
    content: string
    rating: number
    idAnime?: number
    idManga?: number
    tags?: string[]
    isPublic?: boolean
    allowComments?: boolean
  }) => {
    loading.value = true
    error.value = null
    
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`
    
    // Create optimistic review object
    const optimisticReview: ReviewData = {
      idCritique: tempId as any,
      titre: reviewData.titre,
      contenu: reviewData.content,
      notation: reviewData.rating,
      dateCritique: new Date().toISOString(),
      statut: 1,
      estPublique: reviewData.isPublic ?? true,
      idMembre: 0, // Will be filled by actual response
      idAnime: reviewData.idAnime || 0,
      idManga: reviewData.idManga || 0,
      tags: reviewData.tags,
      nbVues: 0,
      slug: reviewData.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    
    try {
      // Add optimistic update
      addOptimisticUpdate(`review-${tempId}`, 'create', optimisticReview)
      
      // Map to NestJS DTO
      const body = {
        titre: (reviewData as any).titre || (reviewData as any).title,
        critique: reviewData.content,
        notation: reviewData.rating,
        idAnime: reviewData.idAnime,
        idManga: reviewData.idManga
      }
      const response = await enhancedFetch(`/api/reviews`, {
        method: 'POST',
        body
      })

      // Remove optimistic update on success
      optimisticUpdates.delete(`review-${tempId}`)
      
      // Invalidate related caches
      apiCache.invalidate('/api/reviews')
      apiCache.invalidate('/api/reviews/my-reviews')
      
      return response
    } catch (err: any) {
      // Remove optimistic update on error
      optimisticUpdates.delete(`review-${tempId}`)
      
      const apiError = handleAPIError(err)
      error.value = apiError
      console.error('Create review API Error:', apiError)
      throw apiError
    } finally {
      loading.value = false
    }
  }

  const updateReview = async (id: number, reviewData: Partial<ReviewData>) => {
    loading.value = true
    error.value = null
    
    try {
      // Add optimistic update
      addOptimisticUpdate(`review-update-${id}`, 'update', { id, ...reviewData })
      
      // Map to NestJS DTO fields when present
      const body: any = { ...reviewData }
      if ((reviewData as any).title) {
        body.titre = (reviewData as any).title
        delete (body as any).title
      }
      if ((reviewData as any).content) {
        body.critique = (reviewData as any).content
        delete body.content
      }
      if ((reviewData as any).rating) {
        body.notation = (reviewData as any).rating
        delete body.rating
      }
      const response = await enhancedFetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        body
      })

      // Remove optimistic update on success
      optimisticUpdates.delete(`review-update-${id}`)
      
      // Invalidate related caches
      apiCache.invalidate(`/api/reviews/${id}`)
      apiCache.invalidate('/api/reviews')
      
      return response
    } catch (err: any) {
      // Remove optimistic update on error
      optimisticUpdates.delete(`review-update-${id}`)
      
      const apiError = handleAPIError(err)
      error.value = apiError
      console.error('Update review API Error:', apiError)
      throw apiError
    } finally {
      loading.value = false
    }
  }

  const deleteReview = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      // Add optimistic update
      addOptimisticUpdate(`review-delete-${id}`, 'delete', { id })
      
      const response = await enhancedFetch(`/api/reviews/${id}`, {
        method: 'DELETE'
      })

      // Remove optimistic update on success
      optimisticUpdates.delete(`review-delete-${id}`)
      
      // Invalidate related caches
      apiCache.invalidate(`/api/reviews/${id}`)
      apiCache.invalidate('/api/reviews')
      
      return response
    } catch (err: any) {
      // Remove optimistic update on error
      optimisticUpdates.delete(`review-delete-${id}`)
      
      const apiError = handleAPIError(err)
      error.value = apiError
      console.error('Delete review API Error:', apiError)
      throw apiError
    } finally {
      loading.value = false
    }
  }

  // Cache management functions
  const clearCache = () => {
    apiCache.invalidate()
  }

  const clearReviewsCache = () => {
    apiCache.invalidate('/api/reviews')
  }

  const refreshReviews = async (params?: ReviewQueryParams) => {
    clearReviewsCache()
    return await fetchReviews(params)
  }

  // Get review statistics
  const getReviewStats = async (period = 'all', type = 'both') => {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('period', period)
      queryParams.append('type', type)
      
      const response = await enhancedFetch<any>(`/api/reviews/stats?${queryParams.toString()}`, {
        cache: true,
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache for stats
      })
      
      return {
        data: response.success ? response.data : {
          totalReviews: 0,
          publishedReviews: 0,
          averageRating: 0,
          totalViews: 0,
          topReviewers: [],
          popularMedia: [],
          recentActivity: []
        }
      }
    } catch (err: any) {
      console.error('Error fetching review stats:', handleAPIError(err))
      return {
        data: {
          totalReviews: 0,
          publishedReviews: 0,
          averageRating: 0,
          totalViews: 0,
          topReviewers: [],
          popularMedia: [],
          recentActivity: []
        }
      }
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    
    // Core functions
    fetchReviews,
    fetchReviewById,
    getTopReviews,
    getUserReviews,
    getMyReviews,
    getReviewStats,
    
    // CRUD operations
    createReview,
    updateReview,
    deleteReview,
    
    // Cache management
    clearCache,
    clearReviewsCache,
    refreshReviews,
    
    // Optimistic updates
    addOptimisticUpdate,
    
    // Utilities
    handleAPIError,
    
    // Cache info (for debugging)
    getCacheSize: () => apiCache.size(),
    getOptimisticUpdatesCount: () => optimisticUpdates.size
  }
}
