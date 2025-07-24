<template>
  <div class="anime-card">
    <div class="anime-image-container">
      <img 
        v-if="getImageUrl(anime.image)"
        :src="getImageUrl(anime.image)" 
        :alt="anime.titre"
        class="anime-image"
        @error="hideImage"
      />
      <div v-else class="anime-placeholder">
        <span class="placeholder-text">{{ anime.titre }}</span>
      </div>
      <div class="anime-rating" v-if="anime.moyennenotes">
        <span class="rating-star">★</span>
        <span>{{ formatRating(anime.moyennenotes) }}</span>
      </div>
    </div>
    
    <div class="anime-content">
      <h3 class="anime-title">{{ anime.titre }}</h3>
      
      <div class="anime-meta">
        <span v-if="anime.realisateur" class="anime-director">
          {{ anime.realisateur }}
        </span>
        <span v-if="anime.annee" class="anime-year">{{ anime.annee }}</span>
      </div>
      
      <p v-if="anime.synopsis" class="anime-synopsis">
        {{ truncatedSynopsis }}
      </p>
      
      <div class="anime-stats" v-if="anime.nb_reviews">
        <span class="reviews-count">
          {{ anime.nb_reviews }} critique{{ anime.nb_reviews > 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  anime: {
    type: Object,
    required: true
  }
})

const truncatedSynopsis = computed(() => {
  if (!props.anime.synopsis) return ''
  return props.anime.synopsis.length > 150 
    ? props.anime.synopsis.substring(0, 150) + '...'
    : props.anime.synopsis
})

const formatRating = (rating) => {
  return parseFloat(rating).toFixed(1)
}

const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  // Use the same image path as homepage
  return `/images/${imagePath}`
}

const hideImage = (event) => {
  event.target.style.display = 'none'
}

</script>

<style scoped>
.anime-card {
  background: var(--surface-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.anime-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.anime-image-container {
  position: relative;
  aspect-ratio: 3/4;
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.anime-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.anime-card:hover .anime-image {
  transform: scale(1.05);
}

.anime-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  padding: 1rem;
}

.placeholder-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.4;
}

.anime-rating {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-star {
  color: #fbbf24;
}

.anime-content {
  padding: 16px;
}

.anime-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.anime-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.anime-director {
  font-weight: 500;
}

.anime-year {
  font-weight: 400;
}

.anime-synopsis {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.anime-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.reviews-count {
  font-weight: 500;
}

@media (max-width: 768px) {
  .anime-content {
    padding: 12px;
  }
  
  .anime-title {
    font-size: 1rem;
  }
  
  .anime-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>