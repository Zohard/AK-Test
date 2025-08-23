<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement de l'article...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-8">
      <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex">
          <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Article non trouvé
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </div>
            <div class="mt-4 space-x-3">
              <NuxtLink to="/articles" class="btn-primary">
                Retour aux articles
              </NuxtLink>
              <button @click="loadArticle" class="btn-secondary">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Article Content -->
    <div v-else-if="article" class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Simple article display -->
        <h1 class="text-4xl font-bold mb-4">{{ article.titre }}</h1>
        <div class="text-gray-600 mb-4">
          <p>Publié le {{ formatDate(article.date) }} par {{ article.author?.memberName || 'Inconnu' }} dans {{ article.categories?.map(c => c.nom || c.name).join(', ') || 'Aucune catégorie' }} - {{ comments.length }} commentaires</p>
        </div>
        
        <!-- Article image -->
        <div v-if="article.imgunebig || article.img" class="mb-6">
          <img 
            :src="transformWebzineImageUrl(article.imgunebig || article.img)" 
            :alt="article.titre"
            class="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            @error="onImageError"
          />
        </div>
        
        <!-- Article content -->
        <div v-if="article.content" class="prose max-w-none" v-html="transformedContent"></div>
        <div v-else-if="article.contenu" class="prose max-w-none" v-html="transformedContenu"></div>
        <div v-else class="text-gray-500">No content available</div>
        
        <!-- Comments Section -->
        <section class="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Commentaires ({{ comments.length }})
            </h2>
            
            <!-- Login prompt for non-authenticated users -->
            <div class="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p class="text-blue-800 dark:text-blue-200 mb-3">
                Connectez-vous pour laisser un commentaire
              </p>
              <NuxtLink to="/login" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                Se connecter
              </NuxtLink>
            </div>
          </div>

          <!-- Comments List -->
          <div v-if="comments.length > 0" class="space-y-4">
            <div 
              v-for="comment in comments" 
              :key="comment.id"
              class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="heroicons:user" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ comment.author?.memberName || comment.nom }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(comment.date) }}
                    </span>
                  </div>
                  <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {{ comment.commentaire }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty comments state -->
          <div v-else class="text-center py-8">
            <Icon name="heroicons:chat-bubble-left" class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Aucun commentaire
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Soyez le premier à commenter cet article.
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article, ArticleComment } from '~/types'
import ArticleHeader from '~/components/articles/ArticleHeader.vue'
import ArticleContent from '~/components/articles/ArticleContent.vue'
import ArticleNavigation from '~/components/articles/ArticleNavigation.vue'
import { transformWebzineImageUrl, transformWebzineImagesInContent } from '~/utils/webzineImages'

// Get route parameters
const route = useRoute()
const slug = route.params.slug as string

// State
const article = ref<Article | null>(null)
const previousArticle = ref<Article | null>(null)
const nextArticle = ref<Article | null>(null)
const relatedArticles = ref<Article[]>([])
const comments = ref<ArticleComment[]>([])
const loading = ref(true)
const error = ref('')
const showComments = ref(true)
const showShareModal = ref(false)
const showImageModal = ref(false)
const selectedImage = ref<{ src: string; alt: string } | null>(null)
const newComment = ref('')
const commentLoading = ref(false)

// Stores
const authStore = useAuthStore()

// API composables
const articlesAPI = useArticlesAPI()
const commentsAPI = useCommentsAPI()

// Computed
const articleUrl = computed(() => {
  if (process.client && article.value) {
    return window.location.href
  }
  return ''
})

const estimatedReadingTime = computed(() => {
  if (!article.value?.contenu) return 0
  const wordsPerMinute = 200
  const words = article.value.contenu.split(' ').length
  return Math.ceil(words / wordsPerMinute)
})

const transformedContent = computed(() => {
  if (!article.value?.content) return ''
  return transformWebzineImagesInContent(article.value.content)
})

const transformedContenu = computed(() => {
  if (!article.value?.contenu) return ''
  return transformWebzineImagesInContent(article.value.contenu)
})

// Methods
const loadArticle = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Fetch article by slug
    const fetchedArticle = await articlesAPI.fetchArticleBySlug(slug)
    article.value = fetchedArticle
    
    // Track article view
    if (fetchedArticle.idArt) {
      await articlesAPI.trackArticleView(fetchedArticle.idArt)
    }
    
    // Load related data in parallel
    await Promise.allSettled([
      loadComments(),
      loadRelatedArticles(),
      loadNavigationArticles()
    ])
    
  } catch (err: any) {
    error.value = 'Article non trouvé'
    console.error('Error loading article:', err)
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  if (!article.value) return
  
  try {
    const articleComments = await commentsAPI.fetchComments(article.value.idArt)
    comments.value = articleComments
  } catch (err) {
    console.error('Error loading comments:', err)
  }
}

const loadRelatedArticles = async () => {
  if (!article.value) return
  
  try {
    // Get articles from the same category
    if (article.value.categories && article.value.categories.length > 0) {
      const related = await articlesAPI.fetchArticlesByCategory(
        article.value.categories[0].id,
        { limit: 4 }
      )
      relatedArticles.value = related.articles.filter(a => a.idArt !== article.value!.idArt)
    }
  } catch (err) {
    console.error('Error loading related articles:', err)
  }
}

const loadNavigationArticles = async () => {
  // This would typically be implemented to get the previous/next articles
  // based on publication date or other criteria
  // For now, we'll leave them empty
}

const addComment = async () => {
  if (!article.value || !newComment.value.trim()) return
  
  try {
    commentLoading.value = true
    const comment = await commentsAPI.createComment(article.value.idArt, newComment.value.trim())
    comments.value.unshift(comment)
    newComment.value = ''
  } catch (err) {
    console.error('Error adding comment:', err)
    // Show error toast
  } finally {
    commentLoading.value = false
  }
}

const printArticle = () => {
  window.print()
}

const onBookmark = (bookmarked: boolean) => {
  console.log('Article bookmarked:', bookmarked)
  // Handle bookmark logic
}

const onContentProcessed = () => {
  console.log('Article content processed')
}

const openImageModal = (src: string, alt: string) => {
  selectedImage.value = { src, alt }
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = null
}

const viewRelatedArticle = (relatedArticle: Article) => {
  navigateTo(`/articles/${relatedArticle.niceUrl}`)
}

const viewMoreRelated = () => {
  if (article.value?.categories && article.value.categories.length > 0) {
    navigateTo(`/articles/category/${article.value.categories[0].slug || article.value.categories[0].id}`)
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.warn('Failed to load image:', img.src)
  // Hide broken image or show placeholder
  img.style.display = 'none'
}

// SEO and page metadata
watchEffect(() => {
  if (article.value) {
    useHead({
      title: `${article.value.titre} - Anime-Kun V2`,
      meta: [
        { name: 'description', content: article.value.metaDescription || `Découvrez l'article "${article.value.titre}" sur Anime-Kun V2` },
        { name: 'keywords', content: article.value.tags || 'article, anime, manga' },
        { property: 'og:title', content: article.value.titre },
        { property: 'og:description', content: article.value.metaDescription || '' },
        { property: 'og:image', content: article.value.imgunebig || article.value.img || '' },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: articleUrl.value },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: article.value.titre },
        { name: 'twitter:description', content: article.value.metaDescription || '' },
        { name: 'twitter:image', content: article.value.imgunebig || article.value.img || '' }
      ],
      link: [
        { rel: 'canonical', href: articleUrl.value }
      ]
    })
  }
})

// Lifecycle
onMounted(() => {
  loadArticle()
})

// Watch for route changes
watch(() => route.params.slug, (newSlug) => {
  if (newSlug && newSlug !== slug) {
    loadArticle()
  }
})
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200;
}

/* Modal animations */
.fixed {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Print styles */
@media print {
  .no-print {
    @apply hidden;
  }
}
</style>