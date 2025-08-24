<template>
  <article class="article-card group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
    <!-- Article Image -->
    <div class="relative aspect-[16/6.3] overflow-hidden">
      <SmartImage
        v-if="articleImage"
        :src="articleImage as string"
        :alt="article.titre"
        aspect-ratio="16/6.3"
        container-class="w-full h-full"
        image-class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 motion-reduce:transition-none motion-reduce:transform-none"
        :placeholder-icon="'heroicons:newspaper'"
      />
      <div 
        v-else 
        class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
      >
        <Icon name="heroicons:newspaper" class="w-16 h-16 text-gray-400" />
      </div>
      
      <!-- Article overlay on hover -->
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 motion-reduce:transition-none flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button
          @click="handleViewClick"
          class="px-7 py-3 bg-white text-gray-900 rounded-full font-medium shadow-xl transform scale-95 group-hover:scale-100 transition-all duration-200 hover:bg-gray-50"
        >
          <Icon name="heroicons:eye" class="w-4 h-4 inline mr-2" />
          Lire l'article
        </button>
      </div>
      
      <!-- Date badge -->
      <div class="absolute top-3 right-3 px-2 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-700 dark:text-gray-300">
        {{ formatDate(article.date) }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 flex flex-col h-full">
      <!-- Category badge -->
      <div class="mb-3">
        <span 
          v-if="article.categories && article.categories.length > 0 && article.categories[0]"
          class="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800"
        >
          <Icon name="heroicons:tag" class="w-3 h-3 mr-1" />
          {{ article.categories[0].name }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="article-card-title text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
        <NuxtLink :to="articleUrl" class="hover:underline">
          {{ article.titre }}
        </NuxtLink>
      </h3>

      <!-- Excerpt -->
      <div class="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
        <p v-if="article.metaDescription" class="line-clamp-2 mb-3 font-medium text-gray-700 dark:text-gray-200">
          {{ article.metaDescription }}
        </p>
        <div 
          v-if="articleExcerpt" 
          class="line-clamp-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
        >
          {{ articleExcerpt }}
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between text-sm">
          <!-- Author -->
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
              {{ (article.author?.memberName || 'A')[0].toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ article.author?.memberName || 'Auteur' }}</p>
            </div>
          </div>

          <!-- Meta info -->
          <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <!-- Views -->
            <div class="flex items-center space-x-1" title="Vues">
              <Icon name="heroicons:eye" class="w-4 h-4" />
              <span>{{ formatNumber(article.nbClics) }}</span>
            </div>
            
            <!-- Comments -->
            <div class="flex items-center space-x-1" title="Commentaires">
              <Icon name="heroicons:chat-bubble-left" class="w-4 h-4" />
              <span>{{ article.commentCount || 0 }}</span>
            </div>
          </div>
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

const { getArticleImageUrl } = useImageUrl()

// Computed properties
const articleImage = computed(() => {
  const rawImage = props.article.imgunebig || props.article.img
  return rawImage ? getArticleImageUrl(rawImage) : null
})

const articleUrl = computed(() => {
  return `/articles/${props.article.niceUrl}`
})

const articleExcerpt = computed(() => {
  if (!props.article.texte) return ''
  
  // Remove HTML tags and format the text
  let text = props.article.texte
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&[^;]+;/g, '') // Remove other HTML entities
    .trim()
  
  // Limit to 150 characters
  if (text.length > 150) {
    const truncated = text.substring(0, 150)
    const lastSpace = truncated.lastIndexOf(' ')
    text = (lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated) + '...'
  }
  
  return text
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

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
