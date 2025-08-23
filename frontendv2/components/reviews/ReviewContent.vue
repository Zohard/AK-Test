<template>
  <div class="review-content">
    <!-- Content wrapper -->
    <div 
      ref="contentRef"
      class="text-gray-900 dark:text-white leading-relaxed"
      v-html="processedContent"
    />

    <!-- Reading progress indicator -->
    <div 
      v-if="showReadingProgress"
      class="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50"
    >
      <div 
        class="h-full bg-blue-600 transition-all duration-150 ease-out"
        :style="{ width: `${readingProgress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content?: string
  showReadingProgress?: boolean
  enableImageModal?: boolean
}

interface Emits {
  'image-click': [src: string, alt: string]
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  showReadingProgress: false,
  enableImageModal: true
})

const emit = defineEmits<Emits>()

// Refs
const contentRef = ref<HTMLElement>()
const readingProgress = ref(0)

// Computed
const processedContent = computed(() => {
  if (!props.content) return '<p class="text-gray-500 italic">Aucun contenu disponible.</p>'
  
  let content = props.content
  
  // Process BBCode-like formatting
  content = processBBCode(content)
  
  // Process line breaks
  content = processLineBreaks(content)
  
  // Process links
  content = processLinks(content)
  
  // Process images
  content = processImages(content)
  
  // Clean up any potentially harmful scripts
  content = sanitizeContent(content)
  
  return content
})

// Methods
const processBBCode = (content: string): string => {
  // Bold
  content = content.replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
  
  // Italic
  content = content.replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
  
  // Underline
  content = content.replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
  
  // Size
  content = content.replace(/\[size=(\d+)\](.*?)\[\/size\]/gi, '<span style="font-size: $1px">$2</span>')
  
  // Color
  content = content.replace(/\[color=([^\]]+)\](.*?)\[\/color\]/gi, '<span style="color: $1">$2</span>')
  
  // Quote
  content = content.replace(/\[quote\](.*?)\[\/quote\]/gi, '<blockquote class="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 my-4 italic rounded-r-lg">$1</blockquote>')
  content = content.replace(/\[quote=([^\]]+)\](.*?)\[\/quote\]/gi, '<blockquote class="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 my-4 rounded-r-lg"><cite class="font-semibold not-italic text-blue-700 dark:text-blue-300">$1 a dit :</cite><br><span class="italic">$2</span></blockquote>')
  
  // Code
  content = content.replace(/\[code\](.*?)\[\/code\]/gi, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto my-4"><code>$1</code></pre>')
  
  // Lists
  content = content.replace(/\[list\](.*?)\[\/list\]/gi, '<ul class="list-disc list-inside my-4 space-y-1">$1</ul>')
  content = content.replace(/\[\*\](.*?)(?=\[\*\]|\[\/list\]|$)/gi, '<li class="ml-2">$1</li>')
  
  // Center
  content = content.replace(/\[center\](.*?)\[\/center\]/gi, '<div class="text-center">$1</div>')
  
  // Spoiler
  content = content.replace(/\[spoiler\](.*?)\[\/spoiler\]/gi, '<details class="bg-gray-100 dark:bg-gray-800 p-3 rounded-md my-4"><summary class="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Cliquez pour révéler le spoiler</summary><div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">$1</div></details>')
  
  return content
}

const processLinks = (content: string): string => {
  // BBCode links
  content = content.replace(/\[url=([^\]]+)\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$2</a>')
  content = content.replace(/\[url\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
  
  // Auto-link URLs (but avoid double-linking already processed URLs)
  const urlRegex = /(?<!href=["'])(https?:\/\/[^\s<>]+)(?![^<]*>)/gi
  content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
  
  return content
}

const processImages = (content: string): string => {
  // BBCode images
  content = content.replace(/\[img\]([^\[]*)\[\/img\]/gi, (match, src) => {
    const cleanSrc = src.trim()
    const clickHandler = props.enableImageModal 
      ? `onclick="window.handleReviewImageClick && window.handleReviewImageClick('${cleanSrc}', 'Image de la critique')"` 
      : ''
    
    return `<img src="${cleanSrc}" alt="Image de la critique" class="max-w-full h-auto rounded-lg shadow-md my-6 cursor-pointer hover:shadow-lg transition-shadow" ${clickHandler} loading="lazy" />`
  })
  
  // Image with alt text
  content = content.replace(/\[img=([^\]]+)\]([^\[]*)\[\/img\]/gi, (match, alt, src) => {
    const cleanSrc = src.trim()
    const cleanAlt = alt.trim()
    const clickHandler = props.enableImageModal 
      ? `onclick="window.handleReviewImageClick && window.handleReviewImageClick('${cleanSrc}', '${cleanAlt}')"` 
      : ''
    
    return `<img src="${cleanSrc}" alt="${cleanAlt}" class="max-w-full h-auto rounded-lg shadow-md my-6 cursor-pointer hover:shadow-lg transition-shadow" ${clickHandler} loading="lazy" />`
  })
  
  return content
}

const processLineBreaks = (content: string): string => {
  // Convert line breaks
  content = content.replace(/\r\n/g, '\n')
  content = content.replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
  content = content.replace(/\n/g, '<br>')
  content = content.replace(/\[br\]/gi, '<br>')
  
  // Convert double line breaks to paragraphs
  content = content.replace(/(<br>\s*){2,}/gi, '</p><p>')
  content = `<p>${content}</p>`
  
  // Clean up empty paragraphs
  content = content.replace(/<p>\s*<\/p>/gi, '')
  content = content.replace(/^<p>\s*<br>\s*/, '<p>')
  content = content.replace(/\s*<br>\s*<\/p>$/, '</p>')
  
  return content
}

const sanitizeContent = (content: string): string => {
  // Remove potentially harmful scripts
  content = content.replace(/<script[^>]*>.*?<\/script>/gi, '')
  content = content.replace(/javascript:/gi, '')
  content = content.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers except our image click handler
  
  // But preserve our image click handler
  content = content.replace(/onclick="window\.handleReviewImageClick[^"]*"/gi, (match) => match)
  
  return content
}

const updateReadingProgress = () => {
  if (!contentRef.value || !props.showReadingProgress) return
  
  const element = contentRef.value
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight - windowHeight
  const scrollTop = window.scrollY
  
  const elementTop = element.offsetTop
  const elementHeight = element.offsetHeight
  
  if (scrollTop >= elementTop) {
    const progress = Math.min(
      ((scrollTop - elementTop + windowHeight) / elementHeight) * 100,
      100
    )
    readingProgress.value = Math.max(0, progress)
  } else {
    readingProgress.value = 0
  }
}

// Global function for image modal (to be used in processed HTML)
if (process.client) {
  (window as any).handleReviewImageClick = (src: string, alt: string) => {
    emit('image-click', src, alt)
  }
}

// Lifecycle
onMounted(() => {
  if (props.showReadingProgress) {
    window.addEventListener('scroll', updateReadingProgress, { passive: true })
    window.addEventListener('resize', updateReadingProgress, { passive: true })
    updateReadingProgress()
  }
})

onUnmounted(() => {
  if (props.showReadingProgress) {
    window.removeEventListener('scroll', updateReadingProgress)
    window.removeEventListener('resize', updateReadingProgress)
  }
})
</script>

<style scoped>
.review-content {
  @apply text-gray-800 dark:text-gray-200;
}

/* Custom prose styles for review content */
.review-content :deep(p) {
  @apply mb-4 leading-relaxed;
}

.review-content :deep(p:last-child) {
  @apply mb-0;
}

.review-content :deep(h1),
.review-content :deep(h2),
.review-content :deep(h3),
.review-content :deep(h4),
.review-content :deep(h5),
.review-content :deep(h6) {
  @apply font-bold mt-8 mb-4;
}

.review-content :deep(h1) { @apply text-2xl; }
.review-content :deep(h2) { @apply text-xl; }
.review-content :deep(h3) { @apply text-lg; }

.review-content :deep(blockquote) {
  @apply border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-3 my-6 rounded-r-lg;
}

.review-content :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-6 overflow-x-auto;
}

.review-content :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm;
}

.review-content :deep(ul), 
.review-content :deep(ol) {
  @apply my-4 pl-6 space-y-1;
}

.review-content :deep(li) {
  @apply leading-relaxed;
}

.review-content :deep(img) {
  @apply max-w-full h-auto rounded-lg shadow-md my-6 cursor-pointer transition-all duration-200;
}

.review-content :deep(img:hover) {
  @apply shadow-lg transform scale-105;
}

.review-content :deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline transition-colors;
}

.review-content :deep(details) {
  @apply bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4;
}

.review-content :deep(summary) {
  @apply cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors;
}

/* Reading progress bar */
.reading-progress {
  @apply fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50;
}

.reading-progress-bar {
  @apply h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-150 ease-out;
}
</style>