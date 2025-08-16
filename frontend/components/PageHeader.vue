<template>
  <div class="page-header">
    <div class="page-header-left">
      <NuxtLink v-if="backLink" :to="backLink" class="back-btn">
        <span class="back-icon">←</span>
        {{ backText || 'Retour' }}
      </NuxtLink>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header-right">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  backLink: String,
  backText: String
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-header-left {
  flex: 1;
}

.page-header-right {
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: var(--accent-color);
}

.back-icon {
  font-size: 1.2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .page-header-right {
    width: 100%;
    justify-content: center;
  }
  
  .page-title {
    font-size: 2rem;
  }
}
</style>