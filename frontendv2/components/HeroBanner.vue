<template>
  <div class="hero-carousel">
    <div v-if="loading" class="loading">
      Chargement des animes récents... {{ debugMessage }}
    </div>
    
    <div v-else-if="animes.length === 0" class="error">
      Aucun anime trouvé
    </div>
    
    <div v-else class="carousel-container">
      <!-- Main slide -->
      <div class="carousel-slide">
        <img 
          v-if="currentAnime.image"
          :src="getImageUrl(currentAnime.image!) || ''" 
          :alt="`Image de l'anime ${currentAnime.titre}`"
          class="hero-image"
          loading="eager"
          @error="hideImage"
        />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="anime-meta">
            <span class="anime-year">{{ currentAnime.annee }}</span>
            <span v-if="currentAnime.nbEp" class="anime-episodes">{{ currentAnime.nbEp }} épisodes</span>
          </div>
          <h1 class="hero-title">{{ currentAnime.titre }}</h1>
          <p class="hero-subtitle">
            {{ truncateText(currentAnime.synopsis) }}
          </p>
          <div class="hero-actions">
            <button class="hero-button primary" @click="navigateToAnime">
              Découvrir
            </button>
            <button class="hero-button secondary" @click="navigateToAnime">
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
          :key="anime.id"
          :class="['thumbnail', { active: index === currentSlide }]"
          @click="goToSlide(index)"
        >
          <img 
            v-if="anime.image"
            :src="getImageUrl(anime.image || '', 'anime') || undefined" 
            :alt="anime.titre"
            loading="lazy"
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

<script setup lang="ts">
import type { Anime, ApiResponse } from '~/types'

const { fetchAnimes } = useAnimeAPI()
const { getImageUrl } = useImageUrl()

const animes = ref<Anime[]>([])
const currentSlide = ref(0)
const loading = ref(true)
const debugMessage = ref('Component loaded')

const currentAnime = computed(() => animes.value[currentSlide.value] || {})

const fetchRecentAnimes = async () => {
  console.log('fetchRecentAnimes function called!')
  try {
    console.log('Making API call with fetchAnimes...')
    const response = await fetchAnimes({ 
      limit: 5, 
      sortBy: 'dateAjout', 
      sortOrder: 'desc' 
    }) as ApiResponse<Anime[]>
    
    console.log('API response received:', response)
    
    if (response && response.animes && response.animes.length > 0) {
      animes.value = response.animes
      console.log('Animes set, length:', animes.value.length)
    } else {
      console.log('No animes in response or invalid response structure')
    }
  } catch (error) {
    console.error('Error fetching recent animes:', error)
  } finally {
    loading.value = false
    console.log('Loading set to false')
  }
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % animes.value.length
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + animes.value.length) % animes.value.length
}

const goToSlide = (index: number) => {
  currentSlide.value = index
}

const truncateText = (text?: string) => {
  if (!text) return 'Découvrez cet anime passionnant'
  return text.length > 200 ? text.substring(0, 200) + '...' : text
}

const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
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

const navigateToAnime = () => {
  if (currentAnime.value.niceUrl) {
    const niceUrl = currentAnime.value.niceUrl || createSlug(currentAnime.value.titre)
    navigateTo(`/anime/${niceUrl}-${currentAnime.value.id}`)
  } else {
    navigateTo('/animes')
  }
}

let autoRotateInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  console.log('HeroBanner component mounted, starting API call...')
  debugMessage.value = 'Component mounted!'
  await fetchRecentAnimes()
  console.log('API call completed, animes length:', animes.value.length)
  debugMessage.value = `API done, ${animes.value.length} animes`
  
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

// Pause auto-rotation on hover
const pauseAutoRotate = () => {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval)
    autoRotateInterval = null
  }
}

const resumeAutoRotate = () => {
  if (animes.value.length > 0 && !autoRotateInterval) {
    autoRotateInterval = setInterval(() => {
      nextSlide()
    }, 5000)
  }
}
</script>