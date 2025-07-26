<template>
  <div class="main-content">
    <HeroBanner />
    
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Dernières critiques</h2>
        <NuxtLink to="/critiques" class="section-link">
          Voir toutes les critiques →
        </NuxtLink>
      </div>
      
      <div v-if="loading" class="loading">
        Chargement des articles...
      </div>
      
      <div v-else class="articles-grid">
        <ArticleCard 
          v-for="critique in critiques" 
          :key="critique.id_critique" 
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
      <div v-if="animeLoading" class="loading">
        Chargement des animés...
      </div>
      <div v-else class="articles-grid">
        <AnimeCard
          v-for="anime in animes"
          :key="anime.id_anime"
          :anime="anime"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()

const critiques = ref([])
const loading = ref(true)

const animes = ref([])
const animeLoading = ref(true)

const fetchCritiques = async () => {
  try {
    const { data } = await $fetch(`${config.public.apiBase}/api/reviews?limit=4`)
    critiques.value = data || []
  } catch (error) {
    console.error('Error fetching critiques:', error)
  } finally {
    loading.value = false
  }
}

const fetchAnimes = async () => {
  try {
    const { data } = await $fetch(`${config.public.apiBase}/api/animes?page=1&limit=3`)
    animes.value = data || []
  } catch (error) {
    console.error('Error fetching animes:', error)
  } finally {
    animeLoading.value = false
  }
}

onMounted(() => {
  fetchCritiques()
  fetchAnimes()
})
</script>