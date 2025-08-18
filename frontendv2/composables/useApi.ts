// Generic API helper composable
export function useApi() {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  const apiCall = async <T>(
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: any
      params?: Record<string, any>
      authenticated?: boolean
    } = {}
  ): Promise<T> => {
    const { method = 'GET', body, params, authenticated = false } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authenticated) {
      Object.assign(headers, authStore.getAuthHeaders())
    }

    try {
      const response = await $fetch<T>(endpoint, {
        method,
        headers,
        body,
        params
      })

      return response
    } catch (error: any) {
      // Enhanced error handling
      const apiError = {
        message: error.data?.message || error.message || 'Une erreur est survenue',
        status: error.status || 500,
        data: error.data
      }

      console.error('API Error:', {
        endpoint,
        method,
        error: apiError
      })

      throw apiError
    }
  }

  // Helper methods for common operations
  const get = <T>(endpoint: string, params?: Record<string, any>, authenticated = false) =>
    apiCall<T>(endpoint, { method: 'GET', params, authenticated })

  const post = <T>(endpoint: string, body?: any, authenticated = true) =>
    apiCall<T>(endpoint, { method: 'POST', body, authenticated })

  const put = <T>(endpoint: string, body?: any, authenticated = true) =>
    apiCall<T>(endpoint, { method: 'PUT', body, authenticated })

  const patch = <T>(endpoint: string, body?: any, authenticated = true) =>
    apiCall<T>(endpoint, { method: 'PATCH', body, authenticated })

  const del = <T>(endpoint: string, authenticated = true) =>
    apiCall<T>(endpoint, { method: 'DELETE', authenticated })

  return {
    apiCall,
    get,
    post,
    put,
    patch,
    del
  }
}