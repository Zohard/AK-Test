<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement de l'anime...</span>
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
              <button @click="loadAnime" class="btn-primary">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Anime Details -->
    <div v-else-if="anime" class="container mx-auto px-4 py-8">
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
              <NuxtLink to="/animes" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Animes
              </NuxtLink>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <Icon name="heroicons:chevron-right" class="h-5 w-5 text-gray-400" />
              <span class="ml-4 text-sm font-medium text-gray-900 dark:text-white">
                {{ anime.titre }}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Main Content -->
      <div class="main bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        
        <!-- Anime Header -->
        <div class="fiche p-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-6">{{ anime.titre }}</h1>
          
          <!-- General Information -->
          <div class="general grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            <!-- Image and Basic Info -->
            <div class="principal lg:col-span-1">
              <div class="img-fiche mb-6">
                <img 
                  :src="getImageUrl(anime.image, 'anime')" 
                  :alt="anime.titre"
                  class="w-full max-w-sm mx-auto rounded-lg shadow-md"
                  @error="onImageError"
                />
              </div>
              
              <!-- Anime Details List -->
              <div class="space-y-3 text-sm">
                <div v-if="anime.annee" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Année :</span>
                  <span class="text-gray-900 dark:text-white">{{ anime.annee }}</span>
                </div>
                
                <div v-if="anime.titreOrig" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Titre original :</span>
                  <span class="text-gray-900 dark:text-white">{{ anime.titreOrig }}</span>
                </div>
                
                <div v-if="anime.nbEp" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Nombre d'épisodes :</span>
                  <span class="text-gray-900 dark:text-white">{{ anime.nbEp }}</span>
                </div>
                
                <div v-if="anime.studio" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Studio :</span>
                  <span class="text-gray-900 dark:text-white">{{ anime.studio }}</span>
                </div>
                
                <div v-if="anime.realisateur" class="flex">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Réalisation :</span>
                  <span class="text-gray-900 dark:text-white">{{ anime.realisateur }}</span>
                </div>
                
                <div v-if="anime.moyenneNotes" class="flex items-center">
                  <span class="font-medium text-gray-700 dark:text-gray-300 mr-2">Note moyenne :</span>
                  <div class="flex items-center">
                    <div class="flex text-yellow-400">
                      <Icon 
                        v-for="i in 5" 
                        :key="i" 
                        name="heroicons:star-solid" 
                        :class="i <= Math.round(anime.moyenneNotes / 2) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
                        class="h-4 w-4"
                      />
                    </div>
                    <span class="ml-2 text-gray-900 dark:text-white">{{ (anime.moyenneNotes / 2).toFixed(1) }}/5</span>
                    <span v-if="anime.nbReviews" class="ml-1 text-gray-500 dark:text-gray-400 text-xs">
                      ({{ anime.nbReviews }} avis)
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
                    <div v-if="anime.synopsis" class="prose dark:prose-invert max-w-none">
                      <p v-html="formatSynopsis(anime.synopsis)"></p>
                    </div>
                    <div v-else class="text-gray-500 dark:text-gray-400 italic">
                      Aucun synopsis disponible pour cet anime.
                    </div>
                  </div>
                  
                  <!-- Staff Tab -->
                  <div v-show="activeTab === 'staff'" class="info staff">
                    <div class="space-y-6">
                      <!-- Basic Staff Info -->
                      <div class="space-y-3">
                        <div v-if="anime.studio">
                          <span class="font-medium text-gray-700 dark:text-gray-300">Studio d'animation :</span>
                          <span class="ml-2 text-gray-900 dark:text-white">{{ anime.studio }}</span>
                        </div>
                        <div v-if="anime.realisateur">
                          <span class="font-medium text-gray-700 dark:text-gray-300">Réalisation :</span>
                          <span class="ml-2 text-gray-900 dark:text-white">{{ anime.realisateur }}</span>
                        </div>
                      </div>

                      <!-- Business Relations -->
                      <div v-if="anime.businessRelations && anime.businessRelations.length" class="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Staff et équipe technique
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div
                            v-for="relation in anime.businessRelations"
                            :key="relation.idRelation"
                            class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div class="flex items-start space-x-3">
                              <!-- Business Image placeholder -->
                              <div class="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Icon name="heroicons:building-office" class="w-6 h-6 text-gray-400" />
                              </div>
                              
                              <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between">
                                  <div class="flex-1">
                                    <NuxtLink
                                      v-if="relation.business"
                                      :to="buildBusinessUrl(relation.business)"
                                      class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm hover:underline"
                                    >
                                      {{ relation.business.denomination || 'Business sans nom' }}
                                    </NuxtLink>
                                    <span v-else class="text-gray-900 dark:text-white font-medium text-sm">
                                      Business #{{ relation.idBusiness }}
                                    </span>
                                    
                                    <div class="mt-1">
                                      <span v-if="relation.type" class="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                        {{ relation.type }}
                                      </span>
                                    </div>
                                    
                                    <p v-if="relation.precisions" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                      {{ relation.precisions }}
                                    </p>
                                  </div>
                                  
                                  <div class="ml-2">
                                    <NuxtLink
                                      v-if="relation.business"
                                      :to="buildBusinessUrl(relation.business)"
                                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                      <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
                                    </NuxtLink>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- No staff info message -->
                      <div v-if="!anime.studio && !anime.realisateur && (!anime.businessRelations || !anime.businessRelations.length)" class="text-gray-500 dark:text-gray-400 italic text-center py-8">
                        Aucune information sur le staff disponible.
                      </div>
                    </div>
                  </div>
                  
                  <!-- Reviews Tab -->
                  <div v-show="activeTab === 'reviews'" class="info reviews">
                    <div class="space-y-4">
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                          Critiques ({{ anime.nbReviews || 0 }})
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
                              placeholder="Partagez votre avis sur cet anime..."
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
                        Aucune critique pour cet anime. Soyez le premier à donner votre avis !
                      </div>
                      
                      <div v-if="loadingReviews" class="text-center py-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Relations Tab -->
                  <div v-show="activeTab === 'relations'" class="info relations">
                    <div class="text-gray-500 dark:text-gray-400 italic">
                      Fonctionnalité des relations à venir.
                    </div>
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
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Screenshots</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div 
                v-for="(screenshot, index) in screenshots" 
                :key="index"
                class="relative group cursor-pointer"
                @click="openLightbox(index)"
              >
                <img 
                  :src="screenshot.thumb" 
                  :alt="`${anime.titre} - Screenshot #${index + 1}`"
                  class="w-full h-16 object-cover rounded-lg transition-transform group-hover:scale-105"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg"></div>
              </div>
            </div>
          </div>
          
        </div>
        
        <!-- Similar Animes Section -->
        <div v-if="similarAnimes.length" class="simama bg-gray-50 dark:bg-gray-800 p-8">
          <div class="similaires-main">
            <div class="bloc sim">
              <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Animes similaires</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <NuxtLink
                  v-for="similar in similarAnimes"
                  :key="similar.id"
                  :to="buildAnimeUrl(similar)"
                  class="group"
                >
                  <img 
                    :src="getImageUrl(similar.image, 'anime')" 
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
                  :to="`/animes/similaires/${anime.id}`"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  Plus d'animes similaires »
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
          :alt="`${anime?.titre} - Screenshot`"
          class="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Anime, Review } from '~/types'

// Route parameters
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// Extract ID from slug (e.g., "attack-on-titan-123" -> "123")
const animeId = computed(() => {
  const parts = slug.value.split('-')
  const lastPart = parts[parts.length - 1]
  // Check if last part is a number
  return /^\d+$/.test(lastPart) ? lastPart : null
})

// Page metadata - will be updated when anime loads
useHead({
  title: 'Chargement...',
  meta: [
    { name: 'description', content: 'Chargement des détails de l\'anime...' }
  ]
})

// State
const anime = ref<Anime | null>(null)
const reviews = ref<Review[]>([])
const similarAnimes = ref<Anime[]>([])
const loading = ref(true)
const loadingReviews = ref(false)
const error = ref('')

const activeTab = ref('synopsis')
const showAddReview = ref(false)
const lightboxOpen = ref(false)
const currentScreenshotIndex = ref(0)

// Mock screenshots for demo
const screenshots = ref([
  {
    thumb: `/images/anime/screenshots/${animeId.value}-1-thumb.jpg`,
    full: `/images/anime/screenshots/${animeId.value}-1.jpg`
  }
])

// Tabs configuration
const tabs = [
  { id: 'synopsis', label: 'Synopsis' },
  { id: 'staff', label: 'Staff' },
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
const animeAPI = useAnimeAPI()
const reviewsAPI = useReviewsAPI()

// Computed
const currentScreenshot = computed(() => {
  return screenshots.value[currentScreenshotIndex.value]
})

// Methods
const buildAnimeUrl = (anime: Anime) => {
  // Create SEO-friendly URL: /anime/nice-url-id
  const niceUrl = anime.niceUrl || createSlug(anime.titre)
  return `/anime/${niceUrl}-${anime.id}`
}

const buildBusinessUrl = (business: any) => {
  // Create SEO-friendly URL: /business/nice-url-id
  const niceUrl = business.niceUrl || createSlug(business.denomination || 'business')
  return `/business/${niceUrl}-${business.idBusiness}`
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

const loadAnime = async () => {
  if (!animeId.value) {
    error.value = 'ID anime invalide dans l\'URL'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    console.log('Loading anime with ID:', animeId.value)
    const response = await animeAPI.fetchAnimeById(parseInt(animeId.value))
    console.log('Anime API response:', response)
    anime.value = response as Anime
    
    // Update page metadata
    if (anime.value) {
      useHead({
        title: `${anime.value.titre} - Anime-Kun V2`,
        meta: [
          { name: 'description', content: anime.value.synopsis || `Découvrez ${anime.value.titre}, un anime${anime.value.annee ? ` de ${anime.value.annee}` : ''}.` },
          { property: 'og:title', content: anime.value.titre },
          { property: 'og:description', content: anime.value.synopsis || `Découvrez ${anime.value.titre}` },
          { property: 'og:image', content: getImageUrl(anime.value.image, 'anime') },
          { property: 'og:type', content: 'video.tv_show' }
        ]
      })
      
      // Load related data
      loadReviews()
      loadSimilarAnimes()
    }
    
  } catch (err: any) {
    console.error('Error loading anime:', err)
    error.value = err.message || 'Erreur lors du chargement de l\'anime'
  } finally {
    loading.value = false
  }
}

const loadReviews = async () => {
  if (!anime.value) return
  
  try {
    loadingReviews.value = true
    const response = await reviewsAPI.fetchReviews({
      idAnime: anime.value.id,
      limit: 10
    })
    reviews.value = (response as any).reviews || (response as any).data || []
  } catch (err) {
    console.error('Error loading reviews:', err)
  } finally {
    loadingReviews.value = false
  }
}

const loadSimilarAnimes = async () => {
  if (!anime.value) return
  
  try {
    const response = await animeAPI.fetchAnimes({
      studio: anime.value.studio,
      limit: 6
    })
    const allAnimes = (response as any).animes || (response as any).data || []
    similarAnimes.value = allAnimes.filter((a: Anime) => a.id !== anime.value!.id).slice(0, 6)
  } catch (err) {
    console.error('Error loading similar animes:', err)
  }
}

const submitReview = async () => {
  if (!anime.value) return
  
  try {
    await reviewsAPI.createReview({
      ...newReview.value,
      idAnime: anime.value.id
    })
    
    newReview.value = { critique: '', notation: 5 }
    showAddReview.value = false
    loadReviews()
    
    if (anime.value.nbReviews !== undefined) {
      anime.value.nbReviews++
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
  img.src = '/images/placeholder-anime.jpg'
}

// Image URL composable
const { getImageUrl } = useImageUrl()

// Load anime on mount
onMounted(() => {
  console.log('Anime details page mounted with slug:', slug.value)
  console.log('Extracted anime ID:', animeId.value)
  loadAnime()
})

// Watch for route changes
watch(() => route.params.slug, () => {
  if (route.params.slug) {
    loadAnime()
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