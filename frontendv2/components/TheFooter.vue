<template>
  <footer class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Logo and description -->
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <img 
              src="/logo.svg" 
              alt="Anime-Kun" 
              class="h-8 w-8"
              @error="hideImage"
            />
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              Anime-Kun V2
            </span>
          </div>
          <p class="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
            Votre plateforme de référence pour découvrir, critiquer et partager 
            vos animes et mangas préférés avec une communauté passionnée.
          </p>
          <div class="flex space-x-4">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Icon name="heroicons:at-symbol" class="w-5 h-5" />
            </a>
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-indigo-500 transition-colors"
            >
              <Icon name="heroicons:chat-bubble-left" class="w-5 h-5" />
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Icon name="heroicons:code-bracket" class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
            Navigation
          </h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink 
                to="/animes"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Animes
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/mangas"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Mangas
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/reviews/all"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Critiques
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/reviews/anime"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Critiques d'animes
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/reviews/manga"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Critiques de mangas
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/articles"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Articles
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
            Support
          </h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink 
                to="/help"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Centre d'aide
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/contact"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/privacy"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Confidentialité
              </NuxtLink>
            </li>
            <li>
              <NuxtLink 
                to="/terms"
                class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Conditions d'utilisation
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          © {{ currentYear }} Anime-Kun V2. Tous droits réservés.
        </p>
        <div class="mt-4 md:mt-0 flex items-center space-x-4">
          <span class="text-gray-500 dark:text-gray-400 text-sm">
            Fait avec ❤️ pour la communauté anime/manga
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()

const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}
</script>