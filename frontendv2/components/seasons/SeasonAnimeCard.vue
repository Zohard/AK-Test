<template>
  <article class="season-anime-card group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden cursor-pointer" @click="$emit('view', anime)">
    <!-- Image Container -->
    <div class="relative aspect-[3/4] overflow-hidden">
      <SmartImage
        v-if="animeImage"
        :src="animeImage"
        :alt="anime.titre"
        :width="300"
        :height="400"
        aspect-ratio="3/4"
        container-class="w-full h-full"
        image-class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        :placeholder-icon="'heroicons:film'"
      />
      <div 
        v-else 
        class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
      >
        <Icon name="heroicons:film" class="w-16 h-16 text-gray-400" />
      </div>

      <!-- Format Badge -->
      <div class="absolute top-2 left-2">
        <span 
          :class="[
            'px-2 py-1 text-xs font-medium rounded-md backdrop-blur-sm',
            formatBadgeClass
          ]"
        >
          {{ anime.format || 'TV' }}
        </span>
      </div>

      <!-- Rating Badge -->
      <div v-if="anime.moyenneNotes" class="absolute top-2 right-2">
        <div class="flex items-center space-x-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md">
          <Icon name="heroicons:star-solid" class="w-3 h-3 text-yellow-400" />
          <span class="text-white text-xs font-medium">{{ formatRating(anime.moyenneNotes) }}</span>
        </div>
      </div>

      <!-- Episode Count -->
      <div v-if="anime.nbEp" class="absolute bottom-2 right-2">
        <span class="px-2 py-1 text-xs font-medium text-white bg-black/70 backdrop-blur-sm rounded-md">
          {{ anime.nbEp }} ép.
        </span>
      </div>

      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Title -->
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
        {{ anime.titre }}
      </h3>

      <!-- Metadata Row -->
      <div class="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span v-if="anime.annee" class="flex items-center">
          <Icon name="heroicons:calendar" class="w-3 h-3 mr-1" />
          {{ anime.annee }}
        </span>
        <span v-if="anime.studio" class="truncate flex items-center max-w-[120px]">
          <Icon name="heroicons:building-office" class="w-3 h-3 mr-1 flex-shrink-0" />
          {{ anime.studio }}
        </span>
      </div>

      <!-- Stats Row -->
      <div class="flex items-center justify-between text-xs">
        <!-- Reviews -->
        <div v-if="anime.nbReviews" class="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
          <Icon name="heroicons:document-text" class="w-3 h-3" />
          <span>{{ anime.nbReviews }} critique{{ anime.nbReviews > 1 ? 's' : '' }}</span>
        </div>
        
        <!-- Rating with Stars -->
        <div v-if="anime.moyenneNotes" class="flex items-center space-x-1">
          <div class="flex items-center">
            <Icon 
              v-for="star in 5" 
              :key="star"
              name="heroicons:star-solid"
              :class="[
                'w-3 h-3',
                star <= Math.round(anime.moyenneNotes / 2) 
                  ? 'text-yellow-400' 
                  : 'text-gray-300 dark:text-gray-600'
              ]"
            />
          </div>
          <span class="text-gray-600 dark:text-gray-400 ml-1">
            {{ formatRating(anime.moyenneNotes) }}
          </span>
        </div>
      </div>

      <!-- Synopsis Preview -->
      <div v-if="anime.synopsis && showSynopsis" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {{ anime.synopsis }}
        </p>
      </div>
    </div>

    <!-- Action Buttons (shown on hover) -->
    <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div class="flex items-center justify-between">
        <button
          @click.stop="toggleFavorite"
          :class="[
            'flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/20 text-white hover:bg-red-500'
          ]"
        >
          <Icon :name="isFavorite ? 'heroicons:heart-solid' : 'heroicons:heart'" class="w-3 h-3" />
          <span>{{ isFavorite ? 'Retiré' : 'Favoris' }}</span>
        </button>

        <button
          @click.stop="addToList"
          class="flex items-center space-x-1 px-2 py-1 bg-white/20 text-white hover:bg-blue-500 rounded-md text-xs font-medium transition-colors"
        >
          <Icon name="heroicons:plus" class="w-3 h-3" />
          <span>Liste</span>
        </button>

        <button
          @click.stop="viewDetails"
          class="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded-md text-xs font-medium transition-colors"
        >
          <Icon name="heroicons:eye" class="w-3 h-3" />
          <span>Voir</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Anime } from '~/types'

interface Props {
  anime: Anime
  showSynopsis?: boolean
}

interface Emits {
  view: [anime: Anime]
}

const props = withDefaults(defineProps<Props>(), {
  showSynopsis: false
})

const emit = defineEmits<Emits>()

const { getImageUrl } = useImageUrl()
const authStore = useAuthStore()

// State
const isFavorite = ref(false)

// Computed
const animeImage = computed(() => {
  return props.anime.image ? getImageUrl(props.anime.image, 'anime') : null
})

const formatBadgeClass = computed(() => {
  const format = props.anime.format || 'TV'
  const classes = {
    'Série TV': 'bg-blue-500/90 text-white',
    'TV': 'bg-blue-500/90 text-white',
    'Film': 'bg-purple-500/90 text-white',
    'ONA': 'bg-green-500/90 text-white',
    'OAV': 'bg-orange-500/90 text-white'
  }
  return classes[format] || classes['TV']
})

// Methods
const formatRating = (rating: number) => {
  return (rating / 1).toFixed(1)
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    navigateTo('/login?redirect=' + encodeURIComponent(useRoute().fullPath))
    return
  }

  try {
    isFavorite.value = !isFavorite.value
    // TODO: Implement API call for favorites
  } catch (error) {
    console.error('Error toggling favorite:', error)
    isFavorite.value = !isFavorite.value
  }
}

const addToList = () => {
  if (!authStore.isAuthenticated) {
    navigateTo('/login?redirect=' + encodeURIComponent(useRoute().fullPath))
    return
  }

  // TODO: Open add to list modal
  console.log('Add to list:', props.anime.titre)
}

const viewDetails = () => {
  emit('view', props.anime)
}

// Load favorite status if authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      // TODO: Load favorite status from API
    } catch (error) {
      // Ignore error for favorite status
    }
  }
})
</script>

<style scoped>
.season-anime-card {
  @apply relative;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.season-anime-card:hover .action-buttons {
  @apply opacity-100;
}

.action-buttons {
  @apply opacity-0 transition-opacity duration-300;
}

/* Animation for hover effects */
.season-anime-card img {
  transition: transform 0.3s ease;
}

.season-anime-card:hover img {
  transform: scale(1.05);
}
</style>