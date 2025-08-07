import { ref } from 'vue'

export function useAnimeAPI() {
  const loading = ref(false)
  const error = ref(null)
  
  const API_BASE = 'http://localhost:3001'
  
  const fetchAnime = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`${API_BASE}/api/animes/${id}`)
      return response
    } catch (err) {
      error.value = 'Erreur lors du chargement de l\'anime'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const saveAnime = async (data, isCreating = false) => {
    loading.value = true
    error.value = null
    
    try {
      const url = isCreating 
        ? `${API_BASE}/api/admin/animes`
        : `${API_BASE}/api/admin/animes/${data.id_anime}`
      
      const method = isCreating ? 'POST' : 'PUT'
      
      const response = await $fetch(url, {
        method,
        body: data
      })
      
      return response
    } catch (err) {
      error.value = isCreating 
        ? 'Erreur lors de la création de l\'anime'
        : 'Erreur lors de la sauvegarde'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchAnimeTags = async (id) => {
    try {
      const response = await $fetch(`${API_BASE}/api/animes/${id}/tags`)
      return response.tags || []
    } catch (err) {
      console.error('Error fetching anime tags:', err)
      return []
    }
  }
  
  const fetchBusinessResults = async (query) => {
    try {
      const response = await $fetch(`${API_BASE}/api/business/search`, {
        params: { q: query, limit: 10 }
      })
      return response.data || []
    } catch (err) {
      console.error('Business search error:', err)
      return []
    }
  }
  
  return {
    loading,
    error,
    fetchAnime,
    saveAnime,
    fetchAnimeTags,
    fetchBusinessResults
  }
}