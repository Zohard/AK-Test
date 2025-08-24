interface RelatedItem {
  id: number
  type: 'anime' | 'manga'
  title: string
  image?: string
  year?: number
  rating?: number
  niceUrl?: string
  relationType?: string
}

interface RelationsResponse {
  relations: RelatedItem[]
  total: number
  anime_id?: number
  manga_id?: number
}

export const useRelations = () => {
  const config = useRuntimeConfig()

  const fetchAnimeRelations = async (animeId: number): Promise<RelationsResponse | null> => {
    try {
      const response = await $fetch<RelationsResponse>(`${config.public.apiBase}/api/animes/${animeId}/relations`)
      return response
    } catch (error) {
      console.error('Error fetching anime relations:', error)
      return null
    }
  }

  const fetchMangaRelations = async (mangaId: number): Promise<RelationsResponse | null> => {
    try {
      const response = await $fetch<RelationsResponse>(`${config.public.apiBase}/api/mangas/${mangaId}/relations`)
      return response
    } catch (error) {
      console.error('Error fetching manga relations:', error)
      return null
    }
  }

  const useAnimeRelations = (animeId: number) => {
    const relations = ref<RelatedItem[]>([])
    const loading = ref(true)
    const error = ref<Error | null>(null)

    const load = async () => {
      loading.value = true
      error.value = null
      
      try {
        const result = await fetchAnimeRelations(animeId)
        if (result) {
          relations.value = result.relations || []
        }
      } catch (err) {
        error.value = err as Error
        console.error('Error in useAnimeRelations:', err)
      } finally {
        loading.value = false
      }
    }

    // Auto-load on mount
    onMounted(load)

    return {
      relations: readonly(relations),
      loading: readonly(loading),
      error: readonly(error),
      reload: load
    }
  }

  const useMangaRelations = (mangaId: number) => {
    const relations = ref<RelatedItem[]>([])
    const loading = ref(true)
    const error = ref<Error | null>(null)

    const load = async () => {
      loading.value = true
      error.value = null
      
      try {
        const result = await fetchMangaRelations(mangaId)
        if (result) {
          relations.value = result.relations || []
        }
      } catch (err) {
        error.value = err as Error
        console.error('Error in useMangaRelations:', err)
      } finally {
        loading.value = false
      }
    }

    // Auto-load on mount
    onMounted(load)

    return {
      relations: readonly(relations),
      loading: readonly(loading),
      error: readonly(error),
      reload: load
    }
  }

  return {
    fetchAnimeRelations,
    fetchMangaRelations,
    useAnimeRelations,
    useMangaRelations
  }
}

// Export types for use in components
export type { RelatedItem, RelationsResponse }