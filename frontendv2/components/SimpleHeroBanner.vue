<template>
  <div class="hero-carousel">
    <div v-if="loading" class="loading">
      Chargement des animes récents...
    </div>
    
    <div v-else-if="error" class="error">
      Erreur: {{ error }}
    </div>
    
    <div v-else-if="animes.length === 0" class="error">
      Aucun anime trouvé
    </div>
    
    <div v-else class="carousel-container">
      <div class="carousel-slide">
        <img 
          v-if="currentAnime.image"
          :src="getImageUrl(currentAnime.image) || ''" 
          :alt="`Image de l'anime ${currentAnime.titre}`"
          class="hero-image"
          loading="eager"
        />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="hero-title">{{ currentAnime.titre }}</h1>
          <p class="hero-subtitle">
            {{ currentAnime.synopsis || 'Découvrez cet anime passionnant' }}
          </p>
          <div class="hero-actions">
            <button class="hero-button primary">
              Découvrir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(true)
const error = ref('')
const animes = ref([])
const currentSlide = ref(0)

const currentAnime = computed(() => animes.value[currentSlide.value] || {})

const { getImageUrl } = useImageUrl()

const fetchAnimes = async () => {
  try {
    console.log('SimpleHeroBanner: Making API call...')
    const response = await $fetch('/api/proxy/animes?limit=5')
    console.log('SimpleHeroBanner: API response:', response)
    
    if (response && response.animes && response.animes.length > 0) {
      animes.value = response.animes
      console.log('SimpleHeroBanner: Animes loaded:', animes.value.length)
    } else {
      error.value = 'Aucun anime trouvé'
    }
  } catch (err: any) {
    console.error('SimpleHeroBanner: API error:', err)
    error.value = err.message || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('SimpleHeroBanner: Component mounted')
  fetchAnimes()
})
</script>