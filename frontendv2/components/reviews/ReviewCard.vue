<template>
  <article class="review-card group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden">
    <!-- Header with media info -->
    <div class="review-header p-4 pb-3">
      <div class="flex items-start space-x-3">
        <!-- Media Image -->
        <div class="flex-shrink-0 relative">
          <SmartImage
            v-if="mediaImage"
            :src="mediaImage"
            :alt="mediaTitle"
            :width="48"
            :height="64"
            aspect-ratio="3/4"
            container-class="w-12 h-16 rounded-md shadow-sm"
            image-class="rounded-md"
            :placeholder-icon="mediaType === 'manga' ? 'heroicons:book-open' : 'heroicons:film'"
          />
          <div 
            v-else 
            class="w-12 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-md flex items-center justify-center"
          >
            <Icon :name="mediaType === 'manga' ? 'heroicons:book-open' : 'heroicons:film'" class="w-5 h-5 text-gray-400" />
          </div>
          
          <!-- Media type badge -->
          <div 
            :class="[
              'absolute -bottom-1 -right-1 px-1.5 py-0.5 text-xs font-medium rounded-full border border-white dark:border-gray-800',
              mediaType === 'manga' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            ]"
          >
            {{ mediaType === 'manga' ? 'M' : 'A' }}
          </div>
        </div>

        <!-- Review meta info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
              {{ mediaTitle }}
            </h4>
            <div class="flex items-center space-x-1 flex-shrink-0 ml-2">
              <Icon name="heroicons:eye" class="w-3 h-3 text-gray-400" />
              <span class="text-xs text-gray-500">{{ formatViews(review.nbClics) }}</span>
            </div>
          </div>
          
          <!-- Rating -->
          <ReviewRating 
            :model-value="review.notation"
            mode="display"
            size="sm"
            :show-max-value="false"
          />
        </div>
      </div>
    </div>

    <!-- Review Content -->
    <div class="review-content px-4 pb-4">
      <!-- Title -->
      <h3 class="review-title text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        <NuxtLink 
          :to="reviewUrl" 
          class="hover:underline"
        >
          {{ review.titre }}
        </NuxtLink>
      </h3>

      <!-- Excerpt -->
      <div class="review-excerpt text-sm text-gray-600 dark:text-gray-300 mb-4">
        <p class="line-clamp-3 leading-relaxed">
          {{ reviewExcerpt }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="review-footer px-4 pb-4">
      <div class="flex items-center justify-between">
        <!-- Author info -->
        <div class="flex items-center space-x-2">
          <div class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
            <img 
              v-if="review.membre?.avatar" 
              :src="review.membre.avatar" 
              :alt="review.membre?.pseudo || 'Utilisateur'"
              class="w-full h-full object-cover"
              @error="onAvatarError"
            />
            <div 
              v-else
              :class="[
                'w-full h-full flex items-center justify-center text-white font-medium text-xs',
                `bg-gradient-to-br ${getAuthorGradient(review.membre?.pseudo)}`
              ]"
            >
              {{ getAuthorInitial(review.membre?.pseudo) }}
            </div>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {{ review.membre?.pseudo || 'Utilisateur' }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(review.dateCritique) }}
            </span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center space-x-2">
          <!-- Favorite button -->
          <button
            @click="toggleFavorite"
            :class="[
              'p-1.5 rounded-full transition-colors',
              isFavorite 
                ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            ]"
            :title="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            <Icon 
              :name="isFavorite ? 'heroicons:heart-solid' : 'heroicons:heart'" 
              class="w-4 h-4" 
            />
          </button>

          <!-- Share button -->
          <button
            @click="shareReview"
            class="p-1.5 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Partager la critique"
          >
            <Icon name="heroicons:share" class="w-4 h-4" />
          </button>

          <!-- Read more button -->
          <NuxtLink
            :to="reviewUrl"
            class="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            Lire plus
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"></div>
  </article>
</template>

<script setup lang="ts">
import type { ReviewData } from '~/composables/useReviewsAPI'

interface Props {
  review: ReviewData
}

interface Emits {
  favorite: [reviewId: number, isFavorite: boolean]
  view: [review: ReviewData]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const { getImageUrl } = useImageUrl()

// State
const isFavorite = ref(false)

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

const reviewUrl = computed(() => {
  // Use numeric ID to avoid backend slug dependency
  return `/review/${props.review.idCritique}`
})

const reviewExcerpt = computed(() => {
  if (!props.review.critique) return ''
  
  // Remove HTML tags and format text
  let text = props.review.critique
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&[^;]+;/g, '') // Remove other HTML entities
    .replace(/\r\n/g, ' ') // Replace line breaks with space
    .replace(/\n/g, ' ') // Replace line breaks with space
    .trim()
  
  // Limit to 150 characters
  if (text.length > 150) {
    const truncated = text.substring(0, 150)
    const lastSpace = truncated.lastIndexOf(' ')
    text = (lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated) + '...'
  }
  
  return text
})

// Methods
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'Hier'
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

const formatViews = (views?: number) => {
  if (!views || views === 0) return '0'
  if (views >= 1000) {
    return Math.floor(views / 1000) + 'k'
  }
  return views.toString()
}

const getAuthorInitial = (pseudo?: string) => {
  return pseudo ? pseudo.charAt(0).toUpperCase() : 'U'
}

const getAuthorGradient = (pseudo?: string) => {
  if (!pseudo) return 'from-gray-500 to-gray-600'
  
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600'
  ]
  
  const index = pseudo.charCodeAt(0) % gradients.length
  return gradients[index]
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const onAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    // Redirect to login
    navigateTo('/login?redirect=' + encodeURIComponent(useRoute().fullPath))
    return
  }

  try {
    isFavorite.value = !isFavorite.value
    emit('favorite', props.review.idCritique, isFavorite.value)
    
    // TODO: Implement API call when backend is ready
    // await $fetch(`/api/reviews/${props.review.idCritique}/favorite`, {
    //   method: isFavorite.value ? 'POST' : 'DELETE',
    //   headers: authStore.getAuthHeaders()
    // })
    
  } catch (error) {
    console.error('Error toggling favorite:', error)
    // Revert on error
    isFavorite.value = !isFavorite.value
  }
}

const shareReview = async () => {
  const url = `${window.location.origin}${reviewUrl.value}`
  const title = `Critique: ${props.review.titre}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: reviewExcerpt.value || `Découvrez cette critique sur Anime-Kun`,
        url: url
      })
    } catch (error) {
      // User cancelled sharing or error occurred
      console.log('Sharing cancelled or failed:', error)
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      // TODO: Show toast notification
      console.log('URL copied to clipboard')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }
}

// Load favorite status if user is authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      // TODO: Implement when API is ready
      // const response = await $fetch(`/api/reviews/${props.review.idCritique}/favorite`, {
      //   headers: authStore.getAuthHeaders()
      // })
      // isFavorite.value = response.isFavorite
    } catch (error) {
      // Ignore error for favorite status
    }
  }
})
</script>

<style scoped>
.review-card {
  @apply relative;
}

.review-card:hover {
  @apply transform -translate-y-0.5;
}

.review-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-excerpt p {
  line-height: 1.5;
}

/* Smooth transitions */
.review-card * {
  transition-property: color, background-color, border-color, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
