# FrontendV2 Migration Roadmap: Node.js API → NestJS API

## 📋 Current State Analysis

**Current Frontend (v1):**
- Nuxt 3 + Vue 3 + TypeScript
- Pinia for state management  
- TailwindCSS for styling
- Connects to Node.js API on port 3001

**Target NestJS API:**
- Modern NestJS architecture
- JWT authentication with refresh tokens
- Comprehensive modules: Auth, Animes, Mangas, Reviews, etc.
- Swagger documentation
- Enhanced security and validation

## 🚀 Migration Roadmap

### **Phase 1: Project Setup & Structure (Week 1)**

#### 1.1 Create FrontendV2 Base
```bash
# Create new frontend directory
mkdir frontendv2
cd frontendv2

# Initialize Nuxt 3 project with latest features
npx nuxi@latest init .
npm install
```

#### 1.2 Install Dependencies
```bash
# Core dependencies from v1 + improvements
npm install @nuxtjs/tailwindcss@latest @pinia/nuxt@latest
npm install axios@latest
npm install @vueuse/core @vueuse/nuxt
npm install @nuxtjs/color-mode  # For dark mode
npm install @headlessui/vue @heroicons/vue  # Better UI components
```

#### 1.3 Configuration Updates
- **nuxt.config.ts**: Update API base to NestJS port (default 3000)
- **Add TypeScript strict mode**
- **Configure proper proxy for NestJS endpoints**

**Example nuxt.config.ts:**
```typescript
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss', 
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode'
  ],
  css: ['~/assets/css/globals.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3000',
      forumUrl: process.env.FORUM_URL || 'http://localhost:8083'
    }
  },
  ssr: true,
  typescript: {
    strict: true,
    typeCheck: true
  },
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### **Phase 2: Authentication System Overhaul (Week 1-2)**

#### 2.1 Update Auth Store (`stores/auth.ts`)

**Breaking Changes:**
- **JWT Refresh Token Flow**: NestJS uses refresh tokens
- **New Endpoints**: `/auth/verify` → `/auth/profile`
- **Response Structure**: Different user object structure

**New Auth Endpoints:**
```typescript
// Authentication endpoints mapping
POST /auth/login        → Returns {access_token, refresh_token, user}
POST /auth/register     → User registration
POST /auth/refresh      → Refresh access token  
GET  /auth/profile      → Get user profile
GET  /auth/verify       → Verify token validity
POST /auth/logout       → Server-side logout
POST /auth/forgot-password → Password reset request
POST /auth/reset-password  → Password reset confirmation
```

**New Auth Store Structure:**
```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const accessToken = ref(null)
  const refreshToken = ref(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)

  // API configuration
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  // Enhanced login with refresh token support
  const login = async (credentials: LoginCredentials) => {
    loading.value = true
    try {
      const response = await $fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: credentials
      })
      
      accessToken.value = response.access_token
      refreshToken.value = response.refresh_token
      user.value = response.user
      isAuthenticated.value = true

      // Store tokens securely
      if (process.client) {
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('refresh_token', response.refresh_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Auto refresh token when needed
  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await $fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      })

      accessToken.value = response.access_token
      user.value = response.user

      if (process.client) {
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      // Refresh failed, logout user
      await logout()
      throw error
    }
  }

  // Enhanced logout with server cleanup
  const logout = async () => {
    try {
      if (accessToken.value) {
        await $fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.value}`
          }
        })
      }
    } catch (error) {
      console.warn('Logout endpoint error:', error)
    } finally {
      clearAuth()
    }
  }

  const clearAuth = () => {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    isAuthenticated.value = false

    if (process.client) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('auth_user')
    }
  }

  // Get headers for authenticated requests
  const getAuthHeaders = () => {
    if (!accessToken.value) return {}
    return {
      'Authorization': `Bearer ${accessToken.value}`
    }
  }

  // Initialize auth state from storage
  const initializeAuth = () => {
    if (process.client) {
      const storedAccessToken = localStorage.getItem('access_token')
      const storedRefreshToken = localStorage.getItem('refresh_token')
      const storedUser = localStorage.getItem('auth_user')

      if (storedAccessToken && storedRefreshToken && storedUser) {
        try {
          accessToken.value = storedAccessToken
          refreshToken.value = storedRefreshToken
          user.value = JSON.parse(storedUser)
          isAuthenticated.value = true
        } catch (error) {
          console.error('Error initializing auth:', error)
          clearAuth()
        }
      }
    }
  }

  // Admin check
  const isAdmin = computed(() => {
    return user.value && (user.value.isAdmin === true || user.value.role === 'admin')
  })

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    loading,
    isAdmin,
    login,
    logout,
    refreshAccessToken,
    clearAuth,
    getAuthHeaders,
    initializeAuth
  }
})
```

#### 2.2 HTTP Interceptor for Auto Token Refresh
```typescript
// plugins/api-interceptor.client.ts
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  // Response interceptor for auto token refresh
  $fetch.create({
    baseURL: config.public.apiBase,
    onResponseError({ response }) {
      if (response.status === 401 && authStore.refreshToken) {
        // Try to refresh token
        return authStore.refreshAccessToken().then(() => {
          // Retry original request with new token
          return $fetch(response.url, {
            headers: authStore.getAuthHeaders()
          })
        })
      }
    }
  })
})
```

### **Phase 3: API Integration & Composables (Week 2-3)**

#### 3.1 Enhanced API Composables

**useAnimeAPI.ts** (Updated):
```typescript
// composables/useAnimeAPI.ts
import type { AnimeQueryParams, AnimeResponse, Anime } from '~/types/anime'

export function useAnimeAPI() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  
  const API_BASE = config.public.apiBase

  const fetchAnimes = async (params?: AnimeQueryParams): Promise<AnimeResponse> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<AnimeResponse>(`${API_BASE}/animes`, {
        params,
        headers: authStore.getAuthHeaders()
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement des animes'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAnimeById = async (id: number, options?: {
    includeReviews?: boolean
    includeEpisodes?: boolean
  }): Promise<Anime> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Anime>(`${API_BASE}/animes/${id}`, {
        params: options,
        headers: authStore.getAuthHeaders()
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors du chargement de l\'anime'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createAnime = async (data: CreateAnimeDto): Promise<Anime> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Anime>(`${API_BASE}/animes`, {
        method: 'POST',
        body: data,
        headers: authStore.getAuthHeaders()
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la création de l\'anime'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAnime = async (id: number, data: UpdateAnimeDto): Promise<Anime> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<Anime>(`${API_BASE}/animes/${id}`, {
        method: 'PATCH',
        body: data,
        headers: authStore.getAuthHeaders()
      })
      return response
    } catch (err: any) {
      error.value = 'Erreur lors de la mise à jour'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getTopAnimes = async (limit = 10): Promise<Anime[]> => {
    try {
      const response = await $fetch<Anime[]>(`${API_BASE}/animes/top`, {
        params: { limit }
      })
      return response
    } catch (err: any) {
      console.error('Error fetching top animes:', err)
      return []
    }
  }

  const getAnimesByGenre = async (genre: string, limit = 20): Promise<Anime[]> => {
    try {
      const response = await $fetch<Anime[]>(`${API_BASE}/animes/genre/${genre}`, {
        params: { limit }
      })
      return response
    } catch (err: any) {
      console.error('Error fetching animes by genre:', err)
      return []
    }
  }

  const autocompleteAnimes = async (query: string, options?: {
    exclude?: string
    limit?: number
  }): Promise<Anime[]> => {
    try {
      const response = await $fetch<Anime[]>(`${API_BASE}/animes/autocomplete`, {
        params: {
          q: query,
          ...options
        }
      })
      return response
    } catch (err: any) {
      console.error('Error in anime autocomplete:', err)
      return []
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchAnimes,
    fetchAnimeById,
    createAnime,
    updateAnime,
    getTopAnimes,
    getAnimesByGenre,
    autocompleteAnimes
  }
}
```

**New Composables:**

**useReviewAPI.ts**:
```typescript
// composables/useReviewAPI.ts
export function useReviewAPI() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const API_BASE = config.public.apiBase

  const fetchReviews = async (params?: ReviewQueryParams) => {
    return await $fetch(`${API_BASE}/reviews`, {
      params,
      headers: authStore.getAuthHeaders()
    })
  }

  const createReview = async (data: CreateReviewDto) => {
    return await $fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      body: data,
      headers: authStore.getAuthHeaders()
    })
  }

  const getTopReviews = async (limit = 10) => {
    return await $fetch(`${API_BASE}/reviews/top`, {
      params: { limit }
    })
  }

  const getUserReviews = async (userId: number) => {
    return await $fetch(`${API_BASE}/reviews/user/${userId}`, {
      headers: authStore.getAuthHeaders()
    })
  }

  const getMyReviews = async () => {
    return await $fetch(`${API_BASE}/reviews/my-reviews`, {
      headers: authStore.getAuthHeaders()
    })
  }

  return {
    fetchReviews,
    createReview,
    getTopReviews,
    getUserReviews,
    getMyReviews
  }
}
```

**useSearchAPI.ts**:
```typescript
// composables/useSearchAPI.ts
export function useSearchAPI() {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const globalSearch = async (query: string, filters?: SearchFilters) => {
    return await $fetch(`${API_BASE}/search`, {
      params: {
        q: query,
        ...filters
      }
    })
  }

  const searchAnimes = async (query: string, filters?: AnimeSearchFilters) => {
    return await $fetch(`${API_BASE}/search/animes`, {
      params: {
        q: query,
        ...filters
      }
    })
  }

  const searchMangas = async (query: string, filters?: MangaSearchFilters) => {
    return await $fetch(`${API_BASE}/search/mangas`, {
      params: {
        q: query,
        ...filters
      }
    })
  }

  return {
    globalSearch,
    searchAnimes,
    searchMangas
  }
}
```

#### 3.2 Type Definitions
```typescript
// types/anime.ts
export interface Anime {
  id: number
  titre: string
  image?: string
  annee?: number
  moyenne_notes?: number
  synopsis?: string
  genre?: string
  episodes?: number
  statut?: string
  created_at: string
  updated_at: string
}

export interface AnimeResponse {
  data: Anime[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AnimeQueryParams {
  page?: number
  limit?: number
  genre?: string
  year?: number
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateAnimeDto {
  titre: string
  synopsis?: string
  annee?: number
  genre?: string
  episodes?: number
  image?: string
}

export interface UpdateAnimeDto extends Partial<CreateAnimeDto> {}
```

### **Phase 4: Enhanced Components & Features (Week 3-4)**

#### 4.1 Enhanced Components

**AnimeCard.vue** (Improved):
```vue
<template>
  <div class="anime-card">
    <div class="anime-image-container">
      <NuxtImg
        v-if="anime.image"
        :src="getImageUrl(anime.image)"
        :alt="anime.titre"
        class="anime-image"
        loading="lazy"
        @error="onImageError"
      />
      <div v-else class="no-image">
        <Icon name="heroicons:photo" class="w-12 h-12 text-gray-400" />
      </div>
      
      <!-- Rating overlay -->
      <div v-if="anime.moyenne_notes" class="rating-overlay">
        <Icon name="heroicons:star-solid" class="w-4 h-4 text-yellow-400" />
        <span>{{ formatRating(anime.moyenne_notes) }}</span>
      </div>
    </div>
    
    <div class="anime-info">
      <h3 class="anime-title">{{ anime.titre }}</h3>
      <p v-if="anime.annee" class="anime-year">{{ anime.annee }}</p>
      <p v-if="anime.genre" class="anime-genre">{{ anime.genre }}</p>
      
      <!-- Quick actions -->
      <div class="anime-actions">
        <button 
          @click="$emit('view', anime)"
          class="btn-primary"
        >
          Voir détails
        </button>
        <button 
          v-if="canEdit" 
          @click="$emit('edit', anime)"
          class="btn-secondary"
        >
          Éditer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Anime } from '~/types/anime'

interface Props {
  anime: Anime
  canEdit?: boolean
}

interface Emits {
  view: [anime: Anime]
  edit: [anime: Anime]
}

defineProps<Props>()
defineEmits<Emits>()

const { getImageUrl } = useImageUrl()
const authStore = useAuthStore()

const canEdit = computed(() => {
  return authStore.isAdmin || authStore.user?.id === anime.created_by
})

const formatRating = (rating: number) => {
  return (rating / 10).toFixed(1)
}

const onImageError = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}
</script>
```

**SearchBar.vue** (New Enhanced Component):
```vue
<template>
  <div class="search-container">
    <div class="search-input-wrapper">
      <Icon name="heroicons:magnifying-glass" class="search-icon" />
      <input
        v-model="query"
        type="text"
        placeholder="Rechercher des animes, mangas..."
        class="search-input"
        @input="onInput"
        @focus="showSuggestions = true"
        @blur="hideSuggestions"
      />
      <button
        v-if="query"
        @click="clearSearch"
        class="clear-button"
      >
        <Icon name="heroicons:x-mark" class="w-4 h-4" />
      </button>
    </div>

    <!-- Autocomplete suggestions -->
    <div v-if="showSuggestions && suggestions.length" class="suggestions">
      <div
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        class="suggestion-item"
        @click="selectSuggestion(suggestion)"
      >
        <NuxtImg
          v-if="suggestion.image"
          :src="getImageUrl(suggestion.image)"
          :alt="suggestion.titre"
          class="suggestion-image"
        />
        <div class="suggestion-info">
          <span class="suggestion-title">{{ suggestion.titre }}</span>
          <span class="suggestion-type">{{ suggestion.type }}</span>
        </div>
      </div>
    </div>

    <!-- Advanced filters -->
    <div v-if="showFilters" class="filters">
      <select v-model="filters.type" class="filter-select">
        <option value="">Tous les types</option>
        <option value="anime">Animes</option>
        <option value="manga">Mangas</option>
      </select>
      
      <select v-model="filters.genre" class="filter-select">
        <option value="">Tous les genres</option>
        <option v-for="genre in genres" :key="genre" :value="genre">
          {{ genre }}
        </option>
      </select>
      
      <input
        v-model="filters.year"
        type="number"
        placeholder="Année"
        class="filter-input"
        min="1900"
        :max="currentYear"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface SearchResult {
  id: number
  titre: string
  image?: string
  type: 'anime' | 'manga'
}

const query = ref('')
const suggestions = ref<SearchResult[]>([])
const showSuggestions = ref(false)
const showFilters = ref(false)

const filters = reactive({
  type: '',
  genre: '',
  year: undefined as number | undefined
})

const { globalSearch } = useSearchAPI()
const { getImageUrl } = useImageUrl()

const currentYear = new Date().getFullYear()

// Debounced search
const debouncedSearch = useDebounceFn(async (searchQuery: string) => {
  if (searchQuery.length < 2) {
    suggestions.value = []
    return
  }

  try {
    const results = await globalSearch(searchQuery, {
      limit: 5,
      ...filters
    })
    suggestions.value = results.data || []
  } catch (error) {
    console.error('Search error:', error)
    suggestions.value = []
  }
}, 300)

const onInput = () => {
  debouncedSearch(query.value)
}

const selectSuggestion = (suggestion: SearchResult) => {
  query.value = suggestion.titre
  showSuggestions.value = false
  
  // Navigate to detail page
  if (suggestion.type === 'anime') {
    navigateTo(`/animes/${suggestion.id}`)
  } else {
    navigateTo(`/mangas/${suggestion.id}`)
  }
}

const clearSearch = () => {
  query.value = ''
  suggestions.value = []
}

const hideSuggestions = () => {
  // Delay to allow click events on suggestions
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}
</script>
```

### **Phase 5: Advanced Features (Week 4-5)**

#### 5.1 Real-time Notifications
```typescript
// composables/useNotifications.ts
export function useNotifications() {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  
  const { data: notificationData } = useLazyFetch('/api/notifications', {
    headers: useAuthStore().getAuthHeaders()
  })

  // WebSocket connection for real-time notifications
  const { status, data, open, close } = useWebSocket('ws://localhost:3000/notifications', {
    autoReconnect: {
      retries: 3,
      delay: 1000,
    },
  })

  watchEffect(() => {
    if (data.value) {
      const newNotification = JSON.parse(data.value)
      notifications.value.unshift(newNotification)
      unreadCount.value++
      
      // Show toast notification
      showToast(newNotification)
    }
  })

  const markAsRead = async (notificationId: number) => {
    await $fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: useAuthStore().getAuthHeaders()
    })
    
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      unreadCount.value--
    }
  }

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    markAsRead,
    connect: open,
    disconnect: close
  }
}
```

#### 5.2 Advanced State Management
```typescript
// stores/content.ts - Unified content store
export const useContentStore = defineStore('content', () => {
  const animes = ref<Anime[]>([])
  const mangas = ref<Manga[]>([])
  const reviews = ref<Review[]>([])
  
  // Cache management
  const cache = reactive(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  const getCachedData = (key: string) => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    return null
  }

  const setCachedData = (key: string, data: any) => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Normalized data management
  const addAnime = (anime: Anime) => {
    const index = animes.value.findIndex(a => a.id === anime.id)
    if (index >= 0) {
      animes.value[index] = anime
    } else {
      animes.value.push(anime)
    }
  }

  const removeAnime = (id: number) => {
    const index = animes.value.findIndex(a => a.id === id)
    if (index >= 0) {
      animes.value.splice(index, 1)
    }
  }

  return {
    animes: readonly(animes),
    mangas: readonly(mangas),
    reviews: readonly(reviews),
    getCachedData,
    setCachedData,
    addAnime,
    removeAnime
  }
})
```

### **Phase 6: Testing & Deployment (Week 5-6)**

#### 6.1 Testing Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts']
  }
})
```

**Component Tests Example:**
```typescript
// test/components/AnimeCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AnimeCard from '~/components/AnimeCard.vue'

describe('AnimeCard', () => {
  const mockAnime = {
    id: 1,
    titre: 'Test Anime',
    image: 'test.jpg',
    annee: 2023,
    moyenne_notes: 85
  }

  it('renders anime information correctly', () => {
    const wrapper = mount(AnimeCard, {
      props: { anime: mockAnime }
    })

    expect(wrapper.text()).toContain('Test Anime')
    expect(wrapper.text()).toContain('2023')
  })

  it('emits view event when detail button is clicked', async () => {
    const wrapper = mount(AnimeCard, {
      props: { anime: mockAnime }
    })

    await wrapper.find('.btn-primary').trigger('click')
    expect(wrapper.emitted('view')).toHaveLength(1)
    expect(wrapper.emitted('view')[0]).toEqual([mockAnime])
  })
})
```

#### 6.2 Docker Configuration
```dockerfile
# Dockerfile.frontendv2
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

**Updated docker-compose.yml:**
```yaml
version: '3.8'

services:
  nestjs-api:
    build:
      context: ./anime-kun-nestjs-v2
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://anime_user:anime_password@postgres:5432/anime_kun
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - postgres

  frontendv2:
    build:
      context: ./frontendv2
      dockerfile: Dockerfile.frontendv2
    ports:
      - "3001:3000"
    environment:
      - API_BASE_URL=http://nestjs-api:3000
    depends_on:
      - nestjs-api

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: anime_user
      POSTGRES_PASSWORD: anime_password
      POSTGRES_DB: anime_kun
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  db_data:
```

## 🔧 Key Migration Challenges & Solutions

### **1. Authentication Breaking Changes**
**Challenge**: Different token structure and endpoints
**Solution**: 
- Complete auth store rewrite with refresh token support
- HTTP interceptor for automatic token refresh
- Proper error handling for auth failures

### **2. API Response Structure**
**Challenge**: NestJS returns different response format
**Solution**:
- Create comprehensive TypeScript interfaces
- Update all API calls to handle new format
- Add response transformers where needed

### **3. Image Handling**
**Challenge**: Different media endpoints and structure
**Solution**:
- Update `useImageUrl` composable for NestJS media endpoints
- Implement proper image optimization with `@nuxt/image`
- Add error handling for missing images

### **4. State Management Complexity**
**Challenge**: More complex data relationships and caching needs
**Solution**:
- Enhanced Pinia stores with normalized data
- Implement intelligent caching strategy
- Add real-time updates via WebSocket

## 📈 Implementation Timeline

### **Week 1: Foundation & Auth**
- [ ] Create frontendv2 project structure
- [ ] Install and configure dependencies
- [ ] Implement new authentication system
- [ ] Test login/logout/refresh flows
- [ ] Set up HTTP interceptors

### **Week 2: Core API Integration**
- [ ] Update anime API integration
- [ ] Implement search functionality
- [ ] Add review system integration
- [ ] Update image handling
- [ ] Create TypeScript interfaces

### **Week 3: Enhanced Components**
- [ ] Improve existing components
- [ ] Add new advanced components
- [ ] Implement real-time search
- [ ] Add notification system
- [ ] Enhanced error handling

### **Week 4: Advanced Features**
- [ ] Add WebSocket integration
- [ ] Implement caching strategy
- [ ] Add admin features
- [ ] Performance optimizations
- [ ] Accessibility improvements

### **Week 5: Testing & Polish**
- [ ] Write component tests
- [ ] Add E2E tests
- [ ] Performance testing
- [ ] Cross-browser testing
- [ ] Documentation

### **Week 6: Deployment**
- [ ] Production build optimization
- [ ] Docker configuration
- [ ] CI/CD pipeline setup
- [ ] Monitoring integration
- [ ] Final deployment

## 🚀 Migration Commands Summary

```bash
# Phase 1: Setup
mkdir frontendv2 && cd frontendv2
npx nuxi@latest init .
npm install @nuxtjs/tailwindcss @pinia/nuxt @vueuse/core @vueuse/nuxt @nuxtjs/color-mode @headlessui/vue @heroicons/vue

# Phase 2: Development
npm run dev  # Start development server
npm run test  # Run tests
npm run build  # Build for production

# Phase 6: Deployment
docker-compose up --build  # Deploy with Docker
```

This comprehensive roadmap provides everything needed to successfully migrate your frontend to work with the NestJS API while adding modern features and improvements.