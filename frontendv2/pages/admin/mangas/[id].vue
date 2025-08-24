<template>
  <div class="admin-layout">
    <!-- Admin Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-section">
        <h3 class="sidebar-title">Navigation</h3>
        <NuxtLink to="/admin" class="sidebar-link">
          <Icon name="heroicons:home" class="w-4 h-4" />
          Dashboard
        </NuxtLink>
      </div>

      <div class="sidebar-section">
        <h3 class="sidebar-title">Contenu</h3>
        <NuxtLink to="/admin/animes" class="sidebar-link">
          <Icon name="heroicons:film" class="w-4 h-4" />
          Animes
        </NuxtLink>
        <NuxtLink to="/admin/mangas" class="sidebar-link active">
          <Icon name="heroicons:book-open" class="w-4 h-4" />
          Mangas
        </NuxtLink>
        <NuxtLink to="/admin/business" class="sidebar-link">
          <Icon name="heroicons:building-office" class="w-4 h-4" />
          Entreprises
        </NuxtLink>
      </div>

      <div class="sidebar-section">
        <h3 class="sidebar-title">Liens Rapides</h3>
        <div class="quick-links">
          <a href="/admin/mangas" class="quick-link">/admin/mangas</a>
          <a href="/admin/mangas/create" class="quick-link">/admin/mangas/create</a>
          <a href="/admin/animes" class="quick-link">/admin/animes</a>
          <a href="/admin/business" class="quick-link">/admin/business</a>
          <a href="http://localhost:3003/docs" target="_blank" class="quick-link">
            API Docs
            <Icon name="heroicons:arrow-top-right-on-square" class="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <div v-if="loading" class="card p-6 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Chargement du manga...</p>
      </div>

      <div v-else-if="error" class="card p-6 text-center text-red-600">
        <p>{{ error }}</p>
        <button class="btn-secondary mt-4" @click="load">Réessayer</button>
      </div>

      <div v-else-if="manga" class="space-y-6">
        <!-- Header -->
        <div class="section-header">
          <div>
            <h1 class="section-title">Éditer le manga #{{ manga.idManga }}</h1>
            <p class="text-gray-600 mt-1">{{ manga.titre }}</p>
          </div>
          <div class="flex gap-3">
            <NuxtLink to="/admin/mangas" class="btn-secondary">
              <Icon name="heroicons:arrow-left" class="w-4 h-4 mr-2" />
              Retour
            </NuxtLink>
          </div>
        </div>

        <!-- Main Form -->
        <form @submit.prevent="save" class="card p-6 space-y-6">
          <h2 class="text-lg font-semibold text-gray-900 border-b pb-2">Informations principales</h2>
          
          <div>
            <label class="form-label">Titre *</label>
            <input v-model="manga.titre" class="form-input w-full" required />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="form-label">Auteur</label>
              <input v-model="manga.auteur" class="form-input w-full" placeholder="Nom de l'auteur" />
            </div>
            <div>
              <label class="form-label">Année</label>
              <input v-model="manga.annee" class="form-input w-full" placeholder="2024" maxlength="4" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="form-label">Éditeur</label>
              <input v-model="manga.editeur" class="form-input w-full" placeholder="Nom de l'éditeur" />
            </div>
            <div>
              <label class="form-label">Nombre de volumes</label>
              <input v-model.number="manga.nbVol" type="number" min="0" class="form-input w-full" placeholder="0" />
            </div>
          </div>

          <div>
            <label class="form-label">Synopsis</label>
            <textarea v-model="manga.synopsis" rows="4" class="form-input w-full" placeholder="Description du manga..."></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="form-label">Statut de publication</label>
              <select v-model.number="manga.statut" class="form-input w-full">
                <option :value="1">Affichée</option>
                <option :value="2">En attente</option>
                <option :value="0">Bloquée</option>
              </select>
            </div>
            <div>
              <label class="form-label">Image de couverture</label>
              <input type="file" accept="image/*" @change="onFile" class="form-input w-full" />
              <div v-if="manga.image" class="mt-2 text-sm text-gray-600">
                <Icon name="heroicons:photo" class="w-4 h-4 inline mr-1" />
                {{ manga.image }}
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <NuxtLink to="/admin/mangas" class="btn-secondary">Annuler</NuxtLink>
            <button type="submit" class="btn-primary" :disabled="saving">
              <Icon v-if="saving" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              <Icon v-else name="heroicons:check" class="w-4 h-4 mr-2" />
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>

        <!-- Relations Section -->
        <div class="card p-6 space-y-4">
          <h2 class="text-lg font-semibold text-gray-900 border-b pb-2">Relations</h2>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-3">Ajouter une relation</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select v-model="relForm.related_type" class="form-input">
                <option value="anime">Anime</option>
                <option value="manga">Manga</option>
              </select>
              <input v-model.number="relForm.related_id" type="number" placeholder="ID de l'élément" class="form-input" />
              <button @click="addRelation" type="button" class="btn-secondary">
                <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
                Ajouter
              </button>
            </div>
          </div>

          <div v-if="relations.length > 0" class="space-y-2">
            <h3 class="font-medium text-gray-900">Relations existantes</h3>
            <div class="space-y-2">
              <div v-for="rel in relations" :key="rel.id_relation" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span class="font-medium">{{ rel.related_type }}</span> #{{ rel.related_id }}
                  <span class="text-sm text-gray-600 ml-2">({{ rel.relation_type }})</span>
                </div>
                <button @click="deleteRelation(rel)" class="btn-small danger">
                  <Icon name="heroicons:trash" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Staff Section -->
        <div class="card p-6 space-y-4">
          <h2 class="text-lg font-semibold text-gray-900 border-b pb-2">Staff & Équipe</h2>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-3">Ajouter un membre</h3>
            <div class="space-y-3">
              <input v-model="businessQuery" @input="debouncedSearchBusiness" 
                     placeholder="Rechercher une entreprise..." class="form-input w-full" />
              <div v-if="businessOptions.length > 0" class="space-y-1 max-h-32 overflow-y-auto">
                <button v-for="business in businessOptions" :key="business.idBusiness"
                        @click="selectBusiness(business)" type="button"
                        class="w-full text-left p-2 hover:bg-gray-100 rounded">
                  {{ business.nom }} (ID: {{ business.idBusiness }})
                </button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input v-model="staffForm.role" placeholder="Rôle (ex: Auteur, Éditeur...)" class="form-input" />
                <button @click="addStaff" type="button" class="btn-secondary">
                  <Icon name="heroicons:user-plus" class="w-4 h-4 mr-2" />
                  Ajouter au staff
                </button>
              </div>
            </div>
          </div>

          <div v-if="staff.length > 0" class="space-y-2">
            <h3 class="font-medium text-gray-900">Équipe actuelle</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="member in staff" :key="member.idBusiness || member.id_business" 
                   class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div class="font-medium">{{ member.nom || member.business?.nom }}</div>
                  <div class="text-sm text-gray-600">{{ member.role }}</div>
                </div>
                <button @click="removeStaff(member)" class="btn-small danger">
                  <Icon name="heroicons:trash" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags Section -->
        <div class="card p-6 space-y-4">
          <h2 class="text-lg font-semibold text-gray-900 border-b pb-2">Tags & Catégories</h2>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-3">Ajouter un tag</h3>
            <div class="space-y-3">
              <input v-model="tagSearch" @input="debouncedSearchTags" 
                     placeholder="Rechercher un tag..." class="form-input w-full" />
              <div v-if="tagOptions.length > 0" class="flex flex-wrap gap-2">
                <button v-for="tag in tagOptions" :key="tag.id"
                        @click="selectTag(tag)" type="button"
                        class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200">
                  {{ tag.name }}
                </button>
              </div>
              <button @click="addTag" type="button" class="btn-secondary">
                <Icon name="heroicons:tag" class="w-4 h-4 mr-2" />
                Ajouter le tag
              </button>
            </div>
          </div>

          <div v-if="tags.length > 0" class="space-y-2">
            <h3 class="font-medium text-gray-900">Tags actuels</h3>
            <div class="flex flex-wrap gap-2">
              <div v-for="tag in tags" :key="tag.id" 
                   class="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                <span>{{ tag.name }}</span>
                <button @click="removeTag(tag)" class="text-red-600 hover:text-red-800">
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { success, error: showError } = useNotification()

// State
const manga = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)

// Admin content data
const relations = ref<any[]>([])
const staff = ref<any[]>([])
const tags = ref<any[]>([])

// Forms
const relForm = reactive<any>({ related_type: 'anime', related_id: undefined, relation_type: 'related' })
const businessQuery = ref('')
const businessOptions = ref<any[]>([])
const staffForm = reactive<any>({ businessId: undefined, role: '' })
const tagSearch = ref('')
const tagOptions = ref<any[]>([])
const tagForm = reactive<any>({ tagId: undefined })

// Methods
const load = async () => {
  try {
    loading.value = true
    error.value = null
    
    const res = await $fetch(`${config.public.apiBase}/api/admin/mangas/${route.params.id}`, {
      headers: authStore.getAuthHeaders() as any
    })
    manga.value = res
    
    // Load additional admin data
    await loadAdminExtras()
    
  } catch (err: any) {
    error.value = err?.data?.message || 'Erreur lors du chargement du manga'
    console.error('Error loading manga:', err)
  } finally {
    loading.value = false
  }
}

const save = async () => {
  try {
    saving.value = true
    
    const body: any = {
      titre: manga.value.titre,
      auteur: manga.value.auteur,
      annee: manga.value.annee,
      nbVol: manga.value.nbVol,
      editeur: manga.value.editeur,
      synopsis: manga.value.synopsis,
      image: manga.value.image,
      statut: manga.value.statut,
    }
    
    await $fetch(`${config.public.apiBase}/api/admin/mangas/${manga.value.idManga}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authStore.getAuthHeaders() as any },
      body
    })
    
    success('Manga mis à jour avec succès')
    
  } catch (err: any) {
    console.error('Error saving manga:', err)
    showError(err?.data?.message || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const onFile = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'manga')
  fd.append('relatedId', String(manga.value.idManga))
  
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', 
      body: fd, 
      headers: authStore.getAuthHeaders() as any
    })
    manga.value.image = res.filename
    success('Image uploadée avec succès')
  } catch (err) {
    console.error('Upload error', err)
    showError('Échec de l\'upload de l\'image')
  }
}

// Admin extras
const loadAdminExtras = async () => {
  if (!manga.value) return
  
  try {
    const type = 'manga'
    const [rels, stf, tgs] = await Promise.all([
      $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/relationships`, { 
        headers: authStore.getAuthHeaders() as any 
      }),
      $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/staff`, { 
        headers: authStore.getAuthHeaders() as any 
      }),
      $fetch(`${config.public.apiBase}/api/admin/content/${type}/${manga.value.idManga}/tags`, { 
        headers: authStore.getAuthHeaders() as any 
      }),
    ])
    relations.value = rels as any[]
    staff.value = stf as any[]
    tags.value = tgs as any[]
  } catch (err) {
    console.error('Error loading admin extras:', err)
  }
}

// Relations
const addRelation = async () => {
  if (!relForm.related_id) return
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/manga/${manga.value.idManga}/relationships`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...authStore.getAuthHeaders() as any }, 
      body: relForm
    })
    relForm.related_id = undefined
    await loadAdminExtras()
    success('Relation ajoutée')
  } catch (err) {
    showError('Erreur lors de l\'ajout de la relation')
  }
}

const deleteRelation = async (rel: any) => {
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/relationships/${rel.id_relation}`, {
      method: 'DELETE', 
      headers: authStore.getAuthHeaders() as any
    })
    await loadAdminExtras()
    success('Relation supprimée')
  } catch (err) {
    showError('Erreur lors de la suppression')
  }
}

// Staff
const debouncedSearchBusiness = useDebounceFn(async () => {
  if (!businessQuery.value) { 
    businessOptions.value = []
    return 
  }
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/admin/business`, {
      params: { search: businessQuery.value, page: 1, limit: 10 }, 
      headers: authStore.getAuthHeaders() as any
    })
    businessOptions.value = res.items || []
  } catch (err) {
    console.error('Error searching business:', err)
  }
}, 400)

const selectBusiness = (b: any) => { 
  staffForm.businessId = b.idBusiness
  businessQuery.value = b.nom
  businessOptions.value = []
}

const addStaff = async () => {
  if (!staffForm.businessId) return
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/manga/${manga.value.idManga}/staff`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...authStore.getAuthHeaders() as any }, 
      body: staffForm
    })
    staffForm.businessId = undefined
    staffForm.role = ''
    businessQuery.value = ''
    await loadAdminExtras()
    success('Membre ajouté à l\'équipe')
  } catch (err) {
    showError('Erreur lors de l\'ajout du membre')
  }
}

const removeStaff = async (s: any) => {
  const id = s.id_business || s.idBusiness
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/manga/${manga.value.idManga}/staff/${id}`, {
      method: 'DELETE', 
      headers: authStore.getAuthHeaders() as any
    })
    await loadAdminExtras()
    success('Membre retiré de l\'équipe')
  } catch (err) {
    showError('Erreur lors de la suppression')
  }
}

// Tags
const debouncedSearchTags = useDebounceFn(async () => {
  if (!tagSearch.value) { 
    tagOptions.value = []
    return 
  }
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/admin/content/tags/search`, {
      params: { q: tagSearch.value, limit: 10 }, 
      headers: authStore.getAuthHeaders() as any
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
  if (!tagForm.tagId) return
  if (tags.value.some((t: any) => t.id === tagForm.tagId)) {
    showError('Ce tag est déjà associé')
    return
  }
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/manga/${manga.value.idManga}/tags`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...authStore.getAuthHeaders() as any }, 
      body: tagForm
    })
    tagForm.tagId = undefined
    tagSearch.value = ''
    tagOptions.value = []
    await loadAdminExtras()
    success('Tag ajouté')
  } catch (err) {
    showError('Erreur lors de l\'ajout du tag')
  }
}

const removeTag = async (t: any) => {
  try {
    await $fetch(`${config.public.apiBase}/api/admin/content/manga/${manga.value.idManga}/tags/${t.id}`, {
      method: 'DELETE', 
      headers: authStore.getAuthHeaders() as any
    })
    await loadAdminExtras()
    success('Tag retiré')
  } catch (err) {
    showError('Erreur lors de la suppression')
  }
}

// Load data on mount
onMounted(() => {
  load()
})

// Set page title
useHead({
  title: `Admin - Manga #${route.params.id}`
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f1f5f9;
}

.admin-sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #d1d5db;
  padding: 20px 0;
  flex-shrink: 0;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.sidebar-section {
  padding: 0 20px;
  margin-bottom: 30px;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #4b5563;
  margin-bottom: 12px;
  letter-spacing: 0.05em;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: #1f2937;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.sidebar-link:hover {
  background-color: #f8fafc;
  color: #111827;
}

.sidebar-link.active {
  background-color: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-link {
  font-size: 12px;
  color: #374151;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  font-weight: 500;
}

.quick-link:hover {
  color: #1d4ed8;
  background-color: #f1f5f9;
}

.admin-main {
  flex: 1;
  padding: 24px;
  overflow-x: auto;
  background-color: #ffffff;
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.form-input {
  border: 2px solid #d1d5db;
  border-radius: 8px;
  padding: 12px 14px;
  color: #111827;
  background-color: #ffffff;
  font-weight: 500;
  transition: border-color 0.2s;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

select.form-input {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: 40px;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #374151;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1f2937;
}

.btn-small {
  background: #e2e8f0;
  color: #374151;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-small:hover {
  background: #cbd5e1;
  color: #1f2937;
}

.btn-small.danger {
  background: #fecaca;
  color: #7f1d1d;
  border: 1px solid #fca5a5;
}

.btn-small.danger:hover {
  background: #fca5a5;
  color: #991b1b;
}

.card {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.text-gray-600 {
  color: #4b5563 !important;
}
</style>