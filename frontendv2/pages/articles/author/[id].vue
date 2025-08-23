<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement du profil auteur...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-8">
      <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex">
          <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Auteur non trouvé
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </div>
            <div class="mt-4 space-x-3">
              <NuxtLink to="/articles" class="btn-primary">
                Retour aux articles
              </NuxtLink>
              <button @click="loadAuthor" class="btn-secondary">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Author Content -->
    <div v-else-if="author">
      <!-- Breadcrumb Navigation -->
      <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-4">
          <ol class="flex items-center space-x-2 text-sm">
            <li>
              <NuxtLink 
                to="/" 
                class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                <Icon name="heroicons:home" class="w-4 h-4" />
              </NuxtLink>
            </li>
            <li>
              <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <NuxtLink 
                to="/articles" 
                class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                Articles
              </NuxtLink>
            </li>
            <li>
              <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <span class="text-gray-900 dark:text-white font-medium">
                {{ author.memberName }}
              </span>
            </li>
          </ol>
        </div>
      </nav>

      <!-- Author Header -->
      <header class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div class="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
          <div class="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <!-- Author Avatar -->
            <div class="flex-shrink-0">
              <div class="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <Icon name="heroicons:user" class="w-16 h-16 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            
            <!-- Author Info -->
            <div class="flex-1 text-center md:text-left">
              <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {{ author.memberName }}
              </h1>
              <p 
                v-if="author.realName && author.realName !== author.memberName" 
                class="text-xl text-gray-600 dark:text-gray-300 mb-4"
              >
                {{ author.realName }}
              </p>
              
              <!-- Author Stats -->
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-600 dark:text-gray-300 mb-6">
                <div class="flex items-center space-x-1">
                  <Icon name="heroicons:document-text" class="w-4 h-4" />
                  <span>{{ totalArticles }} articles</span>
                </div>
                <div v-if="author.nbCritiques" class="flex items-center space-x-1">
                  <Icon name="heroicons:star" class="w-4 h-4" />
                  <span>{{ author.nbCritiques }} critiques</span>
                </div>
                <div v-if="author.experience" class="flex items-center space-x-1">
                  <Icon name="heroicons:trophy" class="w-4 h-4" />
                  <span>{{ author.experience }} exp</span>
                </div>
              </div>

              <!-- Author Bio/Description -->
              <div v-if="author.personalText" class="max-w-2xl">
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {{ author.personalText }}
                </p>
              </div>

              <!-- Author Location/Website -->
              <div v-if="author.location || author.websiteUrl" class="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div v-if="author.location" class="flex items-center space-x-1">
                  <Icon name="heroicons:map-pin" class="w-4 h-4" />
                  <span>{{ author.location }}</span>
                </div>
                <div v-if="author.websiteUrl" class="flex items-center space-x-1">
                  <Icon name="heroicons:link" class="w-4 h-4" />
                  <a 
                    :href="author.websiteUrl" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    {{ author.websiteTitle || 'Site web' }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-12">
        <!-- Filter and Sort Options -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher dans les articles de cet auteur
              </label>
              <div class="relative">
                <input
                  v-model="filters.search"
                  type="text"
                  placeholder="Rechercher un article..."
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
                <option v-for="category in authorCategories" :key="category.id" :value="category.id">
                  {{ category.name }}
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

          <!-- Additional controls -->
          <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
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

              <!-- Clear filters -->
              <button
                v-if="hasActiveFilters"
                @click="clearFilters"
                class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
              >
                Effacer les filtres
              </button>
            </div>

            <!-- Results count -->
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ totalArticles }} articles trouvés
            </div>
          </div>
        </div>

        <!-- Author Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {{ totalArticles }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Articles publiés
            </div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {{ totalViews.toLocaleString() }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Vues totales
            </div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {{ totalComments }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Commentaires reçus
            </div>
          </div>
        </div>

        <!-- Articles Grid -->
        <ArticleCardGrid
          :articles="articles"
          :loading="articlesLoading"
          :pagination="pagination"
          :empty-title="hasActiveFilters ? 'Aucun article trouvé' : 'Aucun article publié'"
          :empty-message="hasActiveFilters ? 'Essayez de modifier vos filtres de recherche.' : 'Cet auteur n\'a pas encore publié d\'articles.'"
          :show-empty-action="hasActiveFilters"
          empty-action-text="Effacer les filtres"
          grid-cols="auto"
          gap="lg"
          @article-view="viewArticle"
          @page-change="goToPage"
          @empty-action="clearFilters"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article, ArticleAuthor, ArticleCategory, ArticleQueryParams, ArticlesResponse } from '~/types'

// Get route parameters
const route = useRoute()
const authorId = parseInt(route.params.id as string)

// State
const author = ref<ArticleAuthor | null>(null)
const articles = ref<Article[]>([])
const authorCategories = ref<ArticleCategory[]>([])
const loading = ref(true)
const articlesLoading = ref(false)
const error = ref('')
const totalArticles = ref(0)
const totalViews = ref(0)
const totalComments = ref(0)
const pagination = ref<ArticlesResponse['pagination']>()

// Filters
const filters = reactive<Omit<ArticleQueryParams, 'authorId'>>({
  page: 1,
  limit: 12,
  search: '',
  categoryId: undefined,
  sortBy: 'date',
  sortOrder: 'desc'
})

// API composables
const articlesAPI = useArticlesAPI()

// Computed
const hasActiveFilters = computed(() => {
  return !!(filters.search || filters.categoryId || filters.sortBy !== 'date')
})

// Methods
const loadAuthor = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Load author articles to get author info and articles
    const response = await articlesAPI.fetchArticlesByAuthor(authorId, {
      limit: 1
    })
    
    if (response.articles.length > 0 && response.articles[0].author) {
      author.value = response.articles[0].author
    } else {
      throw new Error('Auteur non trouvé')
    }
    
    // Load author articles and statistics
    await Promise.allSettled([
      loadAuthorArticles(),
      loadAuthorStatistics()
    ])
    
  } catch (err: any) {
    error.value = 'Auteur non trouvé'
    console.error('Error loading author:', err)
  } finally {
    loading.value = false
  }
}

const loadAuthorArticles = async () => {
  try {
    articlesLoading.value = true
    
    const response = await articlesAPI.fetchArticlesByAuthor(authorId, {
      ...filters,
      sortOrder: filters.sortOrder === 'desc' ? 'desc' : 'asc'
    })
    
    articles.value = response.articles
    pagination.value = response.pagination
    totalArticles.value = response.pagination.totalItems
    
    // Extract unique categories
    const uniqueCategories = new Map()
    response.articles.forEach(article => {
      if (article.categories) {
        article.categories.forEach(category => {
          if (!uniqueCategories.has(category.id)) {
            uniqueCategories.set(category.id, category)
          }
        })
      }
    })
    authorCategories.value = Array.from(uniqueCategories.values())
    
  } catch (err: any) {
    console.error('Error loading author articles:', err)
  } finally {
    articlesLoading.value = false
  }
}

const loadAuthorStatistics = async () => {
  try {
    // Get all articles by author to calculate statistics
    const allArticles = await articlesAPI.fetchArticlesByAuthor(authorId, {
      limit: 1000 // Get all articles for stats
    })
    
    // Calculate totals
    totalViews.value = allArticles.articles.reduce((sum, article) => sum + article.nbClics, 0)
    totalComments.value = allArticles.articles.reduce((sum, article) => sum + (article.commentCount || 0), 0)
    
  } catch (err) {
    console.error('Error loading author statistics:', err)
  }
}

const applyFilters = () => {
  filters.page = 1
  loadAuthorArticles()
  
  // Update URL with filters
  const query: Record<string, string> = {}
  if (filters.search) query.search = filters.search
  if (filters.categoryId) query.category = filters.categoryId.toString()
  if (filters.sortBy !== 'date') query.sort = filters.sortBy
  if (filters.sortOrder !== 'desc') query.order = filters.sortOrder
  
  navigateTo({ query }, { replace: true })
}

const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

const clearFilters = () => {
  filters.search = ''
  filters.categoryId = undefined
  filters.sortBy = 'date'
  filters.sortOrder = 'desc'
  applyFilters()
}

const goToPage = (page: number) => {
  filters.page = page
  loadAuthorArticles()
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewArticle = (article: Article) => {
  navigateTo(`/articles/${article.niceUrl}`)
}

// SEO and page metadata
watchEffect(() => {
  if (author.value) {
    useHead({
      title: `${author.value.memberName} - Auteur - Anime-Kun V2`,
      meta: [
        { name: 'description', content: `Découvrez tous les articles écrits par ${author.value.memberName} sur Anime-Kun V2` },
        { name: 'keywords', content: `${author.value.memberName}, auteur, articles, anime, manga` },
        { property: 'og:title', content: `${author.value.memberName} - Auteur` },
        { property: 'og:description', content: `Découvrez tous les articles écrits par ${author.value.memberName}` },
        { property: 'og:type', content: 'profile' }
      ]
    })
  }
})

// Lifecycle
onMounted(() => {
  if (isNaN(authorId)) {
    error.value = 'ID auteur invalide'
    loading.value = false
    return
  }
  
  // Parse URL query parameters
  const routeQuery = route.query
  if (routeQuery.search) filters.search = routeQuery.search as string
  if (routeQuery.category) filters.categoryId = parseInt(routeQuery.category as string)
  if (routeQuery.sort) filters.sortBy = routeQuery.sort as string
  if (routeQuery.order) filters.sortOrder = routeQuery.order as 'asc' | 'desc'
  if (routeQuery.page) filters.page = parseInt(routeQuery.page as string) || 1
  
  loadAuthor()
})

// Watch for route changes
watch(() => route.params.id, (newId) => {
  const newAuthorId = parseInt(newId as string)
  if (!isNaN(newAuthorId) && newAuthorId !== authorId) {
    loadAuthor()
  }
})
</script>

<style scoped>
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200;
}

.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}
</style>