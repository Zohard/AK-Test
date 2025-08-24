<template>
  <div class="group relative bg-surface rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:transform-none">
    <!-- Image -->
    <div class="relative">
      <div class="aspect-[20/21] overflow-hidden">
        <SmartImage
          v-if="anime.image"
          :src="getImageUrl(anime.image, 'anime')"
          :alt="anime.titre"
          aspect-ratio="20/21"
          container-class="w-full h-full"
          image-class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
          :placeholder-icon="'heroicons:film'"
        />
        <div 
          v-else 
          class="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center"
        >
          <Icon name="heroicons:film" size="xl" class="text-primary-500 dark:text-primary-400" />
        </div>
      </div>
      
      <!-- Rating overlay -->
      <div 
        v-if="anime.moyenneNotes" 
        class="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
      >
        <Icon name="heroicons:star" variant="solid" size="xs" class="text-yellow-400" />
        <span>{{ formatRating(anime.moyenneNotes) }}</span>
      </div>

      <!-- Genre badge -->
      <div 
        v-if="anime.genre" 
        class="absolute top-3 left-3 bg-primary-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
      >
        {{ anime.genre }}
      </div>
    </div>

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:transition-none flex items-center justify-center">
      <Button
        variant="secondary"
        size="lg"
        rounded
        @click="handleViewClick"
        class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white px-6"
      >
        <Icon name="heroicons:eye" size="sm" class="mr-2" />
        Voir les détails
      </Button>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-3">
      <h3 class="font-semibold text-lg text-text line-clamp-2 leading-tight">
        {{ anime.titre }}
      </h3>
      
      <div class="flex items-center gap-3 text-sm text-text-secondary">
        <span v-if="anime.annee" class="flex items-center gap-1">
          <Icon name="heroicons:calendar" size="xs" />
          {{ anime.annee }}
        </span>
        <span v-if="anime.nbEp" class="flex items-center gap-1">
          <Icon name="episode" size="xs" />
          {{ anime.nbEp }} ép.
        </span>
      </div>

      <p 
        v-if="anime.synopsis" 
        class="text-sm text-text-secondary line-clamp-3 leading-relaxed"
      >
        {{ anime.synopsis }}
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('view', anime)"
          icon-right="heroicons:arrow-right"
          class="text-primary-600 hover:text-primary-700"
        >
          En savoir plus
        </Button>
        
        <div class="flex items-center gap-1">
          <!-- Favorite button -->
          <button
            @click="toggleFavorite"
            class="p-2 rounded-full hover:bg-surface-hover transition-colors duration-200"
            :class="{ 'text-red-500': isFavorite, 'text-text-muted hover:text-text': !isFavorite }"
          >
            <Icon 
              :name="isFavorite ? 'heroicons:heart' : 'heroicons:heart'" 
              :variant="isFavorite ? 'solid' : 'outline'"
              size="sm"
            />
          </button>
          
          <!-- Share button -->
          <button
            @click="shareAnime"
            class="p-2 rounded-full hover:bg-surface-hover text-text-muted hover:text-text transition-colors duration-200"
          >
            <Icon name="heroicons:share" size="sm" />
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
