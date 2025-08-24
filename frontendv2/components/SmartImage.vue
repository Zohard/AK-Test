<template>
  <div 
    ref="containerRef"
    :class="[
      'lazy-image-container relative overflow-hidden',
      containerClass
    ]"
    :style="{ aspectRatio: aspectRatio || 'auto' }"
  >
    <!-- Loading skeleton -->
    <div 
      v-if="!loaded && !error"
      :class="[
        'absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
        skeletonClass
      ]"
    >
      <div class="absolute inset-0 flex items-center justify-center">
        <Icon 
          :name="placeholderIcon" 
          class="w-8 h-8 text-gray-400 dark:text-gray-500" 
        />
      </div>
    </div>

    <!-- Error state -->
    <div 
      v-if="error && !loaded"
      :class="[
        'absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
        errorClass
      ]"
    >
      <div class="text-center">
        <Icon 
          name="heroicons:photo" 
          class="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" 
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">Image non disponible</p>
      </div>
    </div>

    <!-- Actual image -->
    <img
      v-if="shouldLoad"
      ref="imageRef"
      :src="optimizedSrc"
      :alt="alt"
      :class="[
        'w-full h-full object-cover transition-opacity duration-300',
        imageClass,
        {
          'opacity-0': !loaded,
          'opacity-100': loaded
        }
      ]"
      :loading="loading"
      :decoding="decoding"
      @load="onLoad"
      @error="onError"
      :sizes="sizes"
      :srcset="srcset"
    />

    <!-- Overlay content -->
    <div v-if="$slots.overlay" class="absolute inset-0">
      <slot name="overlay" :loaded="loaded" :error="error" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  aspectRatio?: string
  lazy?: boolean
  loading?: 'lazy' | 'eager' | 'auto'
  decoding?: 'sync' | 'async' | 'auto'
  placeholderIcon?: string
  containerClass?: string
  imageClass?: string
  skeletonClass?: string
  errorClass?: string
  sizes?: string
  width?: number
  height?: number
  quality?: number
  threshold?: number
  rootMargin?: string
  onlyOnce?: boolean
}

interface Emits {
  load: [event: Event]
  error: [event: Event]
}

const props = withDefaults(defineProps<Props>(), {
  lazy: true,
  loading: 'lazy',
  decoding: 'async',
  placeholderIcon: 'heroicons:photo',
  containerClass: '',
  imageClass: '',
  skeletonClass: '',
  errorClass: '',
  quality: 85,
  threshold: 0.1,
  rootMargin: '50px',
  onlyOnce: true
})

const emit = defineEmits<Emits>()

const { optimizeImageUrl } = useSEO()
const { optimizeForConnection } = usePerformance()
const performanceConfig = optimizeForConnection()

// State
const containerRef = ref<HTMLElement>()
const imageRef = ref<HTMLImageElement>()
const loaded = ref(false)
const error = ref(false)
const shouldLoad = ref(!props.lazy)
const isIntersecting = ref(false)

// Intersection Observer
let observer: IntersectionObserver | null = null

const optimizedSrc = computed(() => {
  // Adjust quality based on connection
  const quality = performanceConfig.connectionType === 'slow-2g' || performanceConfig.connectionType === '2g' 
    ? Math.min(props.quality, 70) 
    : props.quality
    
  return optimizeImageUrl(props.src, props.width, props.height, quality)
})

const srcset = computed(() => {
  if (!props.width || !props.height) return undefined
  
  // Generate responsive srcset
  const baseWidth = props.width
  const sizes = [1, 1.5, 2] // 1x, 1.5x, 2x
  
  return sizes.map(multiplier => {
    const width = Math.round(baseWidth * multiplier)
    const height = Math.round(props.height! * multiplier)
    const url = optimizeImageUrl(props.src, width, height, props.quality)
    return `${url} ${multiplier}x`
  }).join(', ')
})

const setupIntersectionObserver = () => {
  if (!containerRef.value || !props.lazy || typeof window === 'undefined') {
    shouldLoad.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries
      isIntersecting.value = entry.isIntersecting
      
      if (entry.isIntersecting) {
        shouldLoad.value = true
        
        if (props.onlyOnce && observer) {
          observer.disconnect()
        }
      }
    },
    {
      root: null,
      rootMargin: props.rootMargin,
      threshold: props.threshold
    }
  )

  observer.observe(containerRef.value)
}

const onLoad = (event: Event) => {
  loaded.value = true
  error.value = false
  emit('load', event)
}

const onError = (event: Event) => {
  loaded.value = false
  error.value = true
  emit('error', event)
}

// Lifecycle
onMounted(() => {
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Reset state when src changes
watch(() => props.src, () => {
  loaded.value = false
  error.value = false
  
  if (props.lazy && !isIntersecting.value) {
    shouldLoad.value = false
  }
})
</script>

<style scoped>
.lazy-image-container {
  background-color: rgb(243 244 246 / 1); /* bg-gray-100 */
}

@media (prefers-color-scheme: dark) {
  .lazy-image-container {
    background-color: rgb(31 41 55 / 1); /* bg-gray-800 */
  }
}

/* Skeleton animation */
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
  background-size: 468px 100%;
}
</style>