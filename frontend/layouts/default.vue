<template>
  <div>
    <TheHeader />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
// Theme is handled by the theme plugin and composable
// No need to apply classes here since the plugin handles body/html classes
</script>

<style scoped>
.main-content {
  padding-top: 80px; /* Height of fixed header */
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .main-content {
    padding-top: 70px; /* Adjust for mobile header height */
  }
}
</style>