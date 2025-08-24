<template>
  <div class="main-content">
    <SimpleHeroBanner />
    
    <section class="section">
      <div class="section-header">
        <h2 class="section-title flex items-center gap-3">
          <Icon name="heroicons:star" class="w-6 h-6 text-yellow-500" />
          Dernières critiques
        </h2>
        <NuxtLink to="/reviews" class="section-link flex items-center gap-2">
          Voir toutes les critiques
          <Icon name="heroicons:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
      
      <div v-if="reviewsLoading" class="loading">
        Chargement des critiques...
      </div>
      
      <div v-else class="articles-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReviewCard 
          v-for="critique in critiques" 
          :key="critique.idCritique || critique.id" 
          :review="critique" 
          @view="viewReview"
        />
      </div>
    </section>

    <!-- Les animés du moment -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title flex items-center gap-3">
          <Icon name="heroicons:film" class="w-6 h-6 text-blue-500" />
          Les animés du moment
        </h2>
        <NuxtLink to="/animes" class="section-link flex items-center gap-2">
          Voir tous les animés
          <Icon name="heroicons:arrow-right" class="w-4 h-4" />
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
        <h2 class="section-title flex items-center gap-3">
          <Icon name="heroicons:chart-bar" class="w-6 h-6 text-green-500" />
          Statistiques
        </h2>
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
import ReviewCard from '~/components/reviews/ReviewCard.vue'

// Page metadata
useHead({
  title: 'Accueil - Anime-Kun',
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
      sortBy: 'dateCritique',
      sortOrder: 'desc'
    })
    
    const raw = (response as any).data || (response as any).reviews || []
    critiques.value = raw.map(normalizeReview)
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

const viewReview = (review: ReviewData) => {
  // ReviewCard already contains NuxtLink; this is for analytics if needed
}

const normalizeReview = (r: any): ReviewData => {
  return {
    idCritique: r.idCritique || r.id,
    niceUrl: r.niceUrl,
    titre: r.titre,
    critique: r.critique || r.contenu,
    notation: r.notation || r.note,
    dateCritique: r.reviewDate || r.dateCritique || r.dateCreation,
    statut: typeof r.statut === 'number' ? r.statut : 1,
    idMembre: r.idMembre || r.userId || 0,
    idAnime: r.idAnime || r.animeId || 0,
    idManga: r.idManga || r.mangaId || 0,
    nbClics: r.nbClics || r.nbVues || 0,
    anime: r.anime,
    manga: r.manga,
    membre: r.membre ? {
      id: r.membre.id || r.membre.idMember,
      pseudo: r.membre.pseudo || r.membre.memberName,
      avatar: r.membre.avatar
    } : undefined
  }
}
</script>
