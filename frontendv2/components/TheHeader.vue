<template>
  <header
    class="bg-white/90 dark:bg-gray-900/90 supports-backdrop-blur:bg-white/70 dark:supports-backdrop-blur:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-shadow duration-200"
    :class="{ 'shadow-sm': !isScrolled, 'shadow-md': isScrolled }"
    role="banner"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Top row: Logo, Search Bar, and Auth/User Actions -->
      <div class="flex justify-between items-center h-16 border-b border-gray-100 dark:border-gray-800">
        <!-- Logo -->
        <div class="flex items-center flex-shrink-0">
          <NuxtLink to="/" class="flex items-center space-x-2">
            <img 
              src="/logo.svg" 
              alt="Anime-Kun" 
              class="h-8 w-8"
              @error="hideImage"
            />
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              Anime-Kun
            </span>
          </NuxtLink>
        </div>

        <!-- Centered Search Bar (hidden on mobile) -->
        <div class="hidden md:flex flex-1 justify-center px-8 max-w-2xl mx-auto" role="search">
          <div class="w-full max-w-lg">
            <SearchBar />
          </div>
        </div>

        <!-- Right side actions -->
        <div class="flex items-center space-x-4">
          <!-- Theme toggle -->
          <ThemeToggle />
          
          <!-- Notifications (if authenticated) -->
          <div v-if="authStore.isAuthenticated" class="relative">
            <button 
              @click="showNotifications = !showNotifications"
              class="relative p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              :aria-expanded="showNotifications.toString()"
              aria-haspopup="menu"
              aria-controls="notifications-menu"
              aria-label="Ouvrir les notifications"
            >
              <Icon name="heroicons:bell" class="w-6 h-6" />
              <span 
                v-if="unreadCount > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
              <span class="sr-only">Notifications</span>
            </button>
            
            <!-- Notifications dropdown -->
            <div 
              v-if="showNotifications"
              id="notifications-menu"
              role="menu"
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
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              :aria-expanded="showUserMenu.toString()"
              aria-haspopup="menu"
              aria-controls="user-menu"
              aria-label="Ouvrir le menu utilisateur"
            >
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  v-if="authStore.user?.avatar && !avatarError" 
                  :src="authStore.user.avatar" 
                  :alt="authStore.userDisplayName"
                  class="w-full h-full object-cover"
                  @error="onAvatarError"
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
              id="user-menu"
              role="menu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              <div class="p-2">
                <NuxtLink 
                  to="/profile"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:user" class="w-4 h-4 mr-2" />
                  Mon profil
                </NuxtLink>
                <NuxtLink 
                  to="/messages"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:envelope" class="w-4 h-4 mr-2" />
                  Messagerie
                </NuxtLink>
                <NuxtLink 
                  to="/my-collections"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:rectangle-stack" class="w-4 h-4 mr-2" />
                  Mes collections
                </NuxtLink>
                <NuxtLink 
                  to="/my-lists"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  @click="showUserMenu = false"
                >
                  <Icon name="heroicons:list-bullet" class="w-4 h-4 mr-2" />
                  Mes listes
                </NuxtLink>
                <div v-if="authStore.isAdmin" class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <NuxtLink 
                    to="/admin"
                    class="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    @click="showUserMenu = false"
                  >
                    <Icon name="heroicons:cog-8-tooth" class="w-4 h-4 mr-2" />
                    Administration
                  </NuxtLink>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <button 
                    @click="handleLogout"
                    class="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors duration-200"
            :aria-expanded="showMobileMenu.toString()"
            aria-controls="mobile-menu"
            aria-label="Ouvrir le menu mobile"
          >
            <Transition
              enter-active-class="transition-transform duration-200"
              leave-active-class="transition-transform duration-200"
              enter-from-class="rotate-0"
              enter-to-class="rotate-180"
              leave-from-class="rotate-180"
              leave-to-class="rotate-0"
            >
              <Icon 
                :name="showMobileMenu ? 'heroicons:x-mark' : 'heroicons:bars-3'" 
                class="w-6 h-6 transition-transform duration-200" 
              />
            </Transition>
          </button>
        </div>
      </div>

      <!-- Second row: Navigation Menu (hidden on mobile) -->
      <div class="hidden md:flex justify-center py-3">
        <nav class="flex items-center space-x-8" aria-label="Navigation principale">
          <!-- Animes dropdown -->
          <div class="relative" @mouseenter="showAnimeDropdown = true" @mouseleave="showAnimeDropdown = false">
            <NuxtLink 
              to="/animes"
              class="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Icon name="heroicons:film" class="w-5 h-5" />
              <span>Animes</span>
              <Icon name="heroicons:chevron-down" class="w-4 h-4 ml-1 transition-transform duration-200" :class="{ 'rotate-180': showAnimeDropdown }" />
            </NuxtLink>
            
            <!-- Anime Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div 
                v-if="showAnimeDropdown"
                class="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
              >
                <div class="p-4">
                  <div class="grid grid-cols-1 gap-1">
                    <NuxtLink 
                      to="/animes"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:rectangle-stack" class="w-4 h-4 text-blue-500" />
                      <span>Base de données</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      to="/animes/critiques"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:star" class="w-4 h-4 text-yellow-500" />
                      <span>Dernières critiques</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      to="/animes/listes"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:list-bullet" class="w-4 h-4 text-green-500" />
                      <span>Parcourir les listes</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      to="/animes/creation-liste"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:plus-circle" class="w-4 h-4 text-green-500" />
                      <span>Créer une liste</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      to="/animes/recommandations"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:light-bulb" class="w-4 h-4 text-purple-500" />
                      <span>Moteur de recommandations</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      to="/animes/tags"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:tag" class="w-4 h-4 text-indigo-500" />
                      <span>Nuage de tags</span>
                    </NuxtLink>
                    
                    <div v-if="showSeasonMenuItem" class="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                    
                    <NuxtLink 
                      v-if="showSeasonMenuItem"
                      :to="currentSeasonUrl"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:calendar" class="w-4 h-4 text-orange-500" />
                      <span>{{ currentSeasonText }}</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      to="/animes/top"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:trophy" class="w-4 h-4 text-yellow-500" />
                      <span>Tops et flops anime</span>
                    </NuxtLink>
                    
                    <NuxtLink 
                      to="/animes/animemetre"
                      class="flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                    >
                      <Icon name="heroicons:chart-bar" class="w-4 h-4 text-red-500" />
                      <span>ANIMEmètre</span>
                    </NuxtLink>
                  </div>
                  
                  <!-- Stats Footer -->
                  <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {{ animeStats.total }} animes référencés, {{ animeStats.reviews }} critiques
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
          
          <NuxtLink 
            to="/mangas"
            class="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Icon name="heroicons:book-open" class="w-5 h-5" />
            <span>Mangas</span>
          </NuxtLink>
          <NuxtLink 
            to="/reviews"
            class="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Icon name="heroicons:star" class="w-5 h-5" />
            <span>Critiques</span>
          </NuxtLink>
          <NuxtLink 
            to="/articles"
            class="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Icon name="heroicons:newspaper" class="w-5 h-5" />
            <span>Webzine</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Mobile menu -->
      <Transition 
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showMobileMenu" id="mobile-menu" class="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <!-- Mobile search - prominently placed at top -->
          <div class="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
              <Icon name="heroicons:magnifying-glass" class="w-4 h-4" />
              <span>Rechercher</span>
            </div>
            <SearchBar />
          </div>
          
          <!-- Mobile navigation -->
          <nav class="py-2" aria-label="Navigation mobile">
            <NuxtLink 
              to="/animes"
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              @click="showMobileMenu = false"
            >
              <Icon name="heroicons:film" class="w-5 h-5 mr-4" />
              <span class="text-base font-medium">Animes</span>
            </NuxtLink>
            <NuxtLink 
              to="/mangas"
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              @click="showMobileMenu = false"
            >
              <Icon name="heroicons:book-open" class="w-5 h-5 mr-4" />
              <span class="text-base font-medium">Mangas</span>
            </NuxtLink>
            <NuxtLink 
              to="/reviews"
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              @click="showMobileMenu = false"
            >
              <Icon name="heroicons:star" class="w-5 h-5 mr-4" />
              <span class="text-base font-medium">Critiques</span>
            </NuxtLink>
            <NuxtLink 
              to="/articles"
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              @click="showMobileMenu = false"
            >
              <Icon name="heroicons:newspaper" class="w-5 h-5 mr-4" />
              <span class="text-base font-medium">Webzine</span>
            </NuxtLink>
          </nav>

          <!-- Mobile auth buttons -->
          <div v-if="!authStore.isAuthenticated" class="border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3">
            <NuxtLink 
              to="/login"
              class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              @click="showMobileMenu = false"
            >
              <Icon name="heroicons:arrow-left-on-rectangle" class="w-4 h-4 mr-2" />
              Connexion
            </NuxtLink>
            <NuxtLink 
              to="/register"
              class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors duration-200"
              @click="showMobileMenu = false"
            >
              <Icon name="heroicons:user-plus" class="w-4 h-4 mr-2" />
              Inscription
            </NuxtLink>
          </div>

          <!-- Mobile user menu -->
          <div v-else class="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
            <!-- User profile info -->
            <div class="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  v-if="authStore.user?.avatar && !avatarError" 
                  :src="authStore.user.avatar" 
                  :alt="authStore.userDisplayName"
                  class="w-full h-full object-cover"
                  @error="onAvatarError"
                />
                <span 
                  v-else
                  class="text-white text-sm font-medium"
                >
                  {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="flex-1">
                <div class="text-base font-medium text-gray-900 dark:text-white">
                  {{ authStore.userDisplayName }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ authStore.user?.email }}
                </div>
              </div>
            </div>

            <!-- User menu items -->
            <nav class="space-y-1">
              <NuxtLink 
                to="/profile"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                @click="showMobileMenu = false"
              >
                <Icon name="heroicons:user" class="w-5 h-5 mr-4" />
                <span class="text-base">Mon profil</span>
              </NuxtLink>
              <NuxtLink 
                to="/messages"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                @click="showMobileMenu = false"
              >
                <Icon name="heroicons:envelope" class="w-5 h-5 mr-4" />
                <span class="text-base">Messagerie</span>
              </NuxtLink>
              <NuxtLink 
                to="/my-collections"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                @click="showMobileMenu = false"
              >
                <Icon name="heroicons:rectangle-stack" class="w-5 h-5 mr-4" />
                <span class="text-base">Mes collections</span>
              </NuxtLink>
              <NuxtLink 
                to="/my-lists"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                @click="showMobileMenu = false"
              >
                <Icon name="heroicons:list-bullet" class="w-5 h-5 mr-4" />
                <span class="text-base">Mes listes</span>
              </NuxtLink>
              
              <div v-if="authStore.isAdmin" class="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                <NuxtLink 
                  to="/admin"
                  class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  @click="showMobileMenu = false"
                >
                  <Icon name="heroicons:cog-8-tooth" class="w-5 h-5 mr-4" />
                  <span class="text-base">Administration</span>
                </NuxtLink>
              </div>
              
              <div class="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                <button 
                  @click="handleLogout"
                  class="flex items-center w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                >
                  <Icon name="heroicons:arrow-right-on-rectangle" class="w-5 h-5 mr-4" />
                  <span class="text-base">Déconnexion</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Logout Modal -->
    <LogoutModal 
      :is-open="showLogoutModal" 
      @confirm="confirmLogout" 
      @cancel="showLogoutModal = false" 
    />
  </header>
</template>

<script setup lang="ts">
import type { Season } from '~/types'

const authStore = useAuthStore()
const { fetchCurrentSeason, formatSeasonText, formatSeasonUrl } = useSeasonsAPI()

// Reactive state
const showNotifications = ref(false)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const showAnimeDropdown = ref(false)
const avatarError = ref(false)
const isScrolled = ref(false)
const showLogoutModal = ref(false)

// Mock notifications data - will be replaced with real data
const notifications = ref<{id: number; message: string}[]>([])
const unreadCount = ref(0)

// Anime dropdown data
const animeStats = ref({
  total: 8130,
  reviews: 7364
})

// Current season data
const currentSeason = ref<Season | null>(null)
const seasonLoading = ref(true)

// Computed properties for season
const currentSeasonText = computed(() => {
  if (!currentSeason.value) return 'Les animes de la saison'
  return formatSeasonText(currentSeason.value)
})

const currentSeasonUrl = computed(() => {
  if (!currentSeason.value) return '/animes'
  return formatSeasonUrl(currentSeason.value)
})

// Show season menu item only if season is loaded
const showSeasonMenuItem = computed(() => {
  return currentSeason.value !== null
})

// Load current season data
const loadCurrentSeason = async () => {
  try {
    seasonLoading.value = true
    currentSeason.value = await fetchCurrentSeason()
  } catch (error) {
    console.error('Error loading current season:', error)
    // Keep currentSeason as null to hide the menu item
  } finally {
    seasonLoading.value = false
  }
}

// Close dropdowns when clicking outside
onMounted(async () => {
  // Load current season data
  await loadCurrentSeason()
  
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.relative')) {
      showNotifications.value = false
      showUserMenu.value = false
      showAnimeDropdown.value = false
    }
  })

  const onScroll = () => {
    isScrolled.value = window.scrollY > 4
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      showNotifications.value = false
      showUserMenu.value = false
      showMobileMenu.value = false
      showAnimeDropdown.value = false
    }
  }
  document.addEventListener('keydown', onKeydown)

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('keydown', onKeydown)
  })
})

const handleLogout = () => {
  showUserMenu.value = false
  showMobileMenu.value = false
  showLogoutModal.value = true
}

const confirmLogout = async () => {
  const { success } = useNotification()
  
  try {
    await authStore.logout()
    showLogoutModal.value = false
    success('Vous avez été déconnecté avec succès')
    navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
    showLogoutModal.value = false
  }
}

const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

const onAvatarError = (event: Event) => {
  avatarError.value = true
}

// Close mobile menu on route change
watch(() => useRoute().path, () => {
  showMobileMenu.value = false
})

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}
</script>

<style scoped>
/* Custom styles for header */
.router-link-active {
  @apply text-blue-600 dark:text-blue-400;
}

@media (prefers-reduced-motion: reduce) {
  header {
    transition: none !important;
  }
}
</style>
