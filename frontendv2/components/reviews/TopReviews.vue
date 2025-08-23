<template>
  <section class="top-reviews bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Top critiques</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">Les critiques les plus utiles et populaires</p>
      </div>

      <div class="inline-flex rounded-md shadow-sm" role="group">
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          :class="[
            'px-4 py-2 text-sm font-medium border',
            selectedType === opt.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="changeType(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8 text-gray-600 dark:text-gray-300">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-3" />
      Chargement des meilleures critiques...
    </div>

    <div v-else-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4 text-red-700 dark:text-red-300">
      {{ error }}
    </div>

    <div v-else>
      <div v-if="reviews.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReviewCard
          v-for="review in reviews"
          :key="review.idCritique || review.id"
          :review="normalizeReview(review)"
          @view="onView"
        />
      </div>
      <div v-else class="text-center py-8 text-gray-600 dark:text-gray-300">
        Aucune critique trouvée.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import ReviewCard from '~/components/reviews/ReviewCard.vue'
import type { ReviewData } from '~/composables/useReviewsAPI'

interface Props {
  limit?: number
  defaultType?: 'anime' | 'manga' | 'both'
}

const props = withDefaults(defineProps<Props>(), {
  limit: 6,
  defaultType: 'both'
})

const { getTopReviews, fetchReviews } = useReviewsAPI()

const loading = ref(false)
const error = ref('')
const selectedType = ref<Props['defaultType']>(props.defaultType)
const reviews = ref<ReviewData[]>([] as any)

const options = [
  { label: 'Tous', value: 'both' },
  { label: 'Anime', value: 'anime' },
  { label: 'Manga', value: 'manga' }
] as const

const loadTop = async () => {
  try {
    loading.value = true
    error.value = ''
    const { data } = await getTopReviews(props.limit, 'week', selectedType.value)
    reviews.value = (data as any) || []

    // Fallback if backend returns no top reviews (too strict filters)
    if (!reviews.value.length) {
      const fallbackParams: any = {
        limit: props.limit,
        sortBy: 'nbClics',
        sortOrder: 'desc' as const,
        statut: 0
      }
      if (selectedType.value === 'anime') fallbackParams.type = 'anime'
      if (selectedType.value === 'manga') fallbackParams.type = 'manga'

      const fallback = await fetchReviews(fallbackParams)
      reviews.value = (fallback as any)?.data || []
    }
  } catch (e: any) {
    error.value = e?.message || 'Erreur lors du chargement des meilleures critiques'
    reviews.value = []
  } finally {
    loading.value = false
  }
}

const changeType = (type: any) => {
  if (selectedType.value === type) return
  selectedType.value = type
  loadTop()
}

const normalizeReview = (r: any): ReviewData => {
  // Ensure ReviewCard gets the expected structure
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

const onView = (review: ReviewData) => {
  // Optionally handle analytics
}

onMounted(loadTop)
</script>

<style scoped>
.top-reviews {
  @apply mb-8;
}

[role='group'] > button:first-child {
  @apply rounded-l-md;
}

[role='group'] > button:last-child {
  @apply rounded-r-md;
}

[role='group'] > button:not(:first-child) {
  @apply -ml-px;
}
</style>
