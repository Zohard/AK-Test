<template>
  <div class="relative w-full max-w-lg">
    <div class="relative">
      <Icon 
        name="heroicons:magnifying-glass" 
        class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
      />
      <input
        v-model="query"
        type="text"
        placeholder="Rechercher des animes, mangas..."
        class="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        @input="onInput"
        @focus="showSuggestions = true"
        @blur="hideSuggestions"
        @keydown.escape="clearSearch"
        @keydown.enter="performSearch"
      />
      <button
        v-if="query"
        @click="clearSearch"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <Icon name="heroicons:x-mark" class="w-4 h-4" />
      </button>
    </div>

    <!-- Autocomplete suggestions -->
    <div 
      v-if="showSuggestions && suggestions.length && query"
      class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      <div class="p-2">
        <div
          v-for="suggestion in suggestions"
          :key="`${suggestion.type}-${suggestion.id}`"
          class="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          @click="selectSuggestion(suggestion)"
        >
          <div class="w-10 h-12 mr-3 flex-shrink-0">
            <img
              v-if="suggestion.image"
              :src="getImageUrl(suggestion.image, suggestion.type)"
              :alt="suggestion.titre"
              class="w-full h-full object-cover rounded"
              @error="onImageError"
            />
            <div 
              v-else 
              class="w-full h-full bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center"
            >
              <Icon name="heroicons:photo" class="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white truncate">
              {{ suggestion.titre }}
            </div>
            <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span class="capitalize">{{ suggestion.type }}</span>
              <span v-if="suggestion.annee">• {{ suggestion.annee }}</span>
              <span 
                v-if="suggestion.moyenne_notes" 
                class="flex items-center"
              >
                • 
                <Icon name="heroicons:star-solid" class="w-3 h-3 text-yellow-400 ml-1 mr-0.5" />
                {{ (suggestion.moyenne_notes / 10).toFixed(1) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-2">
        <button
          @click="performSearch"
          class="w-full flex items-center justify-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <Icon name="heroicons:magnifying-glass" class="w-4 h-4 mr-2" />
          Voir tous les résultats pour "{{ query }}"
        </button>
      </div>
    </div>

    <!-- Loading indicator -->
    <div 
      v-if="loading"
      class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-300">Recherche...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SearchResult {
  id: number
  titre: string
  image?: string
  type: 'anime' | 'manga'
  annee?: number
  moyenne_notes?: number
}

const query = ref('')
const suggestions = ref<SearchResult[]>([])
const showSuggestions = ref(false)
const loading = ref(false)

const config = useRuntimeConfig()

// Debounced search for autocomplete
const debouncedSearch = useDebounceFn(async (searchQuery: string) => {
  if (searchQuery.length < 2) {
    suggestions.value = []
    return
  }

  loading.value = true
  try {
    const config = useRuntimeConfig()
    
    // Search both anime and manga simultaneously  
    const [animeResults, mangaResults] = await Promise.all([
      $fetch(`${config.public.apiBase}/api/animes/autocomplete`, {
        params: { q: searchQuery, limit: 3 }
      }),
      $fetch(`${config.public.apiBase}/api/mangas/autocomplete`, {
        params: { q: searchQuery, limit: 3 }
      })
    ])
    
    // Process anime results
    const animeData = (animeResults as any).data || []
    const animeItems = Array.isArray(animeData) ? animeData.map((item: any) => ({
      id: item.id || item.id_anime,
      titre: item.titre,
      type: 'anime' as const,
      annee: item.annee,
      moyenne_notes: item.moyenne_notes || item.moyennenotes,
      image: item.image
    })) : []
    
    // Process manga results
    const mangaData = (mangaResults as any).data || []
    const mangaItems = Array.isArray(mangaData) ? mangaData.map((item: any) => ({
      id: item.id || item.id_manga,
      titre: item.titre,
      type: 'manga' as const,
      annee: item.annee,
      moyenne_notes: item.moyenne_notes || item.moyennenotes,
      image: item.image
    })) : []
    
    // Combine and limit results
    suggestions.value = [...animeItems, ...mangaItems].slice(0, 5)
  } catch (error: any) {
    console.error('Search error:', error)
    suggestions.value = []
    
    // If search endpoint doesn't exist yet, gracefully handle
    if (error.status === 404) {
      console.warn('Search endpoint not implemented yet')
    }
  } finally {
    loading.value = false
  }
}, 300)

const onInput = () => {
  debouncedSearch(query.value)
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

const selectSuggestion = (suggestion: SearchResult) => {
  query.value = suggestion.titre
  showSuggestions.value = false
  
  // Navigate to detail page
  if (suggestion.type === 'anime') {
    const niceUrl = suggestion.niceUrl || createSlug(suggestion.titre || suggestion.title)
    navigateTo(`/anime/${niceUrl}-${suggestion.id}`)
  } else if (suggestion.type === 'manga') {
    const niceUrl = suggestion.niceUrl || createSlug(suggestion.titre || suggestion.title)
    navigateTo(`/manga/${niceUrl}-${suggestion.id}`)
  }
}

const clearSearch = () => {
  query.value = ''
  suggestions.value = []
  showSuggestions.value = false
}

const performSearch = () => {
  if (query.value.trim()) {
    showSuggestions.value = false
    navigateTo(`/search?q=${encodeURIComponent(query.value)}`)
  }
}

const hideSuggestions = () => {
  // Delay to allow click events on suggestions
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const getImageUrl = (imagePath: string, type: 'anime' | 'manga') => {
  return `${config.public.apiBase}/media/${type}/${imagePath}`
}

const onImageError = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

// Clear suggestions when clicking outside
onMounted(() => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.relative')) {
      showSuggestions.value = false
    }
  })
})
</script>