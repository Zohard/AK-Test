<template>
  <div :class="gridClasses">
    <!-- Loading skeletons -->
    <template v-if="loading">
      <div 
        v-for="n in skeletonCount" 
        :key="`skeleton-${n}`"
        class="article-skeleton"
      >
        <div class="skeleton-image aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse"></div>
        <div class="skeleton-content p-4 space-y-3">
          <div class="skeleton-badge w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div class="skeleton-title space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
          </div>
          <div class="skeleton-excerpt space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
          </div>
          <div class="skeleton-footer flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div class="flex space-x-3">
              <div class="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Articles grid -->
    <template v-else>
      <ArticleCard
        v-for="article in articles"
        :key="article.idArt"
        :article="article"
        @view="$emit('articleView', $event)"
        class="article-grid-item"
      />
    </template>

    <!-- Empty state -->
    <div 
      v-if="!loading && articles.length === 0"
      class="col-span-full flex flex-col items-center justify-center py-16 text-center"
    >
      <Icon name="heroicons:document-text" class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ emptyTitle || 'Aucun article trouvé' }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-md">
        {{ emptyMessage || 'Il n\'y a pas d\'articles à afficher pour le moment.' }}
      </p>
      <button 
        v-if="showEmptyAction"
        @click="$emit('emptyAction')"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
      >
        {{ emptyActionText || 'Parcourir tous les articles' }}
      </button>
    </div>

    <!-- Pagination -->
    <div 
      v-if="!loading && pagination && pagination.totalPages > 1"
      class="col-span-full mt-8"
    >
      <ArticlePagination
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :has-next="pagination.hasNext"
        :has-previous="pagination.hasPrevious"
        @page-change="$emit('pageChange', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article, ArticlesResponse } from '~/types'

interface Props {
  articles: Article[]
  loading?: boolean
  pagination?: ArticlesResponse['pagination']
  gridCols?: 'auto' | '1' | '2' | '3' | '4' | '5' | '6'
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  skeletonCount?: number
  emptyTitle?: string
  emptyMessage?: string
  emptyActionText?: string
  showEmptyAction?: boolean
}

interface Emits {
  articleView: [article: Article]
  pageChange: [page: number]
  emptyAction: []
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  gridCols: 'auto',
  gap: 'md',
  skeletonCount: 6,
  showEmptyAction: false
})

const emit = defineEmits<Emits>()

// Computed classes for grid layout
const gridClasses = computed(() => {
  const baseClasses = 'grid w-full'
  
  const colsMap = {
    'auto': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    '5': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    '6': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6'
  }
  
  const gapMap = {
    'sm': 'gap-3',
    'md': 'gap-4',
    'lg': 'gap-6',
    'xl': 'gap-8'
  }
  
  return [
    baseClasses,
    colsMap[props.gridCols],
    gapMap[props.gap]
  ].join(' ')
})
</script>

<style scoped>
/* Grid classes are applied directly to the element via :class binding */

.article-skeleton {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden;
}

.article-grid-item {
  @apply w-full;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .article-card-grid {
    @apply gap-3;
  }
}

/* Animation for grid items */
.article-grid-item {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation for multiple items */
.article-grid-item:nth-child(1) { animation-delay: 0.1s; }
.article-grid-item:nth-child(2) { animation-delay: 0.2s; }
.article-grid-item:nth-child(3) { animation-delay: 0.3s; }
.article-grid-item:nth-child(4) { animation-delay: 0.4s; }
.article-grid-item:nth-child(5) { animation-delay: 0.5s; }
.article-grid-item:nth-child(6) { animation-delay: 0.6s; }
</style>