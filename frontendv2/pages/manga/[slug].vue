<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement du manga...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-8">
      <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
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
              <button @click="loadManga" class="btn-primary">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manga Details -->
    <div v-else-if="manga" class="container mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="flex mb-8" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-4">
          <li>
            <NuxtLink to="/" class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
              <Icon name="heroicons:home" class="h-5 w-5" />
              <span class="sr-only">Accueil</span>
            </NuxtLink>
          </li>
          <li>
            <div class="flex items-center">
              <Icon name="heroicons:chevron-right" class="h-5 w-5 text-gray-400" />
              <NuxtLink to="/mangas" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Mangas
              </NuxtLink>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <Icon name="heroicons:chevron-right" class="h-5 w-5 text-gray-400" />
              <span class="ml-4 text-sm font-medium text-gray-900 dark:text-white">
                {{ manga.titre }}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Main Content -->
      <div class="main bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        
        <!-- Manga Header -->
        <div class="fiche p-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-6">{{ manga.titre }}</h1>
          
          <!-- General Information -->
          <div class="general grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            <!-- Image and Basic Info -->
            <div class="principal lg:col-span-1">
              <div class="img-fiche mb-6">
                <img 
                  :src="getImageUrl(manga.image, 'manga')" 
                  :alt="manga.titre"
                  class="w-full max-w-sm mx-auto rounded-lg shadow-md"
                  @error="onImageError"
                />
              </div>
              
              <!-- Manga Details List -->
              <div class="space-y-3 text-sm">
                <div v-if="manga.annee" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Année :</span>
                  <span class="text-gray-900 dark:text-white">{{ manga.annee }}</span>
                </div>
                
                <div v-if="manga.titreOrig" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Titre original :</span>
                  <span class="text-gray-900 dark:text-white">{{ manga.titreOrig }}</span>
                </div>
                
                <div v-if="manga.auteur" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Auteur :</span>
                  <span class="text-gray-900 dark:text-white">{{ manga.auteur }}</span>
                </div>
                
                <div v-if="manga.nbVolumes" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Nombre de volumes :</span>
                  <span class="text-gray-900 dark:text-white">{{ manga.nbVolumes }}</span>
                </div>
                
                <div v-if="manga.editeur" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Éditeur :</span>
                  <span class="text-gray-900 dark:text-white">{{ manga.editeur }}</span>
                </div>

                <div v-if="manga.dessinateur" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Dessinateur :</span>
                  <span class="text-gray-900 dark:text-white">{{ manga.dessinateur }}</span>
                </div>
                
                <div v-if="manga.moyenneNotes" class="flex items-center">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Note moyenne :</span>
                  <div class="flex items-center">
                    <div class="flex text-yellow-400">
                      <Icon 
                        v-for="i in 5" 
                        :key="i" 
                        name="heroicons:star-solid" 
                        :class="i <= Math.round(manga.moyenneNotes / 2) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                        class="h-4 w-4"
                      />
                    </div>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ (manga.moyenneNotes / 2).toFixed(1) }}/5</span>
                    <span v-if="manga.nbReviews" class="ml-1 text-gray-500 dark:text-gray-400 text-xs">
                      ({{ manga.nbReviews }} avis)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Tabbed Content -->
            <div class="lg:col-span-2">
              <div id="tabs" class="ui-tabs">
                
                <!-- Tab Navigation -->
                <div class="fiche-menu mb-6">
                  <ul class="flex border-b border-gray-200 dark:border-gray-700">
                    <li 
                      v-for="tab in tabs" 
                      :key="tab.id"
                      class="mr-2"
                    >
                      <button
                        @click="activeTab = tab.id"
                        :class="[
                          'inline-block py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        ]"
                      >
                        {{ tab.label }}
                      </button>
                    </li>
                  </ul>
                </div>
                
                <!-- Tab Content -->
                <div class="tab-content">
                  
                  <!-- Synopsis Tab -->
                  <div v-show="activeTab === 'synopsis'" class="info synopsis">
                    <div v-if="manga.synopsis" class="prose dark:prose-invert max-w-none">
                      <p v-html="formatSynopsis(manga.synopsis)"></p>
                    </div>
                    <div v-else class="text-gray-500 dark:text-gray-400 italic">
                      Aucun synopsis disponible pour ce manga.
                    </div>
                  </div>
                  
                  <!-- Reviews Tab -->
                  <div v-show="activeTab === 'reviews'" class="info reviews">
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                          Critiques ({{ manga.nbReviews || 0 }})
                        </h3>
                        <button 
                          @click="showAddReview = !showAddReview"
                          class="btn-primary"
                        >
                          Ajouter une critique
                        </button>
                      </div>
                      
                      <!-- Add Review Form -->
                      <div v-if="showAddReview" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <form @submit.prevent="submitReview" class="space-y-4">
                          <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Note
                            </label>
                            <div class="flex items-center space-x-1">
                              <button
                                v-for="i in 10"
                                :key="i"
                                type="button"
                                @click="newReview.notation = i"
                                class="focus:outline-none"
                              >
                                <Icon
                                  name="heroicons:star-solid"
                                  :class="i <= newReview.notation ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                                  class="h-6 w-6 hover:text-yellow-400 transition-colors"
                                />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Votre critique
                            </label>
                            <textarea
                              v-model="newReview.critique"
                              rows="4"
                              class="form-input"
                              placeholder="Partagez votre avis sur ce manga..."
                              required
                            ></textarea>
                          </div>
                          <div class="flex space-x-3">
                            <button type="submit" class="btn-primary">
                              Publier
                            </button>
                            <button 
                              type="button" 
                              @click="showAddReview = false"
                              class="btn-secondary"
                            >
                              Annuler
                            </button>
                          </div>
                        </form>
                      </div>
                      
                      <!-- Reviews List -->
                      <div v-if="reviews.length" class="space-y-4">
                        <div 
                          v-for="review in reviews" 
                          :key="review.id"
                          class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                        >
                          <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center space-x-2">
                              <span class="font-medium text-gray-900 dark:text-white">
                                {{ review.membre?.memberName || 'Utilisateur' }}
                              </span>
                              <div class="flex text-yellow-400">
                                <Icon 
                                  v-for="i in 5" 
                                  :key="i" 
                                  name="heroicons:star-solid" 
                                  :class="i <= Math.round((review.notation || 0) / 2) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                                  class="h-4 w-4"
                                />
                              </div>
                              <span class="text-sm text-gray-600 dark:text-gray-400">
                                {{ review.notation }}/10
                              </span>
                            </div>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                              {{ formatDate(review.reviewDate || review.dateCritique) }}
                            </span>
                          </div>
                          <h4 v-if="review.titre" class="font-medium text-gray-900 dark:text-white mb-1">
                            {{ review.titre }}
                          </h4>
                          <p class="text-gray-700 dark:text-gray-300">{{ review.critique }}</p>
                        </div>
                      </div>
                      
                      <div v-else-if="!loadingReviews" class="text-center py-8 text-gray-500 dark:text-gray-400">
                        Aucune critique pour ce manga. Soyez le premier à donner votre avis !
                      </div>
                      
                      <div v-if="loadingReviews" class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Relations Tab -->
                  <div v-show="activeTab === 'relations'" class="info relations">
                    <RelatedContent
                      :relations="relationsData"
                      :loading="loadingRelations"
                      title="Contenus liés"
                    />
                  </div>
                  
                  <!-- Notes Tab -->
                  <div v-show="activeTab === 'notes'" class="info notes">
                    <div class="text-gray-500 dark:text-gray-400 italic">
                      Aucune note supplémentaire disponible.
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
          
          <!-- Screenshots Section -->
          <div v-if="screenshots.length" class="screenshots mt-8">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Illustrations</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div 
                v-for="(screenshot, index) in screenshots" 
                :key="index"
                class="relative group cursor-pointer"
                @click="openLightbox(index)"
              >
                <img 
                  :src="screenshot.thumb" 
                  :alt="`${manga.titre} - Illustration #${index + 1}`"
                  class="w-full h-16 object-cover rounded-lg transition-transform group-hover:scale-105"
                  @error="onScreenshotError"
                  @load="onScreenshotLoad"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg"></div>
              </div>
            </div>
          </div>
          
        </div>
        
        <!-- Similar Mangas Section -->
        <div v-if="similarMangas.length" class="simama bg-gray-50 dark:bg-gray-800 p-8">
          <div class="similaires-main">
            <div class="bloc sim">
              <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Mangas similaires</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <NuxtLink
                  v-for="similar in similarMangas"
                  :key="similar.id"
                  :to="buildMangaUrl(similar)"
                  class="group"
                >
                  <img 
                    :src="getImageUrl(similar.image, 'manga')" 
                    :alt="similar.titre"
                    class="w-full aspect-[3/4] object-cover rounded-lg transition-transform group-hover:scale-105"
                  />
                  <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 text-center line-clamp-2">
                    {{ similar.titre }}
                  </p>
                </NuxtLink>
              </div>
              <div class="mt-6 text-center">
                <NuxtLink 
                  :to="`/mangas/similaires/${manga.id}`"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  Plus de mangas similaires »
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div 
      v-if="lightboxOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      @click="closeLightbox"
    >
      <div class="relative max-w-4xl max-h-full p-4">
        <button
          @click="closeLightbox"
          class="absolute top-2 right-2 text-white hover:text-gray-300 z-10"
        >
          <Icon name="heroicons:x-mark" class="h-8 w-8" />
        </button>
        <img 
          v-if="currentScreenshot"
          :src="currentScreenshot.full" 
          :alt="`${manga?.titre} - Illustration`"
          class="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Manga, Review } from '~/types'

// Route parameters
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Extract ID from slug (e.g., "one-piece-123" -> "123")
const mangaId = computed(() => {
  const parts = slug.value.split('-')
  const lastPart = parts[parts.length - 1]
  // Check if last part is a number
  return /^\d+$/.test(lastPart) ? lastPart : null
})

// Page metadata - will be updated when manga loads
useHead({
  title: 'Chargement...',
  meta: [
    { name: 'description', content: 'Chargement des détails du manga...' }
  ]
})

// State
const manga = ref<Manga | null>(null)
const reviews = ref<Review[]>([])
const similarMangas = ref<Manga[]>([])
const loading = ref(true)
const loadingReviews = ref(false)
const loadingRelations = ref(false)
const relationsData = ref([])
const error = ref('')

const activeTab = ref('synopsis')
const showAddReview = ref(false)
const lightboxOpen = ref(false)
const currentScreenshotIndex = ref(0)

// Screenshots will be loaded from API or media service
const screenshots = ref([])

// Tabs configuration
const tabs = [
  { id: 'synopsis', label: 'Synopsis' },
  { id: 'reviews', label: 'Critiques' },
  { id: 'relations', label: 'Relations' },
  { id: 'notes', label: 'Notes' }
]

// New review form
const newReview = ref({
  critique: '',
  notation: 5
})

// Composables
const mangaAPI = useMangaAPI()
const reviewsAPI = useReviewsAPI()
const { fetchMangaRelations } = useRelations()
const config = useRuntimeConfig()

// Computed
const currentScreenshot = computed(() => {
  return screenshots.value[currentScreenshotIndex.value]
})

// Methods
const buildMangaUrl = (manga: Manga) => {
  // Create SEO-friendly URL: /manga/nice-url-id
  const niceUrl = manga.niceUrl || createSlug(manga.titre)
  return `/manga/${niceUrl}-${manga.id}`
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

const loadManga = async () => {
  if (!mangaId.value) {
    error.value = 'ID manga invalide dans l\'URL'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    console.log('Loading manga with ID:', mangaId.value)
    const response = await mangaAPI.fetchMangaById(parseInt(mangaId.value))
    console.log('Manga API response:', response)
    manga.value = response as Manga
    
    // Update page metadata
    if (manga.value) {
      useHead({
        title: `${manga.value.titre} - Anime-Kun V2`,
        meta: [
          { name: 'description', content: manga.value.synopsis || `Découvrez ${manga.value.titre}, un manga${manga.value.annee ? ` de ${manga.value.annee}` : ''}.` },
          { property: 'og:title', content: manga.value.titre },
          { property: 'og:description', content: manga.value.synopsis || `Découvrez ${manga.value.titre}` },
          { property: 'og:image', content: getImageUrl(manga.value.image, 'manga') },
          { property: 'og:type', content: 'book' }
        ]
      })
      
      // Load related data
      loadReviews()
      loadSimilarMangas()
      loadScreenshots()
      loadRelations()
    }
    
  } catch (err: any) {
    console.error('Error loading manga:', err)
    error.value = err.message || 'Erreur lors du chargement du manga'
  } finally {
    loading.value = false
  }
}

const loadReviews = async () => {
  if (!manga.value) return
  
  try {
    loadingReviews.value = true
    const response = await reviewsAPI.fetchReviews({
      idManga: manga.value.id,
      limit: 10
    })
    reviews.value = (response as any).reviews || (response as any).data || []
  } catch (err) {
    console.error('Error loading reviews:', err)
  } finally {
    loadingReviews.value = false
  }
}

const loadSimilarMangas = async () => {
  if (!manga.value) return
  
  try {
    const response = await mangaAPI.fetchMangas({
      auteur: manga.value.auteur,
      limit: 6
    })
    const allMangas = (response as any).mangas || (response as any).data || []
    similarMangas.value = allMangas.filter((m: Manga) => m.id !== manga.value!.id).slice(0, 6)
  } catch (err) {
    console.error('Error loading similar mangas:', err)
  }
}

const loadScreenshots = async () => {
  if (!manga.value) return
  
  try {
    // Try to load media from the media API
    const response = await $fetch(`${config.public.apiBase}/api/media/content/${manga.value.id}?type=manga`)
    const mediaItems = (response as any[]) || []
    
    // Since database contains broken references, skip API screenshots entirely
    // and go straight to showing manga cover as fallback
    screenshots.value = []
    
    // If no valid screenshots found, add the manga cover as a fallback illustration
    if (screenshots.value.length === 0 && manga.value.image) {
      const coverUrl = getImageUrl(manga.value.image, 'manga')
      if (coverUrl) {
        screenshots.value = [{
          thumb: coverUrl,
          full: coverUrl
        }]
      }
    }
  } catch (err) {
    // If no media found, add the manga cover as a fallback illustration
    console.log('No screenshots found for manga:', manga.value.id)
    if (manga.value.image) {
      const coverUrl = getImageUrl(manga.value.image, 'manga')
      if (coverUrl) {
        screenshots.value = [{
          thumb: coverUrl,
          full: coverUrl
        }]
      }
    } else {
      screenshots.value = []
    }
  }
}

const loadRelations = async () => {
  if (!manga.value) return
  
  try {
    loadingRelations.value = true
    const response = await fetchMangaRelations(manga.value.id)
    if (response) {
      relationsData.value = response.relations || []
    }
  } catch (err) {
    console.error('Error loading relations:', err)
  } finally {
    loadingRelations.value = false
  }
}

const submitReview = async () => {
  if (!manga.value) return
  
  try {
    await reviewsAPI.createReview({
      ...newReview.value,
      idManga: manga.value.id
    })
    
    newReview.value = { critique: '', notation: 5 }
    showAddReview.value = false
    loadReviews()
    
    if (manga.value.nbReviews !== undefined) {
      manga.value.nbReviews++
    }
    
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de l\'ajout de la critique'
  }
}

const formatSynopsis = (synopsis: string) => {
  return synopsis
    .replace(/\n/g, '<br>')
    .replace(/<span class="italic">(.*?)<\/span>/g, '<em>$1</em>')
    .replace(/<span class="auteur">(.*?)<\/span>/g, '<small class="text-gray-500 dark:text-gray-400">$1</small>')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const openLightbox = (index: number) => {
  currentScreenshotIndex.value = index
  lightboxOpen.value = true
}

const closeLightbox = () => {
  lightboxOpen.value = false
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/placeholder-manga.jpg'
}

const onScreenshotError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // Hide the screenshot container if image fails to load
  const container = img.closest('.relative.group.cursor-pointer')
  if (container) {
    (container as HTMLElement).style.display = 'none'
  }
}

const onScreenshotLoad = (event: Event) => {
  // Screenshot loaded successfully - ensure it's visible
  const img = event.target as HTMLImageElement
  const container = img.closest('.relative.group.cursor-pointer')
  if (container) {
    (container as HTMLElement).style.display = 'block'
  }
}

// Image URL composable
const { getImageUrl } = useImageUrl()

// Load manga on mount
onMounted(() => {
  console.log('Manga details page mounted with slug:', slug.value)
  console.log('Extracted manga ID:', mangaId.value)
  loadManga()
})

// Watch for route changes
watch(() => route.params.slug, () => {
  if (route.params.slug) {
    loadManga()
  }
})
</script>

<style scoped>
.main {
  @apply shadow-lg;
}

.fiche {
  @apply relative;
}

.img-fiche img {
  @apply shadow-lg border border-gray-200 dark:border-gray-700;
}

.ui-tabs {
  @apply relative;
}

.tab-content {
  @apply min-h-[200px];
}

.info {
  @apply text-gray-700 dark:text-gray-300 leading-relaxed;
}

.prose {
  @apply max-w-none;
}

.prose p {
  @apply mb-4 leading-relaxed;
}

.prose em {
  @apply italic font-medium;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar for webkit browsers */
.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.tab-content::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>