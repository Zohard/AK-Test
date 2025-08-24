<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-4">
            <Icon name="heroicons:calendar" class="w-12 h-12 text-blue-200" />
            {{ pageTitle }}
          </h1>
          <p class="text-xl md:text-2xl mb-6 opacity-90">
            Découvrez tous les animes de cette saison
          </p>
          <div v-if="seasonData" class="flex flex-wrap justify-center gap-4 text-sm md:text-base">
            <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span class="font-semibold">{{ totalAnimes }}</span> animes
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span class="font-semibold">{{ getCurrentSeasonName() }}</span> {{ seasonData.annee }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Season Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Icon name="heroicons:calendar" class="w-4 h-4 inline mr-2" />
              Saison
            </label>
            <select
                v-model="selectedSeasonId"
                @change="changeSeason"
                class="form-input w-full"
            >
              <option
                  v-for="season in availableSeasons"
                  :key="season.id_saison"
                  :value="season.id_saison"
              >
                {{ formatSeasonOption(season) }}
              </option>
            </select>
          </div>

          <!-- Format Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Icon name="heroicons:film" class="w-4 h-4 inline mr-2" />
              Format
            </label>
            <select
                v-model="selectedFormat"
                @change="applyFilters"
                class="form-input w-full"
            >
              <option value="">Tous les formats</option>
              <option value="Série TV">Série TV</option>
              <option value="Film">Film</option>
              <option value="ONA">ONA</option>
              <option value="OAV">OAV</option>
            </select>
          </div>

          <!-- Sort Options -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Icon name="heroicons:arrow-up-down" class="w-4 h-4 inline mr-2" />
              Trier par
            </label>
            <select
                v-model="sortBy"
                @change="applyFilters"
                class="form-input w-full"
            >
              <option value="titre">Titre (A-Z)</option>
              <option value="moyenneNotes">Note moyenne</option>
              <option value="nbReviews">Nombre de critiques</option>
              <option value="dateAjout">Date d'ajout</option>
            </select>
          </div>
        </div>

        <!-- Active Filters Display -->
        <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Filtres actifs:</span>
          <span
              v-if="selectedFormat"
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          >
            Format: {{ selectedFormat }}
            <button @click="selectedFormat = ''; applyFilters()" class="ml-2 hover:text-blue-600">
              <Icon name="heroicons:x-mark" class="w-3 h-3" />
            </button>
          </span>
          <button
              @click="clearFilters"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Effacer tous les filtres
          </button>
        </div>

        <!-- Results count -->
        <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredAnimes.length }} anime{{ filteredAnimes.length > 1 ? 's' : '' }}
          {{ hasActiveFilters ? 'trouvé' + (filteredAnimes.length > 1 ? 's' : '') : 'au total' }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
        <span class="ml-4 text-lg text-gray-600 dark:text-gray-300">Chargement des animes...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-6 mb-8">
        <div class="flex items-center">
          <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-red-400 mr-3" />
          <div>
            <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
              Erreur de chargement
            </h3>
            <div class="mt-2 text-red-700 dark:text-red-300">
              {{ error }}
            </div>
            <div class="mt-4">
              <button @click="loadSeasonData" class="btn-primary">
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Anime Grid -->
      <div v-else-if="filteredAnimes.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        <SeasonAnimeCard
            v-for="anime in filteredAnimes"
            :key="anime.id"
            :anime="anime"
            @view="viewAnime"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <Icon name="heroicons:film" class="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
          {{ hasActiveFilters ? 'Aucun anime trouvé' : 'Aucun anime pour cette saison' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ hasActiveFilters
            ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
            : 'Cette saison ne contient pas encore d\'animes référencés.'
          }}
        </p>
        <div v-if="hasActiveFilters" class="space-x-4">
          <button @click="clearFilters" class="btn-primary">
            Effacer les filtres
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Season, Anime } from '~/types'
import SeasonAnimeCard from '~/components/seasons/SeasonAnimeCard.vue'

// Page params
const route = useRoute()
const { season, year, id } = route.params

// State
const seasonData = ref<Season | null>(null)
const animes = ref<Anime[]>([])
const availableSeasons = ref<Season[]>([])
const loading = ref(true)
const error = ref('')

// Filters
const selectedSeasonId = ref<number>(parseInt(id as string))
const selectedFormat = ref('')
const sortBy = ref('titre')

// API composables
const { fetchCurrentSeason, formatSeasonText, formatSeasonUrl } = useSeasonsAPI()

const saisonMap: Record<number, string> = {
  1: 'hiver',
  2: 'printemps',
  3: 'été',
  4: 'automne'
}

// Computed
const pageTitle = computed(() => {
  if (!seasonData.value) return 'Saison Anime'
  const season_name = saisonMap[seasonData.value.saison]
  if (!season_name) return 'Saison Anime'

  // Use "du" for printemps, "de l'" for others
  const article = season_name === 'printemps' ? 'du ' : 'de l\''

  return `Les animes ${article}${season_name} ${seasonData.value.annee}`
})

const totalAnimes = computed(() => animes.value.length)

const filteredAnimes = computed(() => {
  let filtered = [...animes.value]

  // Apply format filter
  if (selectedFormat.value) {
    filtered = filtered.filter(anime => anime.format === selectedFormat.value)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'titre':
        return a.titre.localeCompare(b.titre)
      case 'moyenneNotes':
        return (b.moyenneNotes || 0) - (a.moyenneNotes || 0)
      case 'nbReviews':
        return (b.nbReviews || 0) - (a.nbReviews || 0)
      case 'dateAjout':
        return new Date(b.dateAjout || 0).getTime() - new Date(a.dateAjout || 0).getTime()
      default:
        return 0
    }
  })

  return filtered
})

const hasActiveFilters = computed(() => {
  return selectedFormat.value !== ''
})

// Page metadata
useHead({
  title: () => `${pageTitle.value} - Anime-Kun`,
  meta: [
    {
      name: 'description',
      content: () => `Découvrez tous les animes de ${seasonData.value ? getCurrentSeasonName() + ' ' + seasonData.value.annee : 'cette saison'}. Liste complète avec critiques et notes de la communauté.`
    }
  ]
})

// Methods
const getCurrentSeasonName = () => {
  if (!seasonData.value) return ''
  return saisonMap[seasonData.value.saison] || ''
}

const loadSeasonData = async () => {
  try {
    loading.value = true
    error.value = ''

    // Load season data and animes
    const [seasonResponse, animesResponse, seasonsResponse] = await Promise.all([
      $fetch(`/api/seasons/${id}`),
      $fetch(`/api/seasons/${id}/animes`),
      $fetch('/api/seasons')
    ])

    seasonData.value = seasonResponse as Season
    animes.value = animesResponse as Anime[]
    availableSeasons.value = seasonsResponse as Season[]

  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des données de la saison'
  } finally {
    loading.value = false
  }
}

const changeSeason = () => {
  const selectedSeason = availableSeasons.value.find(s => s.id_saison === selectedSeasonId.value)
  if (selectedSeason) {
    const seasonUrl = formatSeasonUrl(selectedSeason)
    navigateTo(seasonUrl)
  }
}

const applyFilters = () => {
  // Filters are applied through computed property
  // This method exists for explicit filter application if needed
}

const clearFilters = () => {
  selectedFormat.value = ''
  sortBy.value = 'titre'
}

const formatSeasonOption = (season: Season) => {
  const season_name = saisonMap[season.saison] || "";

  return `${season_name} ${season.annee}`.replace(/^\w/, c => c.toUpperCase())
}

const viewAnime = (anime: Anime) => {
  navigateTo(`/anime/${anime.id}`)
}

// Load data on mount
onMounted(() => {
  loadSeasonData()
})

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId && newId !== id) {
    selectedSeasonId.value = parseInt(newId as string)
    loadSeasonData()
  }
})
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>