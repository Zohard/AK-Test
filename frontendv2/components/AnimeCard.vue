<template>
  <div class="anime-card">
    <!-- Image -->
    <div class="relative">
      <img
        v-if="anime.image"
        :src="getImageUrl(anime.image, 'anime') || undefined"
        :alt="anime.titre"
        class="anime-card-image"
        @error="onImageError"
        loading="lazy"
      />
      <div 
        v-else 
        class="anime-card-placeholder"
      >
        <Icon name="heroicons:film" class="w-12 h-12" />
      </div>
      
      <!-- Rating overlay -->
      <div 
        v-if="anime.moyenneNotes" 
        class="anime-card-rating"
      >
        <Icon name="heroicons:star-solid" class="w-3 h-3 text-yellow-400" />
        <span>{{ formatRating(anime.moyenneNotes) }}</span>
      </div>

      <!-- Genre badge -->
      <div 
        v-if="anime.genre" 
        class="anime-card-genre"
      >
        {{ anime.genre }}
      </div>
    </div>

    <!-- Hover overlay -->
    <div class="anime-card-overlay">
      <button
        @click="handleViewClick"
        class="anime-card-view-btn"
      >
        Voir les détails
      </button>
    </div>

    <!-- Content -->
    <div class="anime-card-content">
      <h3 class="anime-card-title">
        {{ anime.titre }}
      </h3>
      
      <div class="anime-card-meta">
        <span v-if="anime.annee">{{ anime.annee }}</span>
        <span v-if="anime.nbEp" class="flex items-center space-x-1">
          <Icon name="heroicons:play" class="w-3 h-3" />
          <span>{{ anime.nbEp }} ép.</span>
        </span>
      </div>

      <p 
        v-if="anime.synopsis" 
        class="anime-card-synopsis"
      >
        {{ anime.synopsis }}
      </p>

      <!-- Actions -->
      <div class="anime-card-actions">
        <button
          @click="$emit('view', anime)"
          class="anime-card-more-btn"
        >
          En savoir plus
        </button>
        
        <div class="anime-card-action-buttons">
          <!-- Favorite button -->
          <button
            @click="toggleFavorite"
            class="anime-card-action-btn"
            :class="{ 'favorite': isFavorite }"
          >
            <Icon 
              :name="isFavorite ? 'heroicons:heart-solid' : 'heroicons:heart'" 
              class="w-5 h-5" 
            />
          </button>
          
          <!-- Share button -->
          <button
            @click="shareAnime"
            class="anime-card-action-btn"
          >
            <Icon name="heroicons:share" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Anime } from '~/types'

interface Props {
  anime: Anime
}

interface Emits {
  view: [anime: Anime]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const { getImageUrl } = useImageUrl()
const router = useRouter()

// State
const isFavorite = ref(false)

// Methods
const formatRating = (rating: number) => {
  return (rating / 10).toFixed(1)
}

const buildAnimeUrl = (anime: any) => {
  // Create SEO-friendly URL: /anime/nice-url-id
  const niceUrl = anime.niceUrl || createSlug(anime.titre)
  return `/anime/${niceUrl}-${anime.id}`
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

const handleViewClick = async () => {
  console.log('View button clicked for anime:', props.anime)
  const targetUrl = buildAnimeUrl(props.anime)
  console.log('Navigating to:', targetUrl)
  
  try {
    await navigateTo(targetUrl)
    console.log('Navigation completed')
  } catch (error) {
    console.error('Navigation error:', error)
    // Fallback to router.push
    try {
      await router.push(targetUrl)
      console.log('Router.push completed')
    } catch (routerError) {
      console.error('Router.push error:', routerError)
      // Last resort: window.location
      window.location.href = targetUrl
    }
  }
  
  // Also emit the event
  emit('view', props.anime)
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  
  // Show placeholder
  const placeholder = img.parentElement?.querySelector('.anime-card-placeholder')
  if (placeholder) {
    (placeholder as HTMLElement).style.display = 'flex'
  }
}

const toggleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    // Redirect to login
    navigateTo('/login?redirect=' + encodeURIComponent(useRoute().fullPath))
    return
  }

  try {
    // This will be implemented when we have the API ready
    // await $fetch(`/api/animes/${props.anime.id}/favorite`, {
    //   method: isFavorite.value ? 'DELETE' : 'POST',
    //   headers: authStore.getAuthHeaders()
    // })
    
    isFavorite.value = !isFavorite.value
    
    // Show toast notification
    // showToast(isFavorite.value ? 'Ajouté aux favoris' : 'Retiré des favoris')
  } catch (error) {
    console.error('Error toggling favorite:', error)
  }
}

const shareAnime = async () => {
  const url = `${window.location.origin}${buildAnimeUrl(props.anime)}`
  const title = `Découvrez ${props.anime.titre} sur Anime-Kun`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: props.anime.synopsis || `Découvrez cet anime sur Anime-Kun`,
        url: url
      })
    } catch (error) {
      // User cancelled sharing or error occurred
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      // showToast('Lien copié dans le presse-papiers')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }
}

// Load favorite status if user is authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      // This will be implemented when we have the API ready
      // const response = await $fetch(`/api/animes/${props.anime.id}/favorite`, {
      //   headers: authStore.getAuthHeaders()
      // })
      // isFavorite.value = response.isFavorite
    } catch (error) {
      // Ignore error for favorite status
    }
  }
})
</script>