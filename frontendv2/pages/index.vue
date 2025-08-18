<template>
  <div class="main-content">
    <SimpleHeroBanner />
    
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Dernières critiques</h2>
        <NuxtLink to="/critiques" class="section-link">
          Voir toutes les critiques →
        </NuxtLink>
      </div>
      
      <div v-if="reviewsLoading" class="loading">
        Chargement des critiques...
      </div>
      
      <div v-else class="articles-grid">
        <ArticleCard 
          v-for="critique in critiques" 
          :key="critique.idCritique" 
          :article="critique" 
        />
      </div>
    </section>

    <!-- Les animés du moment -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Les animés du moment</h2>
        <NuxtLink to="/animes" class="section-link">
          Voir tous les animés →
        </NuxtLink>
      </div>
      <div v-if="animesLoading" class="loading">
        Chargement des animés...
      </div>
      <div v-else class="articles-grid">
        <AnimeCard
          v-for="anime in featuredAnimes"
          :key="anime.id"
          :anime="anime"
          @view="viewAnime"
        />
      </div>
    </section>

    <!-- Quick Stats -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Statistiques</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card text-center">
          <h3 class="text-2xl font-bold text-blue-600">{{ stats.animes || '...' }}</h3>
          <p class="text-gray-600 dark:text-gray-300">Animes</p>
        </div>
        <div class="card text-center">
          <h3 class="text-2xl font-bold text-green-600">{{ stats.mangas || '...' }}</h3>
          <p class="text-gray-600 dark:text-gray-300">Mangas</p>
        </div>
        <div class="card text-center">
          <h3 class="text-2xl font-bold text-purple-600">{{ stats.reviews || '...' }}</h3>
          <p class="text-gray-600 dark:text-gray-300">Critiques</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Anime, ApiResponse } from '~/types'
import type { ReviewData } from '~/composables/useReviewsAPI'

// Page metadata
useHead({
  title: 'Accueil - Anime-Kun V2',
  meta: [
    { name: 'description', content: 'Découvrez notre collection d\'animes et mangas avec critiques et notes de la communauté' }
  ]
})

const { fetchAnimes } = useAnimeAPI()
const { fetchReviews } = useReviewsAPI()

// Reactive data
const stats = ref({
  animes: 0,
  mangas: 0,
  reviews: 0
})

const critiques = ref<ReviewData[]>([])
const reviewsLoading = ref(true)

const featuredAnimes = ref<Anime[]>([])
const animesLoading = ref(true)

// Load initial data
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadCritiques(),
    loadFeaturedAnimes()
  ])
})

const loadStats = async () => {
  try {
    // Get stats from APIs
    const [animesResponse, mangasResponse, reviewsResponse] = await Promise.allSettled([
      fetchAnimes({ limit: 1 }),
      $fetch(`${useRuntimeConfig().public.apiBase}/api/mangas`, { params: { limit: 1 } }),
      $fetch(`${useRuntimeConfig().public.apiBase}/api/reviews/count`)
    ])
    
    stats.value = {
      animes: animesResponse.status === 'fulfilled' ? ((animesResponse.value as ApiResponse<Anime[]>)?.pagination?.total || 0) : 0,
      mangas: mangasResponse.status === 'fulfilled' ? ((mangasResponse.value as ApiResponse<any[]>)?.pagination?.total || 0) : 0,
      reviews: reviewsResponse.status === 'fulfilled' ? ((reviewsResponse.value as any)?.count || 0) : 0
    }
  } catch (error) {
    console.error('Error loading stats:', error)
    stats.value = {
      animes: 0,
      mangas: 0,
      reviews: 0
    }
  }
}

const loadCritiques = async () => {
  try {
    const response = await fetchReviews({ 
      limit: 4,
      statut: 0, // Only visible reviews
      sortBy: 'dateCritique',
      sortOrder: 'desc'
    })
    
    if (response && response.reviews) {
      critiques.value = response.reviews
    }
  } catch (error) {
    console.error('Error loading critiques:', error)
    critiques.value = []
  } finally {
    reviewsLoading.value = false
  }
}

const loadFeaturedAnimes = async () => {
  try {
    const response = await fetchAnimes({ 
      limit: 3, 
      sortBy: 'titre', 
      sortOrder: 'asc' 
    }) as ApiResponse<Anime[]>
    
    if (response && response.animes) {
      featuredAnimes.value = response.animes
    }
  } catch (error) {
    console.error('Error loading featured animes:', error)
  } finally {
    animesLoading.value = false
  }
}

const buildAnimeUrl = (anime: any) => {
  // Create SEO-friendly URL: /anime/nice-url-id
  const niceUrl = anime.niceUrl || createSlug(anime.titre)
  return `/anime/${niceUrl}-${anime.id}`
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

const viewAnime = (anime: any) => {
  console.log('viewAnime called in index page with:', anime)
  navigateTo(buildAnimeUrl(anime))
}
</script>