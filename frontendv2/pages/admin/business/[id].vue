<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <div class="flex items-center">
          <div class="text-red-500 mr-3">⚠️</div>
          <div>
            <h3 class="text-lg font-semibold text-red-800">Erreur de chargement</h3>
            <p class="text-red-600 mt-1">{{ error }}</p>
            <button @click="load" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex min-h-screen">
      <!-- Sidebar Navigation -->
      <aside class="w-64 bg-white shadow-lg border-r border-gray-200">
        <div class="p-6">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-semibold">🏢</span>
            </div>
            <div>
              <h1 class="text-lg font-semibold text-gray-900">Business Admin</h1>
              <p class="text-sm text-gray-600">ID: {{ item?.idBusiness || route.params.id }}</p>
            </div>
          </div>


          <div class="mt-8 pt-6 border-t border-gray-200">
            <NuxtLink to="/admin/business" class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              ← Retour à la liste
            </NuxtLink>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 p-8" v-if="item">
        <!-- General Information -->
        <div class="space-y-6">
          <div class="bg-white shadow-sm rounded-lg border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Informations générales</h2>
              <p class="text-sm text-gray-600 mt-1">Modifier les détails de base de l'entreprise</p>
            </div>

            <form @submit.prevent="save" class="p-6 space-y-6">
              <!-- Denomination -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Dénomination *</label>
                <input 
                  v-model="item.denomination" 
                  type="text" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Nom de l'entreprise"
                />
              </div>

              <!-- Type and Origin -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <input 
                    v-model="item.type" 
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Type d'entreprise"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Origine</label>
                  <input 
                    v-model="item.origine" 
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Pays/région d'origine"
                  />
                </div>
              </div>

              <!-- Website and Date -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Site officiel</label>
                  <input 
                    v-model="item.siteOfficiel" 
                    type="url"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input 
                    v-model="item.date" 
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Date de création"
                  />
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                  v-model="item.notes" 
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 placeholder-gray-500 resize-vertical"
                  placeholder="Notes et informations complémentaires..."
                />
              </div>

              <!-- Status and Image -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select 
                    v-model.number="item.statut"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900"
                  >
                    <option :value="1">Affichée</option>
                    <option :value="2">En attente</option>
                    <option :value="0">Bloquée</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    @change="onFile"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white text-gray-900 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p v-if="item.image" class="text-xs text-gray-500 mt-1">Fichier actuel: {{ item.image }}</p>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="flex justify-end pt-6 border-t border-gray-200">
                <button 
                  type="submit" 
                  :disabled="saving"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span v-if="saving" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>

    <!-- Notification Container -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()
const { addNotification } = useNotification()

// Reactive state
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const item = ref<any>(null)

// Load business data
const load = async () => {
  try {
    loading.value = true
    error.value = null
    
    const res = await $fetch(`${config.public.apiBase}/api/admin/business/${route.params.id}`, {
      headers: auth.getAuthHeaders() as any
    })
    item.value = res
  } catch (err: any) {
    console.error('Error loading business:', err)
    error.value = err?.data?.message || 'Erreur lors du chargement de l\'entreprise'
  } finally {
    loading.value = false
  }
}

// File upload
const onFile = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'business')
  fd.append('relatedId', String(item.value.idBusiness))
  
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', 
      body: fd, 
      headers: auth.getAuthHeaders() as any
    })
    item.value.image = res.filename
    addNotification('Image uploadée avec succès!', 'success')
  } catch (err: any) {
    console.error('Upload error:', err)
    addNotification('Échec de l\'upload de l\'image', 'error')
  }
}

// Save business
const save = async () => {
  try {
    saving.value = true
    
    const body: any = {
      denomination: item.value.denomination,
      type: item.value.type,
      origine: item.value.origine,
      siteOfficiel: item.value.siteOfficiel,
      date: item.value.date,
      notes: item.value.notes,
      statut: item.value.statut,
      image: item.value.image,
    }
    
    await $fetch(`${config.public.apiBase}/api/admin/business/${item.value.idBusiness}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
      body
    })
    
    addNotification('Entreprise mise à jour avec succès!', 'success')
  } catch (err: any) {
    console.error('Error saving business:', err)
    addNotification(err?.data?.message || 'Erreur lors de l\'enregistrement', 'error')
  } finally {
    saving.value = false
  }
}

// Initialize
onMounted(() => {
  load()
})
</script>

<style scoped>
/* Custom styles for better spacing and visual hierarchy */
.min-h-screen {
  min-height: 100vh;
}

/* Ensure proper text contrast */
input, select, textarea {
  background-color: #ffffff !important;
  color: #111827 !important;
}

input::placeholder, textarea::placeholder {
  color: #6b7280 !important;
}

/* Focus states */
input:focus, select:focus, textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* Smooth transitions */
* {
  transition: all 0.2s ease-in-out;
}

/* Loading animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

