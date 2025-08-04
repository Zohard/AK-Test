<template>
  <div class="admin-business">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Gestion des Entreprises</h1>
        <p class="page-subtitle">{{ totalBusiness }} entreprise(s) au total</p>
      </div>
      <div class="page-header-right">
        <NuxtLink to="/admin/business/new" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          Ajouter une entreprise
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
            placeholder="Nom, autres noms..."
            class="filter-input"
            @input="debouncedSearch"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Type</label>
          <select v-model="typeFilter" @change="loadBusiness" class="filter-select">
            <option value="all">Tous</option>
            <option value="Personnalité">Personnalité</option>
            <option value="Editeur">Editeur</option>
            <option value="Studio">Studio</option>
            <option value="Chaîne TV">Chaîne TV</option>
            <option value="Association">Association</option>
            <option value="Magazine">Magazine</option>
            <option value="Evénement">Evénement</option>
            <option value="Divers">Divers</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Origine</label>
          <select v-model="origineFilter" @change="loadBusiness" class="filter-select">
            <option value="all">Toutes</option>
            <option value="Japon">Japon</option>
            <option value="Belgique">Belgique</option>
            <option value="Chine">Chine</option>
            <option value="Corée">Corée</option>
            <option value="Etats-Unis">Etats-Unis</option>
            <option value="France">France</option>
            <option value="Grande Bretagne">Grande Bretagne</option>
            <option value="Italie">Italie</option>
            <option value="Espagne">Espagne</option>
            <option value="Allemagne">Allemagne</option>
            <option value="Hong Kong">Hong Kong</option>
            <option value="Suisse">Suisse</option>
            <option value="Benelux">Benelux</option>
            <option value="Taiwan">Taiwan</option>
            <option value="Asie">Asie</option>
            <option value="Europe">Europe</option>
            <option value="Amérique du Nord">Amérique du Nord</option>
            <option value="Amérique du Sud">Amérique du Sud</option>
            <option value="Afrique">Afrique</option>
            <option value="Océanie">Océanie</option>
            <option value="Russie">Russie</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Par page</label>
          <select v-model="itemsPerPage" @change="loadBusiness" class="filter-select">
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
      <p>Chargement des entreprises...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadBusiness" class="retry-btn">Réessayer</button>
    </div>

    <!-- Business Table -->
    <div v-else-if="business.length > 0" class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Origine</th>
            <th>Année</th>
            <th>Site officiel</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="company in business" :key="company.id_business" class="table-row">
            <td class="name-cell">
              <div class="company-info">
                <div class="company-name">{{ company.denomination }}</div>
                <div v-if="company.autres_denominations" class="company-alt">
                  {{ company.autres_denominations }}
                </div>
              </div>
            </td>
            <td>
              <span class="type-badge" :class="`type-${company.type?.toLowerCase()}`">
                {{ company.type || '—' }}
              </span>
            </td>
            <td>{{ company.origine || '—' }}</td>
            <td>{{ company.date || '—' }}</td>
            <td>
              <a v-if="company.site_officiel" :href="company.site_officiel" target="_blank" class="site-link">
                {{ company.site_officiel }}
              </a>
              <span v-else>—</span>
            </td>
            <td class="actions-cell">
              <NuxtLink :to="`/admin/business/${company.id_business}/edit`" class="action-btn edit-btn">
                ✏️
              </NuxtLink>
              <button @click="editBusiness(company)" class="action-btn quick-edit-btn" title="Modification rapide">
                ⚡
              </button>
              <button @click="confirmDelete(company)" class="action-btn delete-btn">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">🏢</div>
      <h3>Aucune entreprise trouvée</h3>
      <p>{{ searchQuery ? 'Aucun résultat pour votre recherche' : 'Commencez par ajouter votre première entreprise' }}</p>
      <NuxtLink v-if="!searchQuery" to="/admin/business/new" class="btn btn-primary">
        Ajouter une entreprise
      </NuxtLink>
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

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Modifier' : 'Ajouter' }} l'entreprise</h2>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveBusiness" class="business-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Nom *</label>
                <input v-model="formData.denomination" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Type *</label>
                <select v-model="formData.type" class="form-select" required>
                  <option value="">Sélectionner un type</option>
                  <option value="Personnalité">Personnalité</option>
                  <option value="Editeur">Editeur</option>
                  <option value="Studio">Studio</option>
                  <option value="Chaîne TV">Chaîne TV</option>
                  <option value="Association">Association</option>
                  <option value="Magazine">Magazine</option>
                  <option value="Evénement">Evénement</option>
                  <option value="Divers">Divers</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Origine</label>
                <select v-model="formData.origine" class="form-select">
                  <option value="">Sélectionner une origine</option>
                  <option value="Japon">Japon</option>
                  <option value="Belgique">Belgique</option>
                  <option value="Chine">Chine</option>
                  <option value="Corée">Corée</option>
                  <option value="Etats-Unis">Etats-Unis</option>
                  <option value="France">France</option>
                  <option value="Grande Bretagne">Grande Bretagne</option>
                  <option value="Italie">Italie</option>
                  <option value="Espagne">Espagne</option>
                  <option value="Allemagne">Allemagne</option>
                  <option value="Hong Kong">Hong Kong</option>
                  <option value="Suisse">Suisse</option>
                  <option value="Benelux">Benelux</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="Asie">Asie</option>
                  <option value="Europe">Europe</option>
                  <option value="Amérique du Nord">Amérique du Nord</option>
                  <option value="Amérique du Sud">Amérique du Sud</option>
                  <option value="Afrique">Afrique</option>
                  <option value="Océanie">Océanie</option>
                  <option value="Russie">Russie</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Année</label>
                <input v-model="formData.date" type="text" class="form-input" placeholder="ex: 1985" />
              </div>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Autres noms</label>
              <textarea v-model="formData.autres_denominations" class="form-textarea" rows="2" placeholder="Autres dénominations connues..."></textarea>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Site officiel</label>
              <input v-model="formData.site_officiel" type="url" class="form-input" placeholder="https://..." />
            </div>
            <div class="form-group full-width">
              <label class="form-label">Image</label>
              
              <!-- Current image preview -->
              <div v-if="formData.image || imagePreview" class="current-image">
                <div class="image-preview">
                  <img 
                    :src="imagePreview || `/images/business/${formData.image}`" 
                    :alt="formData.denomination"
                    class="preview-img"
                    @error="onImageError"
                  />
                  <button 
                    type="button" 
                    @click="removeImage" 
                    class="remove-image-btn"
                    title="Supprimer l'image"
                  >
                    ×
                  </button>
                </div>
                <p class="image-filename">{{ formData.image }}</p>
              </div>

              <!-- Upload new image -->
              <div class="image-upload-section">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  @change="onFileSelect"
                  class="file-input"
                  style="display: none"
                />
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  class="upload-btn"
                  :disabled="uploading"
                >
                  <span v-if="uploading">Téléchargement...</span>
                  <span v-else>{{ formData.image ? 'Changer l\'image' : 'Choisir une image' }}</span>
                </button>
              </div>

              <!-- Upload progress -->
              <div v-if="uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Upload en cours...</span>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" type="button" class="btn btn-secondary">
            Annuler
          </button>
          <button @click="saveBusiness" type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer') }}
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
          <p>Êtes-vous sûr de vouloir supprimer l'entreprise <strong>{{ businessToDelete?.denomination }}</strong> ?</p>
          <p class="warning-text">Cette action est irréversible et supprimera tous les liens associés.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            Annuler
          </button>
          <button @click="deleteBusiness" class="btn btn-danger" :disabled="deleting">
            {{ deleting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Layout
definePageMeta({
  layout: 'admin'
})

// Head
useHead({
  title: 'Gestion des Entreprises - Administration'
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'http://localhost:3001'

// Reactive data
const business = ref([])
const totalBusiness = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(50)
const searchQuery = ref('')
const typeFilter = ref('all')
const origineFilter = ref('all')
const loading = ref(false)
const error = ref('')

// Modal states
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const businessToDelete = ref(null)

// Image upload states
const uploading = ref(false)
const imagePreview = ref('')

// Form data
const formData = ref({
  denomination: '',
  autres_denominations: '',
  type: '',
  origine: '',
  date: '',
  site_officiel: '',
  image: ''
})

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadBusiness()
  }, 300)
}

// Load business
const loadBusiness = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value
    })
    
    if (typeFilter.value !== 'all') {
      params.append('type', typeFilter.value)
    }
    
    if (origineFilter.value !== 'all') {
      params.append('origine', origineFilter.value)
    }
    
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }
    
    const response = await $fetch(`${API_BASE}/api/admin/business?${params}`, {
      headers: authStore.getAuthHeaders()
    })
    
    business.value = response.data || []
    totalBusiness.value = response.pagination?.total || 0
    totalPages.value = response.pagination?.totalPages || Math.ceil(response.pagination?.total / itemsPerPage.value) || 0
  } catch (err) {
    console.error('Load business error:', err)
    if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else {
      error.value = 'Erreur lors du chargement des entreprises'
    }
  } finally {
    loading.value = false
  }
}

// Change page
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadBusiness()
  }
}

// Reset form
const resetForm = () => {
  formData.value = {
    denomination: '',
    autres_denominations: '',
    type: '',
    origine: '',
    date: '',
    site_officiel: '',
    image: ''
  }
}

// Edit business
const editBusiness = (company) => {
  isEditing.value = true
  formData.value = {
    id: company.id_business,
    denomination: company.denomination || '',
    autres_denominations: company.autres_denominations || '',
    type: company.type || '',
    origine: company.origine || '',
    date: company.date || '',
    site_officiel: company.site_officiel || '',
    image: company.image || ''
  }
  showEditModal.value = true
}

// Save business
const saveBusiness = async () => {
  saving.value = true
  
  try {
    const payload = {
      denomination: formData.value.denomination,
      autres_denominations: formData.value.autres_denominations,
      type: formData.value.type,
      origine: formData.value.origine,
      date: formData.value.date,
      site_officiel: formData.value.site_officiel,
      image: formData.value.image
    }
    
    if (isEditing.value) {
      await $fetch(`${API_BASE}/api/admin/business/${formData.value.id}`, {
        method: 'PUT',
        headers: authStore.getAuthHeaders(),
        body: payload
      })
    } else {
      await $fetch(`${API_BASE}/api/admin/business`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: payload
      })
    }
    
    closeModal()
    await loadBusiness()
  } catch (err) {
    console.error('Save business error:', err)
    error.value = 'Erreur lors de l\'enregistrement'
  } finally {
    saving.value = false
  }
}

// Confirm delete
const confirmDelete = (company) => {
  businessToDelete.value = company
  showDeleteModal.value = true
}

// Delete business
const deleteBusiness = async () => {
  if (!businessToDelete.value) return
  
  deleting.value = true
  
  try {
    await $fetch(`${API_BASE}/api/admin/business/${businessToDelete.value.id_business}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders()
    })
    
    showDeleteModal.value = false
    businessToDelete.value = null
    await loadBusiness()
  } catch (err) {
    console.error('Delete business error:', err)
    error.value = 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

// Close modal
const closeModal = () => {
  showEditModal.value = false
  isEditing.value = false
  imagePreview.value = ''
  resetForm()
}

// Image upload methods
const onFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Le fichier est trop volumineux (max 5MB)'
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Seuls les fichiers image sont acceptés'
    return
  }

  try {
    uploading.value = true
    error.value = ''

    // Create form data for upload
    const uploadFormData = new FormData()
    uploadFormData.append('image', file)

    // Upload to API
    const response = await $fetch(`${API_BASE}/api/admin/business/upload-image`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: uploadFormData
    })

    if (response.success) {
      // Update form data with new filename
      formData.value.image = response.filename
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = 'Erreur lors du téléchargement de l\'image'
  } finally {
    uploading.value = false
    // Reset file input
    event.target.value = ''
  }
}

const removeImage = () => {
  formData.value.image = ''
  imagePreview.value = ''
}

const onImageError = () => {
  // Handle image load errors (e.g., file not found)
  console.warn('Image not found:', formData.value.image)
}

// Load data on mount
onMounted(() => {
  if (isAdmin.value) {
    loadBusiness()
  }
})

// Watch for admin status changes
watch(isAdmin, (newValue) => {
  if (newValue) {
    loadBusiness()
  } else {
    navigateTo('/login')
  }
})
</script>

<style scoped>
.admin-business {
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
  grid-template-columns: 2fr 1fr 1fr 1fr;
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

.name-cell {
  min-width: 200px;
}

.company-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.company-name {
  font-weight: 600;
  color: var(--text-color);
}

.company-alt {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
}

.type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-studio {
  background: var(--info-light);
  color: var(--info-color);
}

.type-éditeur {
  background: var(--success-light);
  color: var(--success-color);
}

.type-distributeur {
  background: var(--warning-light);
  color: var(--warning-color);
}

.type-producteur {
  background: var(--accent-light);
  color: var(--accent-color);
}

.site-link {
  color: var(--accent-color);
  text-decoration: none;
  font-size: 0.875rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.site-link:hover {
  text-decoration: underline;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-ok {
  background: var(--success-light);
  color: var(--success-color);
}

.actions-cell {
  width: 120px;
}

.action-btn {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-right: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.edit-btn:hover {
  background: var(--accent-light);
  border-color: var(--accent-color);
}

.quick-edit-btn:hover {
  background: var(--info-light);
  border-color: var(--info-color);
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
.business-form {
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
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.warning-text {
  color: var(--warning-color);
  font-weight: 500;
  margin-top: 0.5rem;
}

/* Image Upload Styles */
.current-image {
  margin-bottom: 1rem;
}

.image-preview {
  position: relative;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.preview-img {
  max-width: 150px;
  max-height: 150px;
  width: auto;
  height: auto;
  border-radius: 0.5rem;
  border: 2px solid var(--border-color);
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--error-color);
  color: white;
  border: none;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.2s ease;
}

.remove-image-btn:hover {
  background: var(--error-hover);
}

.image-filename {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

.image-upload-section {
  margin-top: 0.5rem;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.upload-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-progress {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: var(--border-color);
  border-radius: 1.5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  width: 100%;
  animation: progress-fill 2s ease-in-out infinite;
}

@keyframes progress-fill {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
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
}
</style>