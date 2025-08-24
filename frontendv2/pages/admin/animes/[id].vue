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
            <button @click="loadAnime" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
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
            <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-semibold">📺</span>
            </div>
            <div>
              <h1 class="text-lg font-semibold text-gray-900">Anime Admin</h1>
              <p class="text-sm text-gray-600">ID: {{ anime?.idAnime || route.params.id }}</p>
            </div>
          </div>

          <nav class="space-y-2">
            <a href="#general" @click.prevent="activeTab = 'general'" 
               :class="['flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', activeTab === 'general' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100']">
              <span class="mr-3">📋</span>
              Informations générales
            </a>
            <a href="#relations" @click.prevent="activeTab = 'relations'"
               :class="['flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', activeTab === 'relations' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100']">
              <span class="mr-3">🔗</span>
              Relations
            </a>
            <a href="#staff" @click.prevent="activeTab = 'staff'"
               :class="['flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', activeTab === 'staff' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100']">
              <span class="mr-3">👥</span>
              Staff
            </a>
            <a href="#tags" @click.prevent="activeTab = 'tags'"
               :class="['flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', activeTab === 'tags' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100']">
              <span class="mr-3">🏷️</span>
              Tags
            </a>
          </nav>

          <div class="mt-8 pt-6 border-t border-gray-200">
            <NuxtLink to="/admin/animes" class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              ← Retour à la liste
            </NuxtLink>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 p-8" v-if="anime">
        <!-- General Information Tab -->
        <div v-show="activeTab === 'general'" class="space-y-6">
          <div class="bg-white shadow-sm rounded-lg border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Informations générales</h2>
              <p class="text-sm text-gray-600 mt-1">Modifier les détails de base de l'anime</p>
            </div>

            <form @submit.prevent="saveAnime" class="p-6 space-y-6">
              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input 
                  v-model="anime.titre" 
                  type="text" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Titre de l'anime"
                />
              </div>

              <!-- Year and Episodes -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Année</label>
                  <input 
                    v-model.number="anime.annee" 
                    type="number" 
                    min="1900"
                    :max="new Date().getFullYear() + 5"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nombre d'épisodes</label>
                  <input 
                    v-model.number="anime.nbEp" 
                    type="number" 
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="12"
                  />
                </div>
              </div>

              <!-- Studio and Director -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Studio</label>
                  <input 
                    v-model="anime.studio" 
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Studio d'animation"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Réalisateur</label>
                  <input 
                    v-model="anime.realisateur" 
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Nom du réalisateur"
                  />
                </div>
              </div>

              <!-- Synopsis -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Synopsis</label>
                <textarea 
                  v-model="anime.synopsis" 
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500 resize-vertical"
                  placeholder="Description de l'anime..."
                />
              </div>

              <!-- Status and Image -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select 
                    v-model.number="anime.statut"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
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
                    @change="handleFileUpload"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p v-if="anime.image" class="text-xs text-gray-500 mt-1">Fichier actuel: {{ anime.image }}</p>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="flex justify-end pt-6 border-t border-gray-200">
                <button 
                  type="submit" 
                  :disabled="saving"
                  class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        <!-- Relations Tab -->
        <div v-show="activeTab === 'relations'" class="space-y-6">
          <div class="bg-white shadow-sm rounded-lg border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Relations</h2>
              <p class="text-sm text-gray-600 mt-1">Gérer les relations avec d'autres contenus</p>
            </div>

            <div class="p-6">
              <!-- Existing Relations -->
              <div v-if="relations.length === 0" class="text-center py-8">
                <div class="text-gray-400 text-6xl mb-4">🔗</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune relation</h3>
                <p class="text-gray-600">Cet anime n'a pas encore de relations définies.</p>
              </div>
              
              <div v-else class="space-y-3 mb-6">
                <div v-for="rel in relations" :key="rel.id_relation" 
                     class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <span class="font-medium text-gray-900">{{ rel.related_title || '—' }}</span>
                      <span class="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {{ rel.typeRelation || 'related' }}
                      </span>
                    </div>
                  </div>
                  <button 
                    @click="deleteRelation(rel)" 
                    class="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <!-- Add Relation Form -->
              <div class="border-t border-gray-200 pt-6">
                <h4 class="text-lg font-medium text-gray-900 mb-4">Ajouter une relation</h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Type de contenu</label>
                    <select 
                      v-model="relForm.related_type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                      <option value="anime">Anime</option>
                      <option value="manga">Manga</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ID du contenu</label>
                    <input 
                      v-model.number="relForm.related_id" 
                      type="number" 
                      min="1"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Type de relation</label>
                    <input 
                      v-model="relForm.relation_type" 
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="sequel, prequel, related..."
                    />
                  </div>
                  <div class="flex items-end">
                    <button 
                      @click="addRelation" 
                      :disabled="!relForm.related_id"
                      class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Staff Tab -->
        <div v-show="activeTab === 'staff'" class="space-y-6">
          <div class="bg-white shadow-sm rounded-lg border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Staff & Business</h2>
              <p class="text-sm text-gray-600 mt-1">Gérer les associations avec les studios et entreprises</p>
            </div>

            <div class="p-6">
              <!-- Existing Staff -->
              <div v-if="staff.length === 0" class="text-center py-8">
                <div class="text-gray-400 text-6xl mb-4">👥</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun staff</h3>
                <p class="text-gray-600">Aucune association business n'est définie pour cet anime.</p>
              </div>
              
              <div v-else class="space-y-3 mb-6">
                <div v-for="s in staff" :key="s.id_relation || s.id_business" 
                     class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div>
                      <span class="font-medium text-gray-900">{{ s.nom }}</span>
                      <span v-if="s.type" class="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {{ s.type }}
                      </span>
                    </div>
                  </div>
                  <button 
                    @click="removeStaff(s)" 
                    class="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                  >
                    Retirer
                  </button>
                </div>
              </div>

              <!-- Add Staff Form -->
              <div class="border-t border-gray-200 pt-6">
                <h4 class="text-lg font-medium text-gray-900 mb-4">Ajouter un business</h4>
                
                <!-- Business Search -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Rechercher un business</label>
                  <input 
                    v-model="businessQuery" 
                    type="text"
                    @input="debouncedSearchBusiness"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Nom du studio, éditeur..."
                  />
                  <div v-if="businessOptions.length" class="mt-3 flex flex-wrap gap-2">
                    <button 
                      v-for="b in businessOptions" 
                      :key="b.idBusiness"
                      @click="selectBusiness(b)"
                      class="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      {{ b.denomination }}
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Business ID</label>
                    <input 
                      v-model.number="staffForm.businessId" 
                      type="number" 
                      min="1"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="ID"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Rôle (optionnel)</label>
                    <input 
                      v-model="staffForm.role" 
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="Studio, Producer..."
                    />
                  </div>
                  <div class="flex items-end">
                    <button 
                      @click="addStaff" 
                      :disabled="!staffForm.businessId"
                      class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags Tab -->
        <div v-show="activeTab === 'tags'" class="space-y-6">
          <div class="bg-white shadow-sm rounded-lg border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Tags</h2>
              <p class="text-sm text-gray-600 mt-1">Gérer les tags et catégories de l'anime</p>
            </div>

            <div class="p-6">
              <!-- Existing Tags -->
              <div v-if="tags.length === 0" class="text-center py-8">
                <div class="text-gray-400 text-6xl mb-4">🏷️</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun tag</h3>
                <p class="text-gray-600">Aucun tag n'est associé à cet anime.</p>
              </div>
              
              <div v-else class="mb-6">
                <div class="flex flex-wrap gap-2">
                  <span v-for="t in tags" :key="t.id" 
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {{ t.nom }}
                    <button 
                      @click="removeTag(t)" 
                      class="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Supprimer ce tag"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              </div>

              <!-- Add Tag Form -->
              <div class="border-t border-gray-200 pt-6">
                <h4 class="text-lg font-medium text-gray-900 mb-4">Ajouter un tag</h4>
                
                <!-- Tag Search -->
                <div class="mb-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Rechercher un tag</label>
                      <input 
                        v-model="tagSearch" 
                        type="text"
                        @input="debouncedSearchTags"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        placeholder="Nom du tag..."
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                      <select 
                        v-model="tagCategory"
                        @change="debouncedSearchTags"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      >
                        <option value="">Toutes les catégories</option>
                        <option value="Genre">Genre</option>
                        <option value="Thème">Thème</option>
                      </select>
                    </div>
                  </div>
                  
                  <div v-if="tagOptions.length" class="flex flex-wrap gap-2">
                    <button 
                      v-for="opt in tagOptions" 
                      :key="opt.id"
                      @click="selectTag(opt)"
                      class="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      {{ opt.name }}
                      <span class="ml-1 text-xs text-blue-600">({{ opt.categorie }})</span>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tag ID</label>
                    <input 
                      v-model.number="tagForm.tagId" 
                      type="number" 
                      min="1"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      placeholder="ID du tag"
                    />
                  </div>
                  <div class="md:col-span-2 flex items-end">
                    <button 
                      @click="addTag" 
                      :disabled="!tagForm.tagId"
                      class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Ajouter le tag
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
const activeTab = ref('general')
const anime = ref<any>(null)
const type = 'anime'

// Relations
const relations = ref<any[]>([])
const relForm = reactive<any>({ 
  related_type: 'anime', 
  related_id: undefined, 
  relation_type: 'related' 
})

// Staff
const staff = ref<any[]>([])
const businessQuery = ref('')
const businessOptions = ref<any[]>([])
const staffForm = reactive<any>({ 
  businessId: undefined, 
  role: '' 
})

// Tags
const tags = ref<any[]>([])
const tagForm = reactive<any>({ tagId: undefined })
const tagSearch = ref('')
const tagOptions = ref<any[]>([])
const tagCategory = ref('')

// Load anime data
const loadAnime = async () => {
  try {
    loading.value = true
    error.value = null
    
    const res = await $fetch(`${config.public.apiBase}/api/admin/animes/${route.params.id}`, {
      headers: auth.getAuthHeaders() as any
    })
    anime.value = res
    await loadAdminExtras()
  } catch (err: any) {
    console.error('Error loading anime:', err)
    error.value = err?.data?.message || 'Erreur lors du chargement de l\'anime'
  } finally {
    loading.value = false
  }
}

// Load additional data (relations, staff, tags)
const loadAdminExtras = async () => {
  if (!anime.value) return
  
  try {
    const [rels, stf, tgs] = await Promise.all([
      $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/relationships`, { 
        headers: auth.getAuthHeaders() as any 
      }),
      $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/staff`, { 
        headers: auth.getAuthHeaders() as any 
      }),
      $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/tags`, { 
        headers: auth.getAuthHeaders() as any 
      }),
    ])
    
    relations.value = rels as any[]
    staff.value = stf as any[]
    tags.value = tgs as any[]
  } catch (err) {
    console.error('Error loading admin extras:', err)
  }
}

// Save anime
const saveAnime = async () => {
  try {
    saving.value = true
    
    const body: any = {
      titre: anime.value.titre,
      annee: anime.value.annee,
      nbEp: anime.value.nbEp,
      studio: anime.value.studio,
      realisateur: anime.value.realisateur,
      synopsis: anime.value.synopsis,
      image: anime.value.image,
      statut: anime.value.statut,
    }
    
    await $fetch(`${config.public.apiBase}/api/admin/animes/${anime.value.idAnime}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
      body
    })
    
    addNotification('Anime mis à jour avec succès!', 'success')
  } catch (err: any) {
    console.error('Error saving anime:', err)
    addNotification(err?.data?.message || 'Erreur lors de l\'enregistrement', 'error')
  } finally {
    saving.value = false
  }
}

// File upload
const handleFileUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'anime')
  fd.append('relatedId', String(anime.value.idAnime))
  
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', 
      body: fd, 
      headers: auth.getAuthHeaders() as any
    })
    anime.value.image = res.filename
    addNotification('Image uploadée avec succès!', 'success')
  } catch (err: any) {
    console.error('Upload error:', err)
    addNotification('Échec de l\'upload de l\'image', 'error')
  }
}

// Relations management
const addRelation = async () => {
  if (!relForm.related_id) {
    addNotification('Veuillez saisir un ID de contenu', 'warning')
    return
  }
  
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/relationships`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, 
      body: relForm
    })
    
    relForm.related_id = undefined
    relForm.relation_type = 'related'
    await loadAdminExtras()
    addNotification('Relation ajoutée avec succès!', 'success')
  } catch (err: any) {
    console.error('Error adding relation:', err)
    addNotification(err?.data?.message || 'Erreur lors de l\'ajout de la relation', 'error')
  }
}

const deleteRelation = async (rel: any) => {
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/relationships/${rel.id_relation}`, {
      method: 'DELETE', 
      headers: auth.getAuthHeaders() as any
    })
    await loadAdminExtras()
    addNotification('Relation supprimée avec succès!', 'success')
  } catch (err: any) {
    console.error('Error deleting relation:', err)
    addNotification('Erreur lors de la suppression de la relation', 'error')
  }
}

// Staff management
const debouncedSearchBusiness = useDebounceFn(async () => {
  if (!businessQuery.value) { 
    businessOptions.value = []
    return 
  }
  
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/admin/business`, {
      params: { search: businessQuery.value, page: 1, limit: 10 }, 
      headers: auth.getAuthHeaders() as any
    })
    businessOptions.value = res.items || []
  } catch (err) {
    console.error('Error searching business:', err)
  }
}, 400)

const selectBusiness = (b: any) => { 
  staffForm.businessId = b.idBusiness 
  businessQuery.value = b.denomination
}

const addStaff = async () => {
  if (!staffForm.businessId) {
    addNotification('Veuillez sélectionner un business', 'warning')
    return
  }
  
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/staff`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, 
      body: staffForm
    })
    
    staffForm.businessId = undefined
    staffForm.role = ''
    businessQuery.value = ''
    businessOptions.value = []
    await loadAdminExtras()
    addNotification('Staff ajouté avec succès!', 'success')
  } catch (err: any) {
    console.error('Error adding staff:', err)
    addNotification(err?.data?.message || 'Erreur lors de l\'ajout du staff', 'error')
  }
}

const removeStaff = async (s: any) => {
  try {
    const id = s.id_business || s.idBusiness
    await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/staff/${id}`, {
      method: 'DELETE', 
      headers: auth.getAuthHeaders() as any
    })
    await loadAdminExtras()
    addNotification('Staff retiré avec succès!', 'success')
  } catch (err: any) {
    console.error('Error removing staff:', err)
    addNotification('Erreur lors de la suppression du staff', 'error')
  }
}

// Tags management
const debouncedSearchTags = useDebounceFn(async () => {
  if (!tagSearch.value) { 
    tagOptions.value = []
    return 
  }
  
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/admin/content/tags/search`, {
      params: { 
        q: tagSearch.value, 
        limit: 10, 
        categorie: tagCategory.value || undefined 
      }, 
      headers: auth.getAuthHeaders() as any
    })
    
    const attachedIds = new Set(tags.value.map((t: any) => t.id))
    tagOptions.value = (res.items || []).filter((opt: any) => !attachedIds.has(opt.id))
  } catch (err) {
    console.error('Error searching tags:', err)
  }
}, 300)

const selectTag = (opt: any) => { 
  tagForm.tagId = opt.id 
  tagSearch.value = opt.name
}

const addTag = async () => {
  if (!tagForm.tagId) {
    addNotification('Veuillez sélectionner un tag', 'warning')
    return
  }
  
  // Prevent duplicate tags
  if (tags.value.some((t: any) => t.id === tagForm.tagId)) {
    addNotification('Ce tag est déjà associé à cet anime', 'warning')
    return
  }
  
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/tags`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, 
      body: tagForm
    })
    
    tagForm.tagId = undefined
    tagSearch.value = ''
    tagOptions.value = []
    await loadAdminExtras()
    addNotification('Tag ajouté avec succès!', 'success')
  } catch (err: any) {
    console.error('Error adding tag:', err)
    addNotification(err?.data?.message || 'Erreur lors de l\'ajout du tag', 'error')
  }
}

const removeTag = async (t: any) => {
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/tags/${t.id}`, {
      method: 'DELETE', 
      headers: auth.getAuthHeaders() as any
    })
    await loadAdminExtras()
    addNotification('Tag supprimé avec succès!', 'success')
  } catch (err: any) {
    console.error('Error removing tag:', err)
    addNotification('Erreur lors de la suppression du tag', 'error')
  }
}

// Initialize
onMounted(() => {
  loadAnime()
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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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