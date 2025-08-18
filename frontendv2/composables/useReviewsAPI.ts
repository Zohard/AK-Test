import type { ApiResponse } from '~/types'

export interface ReviewData {
  idCritique: number
  niceUrl?: string
  titre?: string
  critique?: string
  notation?: number
  dateCritique?: string
  statut: number
  idMembre: number
  idAnime: number
  idManga: number
  nbClics?: number
  nbClicsDay?: number
  nbClicsWeek?: number
  nbClicsMonth?: number
  // Relations
  anime?: {
    id: number
    titre: string
    image?: string
  }
  manga?: {
    id: number
    titre: string
    image?: string
  }
  membre?: {
    id: number
    pseudo: string
  }
}

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
}

export function useReviewsAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchReviews = async (params?: ReviewQueryParams) => {
    loading.value = true
    error.value = null
    
    try {
      // Use server-side proxy to avoid CORS issues
      const response = await $fetch('/api/proxy/reviews', {
        params
      })
      return response as ApiResponse<ReviewData[]>
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des critiques'
      console.error('Reviews API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchReviewById = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/api/reviews/${id}`)
      return response as ReviewData
    } catch (err: any) {
      error.value = 'Erreur lors du chargement de la critique'
      console.error('Review detail API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTopReviews = async (limit = 10) => {
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/api/reviews/top`, {
        params: { limit }
      })
      return response as ApiResponse<ReviewData[]>
    } catch (err: any) {
      console.error('Error fetching top reviews:', err)
      return { data: [] } as ApiResponse<ReviewData[]>
    }
  }

  const getUserReviews = async (userId: number, limit = 20) => {
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/api/reviews/user/${userId}`, {
        params: { limit }
      })
      return response as ApiResponse<ReviewData[]>
    } catch (err: any) {
      console.error('Error fetching user reviews:', err)
      return { data: [] } as ApiResponse<ReviewData[]>
    }
  }

  const createReview = async (reviewData: {
    critique: string
    notation: number
    idAnime?: number
    idManga?: number
    titre?: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/api/reviews`, {
        method: 'POST',
        body: reviewData
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la création de la critique'
      console.error('Create review API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchReviews,
    fetchReviewById,
    getTopReviews,
    getUserReviews,
    createReview
  }
}