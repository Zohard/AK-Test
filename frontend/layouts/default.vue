<template>
  <div>
    <TheHeader />
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup>
// Theme is handled by the theme plugin and composable
// No need to apply classes here since the plugin handles body/html classes
</script>