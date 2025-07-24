<template>
  <div class="main-content">
    <div class="page-header">
      <h1 class="section-title">Animes</h1>
      <p class="page-subtitle">Découvrez notre collection d'animes avec critiques et notes</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <AnimeSearch 
        v-model="searchQuery"
        @search="handleSearch"
        :is-loading="searching"
      />
    </div>

    <!-- Popular Animes Section -->
    <section class="anime-section" v-if="!searchQuery">
      <h2 class="section-subtitle">Animes Populaires</h2>
      <div v-if="loadingPopular" class="loading">
        <div class="loading-spinner"></div>
        <span>Chargement des animes populaires...</span>
      </div>
      <div v-else-if="popularAnimes.length" class="anime-grid">
        <AnimeCard 
          v-for="anime in popularAnimes" 
          :key="anime.id_anime"
          :anime="anime"
        />
      </div>
      <div v-else class="empty-state">
        <p>Aucun anime populaire trouvé</p>
      </div>
    </section>

    <!-- Latest Reviews Section -->
    <section class="anime-section" v-if="!searchQuery">
      <h2 class="section-subtitle">Critiques Récentes (Auteurs Variés)</h2>
      <div v-if="loadingReviews" class="loading">
        <div class="loading-spinner"></div>
        <span>Chargement des dernières critiques...</span>
      </div>
      <div v-else-if="latestReviews.length" class="reviews-grid">
        <div 
          v-for="review in latestReviews" 
          :key="`${review.anime_titre}-${review.username}`"
          class="review-card"
        >
          <div class="review-anime-info">
            <img 
              v-if="getImageUrl(review.anime_image)"
              :src="getImageUrl(review.anime_image)"
              :alt="review.anime_titre"
              class="review-anime-image"
              @error="hideImage"
            />
            <div class="review-details">
              <h3 class="review-anime-title">{{ review.anime_titre }}</h3>
              <div class="review-meta">
                <span class="review-author">par {{ review.username }}</span>
                <div class="review-rating">
                  <span class="rating-star">★</span>
                  <span>{{ review.notation }}/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>Aucune critique trouvée</p>
      </div>
    </section>

    <!-- Search Results -->
    <section class="anime-section" v-if="searchQuery">
      <h2 class="section-subtitle">
        Résultats de recherche pour "{{ searchQuery }}"
        <span v-if="searchResults.length" class="results-count">
          ({{ searchResults.length }} résultat{{ searchResults.length > 1 ? 's' : '' }})
        </span>
      </h2>
      
      <div v-if="searching" class="loading">
        <div class="loading-spinner"></div>
        <span>Recherche en cours...</span>
      </div>
      <div v-else-if="searchResults.length" class="anime-grid">
        <AnimeCard 
          v-for="anime in searchResults" 
          :key="anime.id_anime"
          :anime="anime"
        />
      </div>
      <div v-else class="empty-state">
        <p>Aucun anime trouvé pour "{{ searchQuery }}"</p>
        <button @click="clearSearch" class="clear-search-btn">
          Effacer la recherche
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
// Page metadata
useHead({
  title: 'Animes - Anime-Kun',
  meta: [
    { name: 'description', content: 'Découvrez notre collection d\'animes avec critiques et notes de la communauté' }
  ]
})

// API configuration
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'http://localhost:3002'

// Reactive data
const searchQuery = ref('')
const searching = ref(false)
const loadingPopular = ref(true)
const loadingReviews = ref(true)

const popularAnimes = ref([])
const latestReviews = ref([])
const searchResults = ref([])

// Methods
const handleSearch = async (query) => {
  if (!query.trim()) {
    searchResults.value = []
    return
  }
  
  searching.value = true
  try {
    const response = await $fetch(`${API_BASE}/api/search`, {
      params: {
        query: query,
        type: 'anime',
        limit: 20
      }
    })
    searchResults.value = response.data || []
  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

const fetchPopularAnimes = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/animes`, {
      params: {
        recent: 'true',
        limit: 12
      }
    })
    popularAnimes.value = response.data || []
  } catch (error) {
    console.error('Erreur lors du chargement des animes populaires:', error)
    popularAnimes.value = []
  } finally {
    loadingPopular.value = false
  }
}

const fetchLatestReviews = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/critiques`, {
      params: {
        limit: 100 // Fetch enough to ensure user diversity
      }
    })
    
    // Filter to get unique usernames - one critique per user
    const allCritiques = response.data || []
    const uniqueUserCritiques = []
    const seenUsernames = new Set()
    
    for (const critique of allCritiques) {
      if (!seenUsernames.has(critique.username)) {
        uniqueUserCritiques.push(critique)
        seenUsernames.add(critique.username)
        
        // Stop when we have 8 unique users
        if (uniqueUserCritiques.length >= 8) {
          break
        }
      }
    }
    
    latestReviews.value = uniqueUserCritiques
  } catch (error) {
    console.error('Erreur lors du chargement des critiques:', error)
    latestReviews.value = []
  } finally {
    loadingReviews.value = false
  }
}

const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  // Use the same image path as homepage
  return `/images/${imagePath}`
}

const hideImage = (event) => {
  event.target.style.display = 'none'
}


// Initialize data on mount
onMounted(() => {
  fetchPopularAnimes()
  fetchLatestReviews()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  margin: 0.5rem 0 0 0;
}

.search-section {
  margin-bottom: 3rem;
}

.anime-section {
  margin-bottom: 3rem;
}

.section-subtitle {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.results-count {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-secondary);
}

.anime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.review-card {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.review-anime-info {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.review-anime-image {
  width: 60px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.review-details {
  flex: 1;
  min-width: 0;
}

.review-anime-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.review-author {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.rating-star {
  color: #fbbf24;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-state p {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
}

.clear-search-btn {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clear-search-btn:hover {
  background: var(--accent-color-hover);
}

@media (max-width: 768px) {
  .anime-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .reviews-grid {
    grid-template-columns: 1fr;
  }
  
  .review-anime-info {
    gap: 0.75rem;
  }
  
  .review-anime-image {
    width: 50px;
    height: 70px;
  }
  
  .review-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>