import type { ArticleCategory } from '~/types'

export function useCategoriesAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const config = useRuntimeConfig()

  const fetchCategories = async (): Promise<ArticleCategory[]> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticleCategory[]>('/api/proxy/categories')
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des catégories'
      console.error('Categories API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCategoryById = async (id: number): Promise<ArticleCategory> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticleCategory>(`${config.public.apiBase}/api/categories/${id}`)
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement de la catégorie'
      console.error('Category detail API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCategoryBySlug = async (slug: string): Promise<ArticleCategory> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticleCategory>(`${config.public.apiBase}/api/categories/slug/${slug}`)
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement de la catégorie'
      console.error('Category by slug API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchCategories,
    fetchCategoryById,
    fetchCategoryBySlug
  }
}