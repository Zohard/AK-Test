<template>
  <div class="anime-search">
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          type="text"
          v-model="localQuery"
          @input="onSearchInput"
          @keydown.enter="handleSearch"
          placeholder="Rechercher un anime..."
          class="search-input"
          :disabled="isLoading"
        />
        <button 
          @click="handleSearch"
          :disabled="isLoading || !localQuery.trim()"
          class="search-button"
        >
          <span v-if="!isLoading" class="search-icon">🔍</span>
          <span v-else class="loading-spinner-small"></span>
        </button>
      </div>
      
      <div class="search-filters" v-if="showFilters">
        <select v-model="selectedYear" class="filter-select">
          <option value="">Toutes les années</option>
          <option v-for="year in yearOptions" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        
        <select v-model="selectedGenre" class="filter-select">
          <option value="">Tous les genres</option>
          <option value="action">Action</option>
          <option value="adventure">Aventure</option>
          <option value="comedy">Comédie</option>
          <option value="drama">Drame</option>
          <option value="fantasy">Fantasy</option>
          <option value="romance">Romance</option>
          <option value="sci-fi">Science-Fiction</option>
          <option value="thriller">Thriller</option>
        </select>
      </div>
    </div>
    
    <div class="search-controls">
      <button 
        @click="toggleFilters" 
        class="filter-toggle"
        :class="{ active: showFilters }"
      >
        <span class="filter-icon">⚙️</span>
        Filtres
      </button>
      
      <button 
        v-if="localQuery || selectedYear || selectedGenre"
        @click="clearSearch"
        class="clear-button"
      >
        <span class="clear-icon">✕</span>
        Effacer
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'search'])

// Local state
const localQuery = ref(props.modelValue)
const selectedYear = ref('')
const selectedGenre = ref('')
const showFilters = ref(false)
const searchTimeout = ref(null)

// Year options for filter
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let year = currentYear; year >= 1960; year--) {
    years.push(year)
  }
  return years
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localQuery.value = newValue
})

// Methods
const onSearchInput = () => {
  emit('update:modelValue', localQuery.value)
  
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // Clear search results if field is empty
  if (localQuery.value.trim().length === 0) {
    emit('search', '', {})
  }
}

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  const query = localQuery.value.trim()
  
  // Allow empty search to show all results
  const searchParams = {
    year: selectedYear.value,
    genre: selectedGenre.value
  }
  
  emit('search', query, searchParams)
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const clearSearch = () => {
  localQuery.value = ''
  selectedYear.value = ''
  selectedGenre.value = ''
  emit('update:modelValue', '')
  emit('search', '', {})
}

// Cleanup timeout on unmount
onBeforeUnmount(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>

<style scoped>
.anime-search {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-container {
  margin-bottom: 1rem;
}

.search-input-wrapper {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg-color);
  color: var(--text-color);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-light);
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-button {
  padding: 0.875rem 1.25rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.search-button:hover:not(:disabled) {
  background: var(--accent-color-hover);
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-icon {
  font-size: 1.1rem;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.search-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.search-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-toggle:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.filter-toggle.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.filter-icon {
  font-size: 1rem;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--error-color);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clear-button:hover {
  background: var(--error-color-hover);
}

.clear-icon {
  font-size: 0.875rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .anime-search {
    padding: 1rem;
  }
  
  .search-input-wrapper {
    flex-direction: column;
  }
  
  .search-button {
    align-self: stretch;
  }
  
  .search-filters {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .search-controls {
    justify-content: center;
  }
}
</style>