import type { Manga, MangaQueryParams, CreateMangaDto, UpdateMangaDto } from '~/types'

export function useMangaAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()

  const fetchMangas = async (params?: MangaQueryParams) => {
    loading.value = true
    error.value = null
    
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/api/mangas`, {
        params
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des mangas'
      console.error('Mangas API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMangaById = async (id: number, options?: {
    includeReviews?: boolean
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/api/mangas/${id}`, {
        params: options
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement du manga'
      console.error('Manga detail API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createManga = async (data: CreateMangaDto) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/mangas', {
        method: 'POST',
        body: data,
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la création du manga'
      console.error('Create manga API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateManga = async (id: number, data: UpdateMangaDto) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/mangas/${id}`, {
        method: 'PATCH',
        body: data,
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la mise à jour'
      console.error('Update manga API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteManga = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/mangas/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
    } catch (err: any) {
      error.value = 'Erreur lors de la suppression'
      console.error('Delete manga API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTopMangas = async (limit = 10) => {
    try {
      const response = await $fetch('/api/mangas/top', {
        params: { limit }
      })
      return response
    } catch (err: any) {
      console.error('Error fetching top mangas:', err)
      return []
    }
  }

  const autocompleteManga = async (query: string, options?: {
    exclude?: string
    limit?: number
  }) => {
    try {
      const response = await $fetch('/api/mangas/autocomplete', {
        params: {
          q: query,
          ...options
        }
      })
      return response
    } catch (err: any) {
      console.error('Error in manga autocomplete:', err)
      return []
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchMangas,
    fetchMangaById,
    createManga,
    updateManga,
    deleteManga,
    getTopMangas,
    autocompleteManga
  }
}