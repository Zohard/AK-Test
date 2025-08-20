<template>
  <header class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <img 
              src="/logo.svg" 
              alt="Anime-Kun" 
              class="h-8 w-8"
              @error="hideImage"
            />
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              Anime-Kun V2
            </span>
          </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center space-x-8">
          <NuxtLink 
            to="/animes"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Animes
          </NuxtLink>
          <NuxtLink 
            to="/mangas"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Mangas
          </NuxtLink>
          <NuxtLink 
            to="/reviews"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Critiques
          </NuxtLink>
          <NuxtLink 
            to="/articles"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
          >
            Articles
          </NuxtLink>
        </nav>

        <!-- Search Bar -->
        <div class="hidden lg:flex items-center flex-1 max-w-lg mx-8">
          <SearchBar />
        </div>

        <!-- Right side actions -->
        <div class="flex items-center space-x-4">
          <!-- Theme toggle -->
          <ThemeToggle />
          
          <!-- Notifications (if authenticated) -->
          <div v-if="authStore.isAuthenticated" class="relative">
            <button 
              @click="showNotifications = !showNotifications"
              class="relative p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Icon name="heroicons:bell" class="w-6 h-6" />
              <span 
                v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>
            
            <!-- Notifications dropdown -->
            <div 
              v-if="showNotifications"
              class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              <div class="p-4">
                <h3 class="font-semibold mb-2">Notifications</h3>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  <div 
                    v-for="notification in notifications.slice(0, 5)" 
                    :key="notification.id"
                    class="p-2 rounded bg-gray-50 dark:bg-gray-700 text-sm"
                  >
                    {{ notification.message }}
                  </div>
                  <div v-if="notifications.length === 0" class="text-gray-500 text-center py-4">
                    Aucune notification
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User menu -->
          <div v-if="authStore.isAuthenticated" class="relative">
            <button 
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  v-if="authStore.user?.avatar && !avatarError" 
                  :src="authStore.user.avatar" 
                  :alt="authStore.userDisplayName"
                  class="w-full h-full object-cover"
                  @error="avatarError = true"
                />
                <span 
                  v-else
                  class="text-white text-sm font-medium"
                >
                  {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                </span>
              </div>
              <Icon name="heroicons:chevron-down" class="w-4 h-4" />
            </button>
            
            <!-- User dropdown -->
            <div 
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              <div class="p-2">
                <NuxtLink 
                  to="/profile"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:user" class="w-4 h-4 mr-2" />
                  Mon profil
                </NuxtLink>
                <NuxtLink 
                  to="/messages"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:envelope" class="w-4 h-4 mr-2" />
                  Messagerie
                </NuxtLink>
                <NuxtLink 
                  to="/my-collections"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:rectangle-stack" class="w-4 h-4 mr-2" />
                  Mes collections
                </NuxtLink>
                <NuxtLink 
                  to="/my-lists"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:list-bullet" class="w-4 h-4 mr-2" />
                  Mes listes
                </NuxtLink>
                <div v-if="authStore.isAdmin" class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <NuxtLink 
                    to="/admin"
                    class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    @click="showUserMenu = false"
                  >
                    <Icon name="heroicons:cog-8-tooth" class="w-4 h-4 mr-2" />
                    Administration
                  </NuxtLink>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <button 
                    @click="handleLogout"
                    class="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Icon name="heroicons:arrow-right-on-rectangle" class="w-4 h-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Login/Register buttons -->
          <div v-else class="flex items-center space-x-2">
            <NuxtLink 
              to="/login"
              class="btn-secondary"
            >
              Connexion
            </NuxtLink>
            <NuxtLink 
              to="/register"
              class="btn-primary"
            >
              Inscription
            </NuxtLink>
          </div>

          <!-- Mobile menu button -->
          <button 
            @click="showMobileMenu = !showMobileMenu"
            class="md:hidden p-2 text-gray-700 dark:text-gray-300"
          >
            <Icon name="heroicons:bars-3" class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="showMobileMenu" class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
        <nav class="space-y-2">
          <NuxtLink 
            to="/animes"
            class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            @click="showMobileMenu = false"
          >
            Animes
          </NuxtLink>
          <NuxtLink 
            to="/mangas"
            class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            @click="showMobileMenu = false"
          >
            Mangas
          </NuxtLink>
          <NuxtLink 
            to="/reviews"
            class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            @click="showMobileMenu = false"
          >
            Critiques
          </NuxtLink>
          <NuxtLink 
            to="/articles"
            class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            @click="showMobileMenu = false"
          >
            Articles
          </NuxtLink>
        </nav>
        
        <!-- Mobile search -->
        <div class="mt-4 px-3">
          <SearchBar />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

// Reactive state
const showNotifications = ref(false)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const avatarError = ref(false)

// Mock notifications data - will be replaced with real data
const notifications = ref<{id: number; message: string}[]>([])
const unreadCount = ref(0)

// Close dropdowns when clicking outside
onMounted(() => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.relative')) {
      showNotifications.value = false
      showUserMenu.value = false
    }
  })
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    showUserMenu.value = false
    navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

// Close mobile menu on route change
watch(() => useRoute().path, () => {
  showMobileMenu.value = false
})
</script>

<style scoped>
/* Custom styles for header */
.router-link-active {
  @apply text-blue-600 dark:text-blue-400;
}
</style>