<template>
  <div class="manga-details">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>Chargement des détails du manga...</span>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>Erreur</h2>
      <p>{{ error }}</p>
      <nuxt-link to="/mangas" class="back-link">← Retour aux mangas</nuxt-link>
    </div>

    <div v-else-if="manga" class="manga-content">
      <!-- Header Section -->
      <div class="manga-header">
        <div class="manga-image-section">
          <img 
            v-if="getImageUrl(manga.image)"
            :src="getImageUrl(manga.image)" 
            :alt="manga.titre"
            class="manga-poster"
            @error="hideImage"
          />
          <div v-else class="manga-poster-placeholder">
            <span class="placeholder-text">{{ manga.titre }}</span>
          </div>
        </div>

        <div class="manga-info-section">
          <h1 class="manga-title">{{ manga.titre }}</h1>
          <h2 v-if="manga.titre_orig && manga.titre_orig !== manga.titre" class="manga-original-title">
            {{ manga.titre_orig }}
          </h2>

          <!-- Important Info Block -->
          <div class="important-info-block">
            <h3 class="info-block-title">Informations importantes</h3>
            <div class="info-grid">
              <div v-if="manga.annee" class="info-item">
                <span class="info-label">Année :</span>
                <span class="info-value">{{ manga.annee }}</span>
              </div>
              <div v-if="manga.nb_vol" class="info-item">
                <span class="info-label">Volumes :</span>
                <span class="info-value">{{ manga.nb_vol }} volume{{ manga.nb_vol > 1 ? 's' : '' }}</span>
              </div>
              <div v-if="manga.auteur" class="info-item">
                <span class="info-label">Auteur :</span>
                <span class="info-value">{{ manga.auteur }}</span>
              </div>
              <div v-if="manga.moyenne_notes && manga.moyenne_notes > 0" class="info-item">
                <span class="info-label">Note moyenne :</span>
                <span class="info-value rating">
                  <span class="rating-star">★</span>
                  {{ formatRating(manga.moyenne_notes) }}/10
                </span>
              </div>
              <div v-if="manga.nb_reviews && manga.nb_reviews > 0" class="info-item">
                <span class="info-label">Critiques :</span>
                <span class="info-value">{{ manga.nb_reviews }} critique{{ manga.nb_reviews > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Synopsis -->
          <div v-if="manga.synopsis" class="synopsis-section">
            <h3 class="section-title">Synopsis</h3>
            <p class="synopsis-text">{{ manga.synopsis }}</p>
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
      <div v-if="manga.recent_reviews && manga.recent_reviews.length > 0" class="reviews-section">
        <h3 class="section-title">Critiques récentes</h3>
        <div class="reviews-list">
          <div 
            v-for="review in manga.recent_reviews" 
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
        <nuxt-link to="/mangas" class="back-link">← Retour aux mangas</nuxt-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Get route parameter
const route = useRoute()
const mangaId = route.params.id

// Page metadata
useHead({
  title: `Manga ${mangaId} - Anime-Kun`,
  meta: [
    { name: 'description', content: `Détails du manga ${mangaId}` }
  ]
})

// API configuration
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase

// Reactive data
const manga = ref(null)
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
const fetchMangaDetails = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch(`${API_BASE}/api/mangas/${mangaId}`)
    manga.value = response
    
    // Fetch business links and tags
    await fetchBusinessLinks()
    await fetchTags()
    
  } catch (err) {
    console.error('Error fetching manga details:', err)
    error.value = err.response?.status === 404 ? 'Manga introuvable' : 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const fetchBusinessLinks = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/mangas/${mangaId}/business`)
    businessLinks.value = response.data || []
  } catch (err) {
    console.error('Error fetching business links:', err)
    // Don't set error here, business links are optional
  }
}

const fetchTags = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/mangas/${mangaId}/tags`)
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
  return `/images/mangas/${imagePath}`
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
  fetchMangaDetails()
})
</script>

<style scoped>
/* Copy the CSS from anime/[id].vue and replace .anime- with .manga- where appropriate */
.manga-details {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
/* ...copy the rest of the CSS, replacing .anime- with .manga- for relevant classes... */
</style>
