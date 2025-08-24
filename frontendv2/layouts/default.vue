<template>
  <div class="min-h-screen scroll-container">
    <TheHeader />
    <main class="main-content">
      <slot />
    </main>
    <TheFooter />
    
    <!-- Global Notification Container -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
// Components will be auto-imported
</script>

<style scoped>
/* Layout specific styles */
</style>