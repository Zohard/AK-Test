<template>
  <header class="header">
    <div class="header-container">
      <!-- Mobile Layout -->
      <div class="mobile-header">
        <!-- Left: Burger Menu -->
        <button 
          class="burger-menu"
          @click="toggleMobileMenu"
          :class="{ 'open': showMobileMenu }"
          aria-label="Toggle navigation menu"
        >
          <span class="burger-line"></span>
          <span class="burger-line"></span>
          <span class="burger-line"></span>
        </button>
        
        <!-- Center: Mini Logo -->
        <NuxtLink to="/" class="mobile-logo-link">
          <img src="/mini_logo.png" alt="ANIME-KUN" class="mobile-logo" />
        </NuxtLink>
        
        <!-- Right: Search + User -->
        <div class="mobile-actions">
          <button 
            class="search-icon" 
            @click="toggleMobileSearch"
            aria-label="Search"
          >
            🔍
          </button>
          
          <!-- Mobile Authentication -->
          <div v-if="!isAuthenticated" class="mobile-auth-section">
            <NuxtLink to="/login" class="mobile-auth-icon">
              👤
            </NuxtLink>
          </div>
          
          <div v-else class="mobile-user-avatar">
            <div class="user-avatar">
              <span>{{ userInitials }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="desktop-header">
        <NuxtLink to="/" class="logo">
          <img src="/logo.png" alt="ANIME-KUN" class="logo-image desktop-logo" />
        </NuxtLink>
        
        <!-- Desktop Navigation -->
        <nav class="desktop-nav">
          <ul class="nav">
            <li><NuxtLink to="/">Accueil</NuxtLink></li>
            <li><NuxtLink to="/animes">Anime</NuxtLink></li>
            <li><NuxtLink to="/mangas">Manga</NuxtLink></li>
            <li><NuxtLink to="/critiques">Critiques</NuxtLink></li>
            <li><NuxtLink to="/articles">Webzine</NuxtLink></li>
            <li><a href="http://localhost:8083" target="_blank">Forum</a></li>
          </ul>
        </nav>

        <div class="header-actions">
          <ThemeToggle :show-dropdown="true" />
          
          <!-- Authentication Section -->
          <div v-if="!isAuthenticated" class="auth-section">
            <NuxtLink to="/login" class="auth-link">
              Connexion
            </NuxtLink>
            <span class="auth-separator">|</span>
            <NuxtLink to="/register" class="auth-link">
              Inscription
            </NuxtLink>
          </div>
          
          <div v-else class="user-menu" @mouseenter="openUserMenu" @mouseleave="closeUserMenu">
            <div class="user-info">
              <div class="user-avatar">
                <span>{{ userInitials }}</span>
              </div>
              <span class="username">{{ currentUser?.username }}</span>
              <span class="dropdown-arrow" :class="{ 'open': showUserMenu }">▼</span>
            </div>
            
            <div v-if="showUserMenu" class="user-dropdown" @mouseenter="openUserMenu" @mouseleave="closeUserMenu" @click.stop>
              <NuxtLink to="/profile" class="dropdown-item" @click="closeUserMenuImmediate">
                <span class="dropdown-icon">👤</span>
                Mon profil
              </NuxtLink>
              <NuxtLink to="/messages" class="dropdown-item" @click="closeUserMenuImmediate">
                <span class="dropdown-icon">💬</span>
                Messages privés
              </NuxtLink>
              <NuxtLink v-if="isAdmin" to="/admin/dashboard" class="dropdown-item" @click="closeUserMenuImmediate">
                <span class="dropdown-icon">⚙️</span>
                Administration
              </NuxtLink>
              <div class="dropdown-separator"></div>
              <button @click="handleLogout" class="dropdown-item logout-item">
                <span class="dropdown-icon">🚪</span>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile Search Overlay -->
    <div class="mobile-search-overlay" :class="{ 'open': showMobileSearch }">
      <div class="mobile-search-content">
        <div class="mobile-search-header">
          <input 
            ref="mobileSearchInput"
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher anime, manga..."
            class="mobile-search-input"
            @keyup.enter="performSearch"
          />
          <button 
            class="mobile-search-close" 
            @click="closeMobileSearch"
            aria-label="Fermer la recherche"
          >
            ✕
          </button>
        </div>
        
        <div v-if="searchQuery" class="mobile-search-results">
          <div class="search-suggestions">
            <div class="search-suggestion" @click="performSearch">
              🔍 Rechercher "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile Navigation Menu -->
    <div class="mobile-nav" :class="{ 'open': showMobileMenu }">
      <nav class="mobile-nav-content">
        <ul class="mobile-nav-list">
          <li><NuxtLink to="/" @click="closeMobileMenu">Accueil</NuxtLink></li>
          <li><NuxtLink to="/animes" @click="closeMobileMenu">Anime</NuxtLink></li>
          <li><NuxtLink to="/mangas" @click="closeMobileMenu">Manga</NuxtLink></li>
          <li><NuxtLink to="/critiques" @click="closeMobileMenu">Critiques</NuxtLink></li>
          <li><NuxtLink to="/articles" @click="closeMobileMenu">Webzine</NuxtLink></li>
          <li><a href="http://localhost:8083" target="_blank" @click="closeMobileMenu">Forum</a></li>
        </ul>
        
        <!-- Mobile Auth Section -->
        <div class="mobile-auth">
          <div v-if="!isAuthenticated" class="mobile-auth-buttons">
            <NuxtLink to="/login" @click="closeMobileMenu" class="mobile-auth-btn">
              Connexion
            </NuxtLink>
            <NuxtLink to="/register" @click="closeMobileMenu" class="mobile-auth-btn">
              Inscription
            </NuxtLink>
          </div>
          
          <div v-else class="mobile-user-section">
            <div class="mobile-user-info">
              <div class="mobile-user-avatar">
                <span>{{ userInitials }}</span>
              </div>
              <span class="mobile-username">{{ currentUser?.username }}</span>
            </div>
            <div class="mobile-user-actions">
              <NuxtLink to="/profile" @click="closeMobileMenu" class="mobile-user-action">
                👤 Mon profil
              </NuxtLink>
              <NuxtLink to="/messages" @click="closeMobileMenu" class="mobile-user-action">
                💬 Messages privés
              </NuxtLink>
              <NuxtLink v-if="isAdmin" to="/admin/dashboard" @click="closeMobileMenu" class="mobile-user-action">
                ⚙️ Administration
              </NuxtLink>
              <button @click="handleLogout" class="mobile-user-action mobile-logout">
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
// Import auth store
import { useAuthStore } from '~/stores/auth'

// User menu state
const showUserMenu = ref(false)
let menuTimeout = null

// Mobile menu state
const showMobileMenu = ref(false)

// Mobile search state
const showMobileSearch = ref(false)
const searchQuery = ref('')
const mobileSearchInput = ref(null)

// SSR-safe authentication computed properties
const authStore = ref(null)

// Initialize auth store only on client side
onMounted(() => {
  if (process.client) {
    authStore.value = useAuthStore()
  }
})

const isAuthenticated = computed(() => {
  return authStore.value?.isAuthenticated || false
})

const currentUser = computed(() => {
  return authStore.value?.user || null
})

const isAdmin = computed(() => {
  return authStore.value?.isAdmin || false
})

const userInitials = computed(() => {
  if (!currentUser.value?.username) return '?'
  return currentUser.value.username.charAt(0).toUpperCase()
})

// Methods
const openUserMenu = () => {
  clearTimeout(menuTimeout)
  showUserMenu.value = true
}

const closeUserMenu = () => {
  menuTimeout = setTimeout(() => {
    showUserMenu.value = false
  }, 300) // Small delay for better UX
}

const closeUserMenuImmediate = () => {
  clearTimeout(menuTimeout)
  showUserMenu.value = false
}

const handleLogout = async () => {
  try {
    if (authStore.value) {
      await authStore.value.logout()
    }
    closeUserMenuImmediate()
    closeMobileMenu() // Also close mobile menu if open
    // Redirect to home page after logout
    if (process.client) {
      await navigateTo('/')
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Mobile menu methods
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  // Close user dropdown if open
  if (showMobileMenu.value) {
    closeUserMenuImmediate()
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

// Mobile search methods
const toggleMobileSearch = () => {
  showMobileSearch.value = !showMobileSearch.value
  
  // Close mobile menu if open
  if (showMobileSearch.value) {
    closeMobileMenu()
    closeUserMenuImmediate()
    
    // Focus the search input after opening
    nextTick(() => {
      if (mobileSearchInput.value) {
        mobileSearchInput.value.focus()
      }
    })
  }
}

const closeMobileSearch = () => {
  showMobileSearch.value = false
  searchQuery.value = ''
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    // Navigate to search page with query
    if (process.client) {
      navigateTo(`/animes?search=${encodeURIComponent(searchQuery.value.trim())}`)
    }
    closeMobileSearch()
  }
}

// Cleanup timeout on unmount
onUnmounted(() => {
  if (menuTimeout) {
    clearTimeout(menuTimeout)
  }
})
</script>

<style scoped src="~/assets/css/the-header.css"></style>
