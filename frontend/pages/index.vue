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
  </div>
</template>

<script setup>
const config = useRuntimeConfig()

const critiques = ref([])
const loading = ref(true)

const fetchCritiques = async () => {
  try {
    const { data } = await $fetch(`${config.public.apiBase}/api/critiques?limit=3`)
    critiques.value = data || []
  } catch (error) {
    console.error('Error fetching critiques:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCritiques()
})
</script>