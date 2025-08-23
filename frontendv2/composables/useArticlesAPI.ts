import type { 
  Article, 
  ArticleQueryParams, 
  ArticlesResponse, 
  CreateArticleDto, 
  UpdateArticleDto 
} from '~/types'

export function useArticlesAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const fetchArticles = async (params?: ArticleQueryParams): Promise<ArticlesResponse> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticlesResponse>('/api/proxy/articles', {
        params
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des articles'
      console.error('Articles API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchArticleById = async (id: number): Promise<Article> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Article>(`${config.public.apiBase}/api/articles/${id}`)
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement de l\'article'
      console.error('Article detail API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchArticleBySlug = async (niceUrl: string): Promise<Article> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Article>(`/api/proxy/articles/slug/${niceUrl}`)
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement de l\'article'
      console.error('Article by slug API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchFeaturedArticles = async (limit = 5): Promise<Article[]> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Article[]>('/api/proxy/articles/featured', {
        params: { limit }
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des articles à la une'
      console.error('Featured articles API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchArticlesByCategory = async (categoryId: number, params?: Omit<ArticleQueryParams, 'categoryId'>): Promise<ArticlesResponse> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticlesResponse>(`${config.public.apiBase}/api/articles/category/${categoryId}`, {
        params
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des articles par catégorie'
      console.error('Articles by category API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchArticlesByAuthor = async (authorId: number, params?: Omit<ArticleQueryParams, 'authorId'>): Promise<ArticlesResponse> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticlesResponse>(`${config.public.apiBase}/api/articles/author/${authorId}`, {
        params
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des articles par auteur'
      console.error('Articles by author API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchArticles = async (query: string, params?: Omit<ArticleQueryParams, 'search'>): Promise<ArticlesResponse> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticlesResponse>(`${config.public.apiBase}/api/articles/search`, {
        params: {
          q: query,
          ...params
        }
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la recherche d\'articles'
      console.error('Article search API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const trackArticleView = async (id: number): Promise<void> => {
    try {
      await $fetch(`${config.public.apiBase}/api/articles/${id}/view`, {
        method: 'POST'
      })
    } catch (err: any) {
      console.error('Track article view API Error:', err)
    }
  }

  const createArticle = async (data: CreateArticleDto): Promise<Article> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Article>(`${config.public.apiBase}/api/articles`, {
        method: 'POST',
        body: data,
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la création de l\'article'
      console.error('Create article API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateArticle = async (id: number, data: UpdateArticleDto): Promise<Article> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Article>(`${config.public.apiBase}/api/articles/${id}`, {
        method: 'PUT',
        body: data,
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la mise à jour de l\'article'
      console.error('Update article API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteArticle = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`${config.public.apiBase}/api/articles/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
    } catch (err: any) {
      error.value = 'Erreur lors de la suppression de l\'article'
      console.error('Delete article API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchArticles,
    fetchArticleById,
    fetchArticleBySlug,
    fetchFeaturedArticles,
    fetchArticlesByCategory,
    fetchArticlesByAuthor,
    searchArticles,
    trackArticleView,
    createArticle,
    updateArticle,
    deleteArticle
  }
}