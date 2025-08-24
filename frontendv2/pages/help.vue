<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div class="text-center mb-8">
            <Icon name="heroicons:question-mark-circle" class="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Aide</h1>
            <p class="text-gray-600 dark:text-gray-400">Trouvez des réponses à vos questions</p>
          </div>
          
          <div class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Icon name="heroicons:magnifying-glass" class="w-5 h-5 text-blue-500" />
                  Recherche
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Utilisez la barre de recherche pour trouver vos animes et mangas préférés rapidement.
                </p>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Icon name="heroicons:star" class="w-5 h-5 text-yellow-500" />
                  Notes et critiques
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Notez et laissez des critiques pour partager votre avis avec la communauté.
                </p>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Icon name="heroicons:heart" class="w-5 h-5 text-red-500" />
                  Listes favorites
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Créez vos listes personnalisées pour organiser vos animes et mangas préférés.
                </p>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Icon name="heroicons:users" class="w-5 h-5 text-purple-500" />
                  Communauté
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                  Rejoignez les discussions sur le forum et connectez-vous avec d'autres fans.
                </p>
              </div>
            </div>
            
            <div class="text-center mt-8">
              <NuxtLink 
                to="/"
                class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Icon name="heroicons:arrow-left" class="w-4 h-4" />
                Retour à l'accueil
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
  title: 'Aide - Anime Kun',
  meta: [
    { name: 'description', content: 'Centre d\'aide et FAQ pour Anime Kun' }
  ]
})
</script>