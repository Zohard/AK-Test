<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 group">
    <!-- Image -->
    <div class="relative aspect-w-3 aspect-h-4">
      <img
        v-if="manga.image"
        :src="getImageUrl(manga.image, 'manga')"
        :alt="manga.titre"
        class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
        @error="onImageError"
        loading="lazy"
      />
      <div 
        v-else 
        class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
      >
        <Icon name="heroicons:book-open" class="w-12 h-12 text-gray-400" />
      </div>
      
      

      <!-- Hover overlay -->
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <button
          @click="handleViewClick"
          class="bg-white text-gray-900 px-6 py-2.5 rounded-full font-medium hover:bg-gray-100 transition-colors transform translate-y-2 group-hover:translate-y-0"
        >
          Voir les détails
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {{ manga.titre }}
      </h3>
      
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span v-if="manga.annee">{{ manga.annee }}</span>
        <span v-if="manga.auteur" class="flex items-center space-x-1">
          <Icon name="heroicons:user" class="w-3 h-3" />
          <span class="truncate max-w-24">{{ manga.auteur }}</span>
        </span>
      </div>

      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span v-if="manga.nbVolumes" class="flex items-center space-x-1">
          <Icon name="heroicons:book-open" class="w-3 h-3" />
          <span>{{ manga.nbVolumes }} vol.</span>
        </span>
        <span v-if="manga.editeur" class="truncate max-w-24">{{ manga.editeur }}</span>
      </div>

      <p 
        v-if="manga.synopsis" 
        class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4"
      >
        {{ manga.synopsis }}
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <button
          @click="handleViewClick"
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
        >
          En savoir plus
        </button>
        
        <div class="flex items-center space-x-2">
          <!-- Favorite button -->
          <button
            @click="toggleFavorite"
            class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'text-red-500': isFavorite, 'text-gray-400': !isFavorite }"
          >
            <Icon 
              :name="isFavorite ? 'heroicons:heart-solid' : 'heroicons:heart'" 
              class="w-5 h-5" 
            />
          </button>
          
          <!-- Share button -->
          <button
            @click="shareManga"
            class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon name="heroicons:share" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Manga {
  id: number
  titre: string
  image?: string
  annee?: string
  moyenneNotes?: number
  auteur?: string
  synopsis?: string
  nbVolumes?: string
  editeur?: string
  statut: number
}

interface Props {
  manga: Manga
}

interface Emits {
  view: [manga: Manga]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = useRuntimeConfig()
const authStore = useAuthStore()
const { getImageUrl } = useImageUrl()
const router = useRouter()

// State
const isFavorite = ref(false)

// Methods
const buildMangaUrl = (manga: any) => {
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

const handleViewClick = async () => {
  console.log('View button clicked for manga:', props.manga)
  const targetUrl = buildMangaUrl(props.manga)
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
  
  // Also emit the event for backward compatibility
  emit('view', props.manga)
}

const formatRating = (rating: number) => {
  return (rating / 10).toFixed(1)
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  
  // Show placeholder
  const placeholder = img.parentElement?.querySelector('.placeholder')
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
    // await $fetch(`/api/mangas/${props.manga.id}/favorite`, {
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

const shareManga = async () => {
  const url = `${window.location.origin}/mangas/${props.manga.id}`
  const title = `Découvrez ${props.manga.titre} sur Anime-Kun`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: props.manga.synopsis || `Découvrez ce manga sur Anime-Kun`,
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
      // const response = await $fetch(`/api/mangas/${props.manga.id}/favorite`, {
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

.aspect-w-3 {
  position: relative;
  padding-bottom: calc(4 / 3 * 100%);
}

.aspect-h-4 > * {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
