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
      <div class="section-header">
        <h1 class="section-title">Admin · Mangas</h1>
        <NuxtLink to="/admin/mangas/create" class="btn-primary">Créer un manga</NuxtLink>
      </div>

      <!-- Filters -->
      <div class="card p-4 mb-4 flex gap-3 items-end">
        <div>
          <label class="block text-sm mb-1">Recherche</label>
          <input v-model="filters.search" class="form-input" placeholder="Titre..." @keyup.enter="loadMangas" />
        </div>
        <div>
          <label class="block text-sm mb-1">Année</label>
          <input v-model="filters.annee" class="form-input w-32" placeholder="2024" />
        </div>
        <div>
          <label class="block text-sm mb-1">Éditeur</label>
          <input v-model="filters.editeur" class="form-input" placeholder="Éditeur..." />
        </div>
        <div>
          <label class="block text-sm mb-1">Statut</label>
          <select v-model.number="filters.statut" class="form-input w-40">
            <option :value="undefined">Tous</option>
            <option :value="1">Affichée</option>
            <option :value="2">En attente</option>
            <option :value="0">Bloquée</option>
          </select>
        </div>
        <button class="btn-secondary" @click="loadMangas">Appliquer</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="card p-4 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Chargement...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card p-4 text-center text-red-600">
        <p>{{ error }}</p>
        <button class="btn-secondary mt-2" @click="loadMangas">Réessayer</button>
      </div>

      <!-- Mangas Table -->
      <div v-else class="card overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Auteur</th>
              <th>Année</th>
              <th>Volumes</th>
              <th>Éditeur</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="manga in mangas" :key="manga.idManga">
              <td>{{ manga.idManga }}</td>
              <td>
                <NuxtLink :to="`/admin/mangas/${manga.idManga}`" class="link">
                  {{ manga.titre }}
                </NuxtLink>
              </td>
              <td>{{ manga.auteur || '—' }}</td>
              <td>{{ manga.annee || '—' }}</td>
              <td>{{ manga.nbVolumes || '—' }}</td>
              <td>{{ manga.editeur || '—' }}</td>
              <td>
                <span :class="getStatusClass(manga.statut)">
                  {{ getStatusText(manga.statut) }}
                </span>
              </td>
              <td class="flex gap-2">
                <button class="btn-small" @click="toggleStatus(manga)">
                  {{ manga.statut === 1 ? 'Dépublier' : 'Publier' }}
                </button>
                <button class="btn-small danger" @click="deleteManga(manga)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button 
            class="btn-secondary" 
            :disabled="currentPage <= 1" 
            @click="goToPage(currentPage - 1)"
          >
            Précédent
          </button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button 
            class="btn-secondary" 
            :disabled="currentPage >= totalPages" 
            @click="goToPage(currentPage + 1)"
          >
            Suivant
          </button>
        </div>
        <div class="text-sm text-gray-600">
          {{ totalItems }} mangas au total
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
interface Manga {
  idManga: number
  titre: string
  auteur?: string
  annee?: string
  nbVolumes?: string
  editeur?: string
  statut: number
}

const config = useRuntimeConfig()
const authStore = useAuthStore()
const { success, error: showError } = useNotification()

// State
const mangas = ref<Manga[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

const filters = reactive({
  search: '',
  annee: '',
  editeur: '',
  statut: undefined as number | undefined
})

// Methods
const loadMangas = async () => {
  try {
    loading.value = true
    error.value = null
    
    const params: any = {
      page: currentPage.value,
      limit: 20
    }
    
    if (filters.search?.trim()) params.search = filters.search.trim()
    if (filters.annee?.trim()) params.annee = filters.annee.trim()
    if (filters.editeur?.trim()) params.editeur = filters.editeur.trim()
    if (typeof filters.statut === 'number') params.statut = filters.statut
    
    const response = await $fetch<{items: Manga[], pagination: any}>(`${config.public.apiBase}/api/admin/mangas`, {
      params,
      headers: authStore.getAuthHeaders() as Record<string, string>
    })
    
    mangas.value = response.items || []
    const pagination = response.pagination || {}
    currentPage.value = pagination.page || 1
    totalPages.value = pagination.totalPages || 1
    totalItems.value = pagination.total || 0
    
    // Show success notification on first load
    if (currentPage.value === 1 && !filters.search && !filters.annee && !filters.editeur && typeof filters.statut !== 'number') {
      success(`${totalItems.value} mangas chargés avec succès`, { duration: 3000 })
    }
    
  } catch (err: any) {
    error.value = err?.data?.message || 'Erreur lors du chargement des mangas'
    console.error('Error loading mangas:', err)
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadMangas()
  }
}

const toggleStatus = async (manga: Manga) => {
  try {
    const newStatus = manga.statut === 1 ? 0 : 1
    await $fetch(`${config.public.apiBase}/api/admin/mangas/${manga.idManga}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authStore.getAuthHeaders() as any },
      body: { statut: newStatus }
    })
    success(`${manga.titre} a été ${newStatus === 1 ? 'publié' : 'dépublié'}`)
    loadMangas()
  } catch (err) {
    console.error('Error updating status:', err)
    showError('Erreur lors de la mise à jour du statut')
  }
}

const deleteManga = async (manga: Manga) => {
  if (!confirm(`Supprimer "${manga.titre}" ?`)) return
  
  try {
    await $fetch(`${config.public.apiBase}/api/admin/mangas/${manga.idManga}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders() as any
    })
    success(`"${manga.titre}" a été supprimé`)
    loadMangas()
  } catch (err) {
    console.error('Error deleting manga:', err)
    showError('Erreur lors de la suppression')
  }
}

const getStatusClass = (statut: number) => {
  const baseClass = 'chip'
  if (statut === 1) return `${baseClass} chip-green`
  if (statut === 2) return `${baseClass} chip-red`
  return `${baseClass} chip-gray`
}

const getStatusText = (statut: number) => {
  if (statut === 1) return 'Publié'
  if (statut === 2) return 'Refusé'
  return 'Brouillon'
}

// Load mangas on mount
onMounted(() => {
  loadMangas()
})

// Set page title
useHead({
  title: 'Admin - Mangas'
})
</script>

<style scoped>
.table { 
  width: 100%; 
  border-collapse: collapse; 
  background: #ffffff;
}

.table th {
  padding: 16px 12px; 
  border-bottom: 2px solid #e5e7eb; 
  text-align: left;
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.table td { 
  padding: 14px 12px; 
  border-bottom: 1px solid #f1f5f9; 
  text-align: left;
  color: #111827;
  font-weight: 500;
}

.table tr:hover {
  background-color: #f8fafc;
}

.chip { 
  padding: 4px 12px; 
  border-radius: 9999px; 
  font-size: 12px; 
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.chip-green { 
  background: #d1fae5; 
  color: #065f46; 
  border: 1px solid #a7f3d0;
}

.chip-red { 
  background: #fecaca; 
  color: #7f1d1d; 
  border: 1px solid #fca5a5;
}

.chip-gray { 
  background: #e5e7eb; 
  color: #1f2937; 
  border: 1px solid #d1d5db;
}

.btn-primary { 
  background: #2563eb; 
  color: white; 
  padding: 10px 16px; 
  border-radius: 8px; 
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-secondary { 
  background: #f1f5f9; 
  color: #374151; 
  padding: 8px 14px; 
  border-radius: 6px; 
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1f2937;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.form-input { 
  border: 2px solid #d1d5db; 
  border-radius: 8px; 
  padding: 10px 12px; 
  color: #111827;
  background-color: #ffffff;
  font-weight: 500;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

select.form-input {
  background-color: #ffffff;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: 32px;
}

.link { 
  color: #1d4ed8; 
  text-decoration: none;
  font-weight: 600;
}

.text-gray-600 {
  color: #4b5563 !important;
}

label {
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.text-sm {
  font-size: 14px;
}

.link:hover {
  text-decoration: underline;
}

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
  align-items: center;
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
</style>