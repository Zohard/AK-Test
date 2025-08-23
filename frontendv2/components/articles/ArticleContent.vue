<template>
  <article class="article-content max-w-none">
    <!-- Article content wrapper -->
    <div 
      ref="contentRef"
      class="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20"
      v-html="processedContent"
    />

    <!-- Social sharing buttons -->
    <div 
      v-if="showSocialSharing" 
      class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
    >
      <ArticleSocialShare 
        :title="article.titre"
        :url="articleUrl"
        :description="article.metaDescription"
      />
    </div>

    <!-- Print functionality -->
    <div 
      v-if="showPrintButton" 
      class="mt-6 text-center"
    >
      <button
        @click="printArticle"
        class="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <Icon name="heroicons:printer" class="w-4 h-4" />
        <span>Imprimer l'article</span>
      </button>
    </div>

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
  </article>
</template>

<script setup lang="ts">
import type { Article } from '~/types'

interface Props {
  article: Article
  showSocialSharing?: boolean
  showPrintButton?: boolean
  showReadingProgress?: boolean
  baseImageUrl?: string
}

interface Emits {
  contentProcessed: []
  imageClick: [src: string, alt: string]
}

const props = withDefaults(defineProps<Props>(), {
  showSocialSharing: true,
  showPrintButton: true,
  showReadingProgress: true,
  baseImageUrl: ''
})

const emit = defineEmits<Emits>()

const { getArticleImageUrl } = useImageUrl()

// Refs
const contentRef = ref<HTMLElement>()
const readingProgress = ref(0)

// Computed
const articleUrl = computed(() => {
  if (process.client) {
    return window.location.href
  }
  return `/articles/${props.article.niceUrl}`
})

const processedContent = computed(() => {
  if (!props.article.contenu) return ''
  
  let content = props.article.contenu
  
  // Process images - handle imgunebig and imgunebig2
  content = processImages(content)
  
  // Process BBCode-like formatting
  content = processBBCode(content)
  
  // Process line breaks
  content = processLineBreaks(content)
  
  // Process links
  content = processLinks(content)
  
  // Clean up any remaining tags
  content = sanitizeContent(content)
  
  return content
})

// Methods
const processImages = (content: string): string => {
  // Handle image galleries and individual images
  content = content.replace(/\[img\]([^\[]*)\[\/img\]/gi, (match, src) => {
    const cleanSrc = src.trim()
    const fullSrc = getArticleImageUrl(cleanSrc) || cleanSrc
    return `<img src="${fullSrc}" alt="Article image" class="article-image mx-auto rounded-lg shadow-md cursor-pointer" onclick="openImageModal('${fullSrc}', 'Article image')" loading="lazy" />`
  })
  
  // Handle imgunebig references
  if (props.article.imgunebig) {
    const processedImageBig = getArticleImageUrl(props.article.imgunebig) || props.article.imgunebig
    content = content.replace(/\{imgunebig\}/gi, `<img src="${processedImageBig}" alt="Article image" class="article-image mx-auto rounded-lg shadow-md cursor-pointer" onclick="openImageModal('${processedImageBig}', 'Article image')" loading="lazy" />`)
  }
  
  // Handle imgunebig2 references
  if (props.article.imgunebig2) {
    const processedImageBig2 = getArticleImageUrl(props.article.imgunebig2) || props.article.imgunebig2
    content = content.replace(/\{imgunebig2\}/gi, `<img src="${processedImageBig2}" alt="Article image" class="article-image mx-auto rounded-lg shadow-md cursor-pointer" onclick="openImageModal('${processedImageBig2}', 'Article image')" loading="lazy" />`)
  }
  
  return content
}

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
  content = content.replace(/\[quote\](.*?)\[\/quote\]/gi, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-4">$1</blockquote>')
  content = content.replace(/\[quote=([^\]]+)\](.*?)\[\/quote\]/gi, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-4"><cite class="font-semibold">$1 :</cite><br>$2</blockquote>')
  
  // Code
  content = content.replace(/\[code\](.*?)\[\/code\]/gi, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto"><code>$1</code></pre>')
  
  // Lists
  content = content.replace(/\[list\](.*?)\[\/list\]/gi, '<ul class="list-disc list-inside my-4">$1</ul>')
  content = content.replace(/\[\*\](.*?)(?=\[\*\]|\[\/list\])/gi, '<li>$1</li>')
  
  return content
}

const processLinks = (content: string): string => {
  // BBCode links
  content = content.replace(/\[url=([^\]]+)\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$2</a>')
  content = content.replace(/\[url\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
  
  // Auto-link URLs
  const urlRegex = /(https?:\/\/[^\s<>]+)/gi
  content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
  
  return content
}

const processLineBreaks = (content: string): string => {
  // Convert line breaks
  content = content.replace(/\r\n/g, '<br>')
  content = content.replace(/\n/g, '<br>')
  content = content.replace(/\[br\]/gi, '<br>')
  
  return content
}

const sanitizeContent = (content: string): string => {
  // Remove any potentially harmful scripts while preserving formatting
  content = content.replace(/<script[^>]*>.*?<\/script>/gi, '')
  content = content.replace(/javascript:/gi, '')
  content = content.replace(/on\w+\s*=/gi, '')
  
  return content
}

const printArticle = () => {
  const printContent = `
    <html>
      <head>
        <title>${props.article.titre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .article-meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          img { max-width: 100%; height: auto; margin: 20px 0; }
          blockquote { border-left: 4px solid #ccc; padding-left: 20px; margin: 20px 0; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${props.article.titre}</h1>
        <div class="article-meta">
          <p>Par ${props.article.author?.memberName || 'Auteur'} - ${formatDate(props.article.date)}</p>
        </div>
        <div>${processedContent.value}</div>
      </body>
    </html>
  `
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Reading progress tracking
const updateReadingProgress = () => {
  if (!contentRef.value) return
  
  const element = contentRef.value
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
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
  (window as any).openImageModal = (src: string, alt: string) => {
    emit('imageClick', src, alt)
  }
}

// Lifecycle
onMounted(() => {
  if (props.showReadingProgress) {
    window.addEventListener('scroll', updateReadingProgress)
    window.addEventListener('resize', updateReadingProgress)
    updateReadingProgress()
  }
  
  // Process any post-mount content adjustments
  nextTick(() => {
    emit('contentProcessed')
  })
})

onUnmounted(() => {
  if (props.showReadingProgress) {
    window.removeEventListener('scroll', updateReadingProgress)
    window.removeEventListener('resize', updateReadingProgress)
  }
})
</script>

<style scoped>
.article-content {
  @apply text-gray-800 dark:text-gray-200;
}

.article-content :deep(.article-image) {
  @apply max-w-full h-auto my-6 rounded-lg shadow-lg;
}

.article-content :deep(blockquote) {
  @apply border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 my-6 rounded-r-lg;
}

.article-content :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-6 overflow-x-auto;
}

.article-content :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm;
}

.article-content :deep(ul), 
.article-content :deep(ol) {
  @apply my-4 pl-6;
}

.article-content :deep(li) {
  @apply mb-2;
}

.article-content :deep(table) {
  @apply w-full my-6 border-collapse;
}

.article-content :deep(th),
.article-content :deep(td) {
  @apply border border-gray-300 dark:border-gray-600 px-4 py-2;
}

.article-content :deep(th) {
  @apply bg-gray-100 dark:bg-gray-800 font-semibold;
}

@media print {
  .article-content {
    @apply text-black;
  }
}
</style>