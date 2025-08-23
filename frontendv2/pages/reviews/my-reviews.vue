<template>
  <div class="my-reviews-page">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <div class="container mx-auto px-6 py-12">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold mb-2">Mes critiques</h1>
            <p class="text-purple-100 text-lg">Gérez et suivez toutes vos critiques</p>
          </div>
          <NuxtLink 
            to="/reviews/create"
            class="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            <Icon name="heroicons:plus" class="w-5 h-5 inline mr-2" />
            Nouvelle critique
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-6 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600 mb-1">{{ stats.totalReviews }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total des critiques</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600 mb-1">{{ stats.publishedReviews }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Publiées</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-yellow-600 mb-1">{{ stats.averageRating }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Note moyenne</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600 mb-1">{{ stats.totalViews }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Vues totales</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-6 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Main Content -->
        <div class="flex-1">
          <!-- Filters and Search -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
              <!-- Search -->
              <div class="flex-1">
                <div class="relative">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Rechercher dans mes critiques..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                  <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <!-- Status Filter -->
              <select
                v-model="statusFilter"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Tous les statuts</option>
                <option value="published">Publiées</option>
                <option value="draft">Brouillons</option>
                <option value="private">Privées</option>
              </select>

              <!-- Media Type Filter -->
              <select
                v-model="mediaTypeFilter"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Tous les types</option>
                <option value="anime">Anime</option>
                <option value="manga">Manga</option>
              </select>

              <!-- Sort -->
              <select
                v-model="sortBy"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Plus récentes</option>
                <option value="oldest">Plus anciennes</option>
                <option value="rating_high">Note élevée</option>
                <option value="rating_low">Note faible</option>
                <option value="most_viewed">Plus vues</option>
                <option value="title">Titre A-Z</option>
              </select>
            </div>
          </div>

          <!-- Reviews List -->
          <div v-if="loading" class="space-y-6">
            <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div class="flex space-x-4">
                <div class="w-20 h-28 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div class="flex-1 space-y-3">
                  <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="filteredReviews.length === 0" class="text-center py-12">
            <Icon name="heroicons:document-text" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucune critique trouvée</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {{ searchQuery || statusFilter || mediaTypeFilter 
                ? 'Aucune critique ne correspond à vos critères de recherche.' 
                : 'Vous n\'avez pas encore écrit de critique.' 
              }}
            </p>
            <NuxtLink 
              to="/reviews/create"
              class="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Icon name="heroicons:plus" class="w-5 h-5 mr-2" />
              Écrire ma première critique
            </NuxtLink>
          </div>

          <div v-else class="space-y-6">
            <div 
              v-for="review in filteredReviews" 
              :key="review.id"
              class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div class="p-6">
                <div class="flex space-x-4">
                  <!-- Media Cover -->
                  <div class="flex-shrink-0">
                    <img
                      v-if="getMediaImage(review)"
                      :src="getMediaImage(review)"
                      :alt="getMediaTitle(review)"
                      class="w-20 h-28 object-cover rounded-lg shadow-sm"
                      @error="onImageError"
                    />
                    <div v-else class="w-20 h-28 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center">
                      <Icon :name="getMediaType(review) === 'manga' ? 'heroicons:book-open' : 'heroicons:film'" class="w-8 h-8 text-gray-400" />
                    </div>
                  </div>

                  <!-- Review Content -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {{ review.titre }}
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {{ getMediaTitle(review) }}
                        </p>
                      </div>
                      <!-- Status Badge -->
                      <span 
                        :class="[
                          'px-2 py-1 text-xs font-semibold rounded-full',
                          getStatusBadgeClass(review)
                        ]"
                      >
                        {{ getStatusText(review) }}
                      </span>
                    </div>

                    <!-- Rating -->
                    <div class="flex items-center space-x-2 mb-3">
                      <ReviewRating :rating="review.note" :max-rating="10" mode="display" size="sm" />
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ review.note }}/10</span>
                    </div>

                    <!-- Excerpt -->
                    <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {{ getExcerpt(review.contenu) }}
                    </p>

                    <!-- Meta Info -->
                    <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div class="flex items-center space-x-4">
                        <span class="flex items-center space-x-1">
                          <Icon name="heroicons:calendar" class="w-4 h-4" />
                          <span>{{ formatDate(review.dateCreation) }}</span>
                        </span>
                        <span class="flex items-center space-x-1">
                          <Icon name="heroicons:eye" class="w-4 h-4" />
                          <span>{{ review.nbVues || 0 }} vues</span>
                        </span>
                        <span class="flex items-center space-x-1">
                          <Icon name="heroicons:chat-bubble-left" class="w-4 h-4" />
                          <span>{{ review.nbCommentaires || 0 }} commentaires</span>
                        </span>
                      </div>
                      <div class="flex items-center space-x-1">
                        <Icon :name="getMediaType(review) === 'manga' ? 'heroicons:book-open' : 'heroicons:film'" class="w-4 h-4" />
                        <span class="capitalize">{{ getMediaType(review) }}</span>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center space-x-3">
                      <NuxtLink
                        :to="`/review/${review.id || review.idCritique}`"
                        class="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <Icon name="heroicons:eye" class="w-4 h-4 mr-1" />
                        Voir
                      </NuxtLink>
                      <NuxtLink
                        :to="`/reviews/${review.slug || review.id}/edit`"
                        class="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Icon name="heroicons:pencil" class="w-4 h-4 mr-1" />
                        Modifier
                      </NuxtLink>
                      <button
                        @click="toggleStatus(review)"
                        class="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      >
                        <Icon :name="review.estPublique ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-4 h-4 mr-1" />
                        {{ review.estPublique ? 'Masquer' : 'Publier' }}
                      </button>
                      <button
                        @click="deleteReview(review)"
                        class="inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <Icon name="heroicons:trash" class="w-4 h-4 mr-1" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More -->
          <div v-if="hasMore && !loading" class="text-center mt-8">
            <button
              @click="loadMore"
              class="px-6 py-3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Charger plus de critiques
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="w-full lg:w-80 space-y-6">
          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
            <div class="space-y-3">
              <NuxtLink
                to="/reviews/create"
                class="flex items-center w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
                Nouvelle critique
              </NuxtLink>
              <button
                @click="exportReviews"
                class="flex items-center w-full px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 mr-2" />
                Exporter mes critiques
              </button>
              <NuxtLink
                to="/reviews"
                class="flex items-center w-full px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Icon name="heroicons:document-text" class="w-4 h-4 mr-2" />
                Toutes les critiques
              </NuxtLink>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité récente</h3>
            <div class="space-y-3 text-sm">
              <div v-for="activity in recentActivity" :key="activity.id" class="flex items-start space-x-3">
                <Icon :name="activity.icon" class="w-4 h-4 mt-0.5 text-gray-400" />
                <div>
                  <p class="text-gray-700 dark:text-gray-300">{{ activity.text }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ activity.date }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Writing Tips -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conseils d'écriture</h3>
            <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-start space-x-2">
                <Icon name="heroicons:light-bulb" class="w-4 h-4 mt-0.5 text-yellow-500" />
                <p>Structurez votre critique avec une intro, développement et conclusion</p>
              </div>
              <div class="flex items-start space-x-2">
                <Icon name="heroicons:light-bulb" class="w-4 h-4 mt-0.5 text-yellow-500" />
                <p>Justifiez votre note avec des arguments concrets</p>
              </div>
              <div class="flex items-start space-x-2">
                <Icon name="heroicons:light-bulb" class="w-4 h-4 mt-0.5 text-yellow-500" />
                <p>Évitez les spoilers ou utilisez les balises [spoiler]</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewData } from '~/composables/useReviewsAPI'

// Auth check
const authStore = useAuthStore()
if (!authStore.isAuthenticated) {
  await navigateTo('/login?redirect=' + encodeURIComponent('/reviews/my-reviews'))
}

// Composables
const reviewsAPI = useReviewsAPI()
const { getImageUrl } = useImageUrl()

// State
const loading = ref(true)
const reviews = ref<ReviewData[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const mediaTypeFilter = ref('')
const sortBy = ref('newest')
const hasMore = ref(false)
const page = ref(1)

const stats = reactive({
  totalReviews: 0,
  publishedReviews: 0,
  averageRating: '0.0',
  totalViews: 0
})

const recentActivity = ref([
  {
    id: 1,
    icon: 'heroicons:document-plus',
    text: 'Nouvelle critique publiée sur "One Piece"',
    date: 'Il y a 2 jours'
  },
  {
    id: 2,
    icon: 'heroicons:chat-bubble-left',
    text: '3 nouveaux commentaires sur votre critique',
    date: 'Il y a 3 jours'
  },
  {
    id: 3,
    icon: 'heroicons:heart',
    text: '5 utilisateurs ont aimé votre critique',
    date: 'Il y a 1 semaine'
  }
])

// Computed
const filteredReviews = computed(() => {
  let filtered = [...reviews.value]

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(review => 
      review.titre.toLowerCase().includes(query) ||
      review.contenu.toLowerCase().includes(query) ||
      getMediaTitle(review).toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(review => {
      switch (statusFilter.value) {
        case 'published':
          return review.estPublique
        case 'private':
          return !review.estPublique
        case 'draft':
          return !review.estPublique // Assuming non-public are drafts
        default:
          return true
      }
    })
  }

  // Media type filter
  if (mediaTypeFilter.value) {
    filtered = filtered.filter(review => {
      const mediaType = getMediaType(review)
      return mediaType === mediaTypeFilter.value
    })
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest':
        return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
      case 'oldest':
        return new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
      case 'rating_high':
        return b.note - a.note
      case 'rating_low':
        return a.note - b.note
      case 'most_viewed':
        return (b.nbVues || 0) - (a.nbVues || 0)
      case 'title':
        return a.titre.localeCompare(b.titre)
      default:
        return 0
    }
  })

  return filtered
})

// Methods
const loadReviews = async (append = false) => {
  try {
    loading.value = !append
    
    const response = await reviewsAPI.getMyReviews({
      page: page.value,
      limit: 10
    })
    
    if (append) {
      reviews.value.push(...response.data)
    } else {
      reviews.value = response.data
      // Calculate stats
      stats.totalReviews = response.total || response.data.length
      stats.publishedReviews = response.data.filter(r => r.estPublique).length
      stats.averageRating = response.data.length > 0 
        ? (response.data.reduce((sum, r) => sum + r.note, 0) / response.data.length).toFixed(1)
        : '0.0'
      stats.totalViews = response.data.reduce((sum, r) => sum + (r.nbVues || 0), 0)
    }
    
    hasMore.value = response.hasMore || false
  } catch (error) {
    console.error('Error loading reviews:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  page.value++
  loadReviews(true)
}

const getMediaType = (review: ReviewData): 'anime' | 'manga' => {
  return review.idManga && review.idManga > 0 ? 'manga' : 'anime'
}

const getMediaTitle = (review: ReviewData): string => {
  return review.manga?.titre || review.anime?.titre || 'Titre inconnu'
}

const getMediaImage = (review: ReviewData): string | null => {
  const image = review.manga?.image || review.anime?.image
  return image ? getImageUrl(image, getMediaType(review)) : null
}

const getStatusText = (review: ReviewData): string => {
  return review.estPublique ? 'Publié' : 'Privé'
}

const getStatusBadgeClass = (review: ReviewData): string => {
  return review.estPublique 
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

const getExcerpt = (content: string): string => {
  // Remove HTML tags and limit length
  const text = content.replace(/<[^>]*>/g, '').replace(/\[.*?\]/g, '')
  return text.length > 150 ? text.substring(0, 150) + '...' : text
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const toggleStatus = async (review: ReviewData) => {
  try {
    await reviewsAPI.updateReview(review.id, {
      estPublique: !review.estPublique
    })
    review.estPublique = !review.estPublique
    
    // Update stats
    if (review.estPublique) {
      stats.publishedReviews++
    } else {
      stats.publishedReviews--
    }
  } catch (error) {
    console.error('Error updating review:', error)
    alert('Erreur lors de la mise à jour')
  }
}

const deleteReview = async (review: ReviewData) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette critique ? Cette action est irréversible.')) {
    return
  }

  try {
    await reviewsAPI.deleteReview(review.id)
    
    // Remove from local list
    const index = reviews.value.findIndex(r => r.id === review.id)
    if (index > -1) {
      reviews.value.splice(index, 1)
      stats.totalReviews--
      if (review.estPublique) {
        stats.publishedReviews--
      }
    }
  } catch (error) {
    console.error('Error deleting review:', error)
    alert('Erreur lors de la suppression')
  }
}

const exportReviews = () => {
  // TODO: Implement export functionality
  alert('Fonctionnalité d\'export à venir')
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// Load data
onMounted(() => {
  loadReviews()
})

// Meta
useSeoMeta({
  title: 'Mes critiques - AK9',
  description: 'Gérez et suivez toutes vos critiques d\'animes et mangas',
  ogTitle: 'Mes critiques - AK9',
  ogDescription: 'Gérez et suivez toutes vos critiques d\'animes et mangas',
  robots: 'noindex, nofollow'
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
