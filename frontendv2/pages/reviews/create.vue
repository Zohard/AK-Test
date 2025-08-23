<template>
  <div class="review-create-page">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="container mx-auto px-6 py-12">
        <h1 class="text-4xl font-bold mb-2">Écrire une critique</h1>
        <p class="text-blue-100 text-lg">Partagez votre opinion sur votre anime ou manga favori</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-6 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Progress Indicator -->
        <div class="mb-8">
          <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Étape {{ currentStep }} sur 3</span>
            <span>{{ Math.round((currentStep / 3) * 100) }}% complété</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(currentStep / 3) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- Step 1: Media Selection -->
          <div v-if="currentStep === 1" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">1. Choisissez le média</h2>
            
            <!-- Media Type Selection -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Type de média</label>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input 
                    v-model="form.mediaType" 
                    type="radio" 
                    value="anime" 
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  >
                  <span class="ml-2">Anime</span>
                </label>
                <label class="flex items-center">
                  <input 
                    v-model="form.mediaType" 
                    type="radio" 
                    value="manga" 
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  >
                  <span class="ml-2">Manga</span>
                </label>
              </div>
            </div>

            <!-- Media Search -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher {{ form.mediaType === 'anime' ? 'un anime' : 'un manga' }}
              </label>
              <div class="relative">
                <input
                  v-model="mediaSearch"
                  type="text"
                  placeholder="Tapez pour rechercher..."
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  @input="searchMedia"
                >
                <Icon name="heroicons:magnifying-glass" class="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <!-- Search Results -->
            <div v-if="searchResults.length > 0" class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Résultats de recherche</label>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                <div 
                  v-for="media in searchResults" 
                  :key="media.id"
                  @click="selectMedia(media)"
                  :class="[
                    'p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md',
                    selectedMedia?.id === media.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  ]"
                >
                  <div class="flex space-x-3">
                    <div class="flex-shrink-0">
                      <img
                        v-if="media.image"
                        :src="getImageUrl(media.image, form.mediaType)"
                        :alt="media.titre"
                        class="w-16 h-20 object-cover rounded"
                      />
                      <div v-else class="w-16 h-20 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <Icon :name="form.mediaType === 'anime' ? 'heroicons:film' : 'heroicons:book-open'" class="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ media.titre }}</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ media.annee || 'Année inconnue' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Media -->
            <div v-if="selectedMedia" class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Média sélectionné</label>
              <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div class="flex space-x-4">
                  <img
                    v-if="selectedMedia.image"
                    :src="getImageUrl(selectedMedia.image, form.mediaType)"
                    :alt="selectedMedia.titre"
                    class="w-20 h-28 object-cover rounded"
                  />
                  <div>
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedMedia.titre }}</h4>
                    <p class="text-gray-600 dark:text-gray-400">{{ selectedMedia.annee || 'Année inconnue' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Review Content -->
          <div v-if="currentStep === 2" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">2. Votre critique</h2>

            <!-- Title -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre de votre critique *</label>
              <input
                v-model="form.title"
                type="text"
                required
                placeholder="Ex: Une masterpiece du genre shonen"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
            </div>

            <!-- Rating -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note sur 10 *</label>
              <div class="flex items-center space-x-4">
                <input
                  v-model.number="form.rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                  class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                <span class="text-gray-600 dark:text-gray-400">/ 10</span>
                <ReviewRating :rating="form.rating" :max-rating="10" mode="display" size="lg" />
              </div>
            </div>

            <!-- Content -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contenu de votre critique *</label>
              <div class="mb-2">
                <div class="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>Formatage disponible:</span>
                  <code>[b]gras[/b]</code>
                  <code>[i]italique[/i]</code>
                  <code>[quote]citation[/quote]</code>
                  <code>[spoiler]spoiler[/spoiler]</code>
                </div>
              </div>
              <textarea
                v-model="form.content"
                required
                rows="15"
                placeholder="Partagez votre analyse détaillée du média..."
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-y"
              ></textarea>
              <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ form.content.length }} caractères
                <span v-if="form.content.length < 500" class="text-yellow-600">(minimum recommandé: 500)</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (optionnel)</label>
              <input
                v-model="tagsInput"
                type="text"
                placeholder="Ex: action, aventure, shonen (séparés par des virgules)"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                @input="processTags"
              >
              <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
                <span 
                  v-for="tag in form.tags" 
                  :key="tag"
                  class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {{ tag }}
                  <button @click="removeTag(tag)" class="ml-2 text-blue-600 hover:text-blue-800">
                    <Icon name="heroicons:x-mark" class="w-3 h-3" />
                  </button>
                </span>
              </div>
            </div>
          </div>

          <!-- Step 3: Review Settings -->
          <div v-if="currentStep === 3" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">3. Paramètres de publication</h2>

            <!-- Visibility -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibilité</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input 
                    v-model="form.isPublic" 
                    type="radio" 
                    :value="true"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  >
                  <span class="ml-2">Publique - Visible par tous les utilisateurs</span>
                </label>
                <label class="flex items-center">
                  <input 
                    v-model="form.isPublic" 
                    type="radio" 
                    :value="false"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  >
                  <span class="ml-2">Privée - Visible uniquement par vous</span>
                </label>
              </div>
            </div>

            <!-- Allow Comments -->
            <div class="mb-6">
              <label class="flex items-center">
                <input 
                  v-model="form.allowComments" 
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Autoriser les commentaires</span>
              </label>
            </div>

            <!-- Review Preview -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Prévisualisation</label>
              <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <div class="flex items-start space-x-4 mb-4">
                  <img
                    v-if="selectedMedia?.image"
                    :src="getImageUrl(selectedMedia.image, form.mediaType)"
                    :alt="selectedMedia.titre"
                    class="w-16 h-20 object-cover rounded"
                  />
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ form.title }}</h3>
                    <p class="text-gray-600 dark:text-gray-400">{{ selectedMedia?.titre }}</p>
                    <ReviewRating :rating="form.rating" :max-rating="10" mode="display" />
                  </div>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {{ form.content.substring(0, 200) }}{{ form.content.length > 200 ? '...' : '' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex items-center justify-between pt-6">
            <button
              v-if="currentStep > 1"
              @click="previousStep"
              type="button"
              class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon name="heroicons:arrow-left" class="w-4 h-4 inline mr-2" />
              Précédent
            </button>
            <div v-else></div>

            <div class="flex space-x-3">
              <button
                v-if="currentStep < 3"
                @click="nextStep"
                type="button"
                :disabled="!canProceedToNext"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
                <Icon name="heroicons:arrow-right" class="w-4 h-4 inline ml-2" />
              </button>
              
              <button
                v-if="currentStep === 3"
                type="submit"
                :disabled="isSubmitting || !isFormValid"
                class="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 inline mr-2 animate-spin" />
                <Icon v-else name="heroicons:paper-airplane" class="w-4 h-4 inline mr-2" />
                {{ isSubmitting ? 'Publication...' : 'Publier la critique' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MediaItem {
  id: number
  titre: string
  image?: string
  annee?: number
}

interface ReviewForm {
  mediaType: 'anime' | 'manga'
  mediaId: number | null
  title: string
  content: string
  rating: number
  tags: string[]
  isPublic: boolean
  allowComments: boolean
}

// Auth check
const authStore = useAuthStore()
if (!authStore.isAuthenticated) {
  await navigateTo('/login?redirect=' + encodeURIComponent('/reviews/create'))
}

// Composables
const { getImageUrl } = useImageUrl()
const reviewsAPI = useReviewsAPI()

// State
const currentStep = ref(1)
const isSubmitting = ref(false)
const mediaSearch = ref('')
const searchResults = ref<MediaItem[]>([])
const selectedMedia = ref<MediaItem | null>(null)
const tagsInput = ref('')

const form = reactive<ReviewForm>({
  mediaType: 'anime',
  mediaId: null,
  title: '',
  content: '',
  rating: 7,
  tags: [],
  isPublic: true,
  allowComments: true
})

// Computed
const canProceedToNext = computed(() => {
  if (currentStep.value === 1) {
    return selectedMedia.value !== null
  }
  if (currentStep.value === 2) {
    return form.title.trim() && form.content.trim() && form.rating >= 0 && form.rating <= 10
  }
  return true
})

const isFormValid = computed(() => {
  return selectedMedia.value && 
         form.title.trim() && 
         form.content.trim() && 
         form.rating >= 0 && 
         form.rating <= 10
})

// Methods
const searchMedia = debounce(async () => {
  if (!mediaSearch.value.trim()) {
    searchResults.value = []
    return
  }

  try {
    // TODO: Replace with actual API call
    const response = await $fetch(`/api/${form.mediaType}s`, {
      params: {
        search: mediaSearch.value.trim(),
        limit: 12
      }
    })
    searchResults.value = response.data || []
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  }
}, 300)

const selectMedia = (media: MediaItem) => {
  selectedMedia.value = media
  form.mediaId = media.id
}

const processTags = () => {
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
  form.tags = [...new Set(tags)] // Remove duplicates
}

const removeTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
    tagsInput.value = form.tags.join(', ')
  }
}

const nextStep = () => {
  if (canProceedToNext.value && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true

  try {
    const reviewData = {
      title: form.title.trim(),
      content: form.content.trim(),
      rating: form.rating,
      tags: form.tags,
      isPublic: form.isPublic,
      allowComments: form.allowComments,
      [form.mediaType === 'anime' ? 'idAnime' : 'idManga']: form.mediaId
    }

    const response = await reviewsAPI.createReview(reviewData) as any
    
    // Redirect to the created review (slug or id)
    const createdSlug = response?.slug || response?.niceUrl
    const createdId = response?.id || response?.idCritique || response?.data?.id
    const target = createdSlug || createdId
    if (target) {
      await navigateTo(`/review/${target}`)
    }
  } catch (error) {
    console.error('Error creating review:', error)
    // TODO: Show error toast
    alert('Erreur lors de la création de la critique')
  } finally {
    isSubmitting.value = false
  }
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }) as T
}

// Meta
useSeoMeta({
  title: 'Écrire une critique - AK9',
  description: 'Partagez votre opinion sur vos animes et mangas favoris avec la communauté AK9',
  ogTitle: 'Écrire une critique - AK9',
  ogDescription: 'Partagez votre opinion sur vos animes et mangas favoris avec la communauté AK9',
  robots: 'noindex, nofollow'
})

// Watch for media type changes
watch(() => form.mediaType, () => {
  searchResults.value = []
  selectedMedia.value = null
  form.mediaId = null
  mediaSearch.value = ''
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
