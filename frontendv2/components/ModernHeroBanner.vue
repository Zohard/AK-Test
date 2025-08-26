<template>
  <div class="modern-hero-carousel">
    <div v-if="loading" class="loading">
      <div class="loading-skeleton"></div>
    </div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="items.length === 0" class="error">Aucun contenu trouvé</div>

    <div v-else class="carousel-container">
      <!-- Main carousel -->
      <div class="carousel-wrapper">
        <div 
          class="carousel-track" 
          :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
        >
          <div
            v-for="(item, index) in items"
            :key="item.key"
            class="carousel-slide"
            :class="{ active: index === currentSlide }"
          >
            <div class="slide-image-container">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.alt || item.title"
                class="slide-image"
                loading="eager"
              />
              <div class="image-overlay"></div>
            </div>
            <div class="slide-content">
              <div class="content-badge" :class="item.type">
                {{ item.type === 'review' ? 'Critique' : 'Article' }}
              </div>
              <h2 class="slide-title">{{ item.title }}</h2>
              <p class="slide-subtitle">{{ item.subtitle }}</p>
              <button class="slide-button" @click="goTo(item)">
                <Icon name="heroicons:play" class="w-5 h-5" />
                Découvrir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <button 
        class="nav-button nav-prev" 
        @click="prevSlide" 
        aria-label="Précédent"
        :disabled="items.length <= 1"
      >
        <Icon name="heroicons:chevron-left" class="w-6 h-6" />
      </button>
      
      <button 
        class="nav-button nav-next" 
        @click="nextSlide" 
        aria-label="Suivant"
        :disabled="items.length <= 1"
      >
        <Icon name="heroicons:chevron-right" class="w-6 h-6" />
      </button>

      <!-- Dots indicator - Hidden -->
      <!-- 
      <div class="carousel-indicators">
        <button
          v-for="(item, index) in items"
          :key="`dot-${item.key}`"
          :class="['indicator-dot', { active: index === currentSlide }]"
          @click="goToSlide(index)"
          :aria-label="`Aller à l'élément ${index + 1}`"
        />
      </div>
      -->

      <!-- Progress bar -->
      <div class="progress-container">
        <div 
          class="progress-bar" 
          :style="{ width: `${((currentSlide + 1) / items.length) * 100}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewData } from '~/composables/useReviewsAPI'
import type { Article } from '~/types'
import Icon from '~/components/global/Icon.vue'

const loading = ref(true)
const error = ref('')
const items = ref<Array<{
  key: string
  type: 'review' | 'article'
  title: string
  subtitle: string
  imageUrl: string | null
  link: string
  date: string
  alt?: string
}>>([])
const currentSlide = ref(0)
const isTransitioning = ref(false)

const { getImageUrl, getArticleImageUrl } = useImageUrl()
const reviewsAPI = useReviewsAPI()
const config = useRuntimeConfig()

const currentItem = computed(() => items.value[currentSlide.value] || ({} as any))

const fetchContent = async () => {
  try {
    const [reviewsRes, articlesRes] = await Promise.allSettled([
      reviewsAPI.fetchReviews({ limit: 6, sortBy: 'dateCritique', sortOrder: 'desc' }),
      $fetch<{ articles: Article[] }>(`${config.public.apiBase}/api/articles`, {
        params: { limit: 6, sort: 'date', order: 'DESC', status: 'published' }
      })
    ])

    const reviewItems: any[] = []
    if (reviewsRes.status === 'fulfilled') {
      const reviews = (reviewsRes.value as any).data || (reviewsRes.value as any).reviews || []
      for (const r of reviews as ReviewData[]) {
        const media = r.anime || r.manga
        const imagePath = media?.image || ''
        const mediaType = r.anime ? 'anime' : 'manga'
        reviewItems.push({
          key: `review-${r.idCritique}`,
          type: 'review',
          title: r.titre || media?.titre || 'Critique',
          subtitle: r.critique ? (r.critique.length > 120 ? r.critique.slice(0, 120) + '...' : r.critique) : 'Découvrez la dernière critique de la communauté',
          imageUrl: imagePath ? getImageUrl(imagePath, mediaType as any) : null,
          link: r.niceUrl ? `/review/${r.niceUrl}` : `/review/${r.idCritique}`,
          date: r.dateCritique || new Date().toISOString(),
          alt: media?.titre || r.titre || 'Critique'
        })
      }
    }

    const articleItems: any[] = []
    if (articlesRes.status === 'fulfilled') {
      const arts = (articlesRes.value as any).articles || []
      for (const a of arts as Article[]) {
        const img = a.imgunebig || a.imgunebig2 || a.img || ''
        const imageUrl = img ? getArticleImageUrl(img) : null
        articleItems.push({
          key: `article-${a.idArt}`,
          type: 'article',
          title: a.titre,
          subtitle: a.metaDescription || a.postExcerpt || 'Découvrez notre dernier article',
          imageUrl,
          link: a.niceUrl ? `/articles/${a.niceUrl}` : `/articles/${a.idArt}`,
          date: a.date || (a as any).postDate || new Date().toISOString(),
          alt: a.titre
        })
      }
    }

    const merged = [...reviewItems, ...articleItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
    
    items.value = merged

    if (items.value.length === 0) {
      error.value = 'Aucun contenu trouvé'
    }
  } catch (err: any) {
    console.error('Hero content fetch error:', err)
    error.value = err.message || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

const nextSlide = () => {
  if (isTransitioning.value || items.value.length <= 1) return
  isTransitioning.value = true
  currentSlide.value = (currentSlide.value + 1) % items.value.length
  setTimeout(() => { isTransitioning.value = false }, 500)
}

const prevSlide = () => {
  if (isTransitioning.value || items.value.length <= 1) return
  isTransitioning.value = true
  currentSlide.value = (currentSlide.value - 1 + items.value.length) % items.value.length
  setTimeout(() => { isTransitioning.value = false }, 500)
}

const goToSlide = (index: number) => {
  if (isTransitioning.value || index === currentSlide.value) return
  isTransitioning.value = true
  currentSlide.value = index
  setTimeout(() => { isTransitioning.value = false }, 500)
}

const goTo = (item: any) => {
  navigateTo(item.link)
}

let autoRotateInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await fetchContent()
  if (items.value.length > 1) {
    autoRotateInterval = setInterval(() => nextSlide(), 8000)
  }
})

onUnmounted(() => {
  if (autoRotateInterval) clearInterval(autoRotateInterval)
})
</script>

<style scoped>
.modern-hero-carousel {
  @apply relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900;
  height: 500px;
}

.loading {
  @apply w-full h-full flex items-center justify-center;
}

.loading-skeleton {
  @apply w-full h-full bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse rounded-2xl;
}

.error {
  @apply w-full h-full flex items-center justify-center text-white bg-gray-800 rounded-2xl;
}

.carousel-container {
  @apply relative w-full h-full;
}

.carousel-wrapper {
  @apply w-full h-full overflow-hidden;
}

.carousel-track {
  @apply flex w-full h-full transition-transform duration-500 ease-in-out;
}

.carousel-slide {
  @apply relative flex-shrink-0 w-full h-full;
}

.slide-image-container {
  @apply relative w-full h-full;
}

.slide-image {
  @apply w-full h-full object-cover;
}

.image-overlay {
  @apply absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent;
}

.slide-content {
  @apply absolute bottom-0 left-0 right-0 p-8 text-white z-10;
}

.content-badge {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3;
}

.content-badge.review {
  @apply bg-blue-500/90 text-white;
}

.content-badge.article {
  @apply bg-green-500/90 text-white;
}

.slide-title {
  @apply text-3xl font-bold mb-3 leading-tight;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.slide-subtitle {
  @apply text-gray-200 mb-4 line-clamp-2 max-w-2xl;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.slide-button {
  @apply inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all hover:bg-gray-100 hover:scale-105;
}

.nav-button {
  @apply absolute top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm;
}

.nav-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.nav-prev {
  @apply left-4;
}

.nav-next {
  @apply right-4;
}

.carousel-indicators {
  @apply absolute bottom-20 left-8 flex gap-2 z-20;
}

.indicator-dot {
  @apply w-3 h-3 rounded-full bg-white/50 transition-all hover:bg-white/75;
}

.indicator-dot.active {
  @apply bg-white scale-125;
}

.progress-container {
  @apply absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-20;
}

.progress-bar {
  @apply h-full bg-white transition-all duration-500;
}

@media (max-width: 768px) {
  .modern-hero-carousel {
    height: 400px;
  }
  
  .slide-content {
    @apply p-4;
  }
  
  .slide-title {
    @apply text-2xl;
  }
  
  .nav-button {
    @apply p-2;
  }
  
  .nav-prev {
    @apply left-2;
  }
  
  .nav-next {
    @apply right-2;
  }
  
  .carousel-indicators {
    @apply bottom-16 left-4;
  }
}

@media (max-width: 640px) {
  .modern-hero-carousel {
    height: 300px;
  }
  
  .slide-title {
    @apply text-xl;
  }
  
  .slide-subtitle {
    @apply text-sm;
  }
  
  .slide-button {
    @apply px-4 py-2 text-sm;
  }
}
</style>