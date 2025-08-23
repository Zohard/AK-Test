<template>
  <div class="review-filters bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <!-- Main filters row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <!-- Search -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Icon name="heroicons:magnifying-glass" class="w-4 h-4 inline mr-1" />
          Recherche
        </label>
        <input
          v-model="localFilters.search"
          type="text"
          :placeholder="searchPlaceholder"
          class="form-input"
          @input="debouncedUpdate"
        />
      </div>

      <!-- Type Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Icon name="heroicons:funnel" class="w-4 h-4 inline mr-1" />
          Type
        </label>
        <select v-model="localFilters.type" class="form-input" @change="updateFilters">
          <option value="">Tous</option>
          <option value="anime">Animes</option>
          <option value="manga">Mangas</option>
        </select>
      </div>

      <!-- Rating Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Icon name="heroicons:star" class="w-4 h-4 inline mr-1" />
          Note minimum
        </label>
        <select v-model="localFilters.minNotation" class="form-input" @change="updateFilters">
          <option value="">Toutes</option>
          <option value="9">Excellent (9-10)</option>
          <option value="8">Très bien (8-9)</option>
          <option value="7">Bien (7-8)</option>
          <option value="6">Correct (6-7)</option>
          <option value="5">Moyen (5-6)</option>
        </select>
      </div>

      <!-- Sort -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Icon name="heroicons:bars-arrow-down" class="w-4 h-4 inline mr-1" />
          Trier par
        </label>
        <select v-model="localFilters.sortBy" class="form-input" @change="updateFilters">
          <option value="dateCritique">Plus récentes</option>
          <option value="notation">Note</option>
          <option value="nbClics">Popularité</option>
          <option value="titre">Titre</option>
        </select>
      </div>
    </div>

    <!-- Advanced filters (collapsible) -->
    <div v-if="showAdvanced" class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <!-- Author filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Icon name="heroicons:user" class="w-4 h-4 inline mr-1" />
            Auteur
          </label>
          <input
            v-model="localFilters.author"
            type="text"
            placeholder="Nom d'utilisateur..."
            class="form-input"
            @input="debouncedUpdate"
          />
        </div>

        <!-- Date range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Icon name="heroicons:calendar" class="w-4 h-4 inline mr-1" />
            Période
          </label>
          <select v-model="localFilters.dateRange" class="form-input" @change="updateFilters">
            <option value="">Toutes</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        <!-- Views filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Icon name="heroicons:eye" class="w-4 h-4 inline mr-1" />
            Popularité min.
          </label>
          <select v-model="localFilters.minViews" class="form-input" @change="updateFilters">
            <option value="">Toutes</option>
            <option value="100">100+ vues</option>
            <option value="500">500+ vues</option>
            <option value="1000">1000+ vues</option>
            <option value="5000">5000+ vues</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Controls row -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center space-x-4">
        <!-- Sort order -->
        <div class="flex items-center space-x-2">
          <input
            id="sortOrder"
            v-model="localFilters.sortOrder"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            @change="updateFilters"
          />
          <label for="sortOrder" class="text-sm text-gray-700 dark:text-gray-300">
            Ordre décroissant
          </label>
        </div>

        <!-- Advanced filters toggle -->
        <button
          @click="showAdvanced = !showAdvanced"
          class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1"
        >
          <Icon 
            :name="showAdvanced ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" 
            class="w-4 h-4" 
          />
          <span>Filtres avancés</span>
        </button>
      </div>

      <div class="flex items-center space-x-4">
        <!-- Results count -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          <Icon name="heroicons:document-text" class="w-4 h-4 inline mr-1" />
          {{ resultsCount }} résultat{{ resultsCount !== 1 ? 's' : '' }}
        </div>

        <!-- Clear filters -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center space-x-1"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
          <span>Effacer</span>
        </button>

        <!-- Save filters preset (future feature) -->
        <button
          v-if="hasActiveFilters && showSavePreset"
          @click="saveFiltersPreset"
          class="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center space-x-1"
        >
          <Icon name="heroicons:bookmark" class="w-4 h-4" />
          <span>Sauvegarder</span>
        </button>
      </div>
    </div>

    <!-- Active filters pills -->
    <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap gap-2">
      <div
        v-if="localFilters.search"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      >
        <Icon name="heroicons:magnifying-glass" class="w-3 h-3 mr-1" />
        "{{ localFilters.search }}"
        <button @click="localFilters.search = ''; updateFilters()" class="ml-1 hover:text-blue-600">
          <Icon name="heroicons:x-mark" class="w-3 h-3" />
        </button>
      </div>

      <div
        v-if="localFilters.type"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      >
        <Icon :name="localFilters.type === 'anime' ? 'heroicons:film' : 'heroicons:book-open'" class="w-3 h-3 mr-1" />
        {{ localFilters.type === 'anime' ? 'Animes' : 'Mangas' }}
        <button @click="localFilters.type = ''; updateFilters()" class="ml-1 hover:text-purple-600">
          <Icon name="heroicons:x-mark" class="w-3 h-3" />
        </button>
      </div>

      <div
        v-if="localFilters.minNotation"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      >
        <Icon name="heroicons:star" class="w-3 h-3 mr-1" />
        {{ localFilters.minNotation }}+ ⭐
        <button @click="localFilters.minNotation = ''; updateFilters()" class="ml-1 hover:text-yellow-600">
          <Icon name="heroicons:x-mark" class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ReviewFiltersData {
  search: string
  type: string // 'anime' | 'manga' | ''
  minNotation: string
  sortBy: string
  sortOrder: boolean
  author?: string
  dateRange?: string
  minViews?: string
}

interface Props {
  filters: ReviewFiltersData
  resultsCount?: number
  searchPlaceholder?: string
  showSavePreset?: boolean
}

interface Emits {
  'update:filters': [filters: ReviewFiltersData]
  'clear': []
  'save-preset': [filters: ReviewFiltersData]
}

const props = withDefaults(defineProps<Props>(), {
  resultsCount: 0,
  searchPlaceholder: 'Titre, contenu, anime...',
  showSavePreset: false
})

const emit = defineEmits<Emits>()

// Local state
const showAdvanced = ref(false)
const localFilters = reactive<ReviewFiltersData>({ ...props.filters })

// Computed
const hasActiveFilters = computed(() => {
  return localFilters.search || 
         localFilters.type || 
         localFilters.minNotation || 
         localFilters.sortBy !== 'dateCritique' ||
         localFilters.author ||
         localFilters.dateRange ||
         localFilters.minViews
})

// Methods
const updateFilters = () => {
  emit('update:filters', { ...localFilters })
}

const debouncedUpdate = useDebounceFn(() => {
  updateFilters()
}, 500)

const clearFilters = () => {
  Object.assign(localFilters, {
    search: '',
    type: '',
    minNotation: '',
    sortBy: 'dateCritique',
    sortOrder: false,
    author: '',
    dateRange: '',
    minViews: ''
  })
  emit('clear')
  updateFilters()
}

const saveFiltersPreset = () => {
  emit('save-preset', { ...localFilters })
}

// Watch for prop changes
watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { deep: true })
</script>

<style scoped>
.review-filters {
  @apply transition-all duration-200 ease-in-out;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white;
}

/* Smooth transitions for collapsible sections */
.review-filters .collapse-enter-active,
.review-filters .collapse-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 500px;
  overflow: hidden;
}

.review-filters .collapse-enter-from,
.review-filters .collapse-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>