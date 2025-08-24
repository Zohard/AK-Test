import type { Anime, AnimeQueryParams, CreateAnimeDto, UpdateAnimeDto } from '~/types'

export function useAnimeAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const fetchAnimes = async (params?: AnimeQueryParams) => {
    loading.value = true
    error.value = null
    
    try {
      // Call backend directly using configured API base
      const response = await $fetch(`${config.public.apiBase}/api/animes`, {
        params
      })
      
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des animes'
      console.error('Animes API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAnimeById = async (id: number, options?: {
    includeReviews?: boolean
    includeEpisodes?: boolean
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/${id}`, {
        params: options
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement de l\'anime'
      console.error('Anime detail API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createAnime = async (data: CreateAnimeDto) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes`, {
        method: 'POST',
        body: data,
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la création de l\'anime'
      console.error('Create anime API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAnime = async (id: number, data: UpdateAnimeDto) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/${id}`, {
        method: 'PATCH',
        body: data,
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la mise à jour'
      console.error('Update anime API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteAnime = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`${config.public.apiBase}/api/animes/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
    } catch (err: any) {
      error.value = 'Erreur lors de la suppression'
      console.error('Delete anime API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTopAnimes = async (limit = 10) => {
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/top`, {
        params: { limit }
      })
      return response
    } catch (err: any) {
      console.error('Error fetching top animes:', err)
      return []
    }
  }

  const getAnimesByGenre = async (genre: string, limit = 20) => {
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/genre/${genre}`, {
        params: { limit }
      })
      return response
    } catch (err: any) {
      console.error('Error fetching animes by genre:', err)
      return []
    }
  }

  const autocompleteAnimes = async (query: string, options?: {
    exclude?: string
    limit?: number
  }) => {
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/autocomplete`, {
        params: {
          q: query,
          ...options
        }
      })
      return response
    } catch (err: any) {
      console.error('Error in anime autocomplete:', err)
      return []
    }
  }

  const getGenres = async () => {
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/genres`)
      return response
    } catch (err: any) {
      console.error('Error fetching genres:', err)
      return []
    }
  }

  const getAnimeTags = async (id: number) => {
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/${id}/tags`)
      return response
    } catch (err: any) {
      console.error('Error fetching anime tags:', err)
      return { tags: [] }
    }
  }

  const getAnimeRelations = async (id: number) => {
    try {
      const response = await $fetch(`${config.public.apiBase}/api/animes/${id}/relations`)
      return response
    } catch (err: any) {
      console.error('Error fetching anime relations:', err)
      return { relations: [] }
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchAnimes,
    fetchAnimeById,
    createAnime,
    updateAnime,
    deleteAnime,
    getTopAnimes,
    getAnimesByGenre,
    autocompleteAnimes,
    getGenres,
    getAnimeTags,
    getAnimeRelations
  }
}
