<template>
  <div class="review-media-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Media Image -->
    <div class="relative aspect-[15/14]">
      <SmartImage
        v-if="mediaImage"
        :src="mediaImage"
        :alt="mediaTitle"
        aspect-ratio="15/14"
        container-class="w-full h-full"
        :placeholder-icon="mediaType === 'manga' ? 'heroicons:book-open' : 'heroicons:film'"
      />
      <div 
        v-else 
        class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
      >
        <Icon :name="mediaType === 'manga' ? 'heroicons:book-open' : 'heroicons:film'" class="w-16 h-16 text-gray-400" />
      </div>
      
      <!-- Media Type Badge -->
      <div 
        :class="[
          'absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-full border',
          mediaType === 'manga' 
            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
            : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
        ]"
      >
        {{ mediaType === 'manga' ? 'MANGA' : 'ANIME' }}
      </div>

      <!-- Hover Overlay -->
      <div v-if="showActions" class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
        <button
          @click="handleViewMedia"
          class="px-6 py-2.5 bg-white text-gray-900 rounded-full font-medium shadow-xl transform scale-95 hover:scale-100 transition-all duration-200 hover:bg-gray-50"
        >
          <Icon name="heroicons:eye" class="w-4 h-4 inline mr-2" />
          Voir la fiche
        </button>
      </div>
    </div>

    <!-- Media Info -->
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {{ mediaTitle }}
      </h3>
      
      <!-- Media Details -->
      <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div v-if="mediaYear" class="flex items-center space-x-1">
          <Icon name="heroicons:calendar" class="w-4 h-4" />
          <span>{{ mediaYear }}</span>
        </div>
        
        <div v-if="mediaEpisodes && mediaType === 'anime'" class="flex items-center space-x-1">
          <Icon name="heroicons:play" class="w-4 h-4" />
          <span>{{ mediaEpisodes }} épisodes</span>
        </div>
        
        <div v-if="mediaVolumes && mediaType === 'manga'" class="flex items-center space-x-1">
          <Icon name="heroicons:book-open" class="w-4 h-4" />
          <span>{{ mediaVolumes }} volumes</span>
        </div>

        <div v-if="mediaStudio" class="flex items-center space-x-1">
          <Icon name="heroicons:building-office" class="w-4 h-4" />
          <span>{{ mediaStudio }}</span>
        </div>

        <div v-if="mediaRating" class="flex items-center space-x-2">
          <Icon name="heroicons:star" class="w-4 h-4 text-yellow-400" />
          <span>{{ mediaRating }}/10</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            ({{ mediaReviewsCount }} critiques)
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="showActions" class="mt-4 space-y-2">
        <button
          @click="handleViewMedia"
          class="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icon name="heroicons:eye" class="w-4 h-4" />
          <span>Voir la fiche complète</span>
        </button>
        
        <button
          @click="handleViewAllReviews"
          class="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Icon name="heroicons:document-text" class="w-4 h-4" />
          <span>Toutes les critiques</span>
        </button>
      </div>
    </div>

    <!-- Additional Stats (if available) -->
    <div v-if="showStats" class="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <div class="grid grid-cols-2 gap-4 text-center text-sm">
        <div>
          <div class="font-semibold text-gray-900 dark:text-white">
            {{ mediaReviewsCount || 0 }}
          </div>
          <div class="text-gray-500 dark:text-gray-400">Critiques</div>
        </div>
        <div>
          <div class="font-semibold text-gray-900 dark:text-white">
            {{ mediaFansCount || 0 }}
          </div>
          <div class="text-gray-500 dark:text-gray-400">Fans</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewData } from '~/composables/useReviewsAPI'

interface Props {
  review: ReviewData
  showActions?: boolean
  showStats?: boolean
}

interface Emits {
  'view-media': []
  'view-all-reviews': []
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
  showStats: false
})

const emit = defineEmits<Emits>()

const { getImageUrl } = useImageUrl()

// Computed properties
const mediaType = computed(() => {
  return props.review.idManga && props.review.idManga > 0 ? 'manga' : 'anime'
})

const mediaTitle = computed(() => {
  if (props.review.manga?.titre) {
    return props.review.manga.titre
  }
  if (props.review.anime?.titre) {
    return props.review.anime.titre
  }
  return mediaType.value === 'manga' ? 'Manga' : 'Anime'
})

const mediaImage = computed(() => {
  const image = props.review.manga?.image || props.review.anime?.image
  return image ? getImageUrl(image, mediaType.value) : null
})

const mediaYear = computed(() => {
  // This would come from the full media data
  return props.review.anime?.annee || props.review.manga?.annee || null
})

const mediaEpisodes = computed(() => {
  return props.review.anime?.nbEp || null
})

const mediaVolumes = computed(() => {
  return props.review.manga?.nbVolumes || null
})

const mediaStudio = computed(() => {
  return props.review.anime?.studio || props.review.manga?.auteur || null
})

const mediaRating = computed(() => {
  return props.review.anime?.moyenneNotes || props.review.manga?.moyenneNotes || null
})

const mediaReviewsCount = computed(() => {
  return props.review.anime?.nbReviews || props.review.manga?.nbReviews || 0
})

const mediaFansCount = computed(() => {
  // This would come from a favorites/fans count
  return 0
})

// Methods
const handleViewMedia = () => {
  emit('view-media')
}

const handleViewAllReviews = () => {
  const mediaTitle = props.review.manga?.titre || props.review.anime?.titre
  if (mediaTitle) {
    navigateTo(`/reviews?search=${encodeURIComponent(mediaTitle)}`)
  }
  emit('view-all-reviews')
}

const { handleImageError } = useImageUrl()

const onImageError = (event: Event) => {
  const mediaType = props.review.idManga ? 'manga' : 'anime'
  handleImageError(event, undefined, mediaType)
}
</script>

<style scoped>
.review-media-card {
  @apply transition-all duration-200;
}

.review-media-card:hover {
  @apply shadow-md;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
