<template>
  <div class="article-social-share">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      Partager cet article
    </h3>
    
    <div class="flex flex-wrap gap-3">
      <!-- Facebook -->
      <button
        @click="shareOnFacebook"
        class="social-share-btn bg-blue-600 hover:bg-blue-700 text-white"
        title="Partager sur Facebook"
      >
        <Icon name="heroicons:square-2-stack" class="w-4 h-4" />
        <span>Facebook</span>
      </button>

      <!-- Twitter/X -->
      <button
        @click="shareOnTwitter"
        class="social-share-btn bg-black hover:bg-gray-800 text-white"
        title="Partager sur Twitter/X"
      >
        <Icon name="heroicons:chat-bubble-bottom-center-text" class="w-4 h-4" />
        <span>Twitter</span>
      </button>

      <!-- LinkedIn -->
      <button
        @click="shareOnLinkedIn"
        class="social-share-btn bg-blue-700 hover:bg-blue-800 text-white"
        title="Partager sur LinkedIn"
      >
        <Icon name="heroicons:briefcase" class="w-4 h-4" />
        <span>LinkedIn</span>
      </button>

      <!-- WhatsApp -->
      <button
        @click="shareOnWhatsApp"
        class="social-share-btn bg-green-500 hover:bg-green-600 text-white"
        title="Partager sur WhatsApp"
      >
        <Icon name="heroicons:chat-bubble-oval-left" class="w-4 h-4" />
        <span>WhatsApp</span>
      </button>

      <!-- Email -->
      <button
        @click="shareByEmail"
        class="social-share-btn bg-gray-600 hover:bg-gray-700 text-white"
        title="Partager par email"
      >
        <Icon name="heroicons:envelope" class="w-4 h-4" />
        <span>Email</span>
      </button>

      <!-- Copy Link -->
      <button
        @click="copyToClipboard"
        :class="[
          'social-share-btn transition-colors duration-200',
          copied 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-gray-500 hover:bg-gray-600 text-white'
        ]"
        title="Copier le lien"
      >
        <Icon 
          :name="copied ? 'heroicons:check' : 'heroicons:link'" 
          class="w-4 h-4" 
        />
        <span>{{ copied ? 'Copié !' : 'Copier' }}</span>
      </button>

      <!-- Native Share (if available) -->
      <button
        v-if="canShare"
        @click="shareNatively"
        class="social-share-btn bg-indigo-600 hover:bg-indigo-700 text-white"
        title="Partager"
      >
        <Icon name="heroicons:share" class="w-4 h-4" />
        <span>Partager</span>
      </button>
    </div>

    <!-- Reading time and stats -->
    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center space-x-4">
          <span v-if="readingTime">{{ readingTime }} min de lecture</span>
          <span>{{ wordCount }} mots</span>
        </div>
        <div class="text-xs">
          Partagé {{ shareCount }} fois
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  url: string
  description?: string
  image?: string
  via?: string
  hashtags?: string[]
}

const props = defineProps<Props>()

// State
const copied = ref(false)
const shareCount = ref(0)
const canShare = ref(false)

// Computed
const encodedTitle = computed(() => encodeURIComponent(props.title))
const encodedUrl = computed(() => encodeURIComponent(props.url))
const encodedDescription = computed(() => encodeURIComponent(props.description || ''))

const readingTime = computed(() => {
  if (!props.description) return 0
  const wordsPerMinute = 200
  const words = props.description.split(' ').length
  return Math.ceil(words / wordsPerMinute)
})

const wordCount = computed(() => {
  if (!props.description) return 0
  return props.description.split(' ').length
})

// Share methods
const shareOnFacebook = () => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}`
  openShareWindow(shareUrl)
  trackShare('facebook')
}

const shareOnTwitter = () => {
  let shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle.value}&url=${encodedUrl.value}`
  
  if (props.via) {
    shareUrl += `&via=${encodeURIComponent(props.via)}`
  }
  
  if (props.hashtags && props.hashtags.length > 0) {
    shareUrl += `&hashtags=${encodeURIComponent(props.hashtags.join(','))}`
  }
  
  openShareWindow(shareUrl)
  trackShare('twitter')
}

const shareOnLinkedIn = () => {
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl.value}&title=${encodedTitle.value}&summary=${encodedDescription.value}`
  openShareWindow(shareUrl)
  trackShare('linkedin')
}

const shareOnWhatsApp = () => {
  const text = `${props.title} - ${props.url}`
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
  openShareWindow(shareUrl)
  trackShare('whatsapp')
}

const shareByEmail = () => {
  const subject = encodeURIComponent(props.title)
  const body = encodeURIComponent(`${props.description || ''}\n\nLire l'article complet : ${props.url}`)
  const shareUrl = `mailto:?subject=${subject}&body=${body}`
  window.location.href = shareUrl
  trackShare('email')
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    trackShare('clipboard')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = props.url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const shareNatively = async () => {
  if (!navigator.share) return
  
  try {
    await navigator.share({
      title: props.title,
      text: props.description || '',
      url: props.url
    })
    trackShare('native')
  } catch (error) {
    // User cancelled sharing or error occurred
    console.log('Native sharing cancelled or failed:', error)
  }
}

const openShareWindow = (url: string) => {
  const width = 600
  const height = 400
  const left = (window.innerWidth - width) / 2
  const top = (window.innerHeight - height) / 2
  
  window.open(
    url,
    'share',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  )
}

const trackShare = (platform: string) => {
  shareCount.value++
  
  // Here you could send analytics events
  console.log(`Article shared on ${platform}:`, {
    title: props.title,
    url: props.url,
    platform
  })
  
  // Example: Google Analytics event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'share', {
      method: platform,
      content_type: 'article',
      item_id: props.url
    })
  }
}

// Lifecycle
onMounted(() => {
  // Check if native sharing is available
  canShare.value = !!navigator.share
  
  // Load share count from localStorage or API
  const stored = localStorage.getItem(`share-count-${props.url}`)
  if (stored) {
    shareCount.value = parseInt(stored, 10) || 0
  }
})

// Watch share count and persist to localStorage
watch(shareCount, (newCount) => {
  localStorage.setItem(`share-count-${props.url}`, newCount.toString())
})
</script>

<style scoped>
.social-share-btn {
  @apply inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md;
}

.social-share-btn:hover {
  @apply transform scale-105;
}

.social-share-btn:active {
  @apply transform scale-95;
}
</style>