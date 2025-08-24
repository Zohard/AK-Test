<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-4 text-lg text-gray-600 dark:text-gray-300">Chargement de la critique...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="container mx-auto px-4 py-20">
      <div class="max-w-md mx-auto text-center">
        <Icon name="heroicons:exclamation-triangle" class="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Critique introuvable</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
        <div class="space-x-4">
          <button @click="loadReview" class="btn-primary">
            Réessayer
          </button>
          <NuxtLink to="/reviews" class="btn-secondary">
            Retour aux critiques
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Review content -->
    <div v-else-if="review" class="review-content">
      <!-- Header Section with Breadcrumb -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="container mx-auto px-4 py-8">
          <!-- Breadcrumb -->
          <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <NuxtLink to="/" class="hover:text-gray-700 dark:hover:text-gray-300">Accueil</NuxtLink>
            <Icon name="heroicons:chevron-right" class="w-4 h-4" />
            <NuxtLink to="/reviews" class="hover:text-gray-700 dark:hover:text-gray-300">Critiques</NuxtLink>
            <Icon name="heroicons:chevron-right" class="w-4 h-4" />
            <span class="text-gray-700 dark:text-gray-300">{{ displayTitle }}</span>
          </nav>
        </div>
      </div>

      <!-- Main Content - Single Grid Layout -->
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Left Column: Media Info + Review Content -->
          <div class="lg:col-span-3 space-y-8">
            <!-- Media Info Row -->
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <!-- Media Card -->
              <div class="lg:col-span-1">
                <ReviewMediaCard 
                  :review="review"
                  show-actions
                  @view-media="viewMedia"
                />
              </div>

              <!-- Review Header Info -->
              <div class="lg:col-span-3">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div class="space-y-6">
                    <!-- Title and Rating -->
                    <div>
                      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {{ displayTitle }}
                      </h1>
                      <div class="flex items-center space-x-6">
                        <ReviewRating 
                          :model-value="review.notation"
                          mode="large"
                          :show-original-value="true"
                        />
                        <div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div class="flex items-center space-x-1">
                            <Icon name="heroicons:eye" class="w-4 h-4" />
                            <span>{{ formatViews(review.nbClics) }} vues</span>
                          </div>
                          <div class="flex items-center space-x-1">
                            <Icon name="heroicons:clock" class="w-4 h-4" />
                            <span>{{ formatDate(review.dateCritique) }}</span>
                          </div>
                          <div v-if="readingTime > 0" class="flex items-center space-x-1">
                            <Icon name="heroicons:book-open" class="w-4 h-4" />
                            <span>{{ readingTimeFormatted }} de lecture</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Author Info -->
                    <ReviewAuthor 
                      :author="review.membre"
                      :review-date="review.dateCritique"
                      show-follow-button
                    />

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap items-center gap-4">
                      <button
                        @click="toggleFavorite"
                        :class="[
                          'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                          isFavorite 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                        ]"
                      >
                        <Icon :name="isFavorite ? 'heroicons:heart-solid' : 'heroicons:heart'" class="w-5 h-5" />
                        <span>{{ isFavorite ? 'Retiré des favoris' : 'Ajouter aux favoris' }}</span>
                      </button>

                      <button
                        @click="shareReview"
                        class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Icon name="heroicons:share" class="w-5 h-5" />
                        <span>Partager</span>
                      </button>

                      <button
                        @click="reportReview"
                        class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                      >
                        <Icon name="heroicons:flag" class="w-5 h-5" />
                        <span>Signaler</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Review Content -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="p-8 leading-relaxed text-gray-800 dark:text-gray-200">
                <div 
                  v-if="review.critique" 
                  class="prose prose-gray dark:prose-invert max-w-none break-words overflow-hidden"
                  v-html="htmlCritique"
                />
                <div v-else class="text-gray-500 italic">Aucun contenu disponible.</div>
              </div>
            </div>

            <!-- Comments Section (Future) -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Commentaires
                </h3>
              </div>
              <div class="p-6">
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Icon name="heroicons:chat-bubble-left" class="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Les commentaires seront bientôt disponibles</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Related Reviews -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Autres critiques
              </h3>
              <div v-if="relatedReviews.length" class="space-y-4">
                <div
                  v-for="relatedReview in relatedReviews"
                  :key="relatedReview.idCritique"
                  class="group cursor-pointer"
                  @click="navigateTo(`/review/${relatedReview.idCritique}`)"
                >
                  <div class="flex space-x-3">
                    <div class="flex-shrink-0 w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                      <img
                        v-if="getMediaImage(relatedReview)"
                        :src="getMediaImage(relatedReview)"
                        :alt="getMediaTitle(relatedReview)"
                        class="w-full h-full object-cover"
                        @error="onImageError"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <Icon name="heroicons:film" class="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {{ relatedReview.titre }}
                      </h4>
                      <div class="flex items-center space-x-2 mt-1">
                        <ReviewRating 
                          :model-value="relatedReview.notation"
                          mode="compact"
                          size="sm"
                        />
                        <span class="text-xs text-gray-500">
                          {{ relatedReview.membre?.pseudo }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                Aucune critique similaire trouvée
              </div>
            </div>

            <!-- Author's Other Reviews -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Plus de {{ review.membre?.pseudo }}
              </h3>
              <div v-if="authorReviews.length" class="space-y-3">
                <div
                  v-for="authorReview in authorReviews"
                  :key="authorReview.idCritique"
                  class="group cursor-pointer text-sm"
                  @click="navigateTo(`/review/${authorReview.idCritique}`)"
                >
                  <h4 class="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {{ authorReview.titre }}
                  </h4>
                  <div class="flex items-center justify-between mt-1">
                    <ReviewRating 
                      :model-value="authorReview.notation"
                      mode="compact"
                      size="sm"
                    />
                    <span class="text-xs text-gray-500">
                      {{ formatDate(authorReview.dateCritique) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                Aucune autre critique de cet auteur
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions rapides
              </h3>
              <div class="space-y-3">
                <NuxtLink 
                  :to="`/reviews?search=${getMediaTitle(review)}`"
                  class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Icon name="heroicons:magnifying-glass" class="w-4 h-4 inline mr-2" />
                  Voir toutes les critiques de {{ getMediaTitle(review) }}
                </NuxtLink>
                <NuxtLink 
                  :to="`/reviews?author=${review.membre?.pseudo}`"
                  class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Icon name="heroicons:user" class="w-4 h-4 inline mr-2" />
                  Voir toutes les critiques de {{ review.membre?.pseudo }}
                </NuxtLink>
                <button 
                  @click="printReview"
                  class="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Icon name="heroicons:printer" class="w-4 h-4 inline mr-2" />
                  Imprimer cette critique
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <ReviewImageModal 
      v-if="showImageModal"
      :image-src="modalImageSrc"
      :image-alt="modalImageAlt"
      @close="closeImageModal"
    />

    <!-- Share Modal -->
    <ShareModal
      :show="showShareModal"
      :share-data="shareModalData"
      @close="showShareModal = false"
      @shared="(platform) => console.log('Shared to:', platform)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ReviewData } from '~/composables/useReviewsAPI'
import ReviewMediaCard from '~/components/reviews/ReviewMediaCard.vue'
import ReviewRating from '~/components/reviews/ReviewRating.vue'
import ReviewAuthor from '~/components/reviews/ReviewAuthor.vue'
import ReviewContent from '~/components/reviews/ReviewContent.vue'
import ReviewImageModal from '~/components/reviews/ReviewImageModal.vue'
import ShareModal from '~/components/ShareModal.vue'

// Page props
const route = useRoute()
const slug = route.params.slug as string

// State
const review = ref<ReviewData | null>(null)
const loading = ref(true)
const error = ref('')
const isFavorite = ref(false)
const relatedReviews = ref<ReviewData[]>([])
const authorReviews = ref<ReviewData[]>([])

// Image modal state
const showImageModal = ref(false)
const modalImageSrc = ref('')
const modalImageAlt = ref('')
const showShareModal = ref(false)
const shareModalData = ref({
  title: '',
  text: '',
  url: '',
  image: ''
})

// API composables
const reviewsAPI = useReviewsAPI()
const { getImageUrl } = useImageUrl()
const authStore = useAuthStore()

// Computed
const pageTitle = computed(() => {
  if (!review.value) return 'Critique - Anime-Kun'
  return `${review.value.titre} - Critique par ${review.value.membre?.pseudo} - Anime-Kun`
})

const pageDescription = computed(() => {
  if (!review.value) return 'Découvrez cette critique sur Anime-Kun'
  const excerpt = review.value.critique?.substring(0, 160) || ''
  return `${excerpt}... - Critique de ${getMediaTitle(review.value)} par ${review.value.membre?.pseudo}`
})

const displayTitle = computed(() => {
  if (!review.value) return 'Critique'
  
  // If review has a specific title, use it
  const reviewTitle = review.value.titre || review.value.title || review.value.nom || review.value.name
  if (reviewTitle && reviewTitle.trim()) {
    return reviewTitle
  }
  
  // Otherwise, create "Critique de [Media Title]"
  const mediaTitle = getMediaTitle(review.value)
  if (mediaTitle && mediaTitle !== 'Média') {
    return `Critique de ${mediaTitle}`
  }
  
  // Final fallback
  return 'Critique sans titre'
})

// Meta tags
const runtimeConfig = useRuntimeConfig()
const siteOrigin = computed(() => {
  if (runtimeConfig.public.siteUrl) return runtimeConfig.public.siteUrl
  if (process.client) return window.location.origin
  return ''
})

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: siteOrigin.value ? `${siteOrigin.value}/review/${slug}` : `/review/${slug}` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription }
  ]
})

// Methods
const loadReview = async () => {
  try {
    loading.value = true
    error.value = ''

    // Fetch by slug or numeric ID (handled in composable)
    const reviewData = await reviewsAPI.fetchReviewById(slug)
    
    // Map the response to our expected format
    review.value = {
      idCritique: reviewData.id || reviewData.idCritique,
      niceUrl: reviewData.niceUrl,
      titre: reviewData.titre || reviewData.title || reviewData.nom || reviewData.name,
      critique: reviewData.critique,
      notation: reviewData.notation,
      dateCritique: reviewData.reviewDate || reviewData.dateCritique,
      statut: reviewData.statut || 1,
      idMembre: reviewData.userId || reviewData.idMembre,
      idAnime: reviewData.animeId || reviewData.idAnime,
      idManga: reviewData.mangaId || reviewData.idManga,
      nbClics: reviewData.nbClics || 0,
      anime: reviewData.anime,
      manga: reviewData.manga,
      membre: reviewData.membre 
        ? { id: reviewData.membre.id || reviewData.membre.idMember, pseudo: reviewData.membre.pseudo || reviewData.membre.memberName, avatar: reviewData.membre.avatar }
        : { id: reviewData.userId, pseudo: reviewData.username }
    }

    // Load related content
    await Promise.all([
      loadRelatedReviews(),
      loadAuthorReviews()
    ])

  } catch (err: any) {
    error.value = err.message || 'Critique introuvable'
  } finally {
    loading.value = false
  }
}

const loadRelatedReviews = async () => {
  if (!review.value) return
  
  try {
    // Get reviews for the same media
    const mediaId = review.value.idAnime || review.value.idManga
    const mediaType = review.value.idAnime ? 'anime' : 'manga'
    
    if (mediaId) {
      const params = {
        [mediaType === 'anime' ? 'idAnime' : 'idManga']: mediaId,
        limit: 5
      }
      
      const response = await reviewsAPI.fetchReviews(params)
      const reviews = (response as any).reviews || (response as any).data || []
      
      // Filter out the current review and map data
      relatedReviews.value = reviews
        .filter((r: any) => r.id !== review.value?.idCritique)
        .slice(0, 4)
        .map((r: any) => ({
          idCritique: r.id,
          niceUrl: r.niceUrl,
          titre: r.titre,
          notation: r.notation,
          anime: r.anime,
          manga: r.manga,
          membre: r.membre ? { id: r.membre.id || r.membre.idMember, pseudo: r.membre.pseudo || r.membre.memberName } : undefined
        }))
    }
  } catch (err) {
    console.error('Error loading related reviews:', err)
  }
}

const loadAuthorReviews = async () => {
  if (!review.value?.idMembre) return
  
  try {
    const response = await reviewsAPI.getUserReviews(review.value.idMembre, 5)
    const reviews = (response as any).reviews || (response as any).data || []
    
    // Filter out current review and map data
  authorReviews.value = reviews
    .filter((r: any) => r.id !== review.value?.idCritique)
    .slice(0, 3)
    .map((r: any) => ({
      idCritique: r.id,
      niceUrl: r.niceUrl,
      titre: r.titre,
      notation: r.notation,
      dateCritique: r.reviewDate || r.dateCritique,
      membre: r.membre ? { id: r.membre.id || r.membre.idMember, pseudo: r.membre.pseudo || r.membre.memberName } : undefined
    }))
  } catch (err) {
    console.error('Error loading author reviews:', err)
  }
}

const getMediaTitle = (reviewData: ReviewData) => {
  return reviewData.manga?.titre || reviewData.anime?.titre || 'Média'
}

const getMediaImage = (reviewData: ReviewData) => {
  const image = reviewData.manga?.image || reviewData.anime?.image
  const type = reviewData.idManga ? 'manga' : 'anime'
  return image ? getImageUrl(image, type) : null
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatViews = (views?: number) => {
  if (!views) return '0'
  if (views >= 1000) {
    return `${Math.floor(views / 1000)}k`
  }
  return views.toString()
}

const toggleFavorite = () => {
  if (!authStore.isAuthenticated) {
    navigateTo('/login?redirect=' + encodeURIComponent(route.fullPath))
    return
  }
  
  isFavorite.value = !isFavorite.value
  // TODO: Implement API call
}

const shareReview = () => {
  if (!review.value) return
  
  const shareData = {
    title: `Critique: ${review.value.titre}`,
    text: `Découvrez cette critique de ${getMediaTitle(review.value)} par ${review.value.membre?.pseudo || 'un membre'}`,
    url: window.location.href,
    image: mediaImage.value
  }
  
  showShareModal.value = true
  shareModalData.value = shareData
}

const reportReview = () => {
  // TODO: Implement review reporting
  alert('Fonctionnalité de signalement à venir')
}

const viewMedia = () => {
  if (!review.value) return
  
  if (review.value.idAnime) {
    // Use the anime ID for reliable navigation
    navigateTo(`/anime/${review.value.idAnime}`)
  } else if (review.value.idManga) {
    // Use the manga ID for reliable navigation
    navigateTo(`/manga/${review.value.idManga}`)
  }
}

const openImageModal = (src: string, alt: string) => {
  modalImageSrc.value = src
  modalImageAlt.value = alt
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  modalImageSrc.value = ''
  modalImageAlt.value = ''
}

const printReview = () => {
  window.print()
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// SEO and Structured Data
const { setPageSEO, addReviewStructuredData, addBreadcrumbStructuredData, estimateReadingTime, formatReadingTime } = useSEO()

// Reading time calculation
const readingTime = computed(() => {
  if (!review.value?.critique) return 0
  return estimateReadingTime(review.value.critique)
})

const readingTimeFormatted = computed(() => {
  return formatReadingTime(readingTime.value)
})

// Set comprehensive SEO when review is loaded
watch(review, (newReview) => {
  if (!newReview) return

  const mediaTitle = newReview.anime?.titre || newReview.manga?.titre || 'Média inconnu'
  const author = newReview.membre?.pseudo || 'Anonyme'
  const mediaType = newReview.idManga > 0 ? 'manga' : 'anime'
  const cleanContent = newReview.critique ? newReview.critique.replace(/<[^>]*>/g, '').replace(/\[.*?\]/g, '') : ''
  
  // Basic page SEO
  setPageSEO({
    title: `${newReview.titre} - Critique de ${mediaTitle}`,
    description: cleanContent.substring(0, 160) + (cleanContent.length > 160 ? '...' : ''),
    keywords: [
      mediaTitle,
      mediaType,
      'critique',
      'review',
      'anime',
      'manga',
      author,
      ...(newReview.tags || [])
    ],
    image: getMediaImage(newReview) || '/images/default-og.jpg',
    type: 'article',
    author,
    publishedTime: newReview.dateCritique,
    section: mediaType === 'anime' ? 'Critiques Anime' : 'Critiques Manga',
    tags: newReview.tags || [mediaTitle, mediaType]
  })

  // Structured data for review
  addReviewStructuredData({
    title: newReview.titre,
    content: cleanContent,
    rating: newReview.notation,
    maxRating: 10,
    author,
    datePublished: newReview.dateCritique,
    itemReviewed: {
      name: mediaTitle,
      type: mediaType === 'anime' ? 'TVSeries' : 'Book',
      image: mediaImage.value,
      datePublished: newReview.anime?.annee?.toString() || newReview.manga?.annee?.toString(),
      genre: mediaType === 'anime' ? newReview.anime?.genres : newReview.manga?.genres,
      creator: newReview.anime?.studio || newReview.manga?.auteur
    }
  })

  // Breadcrumb structured data
  addBreadcrumbStructuredData([
    { name: 'Accueil', url: '/' },
    { name: 'Critiques', url: '/reviews' },
    { name: newReview.titre, url: `/review/${slug}` }
  ])
}, { immediate: true })

// Load data on mount
onMounted(() => {
  loadReview()
})

// Watch route changes
watch(() => route.params.slug, (newSlug) => {
  if (newSlug && newSlug !== slug) {
    loadReview()
  }
})

// Basic HTML rendering for critique (fallback that ensures visibility)
const htmlCritique = computed(() => {
  const c = review.value?.critique || ''
  if (!c) return ''
  let out = c
  // BBCode basics
  out = out.replace(/\[b\](.*?)\[\/b\]/gis, '<strong>$1</strong>')
  out = out.replace(/\[i\](.*?)\[\/i\]/gis, '<em>$1</em>')
  out = out.replace(/\[u\](.*?)\[\/u\]/gis, '<u>$1</u>')
  out = out.replace(/\[size=\d+\](.*?)\[\/size\]/gis, '$1')
  out = out.replace(/\[br\]/gi, '<br>')
  out = out.replace(/\r\n/g, '\n').replace(/\n/g, '<br>')
  return out
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Ensure HTML content doesn't break layout */
:deep(.prose) {
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

:deep(.prose *) {
  max-width: 100%;
  overflow-x: auto;
}

:deep(.prose pre) {
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.prose table) {
  table-layout: auto;
  width: 100%;
}

@media print {
  .review-detail-page {
    @apply bg-white;
  }
}
</style>
