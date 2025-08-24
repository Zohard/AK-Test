<template>
  <Teleport to="body">
    <div 
      v-if="show"
      class="share-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      @click="handleBackdropClick"
      @keydown.esc="close"
    >
      <!-- Modal Content -->
      <div 
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Partager
          </h3>
          <button
            @click="close"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fermer"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Share Preview -->
          <div class="mb-6">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div class="flex space-x-3">
                <div v-if="shareData.image" class="flex-shrink-0">
                  <img 
                    :src="shareData.image" 
                    :alt="shareData.title"
                    class="w-16 h-16 object-cover rounded-lg"
                  >
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                    {{ shareData.title }}
                  </h4>
                  <p v-if="shareData.text" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {{ shareData.text }}
                  </p>
                  <p class="text-xs text-blue-600 dark:text-blue-400 truncate">
                    {{ fullUrl }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="mb-6">
            <div class="grid grid-cols-2 gap-3">
              <!-- Native Share (if available) -->
              <button
                v-if="showNativeShare"
                @click="handleNativeShare"
                class="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Icon name="heroicons:share" class="w-5 h-5" />
                <span class="text-sm font-medium">Partager</span>
              </button>

              <!-- Copy Link -->
              <button
                @click="handleCopyLink"
                :class="[
                  'flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors',
                  copied 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
              >
                <Icon :name="copied ? 'heroicons:check' : 'heroicons:clipboard'" class="w-5 h-5" />
                <span class="text-sm font-medium">{{ copied ? 'Copié !' : 'Copier le lien' }}</span>
              </button>

              <!-- Email Share (if no native share) -->
              <button
                v-if="!showNativeShare"
                @click="handleEmailShare"
                class="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Icon name="heroicons:envelope" class="w-5 h-5" />
                <span class="text-sm font-medium">Email</span>
              </button>
            </div>
          </div>

          <!-- Social Platforms -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Partager sur les réseaux sociaux
            </h4>
            <div class="grid grid-cols-4 gap-3">
              <button
                v-for="platform in visiblePlatforms"
                :key="platform.name"
                @click="handlePlatformShare(platform.name)"
                :class="[
                  'flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:scale-105',
                  platform.color
                ]"
                :title="`Partager sur ${platform.name}`"
              >
                <Icon :name="platform.icon" class="w-6 h-6 mb-1" />
                <span class="text-xs font-medium">{{ platform.name }}</span>
              </button>
            </div>
            
            <!-- Show More Platforms -->
            <div v-if="hiddenPlatforms.length > 0" class="mt-3">
              <button
                @click="showAllPlatforms = !showAllPlatforms"
                class="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {{ showAllPlatforms ? 'Moins d\'options' : `${hiddenPlatforms.length} autres options` }}
                <Icon 
                  :name="showAllPlatforms ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" 
                  class="w-4 h-4 inline ml-1" 
                />
              </button>
              
              <div v-if="showAllPlatforms" class="grid grid-cols-4 gap-3 mt-3">
                <button
                  v-for="platform in hiddenPlatforms"
                  :key="platform.name"
                  @click="handlePlatformShare(platform.name)"
                  :class="[
                    'flex flex-col items-center justify-center p-3 rounded-lg transition-all hover:scale-105',
                    platform.color
                  ]"
                  :title="`Partager sur ${platform.name}`"
                >
                  <Icon :name="platform.icon" class="w-6 h-6 mb-1" />
                  <span class="text-xs font-medium">{{ platform.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Share Stats (optional) -->
          <div v-if="showStats && shareStats" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Statistiques de partage
            </h4>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div v-for="(count, platform) in shareStats" :key="platform" class="text-sm">
                <div class="font-semibold text-gray-900 dark:text-white">{{ count }}</div>
                <div class="text-gray-500 dark:text-gray-400 capitalize">{{ platform }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ShareData } from '~/composables/useSocialShare'

interface Props {
  show: boolean
  shareData: ShareData
  showStats?: boolean
}

interface Emits {
  close: []
  shared: [platform: string]
}

const props = withDefaults(defineProps<Props>(), {
  showStats: false
})

const emit = defineEmits<Emits>()

const { 
  platforms, 
  shareToPlatform, 
  shareNative, 
  shareToClipboard, 
  shareViaEmail,
  getShareStats 
} = useSocialShare()

const route = useRoute()
const config = useRuntimeConfig()

// State
const copied = ref(false)
const showAllPlatforms = ref(false)
const shareStats = ref<Record<string, number> | null>(null)

// Computed
const baseUrl = computed(() => config.public.siteUrl || (process.client ? window.location.origin : ''))
const fullUrl = computed(() => props.shareData.url || `${baseUrl.value}${route.fullPath}`)

const showNativeShare = computed(() => {
  return typeof navigator !== 'undefined' && navigator.share
})

const visiblePlatforms = computed(() => {
  return platforms.slice(0, showAllPlatforms.value ? platforms.length : 8)
})

const hiddenPlatforms = computed(() => {
  return showAllPlatforms.value ? [] : platforms.slice(8)
})

// Methods
const close = () => {
  emit('close')
  // Reset state
  copied.value = false
  showAllPlatforms.value = false
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close()
  }
}

const handleNativeShare = async () => {
  try {
    const success = await shareNative(props.shareData)
    if (success) {
      emit('shared', 'native')
      close()
    }
  } catch (error) {
    console.error('Native share failed:', error)
  }
}

const handleCopyLink = async () => {
  try {
    const success = await shareToClipboard(props.shareData)
    if (success) {
      copied.value = true
      emit('shared', 'clipboard')
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        copied.value = false
      }, 3000)
    }
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

const handleEmailShare = () => {
  shareViaEmail(props.shareData)
  emit('shared', 'email')
}

const handlePlatformShare = async (platformName: string) => {
  try {
    await shareToPlatform(platformName, props.shareData)
    emit('shared', platformName.toLowerCase())
  } catch (error) {
    console.error(`Share to ${platformName} failed:`, error)
  }
}

// Load share stats if needed
onMounted(() => {
  if (props.showStats) {
    shareStats.value = getShareStats()
  }
})

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
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
</script>

<style scoped>
.share-modal {
  backdrop-filter: blur(4px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
