<template>
  <div class="anime-details">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>Chargement des détails de l'anime...</span>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>Erreur</h2>
      <p>{{ error }}</p>
      <nuxt-link to="/animes" class="back-link">← Retour aux animes</nuxt-link>
    </div>

    <div v-else-if="anime" class="anime-content">
      <!-- Header Section -->
      <div class="anime-header">
        <div class="anime-image-section">
          <img 
            v-if="getImageUrl(anime.image)"
            :src="getImageUrl(anime.image)" 
            :alt="anime.titre"
            class="anime-poster"
            @error="hideImage"
          />
          <div v-else class="anime-poster-placeholder">
            <span class="placeholder-text">{{ anime.titre }}</span>
          </div>
        </div>

        <div class="anime-info-section">
          <h1 class="anime-title">{{ anime.titre }}</h1>
          <h2 v-if="anime.titre_orig && anime.titre_orig !== anime.titre" class="anime-original-title">
            {{ anime.titre_orig }}
          </h2>

          <!-- Important Info Block -->
          <div class="important-info-block">
            <h3 class="info-block-title">Informations importantes</h3>
            <div class="info-grid">
              <div v-if="anime.annee" class="info-item">
                <span class="info-label">Année :</span>
                <span class="info-value">{{ anime.annee }}</span>
              </div>
              <div v-if="anime.nb_ep" class="info-item">
                <span class="info-label">Épisodes :</span>
                <span class="info-value">{{ anime.nb_ep }} épisode{{ anime.nb_ep > 1 ? 's' : '' }}</span>
              </div>
              <div v-if="anime.studio" class="info-item">
                <span class="info-label">Studio :</span>
                <span class="info-value">{{ anime.studio }}</span>
              </div>
              <div v-if="anime.moyenne_notes && anime.moyenne_notes > 0" class="info-item">
                <span class="info-label">Note moyenne :</span>
                <span class="info-value rating">
                  <span class="rating-star">★</span>
                  {{ formatRating(anime.moyenne_notes) }}/10
                </span>
              </div>
              <div v-if="anime.nb_reviews && anime.nb_reviews > 0" class="info-item">
                <span class="info-label">Critiques :</span>
                <span class="info-value">{{ anime.nb_reviews }} critique{{ anime.nb_reviews > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Synopsis -->
          <div v-if="anime.synopsis" class="synopsis-section">
            <h3 class="section-title">Synopsis</h3>
            <p class="synopsis-text">{{ anime.synopsis }}</p>
          </div>
        </div>
      </div>

      <!-- Business Links Section -->
      <div v-if="businessLinks && businessLinks.length > 0" class="business-section">
        <h3 class="section-title">Équipe et Production</h3>
        <div class="business-grid">
          <div 
            v-for="business in groupedBusinessLinks" 
            :key="business.type"
            class="business-group"
          >
            <h4 class="business-type">{{ business.type }}</h4>
            <div class="business-list">
              <div 
                v-for="item in business.items" 
                :key="item.id_business"
                class="business-item"
              >
                <span class="business-name">{{ item.denomination }}</span>
                <span v-if="item.precisions" class="business-precisions">{{ item.precisions }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tags Section -->
      <div v-if="tags && tags.length > 0" class="tags-section">
        <h3 class="section-title">Genres et Thèmes</h3>
        <div class="tags-grid">
          <div 
            v-for="category in groupedTags" 
            :key="category.name"
            class="tags-category"
          >
            <h4 class="tags-category-title">{{ category.name }}</h4>
            <div class="tags-list">
              <span 
                v-for="tag in category.tags" 
                :key="tag.id_tag"
                class="tag-item"
                :title="tag.description"
              >
                {{ tag.tag_name }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div v-if="anime.recent_reviews && anime.recent_reviews.length > 0" class="reviews-section">
        <h3 class="section-title">Critiques récentes</h3>
        <div class="reviews-list">
          <div 
            v-for="review in anime.recent_reviews" 
            :key="review.id_critique"
            class="review-item"
          >
            <div class="review-header">
              <h4 class="review-title">{{ getReviewTitle(review) }}</h4>
              <div class="review-meta">
                <span class="review-author">par {{ review.author_name || 'Anonyme' }}</span>
                <div class="review-rating">
                  <span class="rating-star">★</span>
                  <span>{{ review.notation }}/10</span>
                </div>
              </div>
            </div>
            <div v-if="review.critique" class="review-content">
              <div class="critique-text" v-html="formatCritiqueText(review.critique)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Link -->
      <div class="navigation-section">
        <nuxt-link to="/animes" class="back-link">← Retour aux animes</nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Get route parameter
const route = useRoute()
const animeId = route.params.id

// Page metadata
useHead({
  title: `Anime ${animeId} - Anime-Kun`,
  meta: [
    { name: 'description', content: `Détails de l'anime ${animeId}` }
  ]
})

// API configuration
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'http://localhost:3001'

// Reactive data
const anime = ref(null)
const businessLinks = ref([])
const tags = ref([])
const loading = ref(true)
const error = ref(null)

// Computed properties
const groupedBusinessLinks = computed(() => {
  if (!businessLinks.value || businessLinks.value.length === 0) return []
  
  const grouped = {}
  businessLinks.value.forEach(business => {
    const type = business.type || 'Autre'
    if (!grouped[type]) {
      grouped[type] = []
    }
    grouped[type].push(business)
  })
  
  return Object.keys(grouped).map(type => ({
    type,
    items: grouped[type]
  })).sort((a, b) => a.type.localeCompare(b.type))
})

const groupedTags = computed(() => {
  if (!tags.value || tags.value.length === 0) return []
  
  const grouped = {}
  tags.value.forEach(tag => {
    const category = tag.categorie || 'Autre'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(tag)
  })
  
  return Object.keys(grouped).map(name => ({
    name,
    tags: grouped[name]
  })).sort((a, b) => a.name.localeCompare(b.name))
})

// Methods
const fetchAnimeDetails = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch(`${API_BASE}/api/animes/${animeId}`)
    anime.value = response
    
    // Fetch business links and tags
    await fetchBusinessLinks()
    await fetchTags()
    
  } catch (err) {
    console.error('Error fetching anime details:', err)
    error.value = err.response?.status === 404 ? 'Anime introuvable' : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const fetchBusinessLinks = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/animes/${animeId}/business`)
    businessLinks.value = response.data || []
  } catch (err) {
    console.error('Error fetching business links:', err)
    // Don't set error here, business links are optional
  }
}

const fetchTags = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/animes/${animeId}/tags`)
    tags.value = response.data || []
  } catch (err) {
    console.error('Error fetching tags:', err)
    // Don't set error here, tags are optional
  }
}

const formatRating = (rating) => {
  return parseFloat(rating).toFixed(1)
}

const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  return `/images/${imagePath}`
}

const hideImage = (event) => {
  event.target.style.display = 'none'
}

const getReviewTitle = (review) => {
  if (review.titre && review.titre.trim() !== '') {
    return review.titre
  }
  return `Critique par ${review.author_name || 'Anonyme'}`
}

const formatCritiqueText = (text) => {
  if (!text) return ''
  
  // Convert <br/> and <br> tags to actual line breaks
  let formatted = text.replace(/<br\s*\/?>/gi, '<br>')
  
  // Convert BBCode [url] tags
  formatted = formatted.replace(/\[url=([^\]]+)\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>')
  formatted = formatted.replace(/\[url\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  
  // Convert BBCode formatting
  formatted = formatted.replace(/\[b\]([^\[]*)\[\/b\]/gi, '<strong>$1</strong>')
  formatted = formatted.replace(/\[i\]([^\[]*)\[\/i\]/gi, '<em>$1</em>')
  formatted = formatted.replace(/\[quote\]([^\[]*)\[\/quote\]/gi, '<blockquote>$1</blockquote>')
  
  // Convert line breaks
  formatted = formatted.replace(/\r\n/g, '<br>')
  formatted = formatted.replace(/\n/g, '<br>')
  
  // Limit length for details page (more generous than card)
  if (formatted.length > 500) {
    let truncated = formatted.substring(0, 500)
    const lastBreak = Math.max(
      truncated.lastIndexOf(' '),
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf(',')
    )
    if (lastBreak > 350) {
      truncated = truncated.substring(0, lastBreak)
    }
    formatted = truncated + '...'
  }
  
  return formatted
}

// Initialize data on mount
onMounted(() => {
  fetchAnimeDetails()
})
</script>

<style scoped>
.anime-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.anime-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.anime-image-section {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.anime-poster {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.anime-poster-placeholder {
  width: 100%;
  aspect-ratio: 3/4;
  background: var(--bg-secondary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
}

.placeholder-text {
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1.4;
}

.anime-info-section {
  min-width: 0;
}

.anime-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.anime-original-title {
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
  font-style: italic;
}

.important-info-block {
  background: var(--surface-color);
  border: 2px solid var(--accent-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-block-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
}

.info-value {
  color: var(--text-color);
  font-weight: 500;
}

.info-value.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-star {
  color: #fbbf24;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.synopsis-section {
  margin-bottom: 2rem;
}

.synopsis-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color);
  margin: 0;
}

.business-section {
  margin-bottom: 3rem;
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.business-group {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.business-type {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent-color);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.875rem;
}

.business-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.business-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.business-name {
  font-weight: 500;
  color: var(--text-color);
}

.business-precisions {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
}

.reviews-section {
  margin-bottom: 3rem;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-item {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.review-header {
  margin-bottom: 1rem;
}

.review-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.review-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
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

.review-content {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.critique-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.critique-text a {
  color: var(--primary-color);
  text-decoration: underline;
}

.critique-text strong {
  font-weight: 600;
  color: var(--text-color);
}

.critique-text blockquote {
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  border-left: 3px solid var(--border-color);
  background: var(--bg-secondary);
  font-style: normal;
}

.navigation-section {
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent-color-hover);
}

.error-container h2 {
  color: var(--text-color);
  margin: 0 0 1rem 0;
}

.error-container p {
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

/* Tags Section */
.tags-section {
  margin-bottom: 3rem;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.tags-category {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.tags-category-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-color);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.875rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  background: var(--bg-secondary);
  color: var(--text-color);
  padding: 0.5rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  cursor: help;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.tag-item:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-1px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .anime-details {
    padding: 1rem;
  }
  
  .anime-header {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .anime-image-section {
    position: static;
    max-width: 200px;
    margin: 0 auto;
  }
  
  .anime-title {
    font-size: 2rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .business-grid {
    grid-template-columns: 1fr;
  }
  
  .tags-grid {
    grid-template-columns: 1fr;
  }
  
  .review-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>