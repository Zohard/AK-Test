<template>
  <div class="relative w-full max-w-lg" ref="searchContainer">
    <div class="relative group">
      <Icon 
        name="heroicons:magnifying-glass" 
        size="sm"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors duration-200" 
      />
      <input
        v-model="query"
        ref="searchInput"
        type="text"
        :placeholder="placeholder"
        class="w-full pl-12 pr-12 py-3 bg-surface border border-border rounded-xl text-text placeholder-text-muted
               focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
               hover:border-primary-400 transition-all duration-200
               shadow-sm hover:shadow-md focus:shadow-lg"
        @input="onInput"
        @focus="handleFocus"
        @blur="hideSuggestions"
        @keydown.escape="clearSearch"
        @keydown.enter="performSearch"
        @keydown.arrow-down="navigateSuggestions(1)"
        @keydown.arrow-up="navigateSuggestions(-1)"
      />
      
      <!-- Action buttons -->
      <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        <!-- Loading spinner -->
        <Icon
          v-if="loading"
          name="heroicons:arrow-path"
          size="sm"
          spin
          class="text-primary-500"
        />
        
        <!-- Clear button -->
        <button
          v-else-if="query"
          @click="clearSearch"
          class="p-1 rounded-full hover:bg-surface-hover text-text-muted hover:text-text transition-all duration-200"
        >
          <Icon name="heroicons:x-mark" size="sm" />
        </button>
        
        <!-- Search shortcut -->
        <div 
          v-else
          class="hidden sm:flex items-center gap-1 px-2 py-1 bg-background border border-border rounded-md text-xs text-text-muted"
        >
          <Icon name="heroicons:command-line" size="xs" />
          <span>K</span>
        </div>
      </div>
    </div>

    <!-- Autocomplete suggestions -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <div 
        v-if="showSuggestions && (suggestions.length || recentSearches.length) && (query || showRecent)"
        class="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-card z-50 max-h-96 overflow-hidden backdrop-blur-sm"
      >
        <!-- Search results -->
        <div v-if="suggestions.length && query" class="p-3">
          <div class="text-xs font-medium text-text-muted mb-3 px-3">Résultats de recherche</div>
          <div
            v-for="(suggestion, index) in suggestions"
            :key="`${suggestion.type}-${suggestion.id}`"
            :class="[
              'flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200',
              'hover:bg-surface-hover hover:shadow-sm',
              selectedSuggestionIndex === index ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800' : ''
            ]"
            @click="selectSuggestion(suggestion)"
          >
            <!-- Thumbnail -->
            <div class="w-12 h-16 mr-4 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50">
              <img
                v-if="suggestion.image && !imageErrors[suggestion.id]"
                :src="getImageUrl(suggestion.image, suggestion.type)"
                :alt="suggestion.titre"
                class="w-full h-full object-cover"
                @error="handleImageError(suggestion.id)"
                @load="handleImageLoad(suggestion.id)"
              />
              <div 
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <Icon 
                  :name="suggestion.type === 'anime' ? 'heroicons:tv' : 'heroicons:book-open'" 
                  size="sm"
                  class="text-primary-500 dark:text-primary-400" 
                />
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-text truncate mb-1">
                {{ suggestion.titre }}
              </div>
              <div class="flex items-center gap-3 text-sm text-text-secondary">
                <Badge
                  :variant="suggestion.type === 'anime' ? 'primary' : 'secondary'"
                  size="xs"
                  class="capitalize"
                >
                  {{ suggestion.type }}
                </Badge>
                <span v-if="suggestion.annee" class="flex items-center gap-1">
                  <Icon name="heroicons:calendar" size="xs" />
                  {{ suggestion.annee }}
                </span>
                <span 
                  v-if="suggestion.moyenne_notes" 
                  class="flex items-center gap-1"
                >
                  <Icon name="heroicons:star" variant="solid" size="xs" class="text-yellow-500" />
                  {{ (suggestion.moyenne_notes / 10).toFixed(1) }}
                </span>
              </div>
            </div>
            
            <!-- Arrow -->
            <Icon 
              name="heroicons:arrow-right" 
              size="sm" 
              class="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3" 
            />
          </div>
        </div>

        <!-- Recent searches -->
        <div v-if="recentSearches.length && !query" class="p-3">
          <div class="text-xs font-medium text-text-muted mb-3 px-3 flex items-center justify-between">
            Recherches récentes
            <button 
              @click="clearRecentSearches"
              class="text-primary-600 hover:text-primary-700 text-xs"
            >
              Effacer tout
            </button>
          </div>
          <div
            v-for="(recent, index) in recentSearches.slice(0, 5)"
            :key="recent"
            class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-surface-hover transition-colors duration-200"
            @click="performRecentSearch(recent)"
          >
            <Icon name="heroicons:clock" size="sm" class="text-text-muted mr-3" />
            <span class="flex-1 text-text">{{ recent }}</span>
            <button
              @click.stop="removeRecentSearch(recent)"
              class="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text"
            >
              <Icon name="heroicons:x-mark" size="xs" />
            </button>
          </div>
        </div>

        <!-- Quick actions -->
        <div v-if="query" class="border-t border-border bg-background/50 backdrop-blur-sm p-3">
          <Button
            variant="ghost"
            size="sm"
            @click="performSearch"
            icon-left="heroicons:magnifying-glass"
            class="w-full justify-center text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            Voir tous les résultats pour "{{ query }}"
          </Button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
interface Props {
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  showRecent?: boolean
}

interface SearchResult {
  id: number
  titre: string
  image?: string
  type: 'anime' | 'manga'
  annee?: number
  moyenne_notes?: number
  niceUrl?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Rechercher des animes, mangas...',
  size: 'md',
  showRecent: true
})

// Refs
const searchContainer = ref<HTMLElement>()
const searchInput = ref<HTMLInputElement>()

// Reactive state
const query = ref('')
const suggestions = ref<SearchResult[]>([])
const showSuggestions = ref(false)
const loading = ref(false)
const selectedSuggestionIndex = ref(-1)
const showRecent = ref(false)
const imageErrors = ref<Record<number, boolean>>({})

// Local storage for recent searches
const recentSearches = ref<string[]>([])

// Load recent searches on mount
onMounted(() => {
  try {
    const stored = localStorage.getItem('anime-kun-recent-searches')
    if (stored) {
      recentSearches.value = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load recent searches:', error)
  }
  
  // Keyboard shortcut (Cmd/Ctrl + K)
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchInput.value?.focus()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})

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
    // Clear previous image errors for new suggestions
    imageErrors.value = {}
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

// Enhanced event handlers
const onInput = () => {
  selectedSuggestionIndex.value = -1
  debouncedSearch(query.value)
}

const handleFocus = () => {
  showSuggestions.value = true
  if (!query.value && props.showRecent) {
    showRecent.value = true
  }
}

const navigateSuggestions = (direction: number) => {
  if (!suggestions.value.length) return
  
  const maxIndex = suggestions.value.length - 1
  selectedSuggestionIndex.value += direction
  
  if (selectedSuggestionIndex.value > maxIndex) {
    selectedSuggestionIndex.value = 0
  } else if (selectedSuggestionIndex.value < 0) {
    selectedSuggestionIndex.value = maxIndex
  }
}

// Recent searches management
const saveToRecentSearches = (searchTerm: string) => {
  if (!searchTerm.trim()) return
  
  const newRecentSearches = [
    searchTerm,
    ...recentSearches.value.filter(s => s !== searchTerm)
  ].slice(0, 10) // Keep only last 10 searches
  
  recentSearches.value = newRecentSearches
  
  try {
    localStorage.setItem('anime-kun-recent-searches', JSON.stringify(newRecentSearches))
  } catch (error) {
    console.warn('Failed to save recent searches:', error)
  }
}

const clearRecentSearches = () => {
  recentSearches.value = []
  localStorage.removeItem('anime-kun-recent-searches')
}

const removeRecentSearch = (searchTerm: string) => {
  recentSearches.value = recentSearches.value.filter(s => s !== searchTerm)
  try {
    localStorage.setItem('anime-kun-recent-searches', JSON.stringify(recentSearches.value))
  } catch (error) {
    console.warn('Failed to update recent searches:', error)
  }
}

const performRecentSearch = (searchTerm: string) => {
  query.value = searchTerm
  showSuggestions.value = false
  performSearch()
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
    // Handle keyboard selection
    if (selectedSuggestionIndex.value >= 0 && suggestions.value.length) {
      selectSuggestion(suggestions.value[selectedSuggestionIndex.value])
      return
    }
    
    saveToRecentSearches(query.value.trim())
    showSuggestions.value = false
    showRecent.value = false
    navigateTo(`/search?q=${encodeURIComponent(query.value)}`)
  }
}

const hideSuggestions = () => {
  // Delay to allow click events on suggestions
  setTimeout(() => {
    showSuggestions.value = false
    showRecent.value = false
    selectedSuggestionIndex.value = -1
  }, 200)
}

// Use the same image URL logic as other components
const { getImageUrl } = useImageUrl()

const handleImageError = (suggestionId: number) => {
  imageErrors.value[suggestionId] = true
}

const handleImageLoad = (suggestionId: number) => {
  imageErrors.value[suggestionId] = false
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