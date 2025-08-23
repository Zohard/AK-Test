<template>
  <Teleport to="body">
    <div 
      v-if="show"
      class="review-image-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      @click="handleBackdropClick"
      @keydown.esc="close"
    >
      <!-- Modal Content -->
      <div 
        class="relative max-w-7xl max-h-full bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {{ imageAlt || 'Image' }}
          </h3>
          <div class="flex items-center space-x-2">
            <button
              @click="downloadImage"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Télécharger l'image"
            >
              <Icon name="heroicons:arrow-down-tray" class="w-5 h-5" />
            </button>
            <button
              @click="shareImage"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Partager l'image"
            >
              <Icon name="heroicons:share" class="w-5 h-5" />
            </button>
            <button
              @click="close"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Fermer"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Image Container -->
        <div class="relative overflow-auto max-h-[80vh]">
          <div v-if="loading" class="flex items-center justify-center p-12">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement...</span>
          </div>

          <div v-else-if="error" class="flex items-center justify-center p-12 text-center">
            <div>
              <Icon name="heroicons:exclamation-triangle" class="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p class="text-gray-600 dark:text-gray-300">Impossible de charger l'image</p>
              <button 
                @click="retryLoad"
                class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>

          <div v-else class="relative">
            <img
              ref="imageRef"
              :src="imageSrc"
              :alt="imageAlt"
              class="max-w-full h-auto mx-auto block"
              :class="{ 
                'cursor-zoom-in': !isZoomed,
                'cursor-zoom-out': isZoomed,
                'transform transition-transform duration-200': true
              }"
              :style="imageStyle"
              @load="onImageLoad"
              @error="onImageError"
              @click="toggleZoom"
              @mousemove="handleMouseMove"
              @mouseleave="handleMouseLeave"
            />
            
            <!-- Zoom indicator -->
            <div 
              v-if="!isZoomed" 
              class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm"
            >
              Cliquez pour zoomer
            </div>
          </div>
        </div>

        <!-- Footer with image info -->
        <div v-if="!loading && !error" class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center space-x-4">
              <span v-if="imageInfo.dimensions">
                {{ imageInfo.dimensions.width }}×{{ imageInfo.dimensions.height }}
              </span>
              <span v-if="imageInfo.size">
                {{ formatFileSize(imageInfo.size) }}
              </span>
              <span v-if="imageInfo.type">
                {{ imageInfo.type.toUpperCase() }}
              </span>
            </div>
            <div class="text-xs">
              Utilisez la molette pour zoomer, glissez pour déplacer
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  imageSrc: string
  imageAlt?: string
  show?: boolean
}

interface Emits {
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  imageAlt: '',
  show: true
})

const emit = defineEmits<Emits>()

// State
const loading = ref(true)
const error = ref(false)
const isZoomed = ref(false)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const imageInfo = ref({
  dimensions: null as { width: number; height: number } | null,
  size: null as number | null,
  type: null as string | null
})

// Refs
const imageRef = ref<HTMLImageElement>()

// Computed
const imageStyle = computed(() => {
  if (!isZoomed.value) return {}
  
  return {
    transform: `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px)`,
    transformOrigin: 'center center'
  }
})

// Methods
const close = () => {
  // Reset state
  isZoomed.value = false
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
  loading.value = true
  error.value = false
  
  emit('close')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const onImageLoad = () => {
  loading.value = false
  error.value = false
  
  if (imageRef.value) {
    imageInfo.value.dimensions = {
      width: imageRef.value.naturalWidth,
      height: imageRef.value.naturalHeight
    }
    
    // Try to get file size (not always available)
    // This would require additional API call in real implementation
  }
}

const onImageError = () => {
  loading.value = false
  error.value = true
}

const retryLoad = () => {
  loading.value = true
  error.value = false
  
  if (imageRef.value) {
    // Force reload by changing src slightly
    const src = props.imageSrc
    imageRef.value.src = ''
    setTimeout(() => {
      if (imageRef.value) {
        imageRef.value.src = src
      }
    }, 100)
  }
}

const toggleZoom = () => {
  if (!isZoomed.value) {
    isZoomed.value = true
    zoomLevel.value = 2
  } else {
    isZoomed.value = false
    zoomLevel.value = 1
    panX.value = 0
    panY.value = 0
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isZoomed.value || !imageRef.value) return
  
  const rect = imageRef.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  
  // Calculate pan offset based on mouse position
  const maxPanX = (rect.width * (zoomLevel.value - 1)) / 2
  const maxPanY = (rect.height * (zoomLevel.value - 1)) / 2
  
  panX.value = (0.5 - x) * maxPanX
  panY.value = (0.5 - y) * maxPanY
}

const handleMouseLeave = () => {
  if (isZoomed.value) {
    panX.value = 0
    panY.value = 0
  }
}

const downloadImage = async () => {
  try {
    const response = await fetch(props.imageSrc)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading image:', error)
  }
}

const shareImage = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.imageAlt || 'Image partagée',
        url: props.imageSrc
      })
    } catch (error) {
      console.log('Sharing cancelled or failed')
    }
  } else {
    try {
      await navigator.clipboard.writeText(props.imageSrc)
      // TODO: Show toast notification
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    toggleZoom()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // Prevent body scrolling
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  // Restore body scrolling
  document.body.style.overflow = ''
})

// Watch for src changes
watch(() => props.imageSrc, () => {
  loading.value = true
  error.value = false
  isZoomed.value = false
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
})
</script>

<style scoped>
.review-image-modal {
  backdrop-filter: blur(4px);
}

/* Smooth transitions for zoom and pan */
.transform {
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Custom scrollbar for image container */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.overflow-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-600 rounded;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500 dark:bg-gray-500;
}
</style>