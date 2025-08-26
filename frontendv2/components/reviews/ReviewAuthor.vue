<template>
  <div class="review-author flex items-start space-x-4">
    <!-- Author Avatar -->
    <div class="flex-shrink-0">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="`Avatar de ${authorName}`"
        class="w-16 h-16 rounded-full shadow-sm"
        @error="onAvatarError"
      />
      <div 
        v-else
        :class="[
          'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm',
          `bg-gradient-to-br ${authorGradient}`
        ]"
      >
        {{ authorInitial }}
      </div>
    </div>

    <!-- Author Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <!-- Author Name -->
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
            <NuxtLink 
              v-if="authorUrl"
              :to="authorUrl"
              class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {{ authorName }}
            </NuxtLink>
            <span v-else>{{ authorName }}</span>
            
            <!-- Badges -->
            <span v-if="isVerified" class="ml-2 inline-flex">
              <Icon 
                name="heroicons:check-badge-solid" 
                class="w-5 h-5 text-blue-500"
                title="Membre vérifié"
              />
            </span>
          </h4>

          <!-- Author Stats -->
          <div class="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center space-x-1">
              <Icon name="heroicons:document-text" class="w-4 h-4" />
              <span>{{ authorStats.reviewsCount }} critiques</span>
            </div>
            
            <div v-if="authorStats.reviewsCount > 0" class="flex items-center space-x-1">
              <Icon name="heroicons:star" class="w-4 h-4 text-yellow-400" />
              <span>{{ authorStats.averageRating }}/10 moyenne</span>
            </div>

            <div class="flex items-center space-x-1">
              <Icon name="heroicons:calendar" class="w-4 h-4" />
              <span>Membre depuis {{ memberSince }}</span>
            </div>
          </div>

          <!-- Review Date -->
          <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <Icon name="heroicons:clock" class="w-4 h-4 inline mr-1" />
            Publié {{ formatReviewDate(reviewDate) }}
          </div>
        </div>

        <!-- Follow Button -->
        <div v-if="showFollowButton" class="flex-shrink-0 ml-4">
          <button
            @click="toggleFollow"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isFollowing
                ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            ]"
          >
            <Icon 
              :name="isFollowing ? 'heroicons:user-minus' : 'heroicons:user-plus'" 
              class="w-4 h-4 inline mr-1" 
            />
            {{ isFollowing ? 'Ne plus suivre' : 'Suivre' }}
          </button>
        </div>
      </div>

      <!-- Author Bio (if available) -->
      <div v-if="authorBio" class="mt-3 text-sm text-gray-600 dark:text-gray-300">
        <p class="line-clamp-2">{{ authorBio }}</p>
      </div>

      <!-- Quick Actions -->
      <div v-if="showQuickActions" class="mt-4 flex flex-wrap gap-2">
        <NuxtLink 
          :to="`/reviews?author=${encodeURIComponent(authorName)}`"
          class="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Icon name="heroicons:document-text" class="w-3 h-3" />
          <span>Toutes ses critiques</span>
        </NuxtLink>
        
        <button
          @click="sendMessage"
          class="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Icon name="heroicons:chat-bubble-left" class="w-3 h-3" />
          <span>Message privé</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: number
  pseudo: string
  avatar?: string
  bio?: string
  isVerified?: boolean
  joinDate?: string
  reviewsCount?: number
  averageRating?: number
}

interface Props {
  author?: Author | { id: number; pseudo: string } | null
  reviewDate?: string
  showFollowButton?: boolean
  showQuickActions?: boolean
}

interface Emits {
  'follow': [authorId: number, isFollowing: boolean]
  'message': [authorId: number]
}

const props = withDefaults(defineProps<Props>(), {
  showFollowButton: false,
  showQuickActions: true
})

const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const { getAvatarUrl, handleImageError } = useImageUrl()

// State
const isFollowing = ref(false)

// Computed properties
const authorName = computed(() => {
  return props.author?.pseudo || 'Utilisateur'
})

const authorUrl = computed(() => {
  if (!props.author?.id) return null
  return `/users/${props.author.id}`
})

const avatarUrl = computed(() => {
  if (!props.author) return null
  
  // If author has avatar field, process it through image URL handler
  if ('avatar' in props.author && props.author.avatar) {
    // Handle problematic external image hosts
    let avatarPath = props.author.avatar
    if (avatarPath.startsWith('https://') && 
        (avatarPath.includes('casimages.com') || avatarPath.includes('imageshack') || avatarPath.includes('hostingpics.net'))) {
      // Convert to HTTP to avoid SSL issues
      avatarPath = avatarPath.replace('https://', 'http://')
    }
    return avatarPath
  }
  
  // No avatar available
  return null
})

const authorInitial = computed(() => {
  return authorName.value.charAt(0).toUpperCase()
})

const authorGradient = computed(() => {
  if (!props.author?.pseudo) return 'from-gray-500 to-gray-600'
  
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600'
  ]
  
  const index = props.author.pseudo.charCodeAt(0) % gradients.length
  return gradients[index]
})

const isVerified = computed(() => {
  if (!props.author || !('isVerified' in props.author)) return false
  return props.author.isVerified || false
})

const authorBio = computed(() => {
  if (!props.author || !('bio' in props.author)) return null
  return props.author.bio || null
})

const authorStats = computed(() => {
  const defaultStats = {
    reviewsCount: 0,
    averageRating: '0.0'
  }
  
  if (!props.author || !('reviewsCount' in props.author)) {
    return defaultStats
  }
  
  return {
    reviewsCount: props.author.reviewsCount || 0,
    averageRating: (props.author.averageRating || 0).toFixed(1)
  }
})

const memberSince = computed(() => {
  if (!props.author || !('joinDate' in props.author) || !props.author.joinDate) {
    return 'longtemps'
  }
  
  const joinDate = new Date(props.author.joinDate)
  const year = joinDate.getFullYear()
  const currentYear = new Date().getFullYear()
  
  if (year === currentYear) {
    return joinDate.toLocaleDateString('fr-FR', { month: 'long' })
  }
  
  return year.toString()
})

// Methods
const formatReviewDate = (dateString?: string) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return 'hier'
  } else if (diffDays < 7) {
    return `il y a ${diffDays} jours`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `il y a ${months} mois`
  } else {
    const years = Math.floor(diffDays / 365)
    return `il y a ${years} an${years > 1 ? 's' : ''}`
  }
}

const toggleFollow = () => {
  if (!authStore.isAuthenticated) {
    navigateTo('/login?redirect=' + encodeURIComponent(useRoute().fullPath))
    return
  }
  
  if (!props.author?.id) return
  
  isFollowing.value = !isFollowing.value
  emit('follow', props.author.id, isFollowing.value)
  
  // TODO: Implement API call
}

const sendMessage = () => {
  if (!authStore.isAuthenticated) {
    navigateTo('/login?redirect=' + encodeURIComponent(useRoute().fullPath))
    return
  }
  
  if (!props.author?.id) return
  
  emit('message', props.author.id)
  
  // TODO: Navigate to messaging system or open modal
  alert('Système de messagerie à venir')
}

const onAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const originalSrc = img.src
  
  // If it's an old image host with SSL issues, try HTTP first
  if (originalSrc.startsWith('https://') && 
      (originalSrc.includes('casimages.com') || originalSrc.includes('imageshack') || originalSrc.includes('hostingpics.net'))) {
    const httpVersion = originalSrc.replace('https://', 'http://')
    if (!img.dataset.httpTried) {
      img.dataset.httpTried = 'true'
      img.src = httpVersion
      return
    }
  }
  
  // Fallback to default avatar
  const fallbackAvatar = getAvatarUrl(undefined, props.author?.id)
  img.src = fallbackAvatar
  img.style.opacity = '0.8'
}

// Load follow status if authenticated
onMounted(async () => {
  if (authStore.isAuthenticated && props.author?.id) {
    try {
      // TODO: Check if following this user
      // const response = await $fetch(`/api/users/${props.author.id}/follow-status`)
      // isFollowing.value = response.isFollowing
    } catch (error) {
      // Ignore error
    }
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>