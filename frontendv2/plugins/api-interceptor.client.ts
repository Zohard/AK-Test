export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  // Global fetch interceptor for auto token refresh
  const originalFetch = globalThis.$fetch

  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      // Only apply baseURL and auth headers to API calls (not Nuxt assets)
      const url = typeof request === 'string' ? request : request.toString()
      
      if ((url.startsWith('/api/') && !url.startsWith('/api/proxy/')) || url.startsWith('http://localhost:3003/') || url.startsWith('/media/')) {
        // Apply baseURL only for API calls and media
        if (!url.startsWith('http')) {
          options.baseURL = config.public.apiBase
        }
        
        // Add auth headers if available
        const headers = authStore.getAuthHeaders()
        if (headers.Authorization && options.headers) {
          options.headers = {
            ...options.headers,
            ...headers
          }
        }
      }
    },
    onResponseError({ response, request }): void {
      // Handle 401 errors by attempting token refresh
      if (response.status === 401 && authStore.refreshToken) {
        authStore.refreshAccessToken().then(() => {
          // Retry original request with new token
          $fetch(request, {
            ...(response as any),
            headers: {
              ...(response as any).headers,
              ...authStore.getAuthHeaders()
            }
          })
        }).catch(() => {
          // Refresh failed, redirect to login
          if (process.client) {
            navigateTo('/login')
          }
        })
      }
    }
  })
})