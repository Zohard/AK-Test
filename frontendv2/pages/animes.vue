<template>
  <div>
    <div class="page-header">
      <h1 class="section-title">Animes</h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Découvrez notre collection d'animes avec critiques et notes de la communauté
      </p>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recherche
          </label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Nom de l'anime..."
            class="form-input"
            @input="debouncedSearch"
          />
        </div>

        <!-- Genre filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Genre
          </label>
          <select v-model="filters.genre" class="form-input" @change="applyFilters">
            <option value="">Tous les genres</option>
            <option v-for="genre in genres" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>
        </div>

        <!-- Year filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Année
          </label>
          <select v-model="filters.year" class="form-input" @change="applyFilters">
            <option value="">Toutes les années</option>
            <option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <!-- Sort -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trier par
          </label>
          <select v-model="filters.sortBy" class="form-input" @change="applyFilters">
            <option value="titre">Titre</option>
            <option value="annee">Année</option>
            <option value="moyenne_notes">Note moyenne</option>
            <option value="created_at">Récemment ajouté</option>
          </select>
        </div>
      </div>

      <!-- Additional filters -->
      <div class="mt-4 flex flex-wrap items-center gap-4">
        <div class="flex items-center space-x-2">
          <input
            id="sortOrder"
            v-model="filters.sortOrder"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            @change="applyFilters"
          />
          <label for="sortOrder" class="text-sm text-gray-700 dark:text-gray-300">
            Ordre décroissant
          </label>
        </div>

        <!-- Results count -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ totalAnimes }} animes trouvés
        </div>

        <!-- Clear filters -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          Effacer les filtres
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement des animes...</span>
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
              @click="loadAnimes"
              class="btn-primary"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Animes grid -->
    <div v-else-if="animes.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimeCard
        v-for="anime in animes"
        :key="anime.id"
        :anime="anime"
        @view="viewAnime"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <Icon name="heroicons:film" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        Aucun anime trouvé
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ hasActiveFilters ? 'Essayez de modifier vos filtres.' : 'Aucun anime disponible pour le moment.' }}
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
</template>

<script setup lang="ts">
import type { Anime } from '~/types'

// Page metadata
useHead({
  title: 'Animes - Anime-Kun V2',
  meta: [
    { name: 'description', content: 'Découvrez notre collection d\'animes avec critiques et notes de la communauté' }
  ]
})

// State
const animes = ref<Anime[]>([])
const loading = ref(true)
const error = ref('')

const totalAnimes = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(12)

const genres = ref([
  'Action', 'Aventure', 'Comédie', 'Drame', 'Fantastique', 
  'Horreur', 'Romance', 'Science-fiction', 'Slice of Life', 'Thriller'
])

const years = ref<number[]>([])

// Filters
const filters = reactive({
  search: '',
  genre: '',
  year: '',
  sortBy: 'titre',
  sortOrder: false // false = ASC, true = DESC
})

// Generate years array
const currentYear = new Date().getFullYear()
for (let year = currentYear; year >= 1960; year--) {
  years.value.push(year)
}

// Computed
const hasActiveFilters = computed(() => {
  return filters.search || filters.genre || filters.year || filters.sortBy !== 'titre'
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
const animeAPI = useAnimeAPI()

// Methods
const loadAnimes = async () => {
  try {
    const response = await animeAPI.fetchAnimes({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: filters.search || undefined,
      genre: filters.genre || undefined,
      annee: filters.year ? parseInt(filters.year) : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder ? 'desc' : 'asc'
    })
    
    // Handle NestJS response format
    animes.value = (response as any).animes || (response as any).data || []
    totalAnimes.value = (response as any).pagination?.total || (response as any).meta?.total || 0
    totalPages.value = (response as any).pagination?.totalPages || (response as any).meta?.totalPages || Math.ceil(totalAnimes.value / itemsPerPage.value)
    
  } catch (err: any) {
    error.value = animeAPI.error.value || 'Erreur lors du chargement des animes'
  }
  
  loading.value = animeAPI.loading.value
}

const applyFilters = () => {
  currentPage.value = 1
  loadAnimes()
}

const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

const clearFilters = () => {
  filters.search = ''
  filters.genre = ''
  filters.year = ''
  filters.sortBy = 'titre'
  filters.sortOrder = false
  applyFilters()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadAnimes()
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const changeItemsPerPage = () => {
  currentPage.value = 1
  loadAnimes()
}

const buildAnimeUrl = (anime: any) => {
  // Create SEO-friendly URL: /anime/nice-url-id
  const niceUrl = anime.niceUrl || createSlug(anime.titre)
  return `/anime/${niceUrl}-${anime.id}`
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

const viewAnime = (anime: any) => {
  console.log('viewAnime called in animes page with:', anime)
  const targetUrl = buildAnimeUrl(anime)
  console.log('Animes page navigating to:', targetUrl)
  navigateTo(targetUrl)
}

// Load data on mount
onMounted(() => {
  loadAnimes()
})

// Watch for route query changes
watch(() => useRoute().query, (newQuery) => {
  if (newQuery.page) {
    currentPage.value = parseInt(newQuery.page as string) || 1
  }
  if (newQuery.search) {
    filters.search = newQuery.search as string
  }
  if (newQuery.genre) {
    filters.genre = newQuery.genre as string
  }
  loadAnimes()
}, { immediate: false })
</script>

<style scoped>
.page-header {
  @apply text-center mb-8;
}
</style>