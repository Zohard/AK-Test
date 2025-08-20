<template>
  <nav class="flex items-center justify-between" aria-label="Pagination">
    <!-- Mobile pagination -->
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        @click="goToPrevious"
        :disabled="!hasPrevious"
        :class="[
          'relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md',
          hasPrevious
            ? 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-not-allowed'
        ]"
      >
        Précédent
      </button>
      <button
        @click="goToNext"
        :disabled="!hasNext"
        :class="[
          'relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md',
          hasNext
            ? 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-not-allowed'
        ]"
      >
        Suivant
      </button>
    </div>

    <!-- Desktop pagination -->
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Page <span class="font-medium">{{ currentPage }}</span> sur 
          <span class="font-medium">{{ totalPages }}</span>
        </p>
      </div>
      <div>
        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <!-- Previous button -->
          <button
            @click="goToPrevious"
            :disabled="!hasPrevious"
            :class="[
              'relative inline-flex items-center rounded-l-md px-2 py-2 text-sm font-medium ring-1 ring-inset focus:z-20 focus:outline-offset-0',
              hasPrevious
                ? 'text-gray-400 ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700'
                : 'text-gray-300 dark:text-gray-600 ring-gray-200 dark:ring-gray-700 cursor-not-allowed'
            ]"
          >
            <Icon name="heroicons:chevron-left" class="h-5 w-5" />
          </button>

          <!-- Page numbers -->
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              @click="goToPage(page as number)"
              :class="[
                'relative inline-flex items-center px-4 py-2 text-sm font-medium ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:z-20 focus:outline-offset-0',
                page === currentPage
                  ? 'z-10 bg-blue-600 text-white focus:bg-blue-500'
                  : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
            >
              ...
            </span>
          </template>

          <!-- Next button -->
          <button
            @click="goToNext"
            :disabled="!hasNext"
            :class="[
              'relative inline-flex items-center rounded-r-md px-2 py-2 text-sm font-medium ring-1 ring-inset focus:z-20 focus:outline-offset-0',
              hasNext
                ? 'text-gray-400 ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700'
                : 'text-gray-300 dark:text-gray-600 ring-gray-200 dark:ring-gray-700 cursor-not-allowed'
            ]"
          >
            <Icon name="heroicons:chevron-right" class="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  maxVisiblePages?: number
}

interface Emits {
  pageChange: [page: number]
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 7
})

const emit = defineEmits<Emits>()

// Generate visible page numbers with ellipsis
const visiblePages = computed(() => {
  const { currentPage, totalPages, maxVisiblePages } = props
  const pages: (number | string)[] = []
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    const halfMax = Math.floor(maxVisiblePages / 2)
    
    if (currentPage <= halfMax + 1) {
      // Show first pages + ellipsis + last
      for (let i = 1; i <= maxVisiblePages - 2; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - halfMax) {
      // Show first + ellipsis + last pages
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - (maxVisiblePages - 3); i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first + ellipsis + middle + ellipsis + last
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - halfMax + 2; i <= currentPage + halfMax - 2; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    }
  }
  
  return pages
})

// Navigation methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('pageChange', page)
  }
}

const goToNext = () => {
  if (props.hasNext) {
    goToPage(props.currentPage + 1)
  }
}

const goToPrevious = () => {
  if (props.hasPrevious) {
    goToPage(props.currentPage - 1)
  }
}
</script>

<style scoped>
button:focus {
  @apply outline-none;
}

button:disabled {
  @apply cursor-not-allowed;
}
</style>