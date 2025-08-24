<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div class="text-center mb-8">
            <Icon name="heroicons:shield-check" class="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Politique de confidentialité</h1>
            <p class="text-gray-600 dark:text-gray-400">Dernière mise à jour : {{ new Date().toLocaleDateString('fr-FR') }}</p>
          </div>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Collecte des données</h2>
            <div class="text-gray-600 dark:text-gray-400 mb-6 space-y-2">
              <p>Nous collectons les informations suivantes :</p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>Informations de compte (nom d'utilisateur, email)</li>
                <li>Préférences et listes personnelles</li>
                <li>Données d'utilisation et statistiques</li>
                <li>Cookies pour améliorer l'expérience utilisateur</li>
              </ul>
            </div>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Utilisation des données</h2>
            <div class="text-gray-600 dark:text-gray-400 mb-6 space-y-2">
              <p>Vos données sont utilisées pour :</p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>Fournir et améliorer nos services</li>
                <li>Personnaliser votre expérience</li>
                <li>Envoyer des notifications importantes</li>
                <li>Analyser l'utilisation du site</li>
              </ul>
            </div>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Partage des données</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Nous ne vendons pas vos données personnelles. Nous pouvons partager des informations 
              avec des partenaires de confiance uniquement dans le cadre de l'amélioration du service.
            </p>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Sécurité</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Nous mettons en place des mesures de sécurité appropriées pour protéger vos données 
              contre l'accès non autorisé, la modification, la divulgation ou la destruction.
            </p>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Vos droits</h2>
            <div class="text-gray-600 dark:text-gray-400 mb-6 space-y-2">
              <p>Vous avez le droit de :</p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>Accéder à vos données personnelles</li>
                <li>Corriger des informations inexactes</li>
                <li>Supprimer votre compte et vos données</li>
                <li>Vous opposer au traitement de vos données</li>
              </ul>
            </div>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">6. Cookies</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer 
              vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
            
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">7. Contact</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-8">
              Pour toute question concernant cette politique de confidentialité, 
              contactez-nous à : privacy@anime-kun.fr
            </p>
          </div>
          
          <div class="text-center border-t border-gray-200 dark:border-gray-700 pt-6">
            <NuxtLink 
              to="/"
              class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
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
  title: 'Politique de confidentialité - Anime Kun',
  meta: [
    { name: 'description', content: 'Politique de confidentialité et protection des données d\'Anime Kun' }
  ]
})
</script>