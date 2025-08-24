<template>
  <div>
    <!-- Hero Section with Featured Articles -->
    <section class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div class="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Webzine
          </h1>
          <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Découvrez notre webzine, actualités et analyses sur l'univers des animes et mangas
          </p>
        </div>

        <!-- Featured Articles -->
        <div v-if="featuredArticles.length > 0" class="mb-16">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Webzine à la une
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <ArticlesArticleCard
              v-for="article in featuredArticles.slice(0, 3)"
              :key="article.idArt"
              :article="article"
              @view="viewArticle"
              class="featured-article-card transform hover:scale-105 transition-all duration-300 shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Filters and Search -->
      <div class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recherche
            </label>
            <div class="relative">
              <input
                v-model="filters.search"
                type="text"
                placeholder="Titre de l'article..."
                class="form-input pl-10"
                @input="debouncedSearch"
              />
              <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <!-- Category filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégorie
            </label>
            <select v-model="filters.categoryId" class="form-input" @change="applyFilters">
              <option value="">Toutes les catégories</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Author filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auteur
            </label>
            <select v-model="filters.authorId" class="form-input" @change="applyFilters">
              <option value="">Tous les auteurs</option>
              <option v-for="author in authors" :key="author.idMember" :value="author.idMember">
                {{ author.memberName }}
              </option>
            </select>
          </div>

          <!-- Sort -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trier par
            </label>
            <select v-model="filters.sortBy" class="form-input" @change="applyFilters">
              <option value="date">Date de publication</option>
              <option value="titre">Titre</option>
              <option value="nbClics">Popularité</option>
              <option value="commentCount">Commentaires</option>
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
            {{ totalArticles }} articles trouvés
          </div>

          <!-- Clear filters -->
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
          >
            Effacer les filtres
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement des articles...</span>
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
                @click="loadArticles"
                class="btn-primary"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Articles Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ArticlesArticleCard
          v-for="article in articles"
          :key="article.idArt"
          :article="article"
          @view="viewArticle"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article, ArticleQueryParams, ArticlesResponse, ArticleCategory, ArticleAuthor } from '~/types'

// Page metadata
useHead({
  title: 'Webzine - Anime-Kun',
  meta: [
    { name: 'description', content: 'Découvrez notre webzine, actualités et analyses sur l\'univers des animes et mangas' },
    { name: 'keywords', content: 'webzine, articles, anime, manga, actualités, analyses, critiques' }
  ]
})

// State
const articles = ref<Article[]>([])
const featuredArticles = ref<Article[]>([])
const categories = ref<ArticleCategory[]>([])
const authors = ref<ArticleAuthor[]>([])
const loading = ref(true)
const error = ref('')
const totalArticles = ref(0)
const pagination = ref<ArticlesResponse['pagination']>()

// Filters
const filters = reactive<ArticleQueryParams>({
  page: 1,
  limit: 6, // Temporary workaround for data integrity issue
  search: '',
  categoryId: undefined,
  authorId: undefined,
  sortBy: 'date',
  sortOrder: true // true = desc, false = asc
})

// API composables
const articlesAPI = useArticlesAPI()
const categoriesAPI = useCategoriesAPI()

// Computed
const hasActiveFilters = computed(() => {
  return !!(filters.search || filters.categoryId || filters.authorId || filters.sortBy !== 'date')
})

// Methods
const loadArticles = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Clean up empty parameters before sending
    const cleanFilters = Object.entries({
      ...filters,
      sortOrder: filters.sortOrder ? 'desc' : 'asc'
    }).reduce((acc, [key, value]) => {
      // Only include parameters that have non-empty values
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
    
    const response = await articlesAPI.fetchArticles(cleanFilters)
    
    articles.value = response.articles || []
    pagination.value = response.pagination || { totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 12 }
    totalArticles.value = response.pagination?.totalItems || 0
    
  } catch (err: any) {
    error.value = articlesAPI.error.value || 'Erreur lors du chargement des articles'
    console.error('Error loading articles:', err)
  } finally {
    loading.value = false
  }
}

const loadFeaturedArticles = async () => {
  try {
    const featured = await articlesAPI.fetchFeaturedArticles(5)
    featuredArticles.value = featured
  } catch (err) {
    console.error('Error loading featured articles:', err)
  }
}

const loadCategories = async () => {
  try {
    const categoryList = await categoriesAPI.fetchCategories()
    categories.value = categoryList
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}

const loadAuthors = async () => {
  try {
    // Get unique authors from articles
    const allArticles = await articlesAPI.fetchArticles({ limit: 100 })
    const uniqueAuthors = new Map()
    
    // Check if allArticles and articles array exist
    if (allArticles && allArticles.articles && Array.isArray(allArticles.articles)) {
      allArticles.articles.forEach(article => {
        if (article.author && !uniqueAuthors.has(article.author.idMember)) {
          uniqueAuthors.set(article.author.idMember, article.author)
        }
      })
    }
    
    authors.value = Array.from(uniqueAuthors.values())
  } catch (err) {
    console.error('Error loading authors:', err)
  }
}

const applyFilters = () => {
  filters.page = 1
  loadArticles()
  
  // Update URL with filters
  const query: Record<string, string> = {}
  if (filters.search) query.search = filters.search
  if (filters.categoryId) query.category = filters.categoryId.toString()
  if (filters.authorId) query.author = filters.authorId.toString()
  if (filters.sortBy !== 'date') query.sort = filters.sortBy
  if (!filters.sortOrder) query.order = 'asc'
  
  navigateTo({ query }, { replace: true })
}

const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

const clearFilters = () => {
  filters.search = ''
  filters.categoryId = undefined
  filters.authorId = undefined
  filters.sortBy = 'date'
  filters.sortOrder = true
  applyFilters()
}

const goToPage = (page: number) => {
  filters.page = page
  loadArticles()
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewArticle = (article: Article) => {
  navigateTo(`/articles/${article.niceUrl}`)
}

// Load initial data
const initializePage = async () => {
  // Load data in parallel
  await Promise.allSettled([
    loadFeaturedArticles(),
    loadCategories(),
    loadAuthors(),
    loadArticles()
  ])
}

// Lifecycle
onMounted(() => {
  // Parse URL query parameters
  const route = useRoute()
  if (route.query.search) filters.search = route.query.search as string
  if (route.query.category) filters.categoryId = parseInt(route.query.category as string)
  if (route.query.author) filters.authorId = parseInt(route.query.author as string)
  if (route.query.sort) filters.sortBy = route.query.sort as string
  if (route.query.order) filters.sortOrder = route.query.order === 'desc'
  if (route.query.page) filters.page = parseInt(route.query.page as string) || 1
  
  initializePage()
})

// Watch for route query changes
watch(() => useRoute().query, (newQuery) => {
  if (newQuery.page) {
    filters.page = parseInt(newQuery.page as string) || 1
    loadArticles()
  }
}, { immediate: false })
</script>

<style scoped>
.page-header {
  @apply text-center mb-8;
}

.featured-article-card {
  @apply bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200;
}

.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

/* Hero section animations */
.featured-article-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.featured-article-card:nth-child(1) { animation-delay: 0.1s; }
.featured-article-card:nth-child(2) { animation-delay: 0.2s; }
.featured-article-card:nth-child(3) { animation-delay: 0.3s; }
</style>