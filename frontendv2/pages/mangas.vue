<template>
  <div class="main-content">
    <div class="page-header">
      <h1 class="section-title flex items-center gap-3">
        <Icon name="heroicons:book-open" class="w-8 h-8 text-blue-600 dark:text-blue-400" />
        Mangas
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        Découvrez notre collection de mangas avec critiques et notes de la communauté
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
            placeholder="Nom du manga..."
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
            <option value="moyenneNotes">Note moyenne</option>
            <option value="dateAjout">Récemment ajouté</option>
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
          {{ totalMangas }} mangas trouvés
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
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement des mangas...</span>
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
              @click="loadMangas"
              class="btn-primary"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mangas grid -->
    <div v-else-if="mangas.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <MangaCard
        v-for="manga in mangas"
        :key="manga.id"
        :manga="manga"
        @view="viewManga"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <Icon name="heroicons:book-open" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        Aucun manga trouvé
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ hasActiveFilters ? 'Essayez de modifier vos filtres.' : 'Aucun manga disponible pour le moment.' }}
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
import type { Manga } from '~/types'

// Page metadata
useHead({
  title: 'Mangas - Anime-Kun',
  meta: [
    { name: 'description', content: 'Découvrez notre collection de mangas avec critiques et notes de la communauté' }
  ]
})

// State
const mangas = ref<Manga[]>([])
const loading = ref(true)
const error = ref('')

const totalMangas = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(12)

const genres = ref([
  'Action', 'Aventure', 'Comédie', 'Drame', 'Fantastique', 
  'Horreur', 'Romance', 'Science-fiction', 'Slice of Life', 'Thriller'
])

const years = ref<string[]>([])

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
  years.value.push(year.toString())
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
const mangaAPI = useMangaAPI()

// Methods
const loadMangas = async () => {
  try {
    const response = await mangaAPI.fetchMangas({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: filters.search || undefined,
      genre: filters.genre || undefined,
      annee: filters.year || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder ? 'desc' : 'asc'
    })
    
    // Handle NestJS response format
    mangas.value = (response as any).mangas || (response as any).data || []
    totalMangas.value = (response as any).pagination?.total || (response as any).meta?.total || 0
    totalPages.value = (response as any).pagination?.totalPages || (response as any).meta?.totalPages || Math.ceil(totalMangas.value / itemsPerPage.value)
    
  } catch (err: any) {
    error.value = mangaAPI.error.value || 'Erreur lors du chargement des mangas'
  }
  
  loading.value = mangaAPI.loading.value
}

const applyFilters = () => {
  currentPage.value = 1
  loadMangas()
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
    loadMangas()
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const changeItemsPerPage = () => {
  currentPage.value = 1
  loadMangas()
}

const viewManga = (manga: any) => {
  navigateTo(`/mangas/${manga.id}`)
}

// Load data on mount
onMounted(() => {
  loadMangas()
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
  loadMangas()
}, { immediate: false })
</script>

<style scoped>
.page-header {
  @apply text-center mb-8;
}
</style>