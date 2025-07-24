<template>
  <div class="main-content">
    <h1 class="section-title">Mangas</h1>
    <div v-if="loading" class="loading">
      Chargement des mangas...
    </div>
    <div v-else>
      <!-- Manga list content will go here -->
      <p>Liste des mangas (à implémenter)</p>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
</script>