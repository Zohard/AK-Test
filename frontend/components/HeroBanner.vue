<template>
  <div class="hero-carousel">
    <div v-if="loading" class="loading">
      Chargement des animes récents...
    </div>
    
    <div v-else-if="animes.length === 0" class="error">
      Aucun anime trouvé
    </div>
    
    <div v-else class="carousel-container">
      <!-- Main slide -->
      <div class="carousel-slide">
        <img 
          v-if="currentAnime.image"
          :src="`/images/anime/${currentAnime.image}`" 
          :alt="currentAnime.titre"
          class="hero-image"
          @error="hideImage"
        />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="anime-meta">
            <span class="anime-year">{{ currentAnime.annee }}</span>
            <span class="anime-episodes">{{ currentAnime.nb_ep }} épisodes</span>
          </div>
          <h1 class="hero-title">{{ currentAnime.titre }}</h1>
          <p class="hero-subtitle">
            {{ truncateText(currentAnime.synopsis) }}
          </p>
          <div class="hero-actions">
            <button class="hero-button primary">
              Découvrir
            </button>
            <button class="hero-button secondary">
              Voir la fiche
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation arrows -->
      <button 
        class="carousel-nav prev" 
        @click="prevSlide"
        aria-label="Anime précédent"
      >
        ‹
      </button>
      <button 
        class="carousel-nav next" 
        @click="nextSlide"
        aria-label="Anime suivant"
      >
        ›
      </button>

      <!-- Dots indicator -->
      <div class="carousel-dots">
        <button
          v-for="(anime, index) in animes"
          :key="index"
          :class="['dot', { active: index === currentSlide }]"
          @click="goToSlide(index)"
          :aria-label="`Aller à l'anime ${index + 1}`"
        />
      </div>

      <!-- Thumbnails -->
      <div class="carousel-thumbnails">
        <div
          v-for="(anime, index) in animes"
          :key="anime.id_anime"
          :class="['thumbnail', { active: index === currentSlide }]"
          @click="goToSlide(index)"
        >
          <img 
            v-if="anime.image"
            :src="`/images/anime/${anime.image}`" 
            :alt="anime.titre"
            @error="hideImage"
          />
          <div class="thumbnail-overlay">
            <span class="thumbnail-title">{{ anime.titre }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()

const animes = ref([])
const currentSlide = ref(0)
const loading = ref(true)

const currentAnime = computed(() => animes.value[currentSlide.value])

const fetchRecentAnimes = async () => {
  try {
    const { data } = await $fetch(`${config.public.apiBase}/api/animes?limit=5&recent=true`)
    if (data && data.length > 0) {
      animes.value = data
    }
  } catch (error) {
    console.error('Error fetching recent animes:', error)
  } finally {
    loading.value = false
  }
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % animes.value.length
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + animes.value.length) % animes.value.length
}

const goToSlide = (index) => {
  currentSlide.value = index
}

const truncateText = (text) => {
  if (!text) return 'Découvrez cet anime passionnant'
  return text.length > 200 ? text.substring(0, 200) + '...' : text
}

const hideImage = (event) => {
  event.target.style.display = 'none'
}

let autoRotateInterval = null

onMounted(async () => {
  await fetchRecentAnimes()
  
  if (animes.value.length > 0) {
    autoRotateInterval = setInterval(() => {
      nextSlide()
    }, 5000) // Auto-rotate every 5 seconds
  }
})

onUnmounted(() => {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval)
  }
})

watch(() => animes.value.length, (newLength) => {
  if (newLength > 0 && !autoRotateInterval) {
    autoRotateInterval = setInterval(() => {
      nextSlide()
    }, 5000)
  }
})
</script>