<template>
  <div class="forum-panel">
    <div class="panel-header">
      <div class="header-content">
        <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-6 h-6 text-blue-500" />
        <h3 class="panel-title">Derniers messages</h3>
      </div>
      <NuxtLink to="/forums" class="panel-link">
        <span>Voir tout</span>
        <Icon name="heroicons:arrow-right" class="w-4 h-4" />
      </NuxtLink>
    </div>

    <div class="panel-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-skeleton" v-for="i in 3" :key="i"></div>
      </div>

      <div v-else class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
          @click="goToMessage(message)"
        >
          <div class="message-header">
            <div class="user-info">
              <div class="user-avatar">
                <img 
                  v-if="message.user.avatar" 
                  :src="message.user.avatar" 
                  :alt="message.user.name"
                  class="avatar-image"
                />
                <div v-else class="avatar-placeholder">
                  {{ message.user.name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="user-details">
                <span class="user-name">{{ message.user.name }}</span>
                <div class="message-meta">
                  <span class="board-name">{{ message.board }}</span>
                  <span class="separator">•</span>
                  <time class="message-time">{{ message.timestamp }}</time>
                </div>
              </div>
            </div>
            <div class="message-stats">
              <div class="stat-item" title="Réponses">
                <Icon name="heroicons:chat-bubble-oval-left" class="w-4 h-4" />
                <span>{{ message.replies }}</span>
              </div>
            </div>
          </div>

          <div class="message-content">
            <h4 class="message-title">{{ message.title }}</h4>
            <p class="message-excerpt">{{ message.excerpt }}</p>
          </div>

          <div class="message-footer">
            <div class="topic-tags" v-if="message.tags.length > 0">
              <span 
                v-for="tag in message.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
            <div class="last-activity">
              <Icon name="heroicons:clock" class="w-3 h-3" />
              <span>{{ message.lastActivity }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error && !loading" class="error-state">
        <Icon name="heroicons:exclamation-triangle" class="w-12 h-12 text-red-400" />
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <button @click="loadForumMessages" class="retry-button">
          <Icon name="heroicons:arrow-path" class="w-4 h-4" />
          Réessayer
        </button>
      </div>

      <div v-else-if="!loading && messages.length === 0" class="empty-state">
        <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-12 h-12 text-gray-400" />
        <p>Aucun message récent</p>
      </div>
    </div>

    <div class="panel-footer">
      <NuxtLink to="/forums" class="forum-cta">
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Rejoindre la discussion
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ForumMessage } from '~/composables/useForumsAPI'

interface DisplayMessage {
  id: number
  topicId?: number
  title: string
  excerpt: string
  user: {
    id: number
    name: string
    avatar?: string
  }
  board: string
  timestamp: string
  lastActivity: string
  replies: number
  tags: string[]
}

const loading = ref(true)
const messages = ref<DisplayMessage[]>([])
const error = ref('')

const { fetchLatestMessages, formatMessageTime, formatLastActivity, buildForumUrl } = useForumsAPI()

const loadForumMessages = async () => {
  try {
    loading.value = true
    error.value = ''
    
    console.log('ForumPanel: Starting to fetch messages...')
    const response = await fetchLatestMessages({ limit: 3 })
    console.log('ForumPanel: Response received:', response)
    
    // Transform API data to display format
    if (response.messages && response.messages.length > 0) {
      console.log('ForumPanel: Using real forum data')
      messages.value = response.messages.map((msg: ForumMessage) => ({
        id: msg.id,
        topicId: msg.topicId,
        title: cleanText(msg.subject),
        excerpt: cleanExcerpt(msg.body || 'Aucun contenu disponible'),
        user: {
          id: msg.memberId,
          name: msg.posterName,
          avatar: undefined
        },
        board: msg.boardName,
        timestamp: formatMessageTime(msg.posterTime),
        lastActivity: formatLastActivity(msg.lastMessageTime || msg.posterTime),
        replies: msg.topicReplies,
        tags: []
      }))
      console.log('ForumPanel: Transformed messages:', messages.value)
    } else {
      console.log('ForumPanel: No messages from API, using mock data')
      useMockData()
    }
    
  } catch (err: any) {
    console.error('ForumPanel: Error loading forum messages:', err)
    error.value = 'Erreur lors du chargement des messages'
    useMockData()
  } finally {
    loading.value = false
    console.log('ForumPanel: Loading finished, messages count:', messages.value.length)
  }
}

const cleanText = (text: string): string => {
  // Create a temporary DOM element to decode HTML entities
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = text
  let decodedText = tempDiv.textContent || tempDiv.innerText || text
  
  // Additional manual replacements for common entities that might not be decoded
  decodedText = decodedText
    .replace(/&#33;/g, '!')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (match, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
  
  return decodedText
}

const cleanExcerpt = (text: string): string => {
  const cleanedText = cleanText(text)
  // Truncate and add ellipsis if needed
  return cleanedText.length > 150 ? cleanedText.substring(0, 150) + '...' : cleanedText
}

const useMockData = () => {
  console.log('ForumPanel: Using mock data as fallback')
  messages.value = [
    {
      id: 1,
      title: "Votre anime préféré de cette saison ?",
      excerpt: "Salut tout le monde ! Je suis curieux de savoir quels sont vos animes préférés de cette saison d'automne.",
      user: { id: 1, name: "OtakuMaster", avatar: undefined },
      board: "Discussion générale",
      timestamp: "Il y a 2h",
      lastActivity: "1h",
      replies: 23,
      tags: []
    },
    {
      id: 2,
      title: "Critique détaillée : Attack on Titan Final",
      excerpt: "Après avoir terminé la série, je voulais partager mes impressions sur cette conclusion épique.",
      user: { id: 2, name: "CritiqueAnime", avatar: undefined },
      board: "Critiques",
      timestamp: "Il y a 3h",
      lastActivity: "2h",
      replies: 45,
      tags: []
    },
    {
      id: 3,
      title: "Où regarder légalement les derniers épisodes ?",
      excerpt: "Bonjour, je cherche des plateformes légales pour suivre les nouveautés.",
      user: { id: 3, name: "DebutantAnime", avatar: undefined },
      board: "Aide & Questions",
      timestamp: "Il y a 4h",
      lastActivity: "3h",
      replies: 12,
      tags: []
    }
  ]
}

const goToMessage = (message: DisplayMessage) => {
  // For real forum data, use topicId to navigate to the topic
  if (message.topicId) {
    // Navigate to the SMF forum topic directly
    const forumUrl = buildForumUrl(message.topicId, message.id)
    window.open(forumUrl, '_blank')
  } else {
    // For mock data, just go to the main forum
    navigateTo('/forums')
  }
}

onMounted(async () => {
  await loadForumMessages()
})
</script>

<style scoped>
.forum-panel {
  @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col;
}

.panel-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.header-content {
  @apply flex items-center gap-2;
}

.panel-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.panel-link {
  @apply flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors;
}

.panel-content {
  @apply flex-1 overflow-hidden;
}

.loading-state {
  @apply p-4 space-y-4;
}

.loading-skeleton {
  @apply h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse;
}

.messages-list {
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.message-item {
  @apply p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors;
}

.message-header {
  @apply flex items-start justify-between mb-3;
}

.user-info {
  @apply flex items-start gap-3 flex-1;
}

.user-avatar {
  @apply flex-shrink-0;
}

.avatar-image {
  @apply w-8 h-8 rounded-full object-cover;
}

.avatar-placeholder {
  @apply w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold;
}

.user-details {
  @apply flex-1 min-w-0;
}

.user-name {
  @apply font-medium text-gray-900 dark:text-white text-sm;
}

.message-meta {
  @apply flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5;
}

.board-name {
  @apply text-blue-600 dark:text-blue-400;
}

.separator {
  @apply text-gray-300;
}

.message-stats {
  @apply flex-shrink-0;
}

.stat-item {
  @apply flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400;
}

.message-content {
  @apply mb-3;
}

.message-title {
  @apply font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-1;
}

.message-excerpt {
  @apply text-gray-600 dark:text-gray-300 text-sm line-clamp-2 leading-relaxed;
}

.message-footer {
  @apply flex items-center justify-between;
}

.topic-tags {
  @apply flex gap-1 flex-wrap;
}

.tag {
  @apply px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full;
}

.last-activity {
  @apply flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500;
}

.error-state {
  @apply flex flex-col items-center justify-center p-8 text-center;
}

.retry-button {
  @apply flex items-center gap-2 mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors;
}

.empty-state {
  @apply flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400;
}

.panel-footer {
  @apply p-4 border-t border-gray-200 dark:border-gray-700;
}

.forum-cta {
  @apply flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm;
}

@media (max-width: 1024px) {
  .message-item {
    @apply p-3;
  }
  
  .user-info {
    @apply gap-2;
  }
  
  .message-title {
    @apply text-xs;
  }
  
  .message-excerpt {
    @apply text-xs line-clamp-1;
  }
}
</style>