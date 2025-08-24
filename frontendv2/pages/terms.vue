<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div class="text-center mb-8">
            <Icon name="heroicons:document-text" class="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Conditions d'utilisation</h1>
            <p class="text-gray-600 dark:text-gray-400">Dernière mise à jour : {{ new Date().toLocaleDateString('fr-FR') }}</p>
          </div>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptation des conditions</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              En accédant et en utilisant Anime Kun, vous acceptez d'être lié par ces conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Description du service</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Anime Kun est une plateforme dédiée aux amateurs d'animes et de mangas, proposant des informations, 
              critiques, et un espace communautaire pour les passionnés.
            </p>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Utilisation acceptable</h2>
            <div class="text-gray-600 dark:text-gray-400 mb-6 space-y-2">
              <p>Vous vous engagez à :</p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>Utiliser le service de manière respectueuse</li>
                <li>Ne pas publier de contenu offensant ou inapproprié</li>
                <li>Respecter les droits d'auteur</li>
                <li>Ne pas utiliser le service à des fins malveillantes</li>
              </ul>
            </div>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Contenu utilisateur</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Vous conservez la propriété de votre contenu, mais accordez à Anime Kun une licence 
              pour l'utiliser dans le cadre du service. Vous êtes responsable du contenu que vous publiez.
            </p>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Limitation de responsabilité</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Anime Kun est fourni "en l'état" sans garantie. Nous ne sommes pas responsables 
              des dommages résultant de l'utilisation du service.
            </p>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">6. Modifications</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-8">
              Nous nous réservons le droit de modifier ces conditions à tout moment. 
              Les modifications seront effectives dès leur publication sur cette page.
            </p>
          </div>
          
          <div class="text-center border-t border-gray-200 dark:border-gray-700 pt-6">
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
</template>

<script setup lang="ts">
useHead({
  title: 'Conditions d\'utilisation - Anime Kun',
  meta: [
    { name: 'description', content: 'Conditions d\'utilisation du site Anime Kun' }
  ]
})
</script>