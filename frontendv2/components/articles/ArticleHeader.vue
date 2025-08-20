<template>
  <header class="article-header relative">
    <!-- Hero Image -->
    <div 
      v-if="heroImage" 
      class="relative h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-200 dark:bg-gray-800"
    >
      <img
        :src="heroImage"
        :alt="article.titre"
        class="w-full h-full object-cover"
        @error="onImageError"
      />
      
      <!-- Overlay for better text readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      
      <!-- Hero content -->
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 text-white">
        <div class="max-w-4xl mx-auto">
          <!-- Category badge -->
          <div class="mb-4">
            <span 
              v-if="article.categories && article.categories.length > 0"
              class="inline-block px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-full"
            >
              {{ article.categories[0].name }}
            </span>
          </div>
          
          <!-- Title -->
          <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {{ article.titre }}
          </h1>
          
          <!-- Meta description -->
          <p 
            v-if="article.metaDescription" 
            class="text-lg md:text-xl text-gray-200 mb-6 max-w-3xl"
          >
            {{ article.metaDescription }}
          </p>
        </div>
      </div>
    </div>

    <!-- Header without hero image -->
    <div 
      v-else 
      class="bg-white dark:bg-gray-900 py-12 md:py-16 lg:py-20"
    >
      <div class="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
        <!-- Category badge -->
        <div class="mb-6">
          <span 
            v-if="article.categories && article.categories.length > 0"
            class="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200 rounded-full"
          >
            {{ article.categories[0].name }}
          </span>
        </div>
        
        <!-- Title -->
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          {{ article.titre }}
        </h1>
        
        <!-- Meta description -->
        <p 
          v-if="article.metaDescription" 
          class="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl"
        >
          {{ article.metaDescription }}
        </p>
      </div>
    </div>

    <!-- Article metadata -->
    <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-6 md:px-8 lg:px-12 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <!-- Author info -->
          <div class="flex items-center space-x-4">
            <!-- Author avatar -->
            <div class="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="heroicons:user" class="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
            
            <!-- Author details -->
            <div>
              <div class="flex items-center space-x-2">
                <NuxtLink 
                  :to="`/articles/author/${article.auteur}`"
                  class="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  {{ article.author?.memberName || 'Auteur' }}
                </NuxtLink>
                <span 
                  v-if="article.author?.realName && article.author.realName !== article.author.memberName"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  ({{ article.author.realName }})
                </span>
              </div>
              <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{{ formatDate(article.date) }}</span>
                <span v-if="estimatedReadingTime">{{ estimatedReadingTime }} min de lecture</span>
              </div>
            </div>
          </div>

          <!-- Article stats -->
          <div class="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <!-- Views -->
            <div class="flex items-center space-x-1">
              <Icon name="heroicons:eye" class="w-4 h-4" />
              <span>{{ formatNumber(article.nbClics) }}</span>
            </div>
            
            <!-- Comments -->
            <div class="flex items-center space-x-1">
              <Icon name="heroicons:chat-bubble-left" class="w-4 h-4" />
              <span>{{ article.commentCount || 0 }}</span>
            </div>
            
            <!-- Tags -->
            <div 
              v-if="article.tags" 
              class="hidden sm:flex items-center space-x-1"
            >
              <Icon name="heroicons:tag" class="w-4 h-4" />
              <span>{{ formatTags(article.tags) }}</span>
            </div>
          </div>
        </div>

        <!-- Tags row for mobile -->
        <div 
          v-if="article.tags" 
          class="mt-4 sm:hidden"
        >
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="tag in parsedTags" 
              :key="tag"
              class="inline-block px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Action buttons -->
        <div 
          v-if="showActions" 
          class="mt-6 flex items-center space-x-3"
        >
          <!-- Bookmark -->
          <button
            @click="toggleBookmark"
            :class="[
              'inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors duration-200',
              isBookmarked
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            <Icon 
              :name="isBookmarked ? 'heroicons:bookmark-solid' : 'heroicons:bookmark'" 
              class="w-4 h-4" 
            />
            <span>{{ isBookmarked ? 'Enregistré' : 'Enregistrer' }}</span>
          </button>

          <!-- Share -->
          <button
            @click="$emit('share')"
            class="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Icon name="heroicons:share" class="w-4 h-4" />
            <span>Partager</span>
          </button>

          <!-- Print -->
          <button
            @click="$emit('print')"
            class="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Icon name="heroicons:printer" class="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Article } from '~/types'

interface Props {
  article: Article
  showActions?: boolean
  estimatedReadingTime?: number
}

interface Emits {
  share: []
  print: []
  bookmark: [bookmarked: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const emit = defineEmits<Emits>()

// State
const isBookmarked = ref(false)

// Computed
const heroImage = computed(() => {
  return props.article.imgunebig || props.article.img
})

const parsedTags = computed(() => {
  if (!props.article.tags) return []
  return props.article.tags.split(',').map(tag => tag.trim()).filter(Boolean)
})

// Methods
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return Math.floor(num / 1000000) + 'M'
  }
  if (num >= 1000) {
    return Math.floor(num / 1000) + 'k'
  }
  return num.toString()
}

const formatTags = (tags: string) => {
  const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean)
  if (tagList.length <= 3) {
    return tagList.map(tag => `#${tag}`).join(', ')
  }
  return `${tagList.slice(0, 2).map(tag => `#${tag}`).join(', ')}, +${tagList.length - 2}`
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const toggleBookmark = () => {
  isBookmarked.value = !isBookmarked.value
  emit('bookmark', isBookmarked.value)
  
  // Store bookmark status
  const bookmarks = JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
  if (isBookmarked.value) {
    bookmarks.push(props.article.idArt)
  } else {
    const index = bookmarks.indexOf(props.article.idArt)
    if (index > -1) {
      bookmarks.splice(index, 1)
    }
  }
  localStorage.setItem('article-bookmarks', JSON.stringify(bookmarks))
}

// Load bookmark status
onMounted(() => {
  const bookmarks = JSON.parse(localStorage.getItem('article-bookmarks') || '[]')
  isBookmarked.value = bookmarks.includes(props.article.idArt)
})
</script>

<style scoped>
.article-header {
  @apply relative;
}

.article-header img {
  @apply transition-transform duration-300 hover:scale-105;
}

/* Responsive text adjustments */
@media (max-width: 640px) {
  .article-header h1 {
    @apply text-2xl;
  }
  
  .article-header p {
    @apply text-base;
  }
}
</style>