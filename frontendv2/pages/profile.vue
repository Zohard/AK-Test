<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement du profil...</span>
    </div>

    <!-- Profile Content -->
    <div v-else class="container mx-auto px-4 py-8">
      <!-- Profile Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <!-- Cover Image -->
        <div class="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        <!-- Profile Info -->
        <div class="px-6 py-6 relative">
          <!-- Avatar -->
          <div class="absolute -top-16 left-6">
            <div class="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-blue-500 flex items-center justify-center">
              <img 
                v-if="userProfile?.avatar" 
                :src="userProfile.avatar" 
                :alt="userProfile?.realName || userProfile?.username"
                class="w-full h-full object-cover"
                @error="showFallbackAvatar = true"
                v-show="!showFallbackAvatar"
              />
              <span 
                v-if="!userProfile?.avatar || showFallbackAvatar"
                class="text-white text-2xl font-bold"
              >
                {{ userProfile?.realName?.charAt(0)?.toUpperCase() || userProfile?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </span>
            </div>
          </div>
          
          <!-- Basic Info -->
          <div class="ml-32">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {{ userProfile?.realName || userProfile?.username }}
            </h1>
            <p v-if="userProfile?.username && userProfile?.realName" class="text-gray-600 dark:text-gray-400 mb-2">
              @{{ userProfile.username }}
            </p>
            <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div v-if="userProfile?.location" class="flex items-center">
                <Icon name="heroicons:map-pin" class="w-4 h-4 mr-1" />
                {{ userProfile.location }}
              </div>
              <div v-if="userProfile?.birthday" class="flex items-center">
                <Icon name="heroicons:cake" class="w-4 h-4 mr-1" />
                {{ formatDate(userProfile.birthday) }}
              </div>
              <div class="flex items-center">
                <Icon name="heroicons:calendar" class="w-4 h-4 mr-1" />
                Membre depuis {{ formatDate(userProfile?.registrationDate) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Reviews Stats -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Critiques</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ userStats?.totalReviews || 0 }}</p>
            </div>
            <Icon name="heroicons:star" class="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <!-- Anime Collection Stats -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Animes en collection</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ userStats?.animeCount || 0 }}</p>
            </div>
            <Icon name="heroicons:play" class="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <!-- Manga Collection Stats -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Mangas en collection</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ userStats?.mangaCount || 0 }}</p>
            </div>
            <Icon name="heroicons:book-open" class="w-8 h-8 text-green-500" />
          </div>
        </div>

        <!-- Total Posts -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Messages forum</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ userProfile?.posts || 0 }}</p>
            </div>
            <Icon name="heroicons:chat-bubble-left" class="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <!-- Content Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <!-- Tab Headers -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex space-x-8 px-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Recent Activity Tab -->
          <div v-show="activeTab === 'activity'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité récente</h3>
            <div v-if="recentActivity.length" class="space-y-4">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div class="flex-shrink-0">
                  <Icon :name="getActivityIcon(activity.type)" class="w-6 h-6 text-gray-500" />
                </div>
                <div class="flex-1">
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ formatActivity(activity) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatDate(activity.date) }}
                  </p>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucune activité récente
            </div>
          </div>

          <!-- Recommendations Tab -->
          <div v-show="activeTab === 'recommendations'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommandations pour vous</h3>
            <div v-if="recommendations.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <NuxtLink
                v-for="item in recommendations"
                :key="item.id"
                :to="buildItemUrl(item)"
                class="group"
              >
                <img 
                  :src="getImageUrl(item.image, item.type)" 
                  :alt="item.titre"
                  class="w-full aspect-[3/4] object-cover rounded-lg transition-transform group-hover:scale-105"
                />
                <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 text-center line-clamp-2">
                  {{ item.titre }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {{ item.type === 'anime' ? 'Anime' : 'Manga' }}
                </p>
              </NuxtLink>
            </div>
            <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucune recommandation disponible pour le moment
            </div>
          </div>

          <!-- Statistics Tab -->
          <div v-show="activeTab === 'stats'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques détaillées</h3>
            
            <!-- Genre Preferences -->
            <div v-if="userStats?.genreStats" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Genres préférés</h4>
              <div class="space-y-2">
                <div
                  v-for="genre in userStats.genreStats.slice(0, 5)"
                  :key="genre.name"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{ genre.name }}</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        class="bg-blue-500 h-2 rounded-full"
                        :style="{ width: `${(genre.count / userStats.genreStats[0].count) * 100}%` }"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-900 dark:text-white font-medium">{{ genre.count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rating Distribution -->
            <div v-if="userStats?.ratingStats" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Distribution des notes</h4>
              <div class="space-y-2">
                <div
                  v-for="rating in userStats.ratingStats"
                  :key="rating.rating"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{ rating.rating }} étoiles</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        class="bg-yellow-500 h-2 rounded-full"
                        :style="{ width: `${(rating.count / Math.max(...userStats.ratingStats.map(r => r.count))) * 100}%` }"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-900 dark:text-white font-medium">{{ rating.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'Mon Profil - Anime-Kun V2',
  meta: [
    { name: 'description', content: 'Votre profil utilisateur Anime-Kun' }
  ]
})

// Auth check
const authStore = useAuthStore()
const config = useRuntimeConfig()

if (!authStore.isAuthenticated) {
  await navigateTo('/login?redirect=/profile')
}

// State
const loading = ref(true)
const activeTab = ref('activity')
const userProfile = ref(null)
const userStats = ref(null)
const recentActivity = ref([])
const recommendations = ref([])
const showFallbackAvatar = ref(false)

// Tabs configuration
const tabs = [
  { id: 'activity', label: 'Activité récente' },
  { id: 'recommendations', label: 'Recommandations' },
  { id: 'stats', label: 'Statistiques' }
]

// Methods
const formatDate = (timestamp: number | string) => {
  if (!timestamp) return 'Non spécifié'
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000)
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'review': return 'heroicons:star'
    case 'anime_added': return 'heroicons:play'
    case 'manga_added': return 'heroicons:book-open'
    case 'list_created': return 'heroicons:list-bullet'
    default: return 'heroicons:clock'
  }
}

const formatActivity = (activity: any) => {
  switch (activity.type) {
    case 'review':
      return `A écrit une critique pour "${activity.title}"`
    case 'anime_added':
      return `A ajouté l'anime "${activity.title}" à sa collection`
    case 'manga_added':
      return `A ajouté le manga "${activity.title}" à sa collection`
    case 'list_created':
      return `A créé une nouvelle liste "${activity.title}"`
    default:
      return activity.description || 'Activité inconnue'
  }
}

const buildItemUrl = (item: any) => {
  if (item.type === 'anime') {
    const niceUrl = item.niceUrl || createSlug(item.titre)
    return `/anime/${niceUrl}-${item.id}`
  } else {
    const niceUrl = item.niceUrl || createSlug(item.titre)
    return `/manga/${niceUrl}-${item.id}`
  }
}

const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const getImageUrl = (imagePath: string, type: string) => {
  if (!imagePath) return '/placeholder-image.jpg'
  if (imagePath.startsWith('http')) return imagePath
  return `${config.public.apiBase}/images/${type}s/${imagePath}`
}

// Load profile data
const loadProfile = async () => {
  try {
    loading.value = true
    
    // Get user profile
    userProfile.value = authStore.user
    
    // Get user statistics
    const statsResponse = await $fetch(`${config.public.apiBase}/api/users/${authStore.user.id}/stats`, {
      headers: authStore.getAuthHeaders()
    })
    userStats.value = statsResponse
    
    // Get recent activity
    const activityResponse = await $fetch(`${config.public.apiBase}/api/users/${authStore.user.id}/activity`, {
      headers: authStore.getAuthHeaders()
    })
    recentActivity.value = activityResponse.activities || []
    
    // Get recommendations
    const recommendationsResponse = await $fetch(`${config.public.apiBase}/api/users/${authStore.user.id}/recommendations`, {
      headers: authStore.getAuthHeaders()
    })
    recommendations.value = recommendationsResponse.items || []
    
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>