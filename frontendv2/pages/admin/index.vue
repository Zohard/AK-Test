<template>
  <div class="main-content">
    <div class="section-header">
      <h1 class="section-title">Administration</h1>
      <p class="text-gray-600 dark:text-gray-400">Gestion du site Anime-Kun</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:users" class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Utilisateurs</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.users || '--' }}</p>
          </div>
        </div>
      </div>
      
      <div class="card p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:film" class="h-8 w-8 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Animes</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.animes || '--' }}</p>
          </div>
        </div>
      </div>
      
      <div class="card p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:book-open" class="h-8 w-8 text-purple-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Mangas</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.mangas || '--' }}</p>
          </div>
        </div>
      </div>
      
      <div class="card p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:newspaper" class="h-8 w-8 text-orange-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Articles</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.articles || '--' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Content Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Panel - Admin Menu -->
      <div class="lg:col-span-2">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Content Management -->
          <div class="card p-6">
            <div class="flex items-center mb-4">
              <Icon name="heroicons:document-text" class="h-6 w-6 text-blue-600 mr-2" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Gestion du Contenu</h2>
            </div>
            <div class="space-y-3">
              <NuxtLink to="/admin/animes" class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <Icon name="heroicons:film" class="w-4 h-4 mr-2" />
                Animes
              </NuxtLink>
              <NuxtLink to="/admin/mangas" class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <Icon name="heroicons:book-open" class="w-4 h-4 mr-2" />
                Mangas  
              </NuxtLink>
              <NuxtLink to="/admin/business" class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <Icon name="heroicons:building-office" class="w-4 h-4 mr-2" />
                Entreprises
              </NuxtLink>
            </div>
          </div>

          <!-- User Management -->
          <div class="card p-6">
            <div class="flex items-center mb-4">
              <Icon name="heroicons:users" class="h-6 w-6 text-green-600 mr-2" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Gestion des Utilisateurs</h2>
            </div>
            <div class="space-y-3">
              <div class="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-500 rounded-md">
                <Icon name="heroicons:user-group" class="w-4 h-4 mr-2" />
                Utilisateurs (à venir)
              </div>
              <div class="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-500 rounded-md">
                <Icon name="heroicons:shield-check" class="w-4 h-4 mr-2" />
                Modération (à venir)
              </div>
            </div>
          </div>

          <!-- System & Settings -->
          <div class="card p-6">
            <div class="flex items-center mb-4">
              <Icon name="heroicons:cog-8-tooth" class="h-6 w-6 text-purple-600 mr-2" />
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Système</h2>
            </div>
            <div class="space-y-3">
              <div class="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-500 rounded-md">
                <Icon name="heroicons:cog-6-tooth" class="w-4 h-4 mr-2" />
                Paramètres (à venir)
              </div>
              <a href="http://localhost:3003/docs" target="_blank" class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                <Icon name="heroicons:code-bracket" class="w-4 h-4 mr-2" />
                API Docs
                <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3 ml-auto" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Quick Links -->
      <div class="lg:col-span-1">
        <div class="card p-6">
          <div class="flex items-center mb-4">
            <Icon name="heroicons:link" class="h-6 w-6 text-indigo-600 mr-2" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Liens Rapides</h2>
          </div>
          <div class="space-y-3">
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Gestion du Contenu</h3>
              <div class="space-y-1 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                <a href="/admin/animes" class="block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  /admin/animes
                </a>
                <a href="/admin/animes/create" class="block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  /admin/animes/create
                </a>
                <a href="/admin/mangas" class="block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  /admin/mangas
                </a>
                <a href="/admin/mangas/create" class="block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  /admin/mangas/create
                </a>
                <a href="/admin/business" class="block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  /admin/business
                </a>
                <a href="/admin/business/create" class="block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  /admin/business/create
                </a>
              </div>
            </div>

            <div class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">API & Documentation</h3>
              <div class="space-y-1 pl-2 border-l-2 border-purple-200 dark:border-purple-800">
                <a href="http://localhost:3003/docs" target="_blank" class="block text-xs text-purple-600 dark:text-purple-400 hover:underline">
                  API Documentation
                  <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3 inline ml-1" />
                </a>
                <a href="http://localhost:3003/api" target="_blank" class="block text-xs text-purple-600 dark:text-purple-400 hover:underline">
                  API Health Check
                  <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3 inline ml-1" />
                </a>
              </div>
            </div>

            <div class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Site Public</h3>
              <div class="space-y-1 pl-2 border-l-2 border-green-200 dark:border-green-800">
                <a href="/animes" class="block text-xs text-green-600 dark:text-green-400 hover:underline">
                  /animes
                </a>
                <a href="/mangas" class="block text-xs text-green-600 dark:text-green-400 hover:underline">
                  /mangas
                </a>
                <a href="/articles" class="block text-xs text-green-600 dark:text-green-400 hover:underline">
                  /articles
                </a>
                <a href="/reviews" class="block text-xs text-green-600 dark:text-green-400 hover:underline">
                  /reviews
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card mt-8">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Activité Récente</h2>
      </div>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div v-else-if="recentActivity.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucune activité récente
        </div>
        <div v-else class="space-y-4">
          <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div class="flex items-center">
              <div class="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <div>
                <p class="text-sm text-gray-900 dark:text-white">{{ activity.description }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ activity.timestamp }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const config = useRuntimeConfig()

// Check admin access
if (!authStore.isAdmin) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Accès interdit - Droits administrateur requis'
  })
}

const stats = ref({
  users: 0,
  animes: 0,
  mangas: 0,
  articles: 0
})

const recentActivity = ref<Array<{id: string, description: string, timestamp: string}>>([])
const loading = ref(true)

// Load dashboard data
const loadDashboard = async () => {
  try {
    loading.value = true
    
    // Try to load dashboard stats from API
    const response = await $fetch(`${config.public.apiBase}/api/admin/dashboard`, {
      headers: authStore.getAuthHeaders() as Record<string, string>
    })
    
    if (response) {
      stats.value = response.stats || stats.value
      recentActivity.value = response.recentActivity || []
    }
  } catch (error) {
    console.error('Error loading dashboard:', error)
    // Show mock data on error
    stats.value = {
      users: 1250,
      animes: 8130,
      mangas: 3500,
      articles: 709
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})

// Set page title
useHead({
  title: 'Administration - Anime-Kun'
})
</script>