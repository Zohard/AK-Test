<template>
  <div class="reviews-page">
    <!-- Hero Section -->
    <div class="hero-section bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-4">
            <Icon name="heroicons:star" class="w-12 h-12 text-yellow-300" />
            Critiques d'Animes et Mangas
          </h1>
          <p class="text-xl md:text-2xl mb-6 opacity-90">
            Découvrez les avis de la communauté sur vos œuvres préférées
          </p>
          <div class="flex flex-wrap justify-center gap-4 text-sm md:text-base">
            <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span class="font-semibold">{{ totalReviews }}</span> critiques
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Top Reviews with Toggle -->
      <div class="mb-8">
        <TopReviews :limit="6" default-type="both" />
      </div>

      <!-- Filters Section -->
      <div class="mb-8">
        <ReviewFilters
          :filters="filters"
          :results-count="filteredReviewsCount"
          search-placeholder="Titre, contenu, anime, manga..."
          @update:filters="updateFilters"
          @clear="clearFilters"
        />
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement des critiques...</span>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-8">
        <div class="flex">
          <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Erreur de chargement
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </div>
            <div class="mt-4">
              <button
                @click="loadReviews"
                class="btn-primary"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Grid -->
      <div v-else-if="reviews.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReviewCard
          v-for="review in reviews"
          :key="review.idCritique"
          :review="review"
          @favorite="handleFavorite"
          @view="handleReviewView"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <Icon name="heroicons:document-text" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Aucune critique trouvée
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ hasActiveFilters ? 'Essayez de modifier vos filtres.' : 'Aucune critique disponible pour le moment.' }}
        </p>
        <div v-if="hasActiveFilters" class="mt-6">
          <button
            @click="clearFilters"
            class="btn-primary"
          >
            Effacer les filtres
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-8 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Page {{ currentPage }} sur {{ totalPages }}
          </span>
          <select
            v-model="itemsPerPage"
            class="form-input w-auto"
            @change="changeItemsPerPage"
          >
            <option value="12">12 par page</option>
            <option value="24">24 par page</option>
            <option value="48">48 par page</option>
          </select>
        </div>

        <div class="flex items-center space-x-2">
          <button
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
            class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="heroicons:chevron-left" class="w-4 h-4" />
            Précédent
          </button>
          
          <!-- Page numbers -->
          <div class="flex items-center space-x-1">
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="[
                'px-3 py-2 text-sm rounded-md transition-colors',
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>

          <button
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
            class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
            <Icon name="heroicons:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewData } from '~/composables/useReviewsAPI'
import type { ReviewFiltersData } from '~/components/reviews/ReviewFilters.vue'
import ReviewFilters from '~/components/reviews/ReviewFilters.vue'
import ReviewCard from '~/components/reviews/ReviewCard.vue'
import TopReviews from '~/components/reviews/TopReviews.vue'

// Page metadata
useHead({
  title: 'Critiques - Anime-Kun',
  meta: [
    { name: 'description', content: 'Découvrez les critiques d\'animes et mangas de la communauté Anime-Kun' }
  ]
})

// State
const reviews = ref<ReviewData[]>([])
const loading = ref(true)
const error = ref('')

const totalReviews = ref(0)
const filteredReviewsCount = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(12)

// Filters
const filters = reactive<ReviewFiltersData>({
  search: '',
  type: '', // 'anime' or 'manga'
  minNotation: '',
  sortBy: 'dateCritique',
  sortOrder: false, // false = ASC, true = DESC
  author: '',
  dateRange: '',
  minViews: ''
})

// Computed
const hasActiveFilters = computed(() => {
  return filters.search || 
         filters.type || 
         filters.minNotation || 
         filters.sortBy !== 'dateCritique' ||
         filters.author ||
         filters.dateRange ||
         filters.minViews
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// API composable
const reviewsAPI = useReviewsAPI()

// Methods
const loadReviews = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const queryParams: any = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: filters.search || undefined,
      minNotation: filters.minNotation ? parseInt(filters.minNotation) : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder ? 'desc' : 'asc'
    }

    // Server-side type filter
    if (filters.type === 'anime' || filters.type === 'manga') {
      queryParams.type = filters.type
    }
    
    const response = await reviewsAPI.fetchReviews(queryParams)
    
    // Handle response format and map API fields to component expectations
    const rawReviews = (response as any).reviews || (response as any).data || []
    
    // Map API response fields to component expected fields
    let mapped = rawReviews.map((review: any) => ({
      idCritique: review.id,
      niceUrl: review.niceUrl,
      titre: review.titre,
      critique: review.critique,
      notation: review.notation,
      dateCritique: review.reviewDate,
      statut: review.statut || 1,
      idMembre: review.userId,
      idAnime: review.animeId,
      idManga: review.mangaId,
      nbClics: review.nbClics || 0,
      // Relations - these might not be included in the current API response
      anime: review.anime ? {
        id: review.anime.id,
        titre: review.anime.titre,
        image: review.anime.image
      } : undefined,
      manga: review.manga ? {
        id: review.manga.id,
        titre: review.manga.titre,
        image: review.manga.image
      } : undefined,
      membre: review.membre ? {
        id: review.membre.id || review.membre.idMember,
        pseudo: review.membre.pseudo || review.membre.memberName,
        avatar: review.membre.avatar
      } : undefined
    }))

    // Apply client-side type filter when requested (backend lacks a generic type filter)
    if (filters.type === 'anime') {
      mapped = mapped.filter((r: any) => !r.idManga || r.idManga === 0)
    } else if (filters.type === 'manga') {
      mapped = mapped.filter((r: any) => r.idManga && r.idManga > 0)
    }

    reviews.value = mapped
    
    filteredReviewsCount.value = (response as any).pagination?.total || (response as any).meta?.total || rawReviews.length
    totalPages.value = (response as any).pagination?.totalPages || (response as any).meta?.totalPages || Math.ceil(filteredReviewsCount.value / itemsPerPage.value)
    
  } catch (err: any) {
    error.value = reviewsAPI.error.value || 'Erreur lors du chargement des critiques'
  } finally {
    loading.value = false
  }
}

const config = useRuntimeConfig()
const loadStats = async () => {
  try {
    const res = await $fetch(`${config.public.apiBase}/api/reviews/count`)
    totalReviews.value = (res as any)?.count || 0
  } catch (err) {
    console.error('Error loading stats:', err)
    totalReviews.value = 0
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadReviews()
}

const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

const updateFilters = (newFilters: ReviewFiltersData) => {
  Object.assign(filters, newFilters)
  applyFilters()
}

const clearFilters = () => {
  Object.assign(filters, {
    search: '',
    type: '',
    minNotation: '',
    sortBy: 'dateCritique',
    sortOrder: false,
    author: '',
    dateRange: '',
    minViews: ''
  })
  applyFilters()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadReviews()
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const changeItemsPerPage = () => {
  currentPage.value = 1
  loadReviews()
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const handleFavorite = (reviewId: number, isFavorite: boolean) => {
  console.log(`Review ${reviewId} ${isFavorite ? 'added to' : 'removed from'} favorites`)
  // TODO: Update local state or refetch data if needed
}

const handleReviewView = (review: ReviewData) => {
  console.log('Viewing review:', review.titre)
  // Navigation is handled by the component, this is for analytics/tracking
}

// SEO optimization
const { setPageSEO, addBreadcrumbStructuredData } = useSEO()

const setSEO = () => {
  const totalReviewsText = totalReviews.value > 0 ? ` - ${totalReviews.value} critiques` : ''
  
  setPageSEO({
    title: `Critiques d'animes et mangas${totalReviewsText}`,
    description: 'Découvrez les dernières critiques d\'animes et mangas de la communauté AK9. Partagez votre avis, trouvez votre prochain anime à regarder et rejoignez notre communauté passionnée.',
    keywords: [
      'critiques anime',
      'critiques manga',
      'reviews anime',
      'reviews manga',
      'communauté anime',
      'recommandations anime',
      'recommandations manga',
      'otaku',
      'anime français'
    ],
    type: 'website'
  })

  // Breadcrumb structured data
  addBreadcrumbStructuredData([
    { name: 'Accueil', url: '/' },
    { name: 'Critiques', url: '/reviews' }
  ])
}

// Performance monitoring
const { monitorPerformance, optimizeForConnection } = usePerformance()
const performanceConfig = optimizeForConnection()

// Load data on mount
onMounted(() => {
  loadStats()
  loadReviews()
  setSEO()
  monitorPerformance()
})

// Watch for route query changes
watch(() => useRoute().query, (newQuery) => {
  if (newQuery.page) {
    currentPage.value = parseInt(newQuery.page as string) || 1
  }
  if (newQuery.search) {
    filters.search = newQuery.search as string
  }
  loadReviews()
}, { immediate: false })

// Update SEO when stats change
watch([totalReviews], () => {
  setSEO()
})
</script>

<style scoped>
.reviews-page {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
