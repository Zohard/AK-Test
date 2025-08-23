<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement de la catégorie...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-8">
      <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex">
          <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Catégorie non trouvée
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </div>
            <div class="mt-4 space-x-3">
              <NuxtLink to="/articles" class="btn-primary">
                Retour aux articles
              </NuxtLink>
              <button @click="loadCategory" class="btn-secondary">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Content -->
    <div v-else-if="category">
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
                {{ category.name }}
              </span>
            </li>
          </ol>
        </div>
      </nav>

      <!-- Category Header -->
      <header class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div class="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
          <div class="text-center">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {{ category.name }}
            </h1>
            <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Découvrez tous les articles de la catégorie "{{ category.name }}"
            </p>
            <div class="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{{ totalArticles }} articles</span>
              <span>•</span>
              <span>Mis à jour régulièrement</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-12">
        <!-- Filters and Sorting -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recherche dans cette catégorie
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

            <!-- Author filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auteur
              </label>
              <select v-model="filters.authorId" class="form-input" @change="applyFilters">
                <option value="">Tous les auteurs</option>
                <option v-for="author in categoryAuthors" :key="author.idMember" :value="author.idMember">
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

        <!-- Articles Grid -->
        <ArticleCardGrid
          :articles="articles"
          :loading="articlesLoading"
          :pagination="pagination"
          :empty-title="hasActiveFilters ? 'Aucun article trouvé' : 'Aucun article dans cette catégorie'"
          :empty-message="hasActiveFilters ? 'Essayez de modifier vos filtres de recherche.' : 'Cette catégorie ne contient pas encore d\'articles.'"
          :show-empty-action="hasActiveFilters"
          empty-action-text="Effacer les filtres"
          grid-cols="auto"
          gap="lg"
          @article-view="viewArticle"
          @page-change="goToPage"
          @empty-action="clearFilters"
        />

        <!-- Other Categories -->
        <section v-if="otherCategories.length > 0" class="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Autres catégories
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <NuxtLink
              v-for="otherCategory in otherCategories"
              :key="otherCategory.id"
              :to="`/articles/category/${otherCategory.slug || otherCategory.id}`"
              class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 text-center group"
            >
              <h3 class="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {{ otherCategory.name }}
              </h3>
            </NuxtLink>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article, ArticleCategory, ArticleAuthor, ArticleQueryParams, ArticlesResponse } from '~/types'

// Get route parameters
const route = useRoute()
const slug = route.params.slug as string

// State
const category = ref<ArticleCategory | null>(null)
const articles = ref<Article[]>([])
const categoryAuthors = ref<ArticleAuthor[]>([])
const otherCategories = ref<ArticleCategory[]>([])
const loading = ref(true)
const articlesLoading = ref(false)
const error = ref('')
const totalArticles = ref(0)
const pagination = ref<ArticlesResponse['pagination']>()

// Filters
const filters = reactive<Omit<ArticleQueryParams, 'categoryId'>>({
  page: 1,
  limit: 12,
  search: '',
  authorId: undefined,
  sortBy: 'date',
  sortOrder: 'desc'
})

// API composables
const articlesAPI = useArticlesAPI()
const categoriesAPI = useCategoriesAPI()

// Computed
const hasActiveFilters = computed(() => {
  return !!(filters.search || filters.authorId || filters.sortBy !== 'date')
})

// Methods
const loadCategory = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Load category by slug or ID
    let categoryData: ArticleCategory
    if (isNaN(Number(slug))) {
      categoryData = await categoriesAPI.fetchCategoryBySlug(slug)
    } else {
      categoryData = await categoriesAPI.fetchCategoryById(Number(slug))
    }
    
    category.value = categoryData
    
    // Load category articles and other data in parallel
    await Promise.allSettled([
      loadCategoryArticles(),
      loadOtherCategories()
    ])
    
  } catch (err: any) {
    error.value = 'Catégorie non trouvée'
    console.error('Error loading category:', err)
  } finally {
    loading.value = false
  }
}

const loadCategoryArticles = async () => {
  if (!category.value) return
  
  try {
    articlesLoading.value = true
    
    const response = await articlesAPI.fetchArticlesByCategory(category.value.id, {
      ...filters,
      sortOrder: filters.sortOrder === 'desc' ? 'desc' : 'asc'
    })
    
    articles.value = response.articles
    pagination.value = response.pagination
    totalArticles.value = response.pagination.totalItems
    
    // Extract unique authors
    const uniqueAuthors = new Map()
    response.articles.forEach(article => {
      if (article.author && !uniqueAuthors.has(article.author.idMember)) {
        uniqueAuthors.set(article.author.idMember, article.author)
      }
    })
    categoryAuthors.value = Array.from(uniqueAuthors.values())
    
  } catch (err: any) {
    console.error('Error loading category articles:', err)
  } finally {
    articlesLoading.value = false
  }
}

const loadOtherCategories = async () => {
  try {
    const allCategories = await categoriesAPI.fetchCategories()
    otherCategories.value = allCategories.filter(cat => cat.id !== category.value?.id).slice(0, 8)
  } catch (err) {
    console.error('Error loading other categories:', err)
  }
}

const applyFilters = () => {
  filters.page = 1
  loadCategoryArticles()
  
  // Update URL with filters
  const query: Record<string, string> = {}
  if (filters.search) query.search = filters.search
  if (filters.authorId) query.author = filters.authorId.toString()
  if (filters.sortBy !== 'date') query.sort = filters.sortBy
  if (filters.sortOrder !== 'desc') query.order = filters.sortOrder
  
  navigateTo({ query }, { replace: true })
}

const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

const clearFilters = () => {
  filters.search = ''
  filters.authorId = undefined
  filters.sortBy = 'date'
  filters.sortOrder = 'desc'
  applyFilters()
}

const goToPage = (page: number) => {
  filters.page = page
  loadCategoryArticles()
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const viewArticle = (article: Article) => {
  navigateTo(`/articles/${article.niceUrl}`)
}

// SEO and page metadata
watchEffect(() => {
  if (category.value) {
    useHead({
      title: `${category.value.name} - Articles - Anime-Kun V2`,
      meta: [
        { name: 'description', content: `Découvrez tous les articles de la catégorie "${category.value.name}" sur Anime-Kun V2` },
        { name: 'keywords', content: `${category.value.name}, articles, anime, manga` },
        { property: 'og:title', content: `${category.value.name} - Articles` },
        { property: 'og:description', content: `Découvrez tous les articles de la catégorie "${category.value.name}"` },
        { property: 'og:type', content: 'website' }
      ]
    })
  }
})

// Lifecycle
onMounted(() => {
  // Parse URL query parameters
  const routeQuery = route.query
  if (routeQuery.search) filters.search = routeQuery.search as string
  if (routeQuery.author) filters.authorId = parseInt(routeQuery.author as string)
  if (routeQuery.sort) filters.sortBy = routeQuery.sort as string
  if (routeQuery.order) filters.sortOrder = routeQuery.order as 'asc' | 'desc'
  if (routeQuery.page) filters.page = parseInt(routeQuery.page as string) || 1
  
  loadCategory()
})

// Watch for route changes
watch(() => route.params.slug, (newSlug) => {
  if (newSlug && newSlug !== slug) {
    loadCategory()
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