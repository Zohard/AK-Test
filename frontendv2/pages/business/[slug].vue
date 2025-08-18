<template>
  <div class="business-detail-page">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Chargement des détails...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-8">
      <div class="flex">
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Erreur de chargement
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            {{ error }}
          </div>
          <div class="mt-4">
            <button
              @click="loadBusiness"
              class="btn-primary"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Business details -->
    <div v-else-if="business" class="max-w-6xl mx-auto">
      <!-- Header section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
        <div class="md:flex">
          <!-- Business image -->
          <div class="md:w-1/3">
            <div class="aspect-w-3 aspect-h-4 bg-gray-200 dark:bg-gray-700">
              <img
                v-if="business.image"
                :src="getImageUrl(business.image)"
                :alt="business.denomination || 'Business'"
                class="w-full h-full object-cover"
                @error="hideImage"
              />
              <div 
                v-else 
                class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700"
              >
                <Icon name="heroicons:building-office" class="w-16 h-16 text-gray-400" />
              </div>
            </div>
          </div>

          <!-- Business info -->
          <div class="md:w-2/3 p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {{ business.denomination || 'Sans nom' }}
                </h1>
                
                <div v-if="business.autresDenominations" class="mb-4">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Autres dénominations:</span>
                    {{ business.autresDenominations }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div v-if="business.type" class="flex items-center">
                    <Icon name="heroicons:tag" class="w-4 h-4 mr-1" />
                    <span class="capitalize">{{ business.type }}</span>
                  </div>
                  <div v-if="business.origine" class="flex items-center">
                    <Icon name="heroicons:globe-alt" class="w-4 h-4 mr-1" />
                    <span>{{ business.origine }}</span>
                  </div>
                  <div v-if="business.date" class="flex items-center">
                    <Icon name="heroicons:calendar" class="w-4 h-4 mr-1" />
                    <span>{{ formatDate(business.date) }}</span>
                  </div>
                </div>

                <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div class="flex items-center">
                    <Icon name="heroicons:eye" class="w-4 h-4 mr-1" />
                    <span>{{ business.nbClics || 0 }} vues</span>
                  </div>
                  <div class="flex items-center">
                    <Icon name="heroicons:link" class="w-4 h-4 mr-1" />
                    <span>{{ business.relations || 0 }} relations</span>
                  </div>
                </div>

                <div v-if="business.siteOfficiel" class="mb-4">
                  <a
                    :href="business.siteOfficiel"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Icon name="heroicons:globe-alt" class="w-4 h-4 mr-1" />
                    Site officiel
                    <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Notes/Description -->
            <div v-if="business.notes" class="mt-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Description
              </h3>
              <div class="prose prose-gray dark:prose-invert max-w-none">
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {{ business.notes }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related content sections would go here -->
      <!-- For example: Related anime, staff members, etc. -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Placeholder for related anime -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Animes associés
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-center py-8">
            Fonctionnalité à venir...
          </p>
        </div>

        <!-- Placeholder for related manga -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mangas associés
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-center py-8">
            Fonctionnalité à venir...
          </p>
        </div>
      </div>
    </div>

    <!-- Not found state -->
    <div v-else class="text-center py-12">
      <Icon name="heroicons:building-office" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        Entité business introuvable
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        L'entité business demandée n'existe pas ou a été supprimée.
      </p>
      <div class="mt-6">
        <NuxtLink
          to="/business"
          class="btn-primary"
        >
          Retourner à la liste
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Business } from '~/types'

// Page metadata
useHead({
  title: 'Détails Business - Anime-Kun V2'
})

// Get route parameters
const route = useRoute()
const slug = route.params.slug as string

// State
const business = ref<Business | null>(null)
const loading = ref(true)
const error = ref('')

// Runtime config for API base URL
const config = useRuntimeConfig()

// Extract ID from slug (expecting format: nice-url-123)
const extractIdFromSlug = (slug: string): number | null => {
  console.log('Extracting ID from slug:', slug)
  const matches = slug.match(/-(\d+)$/)
  const id = matches ? parseInt(matches[1]) : null
  console.log('Extracted ID:', id)
  return id
}

// Generate slug from business name
const createSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Load business data
const loadBusiness = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const businessId = extractIdFromSlug(slug)
    if (!businessId) {
      error.value = 'ID business invalide dans l\'URL'
      return
    }

    console.log('Loading business with ID:', businessId)
    
    const response = await $fetch(`/api/business/${businessId}`, {
      baseURL: config.public.apiBase
    })
    
    console.log('Business API response:', response)
    
    if (response && (response.data || response.idBusiness)) {
      business.value = response.data || response
      
      // Update page title with business name
      if (business.value?.denomination) {
        useHead({
          title: `${business.value.denomination} - Anime-Kun V2`,
          meta: [
            { name: 'description', content: business.value.notes || `Informations sur ${business.value.denomination}` }
          ]
        })
      }
      
      // Increment view count
      await incrementBusinessClicks(businessId)
    } else {
      error.value = 'Entité business introuvable'
    }
  } catch (err: any) {
    console.error('Error loading business:', err)
    error.value = err.message || 'Erreur lors du chargement de l\'entité business'
  } finally {
    loading.value = false
  }
}

// Increment business clicks
const incrementBusinessClicks = async (businessId: number) => {
  try {
    await $fetch(`/api/business/${businessId}/clicks`, {
      method: 'POST',
      baseURL: config.public.apiBase,
      query: { type: 'day' }
    })
  } catch (err) {
    console.warn('Failed to increment business clicks:', err)
  }
}

// Get image URL
const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  return `${config.public.apiBase}/media/business/${imagePath}`
}

// Hide broken images
const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

// Format date
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

// Load business on component mount
onMounted(() => {
  loadBusiness()
})

// Watch for route changes
watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    loadBusiness()
  }
})
</script>

<style scoped>
.business-detail-page {
  @apply container mx-auto px-4 py-8;
}

.aspect-w-3 {
  position: relative;
  width: 100%;
}

.aspect-w-3::before {
  content: '';
  display: block;
  padding-bottom: 133.333333%; /* 4:3 aspect ratio */
}

.aspect-h-4 > * {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>