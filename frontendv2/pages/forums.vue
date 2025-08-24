<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div class="text-center mb-8">
            <Icon name="heroicons:chat-bubble-left-ellipsis" class="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Forum</h1>
            <p class="text-gray-600 dark:text-gray-400">Rejoignez la communauté et discutez de vos animes et mangas préférés</p>
          </div>
          
          <div class="text-center">
            <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Le forum sera bientôt disponible. En attendant, explorez notre collection d'animes et mangas !
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <NuxtLink 
                to="/"
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Retour à l'accueil
              </NuxtLink>
              <NuxtLink 
                to="/animes"
                class="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Découvrir les animes
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Forum - Anime Kun',
  meta: [
    { name: 'description', content: 'Forum communautaire pour discuter d\'animes et mangas' }
  ]
})
</script>