<template>
  <div id="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Global meta
useHead({
  title: 'Anime-Kun V2',
  meta: [
    { name: 'description', content: 'Découvrez et partagez vos animes et mangas préférés' }
  ]
})

// Initialize auth on app start
const authStore = useAuthStore()
onMounted(() => {
  authStore.initializeAuth()
})
</script>

<style>
html {
  font-family: system-ui, -apple-system, sans-serif;
}
</style>