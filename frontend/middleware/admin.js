import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (process.server) return

  const authStore = useAuthStore()

  // Wait for auth to load if it's still loading
  if (authStore.loading) {
    // Let the page load and handle auth checks in the layout/component
    return
  }

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // Check if user has admin privileges
  if (!authStore.isAdmin) {
    return navigateTo('/admin/unauthorized')
  }
})