<template>
  <div class="admin-mangas">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Gestion des Mangas</h1>
        <p class="page-subtitle">{{ totalMangas }} manga(s) au total</p>
      </div>
      <div class="page-header-right">
        <NuxtLink to="/admin/mangas/new" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          Ajouter un manga
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="filter-label">Recherche</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Titre, auteur..."
            class="filter-input"
            @input="debouncedSearch"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Statut</label>
          <select v-model="statusFilter" @change="loadMangas" class="filter-select">
            <option value="all">Tous</option>
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Par page</label>
          <select v-model="itemsPerPage" @change="loadMangas" class="filter-select">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement des mangas...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadMangas" class="retry-btn">Réessayer</button>
    </div>

    <!-- Mangas Table -->
    <div v-else-if="mangas.length > 0" class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Année</th>
            <th>Volumes</th>
            <th>Note</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="manga in mangas" :key="manga.id_manga" class="table-row">
            <td class="image-cell">
              <div class="thumbnail-container">
                <img
                  v-if="manga.image"
                  :src="getImageUrl(`images/manga/${manga.image}`)"
                  :alt="manga.titre"
                  class="manga-thumbnail"
                  @error="handleImageError"
                />
                <div v-else class="thumbnail-placeholder">
                  <span class="placeholder-icon">📚</span>
                </div>
              </div>
            </td>
            <td class="title-cell">
              <div class="title-main">{{ manga.titre }}</div>
            </td>
            <td>{{ manga.auteur || '—' }}</td>
            <td>{{ manga.annee || '—' }}</td>
            <td>{{ manga.nb_volumes || '—' }}</td>
            <td class="rating-cell">
              <div v-if="manga.moyenne_notes" class="rating">
                <span class="rating-value">{{ manga.moyenne_notes.toFixed(1) }}</span>
                <span class="rating-count">({{ manga.nb_reviews }})</span>
              </div>
              <span v-else class="no-rating">Pas de note</span>
            </td>
            <td>
              <span :class="['status-badge', manga.statut ? 'status-active' : 'status-inactive']">
                {{ manga.statut ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="actions-cell">
              <NuxtLink :to="`/admin/mangas/${manga.id_manga}/edit`" class="action-btn edit-btn">
                ✏️
              </NuxtLink>
              <button @click="confirmDelete(manga)" class="action-btn delete-btn">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>Aucun manga trouvé</h3>
      <p>{{ searchQuery ? 'Aucun résultat pour votre recherche' : 'Commencez par ajouter votre premier manga' }}</p>
      <button v-if="!searchQuery" @click="showCreateModal = true" class="btn btn-primary">
        Ajouter un manga
      </button>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        ‹ Précédent
      </button>
      <span class="pagination-info">
        Page {{ currentPage }} sur {{ totalPages }}
      </span>
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Suivant ›
      </button>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Ajouter un manga</h2>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveManga" class="manga-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Titre *</label>
                <input v-model="formData.titre" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Auteur *</label>
                <input v-model="formData.auteur" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Année</label>
                <input v-model="formData.annee" type="number" min="1900" max="2030" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Nombre de volumes</label>
                <input v-model="formData.nb_volumes" type="number" min="1" class="form-input" />
              </div>
              <div class="form-group full-width">
                <label class="form-label">Image URL</label>
                <input v-model="formData.image" type="url" class="form-input" />
              </div>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Synopsis</label>
              <textarea v-model="formData.synopsis" class="form-textarea" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label class="form-checkbox">
                <input v-model="formData.statut" type="checkbox" />
                <span class="checkbox-label">Manga actif</span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary">
            Annuler
          </button>
          <button @click="saveManga" type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal modal-danger" @click.stop>
        <div class="modal-header">
          <h2>Confirmer la suppression</h2>
          <button @click="showDeleteModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer le manga <strong>{{ mangaToDelete?.titre }}</strong> ?</p>
          <p class="warning-text">Cette action est irréversible et supprimera toutes les critiques associées.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            Annuler
          </button>
          <button @click="deleteManga" class="btn btn-danger" :disabled="deleting">
            {{ deleting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useImageUrl } from '~/composables/useImageUrl'

// Layout
definePageMeta({
  layout: 'admin'
})

// Head
useHead({
  title: 'Gestion des Mangas - Administration'
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)
const { getImageUrl } = useImageUrl()

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase

// Reactive data
const mangas = ref([])
const totalMangas = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(50)
const searchQuery = ref('')
const statusFilter = ref('all')
const loading = ref(false)
const error = ref('')

// Modal states
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)
const mangaToDelete = ref(null)

// Form data
const formData = ref({
  titre: '',
  auteur: '',
  annee: new Date().getFullYear(),
  nb_volumes: null,
  synopsis: '',
  image: '',
  statut: true
})

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadMangas()
  }, 300)
}

// Load mangas
const loadMangas = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
      status: statusFilter.value
    })
    
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }
    
    const response = await $fetch(`${API_BASE}/api/admin/mangas?${params}`, {
      headers: authStore.getAuthHeaders()
    })
    
    mangas.value = response.data || []
    totalMangas.value = response.pagination?.total || 0
    totalPages.value = response.pagination?.totalPages || Math.ceil(response.pagination?.total / itemsPerPage.value) || 0
  } catch (err) {
    console.error('Load mangas error:', err)
    if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else {
      error.value = 'Erreur lors du chargement des mangas'
    }
  } finally {
    loading.value = false
  }
}

// Change page
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadMangas()
  }
}

// Reset form
const resetForm = () => {
  formData.value = {
    titre: '',
    auteur: '',
    annee: new Date().getFullYear(),
    nb_volumes: null,
    synopsis: '',
    image: '',
    statut: true
  }
}


// Save manga
const saveManga = async () => {
  saving.value = true
  
  try {
    const payload = {
      titre: formData.value.titre,
      auteur: formData.value.auteur,
      annee: formData.value.annee ? parseInt(formData.value.annee) : null,
      nb_volumes: formData.value.nb_volumes ? parseInt(formData.value.nb_volumes) : null,
      synopsis: formData.value.synopsis,
      image: formData.value.image,
      statut: formData.value.statut ? 1 : 0
    }
    
    await $fetch(`${API_BASE}/api/admin/mangas`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: payload
    })
    
    closeModal()
    await loadMangas()
  } catch (err) {
    console.error('Save manga error:', err)
    error.value = 'Erreur lors de l\'enregistrement'
  } finally {
    saving.value = false
  }
}

// Confirm delete
const confirmDelete = (manga) => {
  mangaToDelete.value = manga
  showDeleteModal.value = true
}

// Delete manga
const deleteManga = async () => {
  if (!mangaToDelete.value) return
  
  deleting.value = true
  
  try {
    await $fetch(`${API_BASE}/api/admin/mangas/${mangaToDelete.value.id_manga}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders()
    })
    
    showDeleteModal.value = false
    mangaToDelete.value = null
    await loadMangas()
  } catch (err) {
    console.error('Delete manga error:', err)
    error.value = 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

// Close modal
const closeModal = () => {
  showCreateModal.value = false
  resetForm()
}

// Handle image error
const handleImageError = (event) => {
  // Prevent infinite loops by checking if we're already showing a fallback
  if (event.target.dataset.fallback) return
  
  // Mark as fallback and use a different approach
  event.target.dataset.fallback = 'true'
  
  // Try to use the placeholder image from public folder
  const { getImageUrl } = useImageUrl()
  const placeholderPath = getImageUrl('manga/placeholder-manga.jpg')
  
  // Create a temporary image to test if placeholder exists
  const testImg = new Image()
  testImg.onload = () => {
    event.target.src = placeholderPath
  }
  testImg.onerror = () => {
    // If placeholder doesn't exist, use a CSS-based fallback
    event.target.style.display = 'none'
    event.target.parentElement.style.background = 'var(--bg-secondary)'
    event.target.parentElement.style.display = 'flex'
    event.target.parentElement.style.alignItems = 'center'
    event.target.parentElement.style.justifyContent = 'center'
    event.target.parentElement.innerHTML = '<span style="font-size: 1.5rem; color: var(--text-muted);">📚</span>'
  }
  testImg.src = placeholderPath
}

// Load data on mount
onMounted(() => {
  if (isAdmin.value) {
    loadMangas()
  }
})

// Watch for admin status changes
watch(isAdmin, (newValue) => {
  if (newValue) {
    loadMangas()
  } else {
    navigateTo('/login')
  }
})
</script>

<style scoped>
.admin-mangas {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Filters */
.filters-section {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--surface-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--surface-hover);
}

.btn-danger {
  background: var(--error-color);
  color: white;
}

.btn-danger:hover {
  background: var(--error-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table */
.table-container {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 2rem;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  background: var(--bg-secondary);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
}

.admin-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.table-row:hover {
  background: var(--surface-hover);
}

.image-cell {
  width: 80px;
}

.thumbnail-container {
  width: 60px;
  height: 80px;
  border-radius: 0.5rem;
  overflow: hidden;
}

.manga-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.placeholder-icon {
  font-size: 1.5rem;
  color: var(--text-muted);
  opacity: 0.6;
}

.title-cell {
  min-width: 200px;
}

.title-main {
  font-weight: 600;
  color: var(--text-color);
}

.rating-cell {
  text-align: center;
}

.rating-value {
  font-weight: 600;
  color: var(--accent-color);
}

.rating-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.no-rating {
  color: var(--text-secondary);
  font-style: italic;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background: var(--success-light);
  color: var(--success-color);
}

.status-inactive {
  background: var(--warning-light);
  color: var(--warning-color);
}

.actions-cell {
  width: 100px;
}

.action-btn {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-right: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: var(--accent-light);
  border-color: var(--accent-color);
}

.delete-btn:hover {
  background: var(--error-light);
  border-color: var(--error-color);
}

/* States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--surface-hover);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--surface-color);
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-large);
}

.modal-danger {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-color);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* Form */
.manga-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label {
  font-weight: 500;
  color: var(--text-color);
}

.warning-text {
  color: var(--warning-color);
  font-weight: 500;
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .admin-table {
    font-size: 0.875rem;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .manga-thumbnail {
    width: 50px;
    height: 65px;
  }
}
</style>