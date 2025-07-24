<template>
  <div class="main-content">
    <h1 class="section-title">Webzine</h1>
    <div v-if="loading" class="loading">
      Chargement des articles...
    </div>
    <div v-else>
      <!-- Article list content will go here -->
      <p>Liste des articles (à implémenter)</p>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
</script>