<template>
  <div class="main-content">
    <h1 class="section-title">Critiques</h1>
    <div v-if="loading" class="loading">
      Chargement des critiques...
    </div>
    <div v-else>
      <!-- Critique list content will go here -->
      <p>Liste des critiques (à implémenter)</p>
    </div>
  </div>
</template>

<script setup>
const loading = ref(false)
</script>