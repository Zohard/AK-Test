import type { ArticleComment } from '~/types'

export interface CreateCommentDto {
  commentaire: string
  id_article: number
  nom?: string // Optional if using authenticated user's name
}

export interface UpdateCommentDto {
  commentaire: string
}

export function useCommentsAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const fetchComments = async (articleId: number): Promise<ArticleComment[]> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticleComment[]>(`${config.public.apiBase}/api/articles/${articleId}/comments`)
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des commentaires'
      console.error('Comments API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createComment = async (articleId: number, content: string): Promise<ArticleComment> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticleComment>(`${config.public.apiBase}/api/articles/${articleId}/comments`, {
        method: 'POST',
        body: { 
          commentaire: content,
          id_article: articleId
        },
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la création du commentaire'
      console.error('Create comment API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateComment = async (id: number, content: string): Promise<ArticleComment> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<ArticleComment>(`${config.public.apiBase}/api/comments/${id}`, {
        method: 'PUT',
        body: { commentaire: content },
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la mise à jour du commentaire'
      console.error('Update comment API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteComment = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`${config.public.apiBase}/api/comments/${id}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeaders() as Record<string, string>
      })
    } catch (err: any) {
      error.value = 'Erreur lors de la suppression du commentaire'
      console.error('Delete comment API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchComments,
    createComment,
    updateComment,
    deleteComment
  }
}