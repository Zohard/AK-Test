<template>
  <article class="article-card group relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
    <!-- Article Image -->
    <div class="relative aspect-video">
      <img
        v-if="article.img || article.imgunebig"
        :src="articleImage"
        :alt="article.titre"
        class="w-full h-full object-cover"
        @error="onImageError"
        loading="lazy"
      />
      <div 
        v-else 
        class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
      >
        <Icon name="heroicons:newspaper" class="w-12 h-12 text-gray-400" />
      </div>
      
      <!-- Article overlay on hover -->
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button
          @click="handleViewClick"
          class="px-4 py-2 bg-white text-gray-900 rounded-md font-medium shadow-lg transform scale-95 group-hover:scale-100 transition-transform duration-200"
        >
          Lire l'article
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Category badge -->
      <div class="mb-2">
        <span 
          v-if="article.categories && article.categories.length > 0"
          class="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200 rounded-full"
        >
          {{ article.categories[0].name }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="article-card-title text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
        <NuxtLink :to="articleUrl" class="hover:underline">
          {{ article.titre }}
        </NuxtLink>
      </h3>

      <!-- Excerpt -->
      <p 
        v-if="article.metaDescription" 
        class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3"
      >
        {{ article.metaDescription }}
      </p>

      <!-- Footer -->
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <!-- Author -->
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <Icon name="heroicons:user" class="w-3 h-3" />
          </div>
          <span>{{ article.author?.memberName || 'Auteur' }}</span>
        </div>

        <!-- Meta info -->
        <div class="flex items-center space-x-3">
          <!-- Views -->
          <div class="flex items-center space-x-1">
            <Icon name="heroicons:eye" class="w-3 h-3" />
            <span>{{ formatNumber(article.nbClics) }}</span>
          </div>
          
          <!-- Comments -->
          <div class="flex items-center space-x-1">
            <Icon name="heroicons:chat-bubble-left" class="w-3 h-3" />
            <span>{{ article.commentCount || 0 }}</span>
          </div>
          
          <!-- Date -->
          <span>{{ formatDate(article.date) }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Article } from '~/types'

interface Props {
  article: Article
}

interface Emits {
  view: [article: Article]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed properties
const articleImage = computed(() => {
  return props.article.imgunebig || props.article.img
})

const articleUrl = computed(() => {
  return `/articles/${props.article.niceUrl}`
})

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return Math.floor(num / 1000) + 'k'
  }
  return num.toString()
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const handleViewClick = () => {
  navigateTo(articleUrl.value)
  emit('view', props.article)
}

const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
</script>

<style scoped>
.article-card {
  @apply transition-all duration-200;
}

.article-card:hover {
  @apply transform -translate-y-1;
}

.article-card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>