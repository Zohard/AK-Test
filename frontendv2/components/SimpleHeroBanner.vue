<template>
  <div class="hero-carousel">
    <div v-if="loading" class="loading">Chargement du contenu...</div>

    <div v-else-if="error" class="error">Erreur: {{ error }}</div>

    <div v-else-if="items.length === 0" class="error">Aucun contenu trouvé</div>

    <div v-else class="carousel-container">
      <!-- Main slide -->
      <div class="carousel-slide">
        <img
          v-if="currentItem.imageUrl"
          :src="currentItem.imageUrl"
          :alt="currentItem.alt || currentItem.title"
          class="hero-image"
          loading="eager"
        />
        <div class="hero-content">
          <div class="hero-badge" :class="currentItem.type">{{ currentItem.type === 'review' ? 'Critique' : 'Article' }}</div>
          <h1 class="hero-title">{{ currentItem.title }}</h1>
          <p class="hero-subtitle">{{ currentItem.subtitle }}</p>
          <div class="hero-actions">
            <button class="hero-button primary" @click="goTo(currentItem)">
              Lire
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation arrows -->
      <button class="carousel-nav prev" @click="prevSlide" aria-label="Précédent">‹</button>
      <button class="carousel-nav next" @click="nextSlide" aria-label="Suivant">›</button>

      <!-- Dots indicator -->
      <div class="carousel-dots">
        <button
          v-for="(it, index) in items"
          :key="it.key"
          :class="['dot', { active: index === currentSlide }]"
          @click="goToSlide(index)"
          :aria-label="`Aller à l\'élément ${index + 1}`"
        />
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import type { ReviewData } from '~/composables/useReviewsAPI'
import type { Article } from '~/types'

const loading = ref(true)
const error = ref('')
const items = ref<Array<{
  key: string
  type: 'review' | 'article'
  title: string
  subtitle: string
  imageUrl: string | null
  link: string
  date: string // ISO
  alt?: string
}>>([])
const currentSlide = ref(0)

const { getImageUrl, getArticleImageUrl } = useImageUrl()
const reviewsAPI = useReviewsAPI()
const config = useRuntimeConfig()

const currentItem = computed(() => items.value[currentSlide.value] || ({} as any))

const fetchContent = async () => {
  try {
    const [reviewsRes, articlesRes] = await Promise.allSettled([
      reviewsAPI.fetchReviews({ limit: 4, sortBy: 'dateCritique', sortOrder: 'desc' }),
      // Fetch latest published articles directly from API
      $fetch<{ articles: Article[] }>(`${config.public.apiBase}/api/articles`, {
        params: { limit: 4, sort: 'date', order: 'DESC', status: 'published' }
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
          subtitle: r.critique ? (r.critique.length > 140 ? r.critique.slice(0, 140) + '...' : r.critique) : 'Découvrez la dernière critique de la communauté',
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

    // Merge and sort by date desc, then take up to 8 items
    const merged = [...reviewItems, ...articleItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    items.value = merged.slice(0, 8)

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
  currentSlide.value = (currentSlide.value + 1) % items.value.length
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + items.value.length) % items.value.length
}

const goToSlide = (index: number) => {
  currentSlide.value = index
}

const goTo = (item: any) => {
  navigateTo(item.link)
}

let autoRotateInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await fetchContent()
  if (items.value.length > 1) {
    autoRotateInterval = setInterval(() => nextSlide(), 6000)
  }
})

onUnmounted(() => {
  if (autoRotateInterval) clearInterval(autoRotateInterval)
})
</script>

<style scoped>
.hero-badge {
  display: inline-block;
  padding: 8px 14px; /* increased padding for better touch target */
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}
.hero-badge.review { background: rgba(59,130,246,0.9); color: white; }
.hero-badge.article { background: rgba(16,185,129,0.9); color: white; }
.hero-carousel { position: relative; overflow: hidden; border-radius: 12px; }
.carousel-container { position: relative; }
.carousel-slide { position: relative; height: 360px; line-height: 0; }
.hero-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-content { position: absolute; bottom: 72px; left: 64px; right: 24px; color: white; padding-bottom: 12px; z-index: 3; }
@media (max-width: 640px) {
  .hero-content { left: 24px; bottom: 56px; }
}
.hero-title { font-size: 28px; font-weight: 800; line-height: 1.1; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
.hero-subtitle { font-size: 14px; opacity: 0.95; max-width: 760px; }
.hero-button { margin-top: 12px; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
.hero-button.primary { background: #3b82f6; color: white; }
.carousel-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.35); color: white; border: none; width: 38px; height: 38px; border-radius: 9999px; font-size: 20px; }
.carousel-nav.prev { left: 10px; }
.carousel-nav.next { right: 10px; }
.carousel-dots { position: absolute; bottom: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 2; }
.dot { width: 8px; height: 8px; border-radius: 9999px; background: rgba(255,255,255,0.5); border: none; }
.dot.active { background: white; }
</style>
