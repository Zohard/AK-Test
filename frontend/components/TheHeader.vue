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
          <button class="search-icon" aria-label="Search">
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
            <li><NuxtLink to="/forum">Forum</NuxtLink></li>
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
    
    <!-- Mobile Navigation Menu -->
    <div class="mobile-nav" :class="{ 'open': showMobileMenu }">
      <nav class="mobile-nav-content">
        <ul class="mobile-nav-list">
          <li><NuxtLink to="/" @click="closeMobileMenu">Accueil</NuxtLink></li>
          <li><NuxtLink to="/animes" @click="closeMobileMenu">Anime</NuxtLink></li>
          <li><NuxtLink to="/mangas" @click="closeMobileMenu">Manga</NuxtLink></li>
          <li><NuxtLink to="/critiques" @click="closeMobileMenu">Critiques</NuxtLink></li>
          <li><NuxtLink to="/articles" @click="closeMobileMenu">Webzine</NuxtLink></li>
          <li><NuxtLink to="/forum" @click="closeMobileMenu">Forum</NuxtLink></li>
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
    await navigateTo('/')
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

// Cleanup timeout on unmount
onUnmounted(() => {
  if (menuTimeout) {
    clearTimeout(menuTimeout)
  }
})
</script>

<style scoped>
/* Header container */
.header {
  position: relative;
  z-index: 100;
}

.header-container {
  position: relative;
  z-index: 101;
}

/* Mobile header layout */
.mobile-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 1rem;
}

/* Desktop header layout */
.desktop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Burger menu styles */
.burger-menu {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 102;
}

.burger-line {
  width: 100%;
  height: 3px;
  background-color: var(--text-color);
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.burger-menu.open .burger-line:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.burger-menu.open .burger-line:nth-child(2) {
  opacity: 0;
}

.burger-menu.open .burger-line:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Mobile logo */
.mobile-logo-link {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.mobile-logo {
  height: 40px;
  width: auto;
}

/* Mobile actions */
.mobile-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.search-icon:hover {
  background-color: var(--bg-secondary);
}

.mobile-auth-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border-radius: 50%;
  text-decoration: none;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.mobile-auth-icon:hover {
  background-color: var(--accent-color);
  color: white;
}

.mobile-user-avatar .user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color) 0%, #5a67d8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Desktop navigation */
.desktop-nav {
  display: block;
}

/* Mobile navigation */
.mobile-nav {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  background: var(--surface-color);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 99;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.mobile-nav.open {
  max-height: calc(100vh - 80px);
}

.mobile-nav-content {
  padding: 1rem 0;
}

.mobile-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-nav-list li {
  border-bottom: 1px solid var(--border-color);
}

.mobile-nav-list li:last-child {
  border-bottom: none;
}

.mobile-nav-list a {
  display: block;
  padding: 1rem 1.5rem;
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.mobile-nav-list a:hover,
.mobile-nav-list a.router-link-active {
  background-color: var(--bg-secondary);
  color: var(--accent-color);
}

/* Mobile auth section */
.mobile-auth {
  border-top: 2px solid var(--border-color);
  padding: 1rem 1.5rem;
  margin-top: 1rem;
}

.mobile-auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mobile-auth-btn {
  display: block;
  padding: 0.75rem 1rem;
  background: var(--accent-color);
  color: white;
  text-decoration: none;
  text-align: center;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.mobile-auth-btn:hover {
  background: var(--accent-color-dark);
  transform: translateY(-2px);
}

.mobile-auth-btn:nth-child(2) {
  background: transparent;
  border: 2px solid var(--accent-color);
  color: var(--accent-color);
}

.mobile-auth-btn:nth-child(2):hover {
  background: var(--accent-color);
  color: white;
}

/* Mobile user section */
.mobile-user-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.mobile-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color) 0%, #5a67d8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.mobile-username {
  color: var(--text-color);
  font-weight: 600;
  font-size: 1rem;
}

.mobile-user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-user-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.mobile-user-action:hover {
  background-color: var(--bg-secondary);
}

.mobile-logout {
  color: #dc2626;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.mobile-logout:hover {
  background-color: #fef2f2;
}

/* Authentication styles */
.auth-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.auth-link {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.auth-link:hover {
  color: var(--accent-color);
}

.auth-separator {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin: 0 0.25rem;
}

/* User menu styles */
.user-menu {
  position: relative;
  margin-left: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.user-menu:hover .user-info {
  background-color: var(--bg-secondary);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color) 0%, #5a67d8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.username {
  color: var(--text-color);
  font-weight: 500;
  font-size: 0.9rem;
}

.dropdown-arrow {
  color: var(--text-secondary);
  font-size: 0.7rem;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.dropdown-item:hover {
  background-color: var(--bg-secondary);
}

.dropdown-item:first-child {
  border-radius: 8px 8px 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 8px 8px;
}

.dropdown-icon {
  font-size: 1rem;
  width: 1.25rem;
  text-align: center;
}

.dropdown-separator {
  height: 1px;
  background-color: var(--border-color);
  margin: 0.25rem 0;
}

.logout-item {
  color: #dc2626;
}

.logout-item:hover {
  background-color: #fef2f2;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .mobile-header {
    display: flex;
  }

  .desktop-header {
    display: none;
  }
}

@media (max-width: 480px) {
  .mobile-nav {
    top: 70px;
  }
  
  .mobile-nav.open {
    max-height: calc(100vh - 70px);
  }
  
  .mobile-nav-list a {
    padding: 0.875rem 1rem;
    font-size: 0.9rem;
  }
  
  .mobile-auth {
    padding: 0.875rem 1rem;
  }
}
</style>