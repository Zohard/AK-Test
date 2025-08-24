<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div class="text-center mb-8">
            <Icon name="heroicons:envelope" class="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact</h1>
            <p class="text-gray-600 dark:text-gray-400">Contactez-nous pour toute question ou suggestion</p>
          </div>
          
          <div class="grid md:grid-cols-2 gap-8">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Informations de contact</h2>
              
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <Icon name="heroicons:envelope" class="w-5 h-5 text-blue-500" />
                  <span class="text-gray-600 dark:text-gray-400">contact@anime-kun.fr</span>
                </div>
                
                <div class="flex items-center gap-3">
                  <Icon name="heroicons:chat-bubble-left" class="w-5 h-5 text-green-500" />
                  <span class="text-gray-600 dark:text-gray-400">Forum communautaire</span>
                </div>
                
                <div class="flex items-center gap-3">
                  <Icon name="heroicons:clock" class="w-5 h-5 text-orange-500" />
                  <span class="text-gray-600 dark:text-gray-400">Réponse sous 24-48h</span>
                </div>
              </div>
              
              <div class="mt-8">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Suivez-nous</h3>
                <div class="flex gap-4">
                  <a href="#" class="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    <Icon name="heroicons:share" class="w-5 h-5" />
                  </a>
                  <a href="#" class="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                    <Icon name="heroicons:chat-bubble-oval-left" class="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Envoyez-nous un message</h2>
              
              <form class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows="4"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
          
          <div class="text-center mt-8">
            <NuxtLink 
              to="/"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              <Icon name="heroicons:arrow-left" class="w-4 h-4" />
              Retour à l'accueil
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Contact - Anime Kun',
  meta: [
    { name: 'description', content: 'Contactez l\'équipe d\'Anime Kun' }
  ]
})
</script>