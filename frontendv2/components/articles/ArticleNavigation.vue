<template>
  <div class="article-navigation">
    <!-- Previous/Next Navigation -->
    <nav 
      v-if="showPrevNext && (previousArticle || nextArticle)" 
      class="border-t border-b border-gray-200 dark:border-gray-700 py-6"
    >
      <div class="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
        <div class="flex justify-between">
          <!-- Previous Article -->
          <div class="flex-1 pr-4">
            <NuxtLink 
              v-if="previousArticle" 
              :to="`/articles/${previousArticle.niceUrl}`"
              class="group block"
            >
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 mt-1">
                  <Icon 
                    name="heroicons:arrow-left" 
                    class="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" 
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    Article précédent
                  </p>
                  <p class="mt-1 text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                    {{ previousArticle.titre }}
                  </p>
                  <p 
                    v-if="previousArticle.metaDescription" 
                    class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                  >
                    {{ previousArticle.metaDescription }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- Divider -->
          <div 
            v-if="previousArticle && nextArticle" 
            class="w-px bg-gray-200 dark:bg-gray-700 mx-4"
          ></div>

          <!-- Next Article -->
          <div class="flex-1 pl-4">
            <NuxtLink 
              v-if="nextArticle" 
              :to="`/articles/${nextArticle.niceUrl}`"
              class="group block text-right"
            >
              <div class="flex items-start space-x-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    Article suivant
                  </p>
                  <p class="mt-1 text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                    {{ nextArticle.titre }}
                  </p>
                  <p 
                    v-if="nextArticle.metaDescription" 
                    class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                  >
                    {{ nextArticle.metaDescription }}
                  </p>
                </div>
                <div class="flex-shrink-0 mt-1">
                  <Icon 
                    name="heroicons:arrow-right" 
                    class="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" 
                  />
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Related Articles -->
    <section 
      v-if="showRelated && relatedArticles && relatedArticles.length > 0" 
      class="py-12 bg-gray-50 dark:bg-gray-800"
    >
      <div class="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        <div class="text-center mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Articles similaires
          </h2>
          <p class="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Découvrez d'autres articles qui pourraient vous intéresser
          </p>
        </div>

        <!-- Related articles grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ArticleCard
            v-for="article in relatedArticles.slice(0, maxRelated)"
            :key="article.idArt"
            :article="article"
            @view="$emit('relatedArticleView', $event)"
            class="transform hover:scale-105 transition-transform duration-200"
          />
        </div>

        <!-- View more related articles -->
        <div 
          v-if="relatedArticles.length > maxRelated" 
          class="text-center mt-8"
        >
          <button
            @click="$emit('viewMoreRelated')"
            class="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <span>Voir plus d'articles similaires</span>
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- Breadcrumb Navigation -->
    <nav 
      v-if="showBreadcrumb" 
      class="py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
      aria-label="Breadcrumb"
    >
      <div class="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
        <ol class="flex items-center space-x-2 text-sm">
          <!-- Home -->
          <li>
            <NuxtLink 
              to="/" 
              class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <Icon name="heroicons:home" class="w-4 h-4" />
            </NuxtLink>
          </li>
          
          <li>
            <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-400" />
          </li>
          
          <!-- Articles -->
          <li>
            <NuxtLink 
              to="/articles" 
              class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              Articles
            </NuxtLink>
          </li>

          <!-- Category -->
          <template v-if="currentArticle?.categories && currentArticle.categories.length > 0">
            <li>
              <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <NuxtLink 
                :to="`/articles/category/${currentArticle.categories[0].slug || currentArticle.categories[0].id}`"
                class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              >
                {{ currentArticle.categories[0].name }}
              </NuxtLink>
            </li>
          </template>

          <!-- Current article -->
          <li>
            <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-400" />
          </li>
          <li>
            <span class="text-gray-900 dark:text-white font-medium line-clamp-1">
              {{ currentArticle?.titre }}
            </span>
          </li>
        </ol>
      </div>
    </nav>

    <!-- Back to top button -->
    <div 
      v-if="showBackToTop" 
      class="fixed bottom-6 right-6 z-50"
    >
      <button
        @click="scrollToTop"
        :class="[
          'p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200',
          showBackToTopButton ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-90 pointer-events-none'
        ]"
        title="Retour en haut"
      >
        <Icon name="heroicons:arrow-up" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from '~/types'

interface Props {
  currentArticle?: Article
  previousArticle?: Article
  nextArticle?: Article
  relatedArticles?: Article[]
  showPrevNext?: boolean
  showRelated?: boolean
  showBreadcrumb?: boolean
  showBackToTop?: boolean
  maxRelated?: number
}

interface Emits {
  relatedArticleView: [article: Article]
  viewMoreRelated: []
}

const props = withDefaults(defineProps<Props>(), {
  showPrevNext: true,
  showRelated: true,
  showBreadcrumb: true,
  showBackToTop: true,
  maxRelated: 3
})

const emit = defineEmits<Emits>()

// State
const showBackToTopButton = ref(false)

// Methods
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleScroll = () => {
  showBackToTopButton.value = window.scrollY > 300
}

// Lifecycle
onMounted(() => {
  if (props.showBackToTop) {
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position
  }
})

onUnmounted(() => {
  if (props.showBackToTop) {
    window.removeEventListener('scroll', handleScroll)
  }
})

// Watch for route changes to reset scroll position
watch(() => useRoute().path, () => {
  showBackToTopButton.value = false
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-navigation {
  @apply relative;
}

/* Smooth transitions for back to top button */
.fixed button {
  transition: all 0.2s ease-in-out;
}

/* Hover effects for navigation links */
.article-navigation a:hover {
  @apply transform translate-x-1;
}

.article-navigation a[href*="previous"]:hover {
  @apply -translate-x-1;
}

/* Related articles hover effect */
.related-articles .transform:hover {
  @apply shadow-lg;
}
</style>