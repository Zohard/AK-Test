<template>
  <div class="admin-business">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Gestion des Fiches Business</h1>
        <p class="page-subtitle">{{ totalBusiness }} fiche(s) business au total</p>
      </div>
      <div class="page-header-right">
        <button @click="addBusiness" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          Ajouter une fiche business
        </button>
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
            placeholder="Dénomination..."
            class="filter-input"
            @input="debouncedSearch"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Type</label>
          <select v-model="typeFilter" @change="onFilterChange" class="filter-select">
            <option value="">Tous les types</option>
            <option v-for="type in availableTypes" :key="type.name" :value="type.name">
              {{ type.name }} ({{ type.count }})
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Statut</label>
          <select v-model="statusFilter" @change="onFilterChange" class="filter-select">
            <option value="all">Tous</option>
            <option value="active">Actif ({{ statusCounts.active || 0 }})</option>
            <option value="inactive">Inactif ({{ statusCounts.inactive || 0 }})</option>
            <option value="pending">En attente ({{ statusCounts.pending || 0 }})</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Par page</label>
          <select v-model="itemsPerPage" @change="onFilterChange" class="filter-select">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <ClientOnly>
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Chargement des fiches business...</p>
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
            <th>Image</th>
            <th>Dénomination</th>
            <th>Type</th>
            <th>Origine</th>
            <th>Relations</th>
            <th>Statut</th>
            <th>Date d'ajout</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in business" :key="item.id_business" class="table-row">
            <td class="image-cell">
              <img
                :src="item.image ? getImageUrl(`business/${item.image}`) : '/placeholder-business.jpg'"
                :alt="item.denomination"
                class="business-thumbnail"
                @error="handleImageError"
              />
            </td>
            <td class="title-cell">
              <div class="title-main">{{ item.denomination }}</div>
              <div v-if="item.autres_denominations" class="title-alt">
                {{ item.autres_denominations }}
              </div>
            </td>
            <td>
              <span :class="['type-badge', `type-${item.type.toLowerCase().replace(/\s+/g, '-')}`]">
                {{ item.type }}
              </span>
            </td>
            <td>{{ item.origine || '—' }}</td>
            <td class="relations-cell">
              <div class="relations-count">
                <span class="relations-number">{{ item.nb_relations || 0 }}</span>
                <span class="relations-label">relation(s)</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(item.statut)]">
                {{ getStatusText(item.statut) }}
              </span>
            </td>
            <td class="date-cell">
              <div class="date-main">{{ formatDate(item.date_ajout) }}</div>
            </td>
            <td class="actions-cell">
              <button @click="viewBusiness(item)" class="action-btn view-btn" title="Voir détails">
                👁️
              </button>
              <button @click="editBusiness(item)" class="action-btn edit-btn" title="Modifier">
                ✏️
              </button>
              <button @click="confirmDelete(item)" class="action-btn delete-btn" title="Supprimer">
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
        <h3>Aucune fiche business trouvée</h3>
        <p>{{ searchQuery ? 'Aucun résultat pour votre recherche' : 'Commencez par ajouter votre première fiche business' }}</p>
        <button v-if="!searchQuery" @click="addBusiness" class="btn btn-primary">
          Ajouter une fiche business
        </button>
      </div>
    </ClientOnly>

    <!-- Pagination -->
    <ClientOnly>
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
    </ClientOnly>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Modifier la fiche business' : 'Ajouter une fiche business' }}</h2>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveBusiness" class="business-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Dénomination *</label>
                <input v-model="formData.denomination" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Type *</label>
                <select v-model="formData.type" class="form-input" required>
                  <option value="">Sélectionner un type</option>
                  <option value="Personnalité">Personnalité</option>
                  <option value="Studio">Studio</option>
                  <option value="Editeur">Editeur</option>
                  <option value="Divers">Divers</option>
                  <option value="Chaîne TV">Chaîne TV</option>
                  <option value="Magazine">Magazine</option>
                  <option value="Evénement">Evénement</option>
                  <option value="Association">Association</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Origine</label>
                <input v-model="formData.origine" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Site officiel</label>
                <input v-model="formData.site_officiel" type="url" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Image (filename only)</label>
                <input v-model="formData.image" type="text" class="form-input" placeholder="example.jpg" />
                <small class="form-help">Image sera stockée dans /images/business/</small>
              </div>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Autres dénominations</label>
              <textarea v-model="formData.autres_denominations" class="form-textarea" rows="2"></textarea>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Notes</label>
              <textarea v-model="formData.notes" class="form-textarea" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Statut</label>
              <select v-model="formData.statut" class="form-input">
                <option :value="1">Actif</option>
                <option :value="0">Inactif</option>
                <option :value="2">En attente</option>
              </select>
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

    <!-- View Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="showViewModal = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h2>{{ viewData.denomination }}</h2>
          <button @click="showViewModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="business-details">
            <div class="details-grid">
              <div class="detail-item">
                <strong>Type:</strong> {{ viewData.type }}
              </div>
              <div class="detail-item">
                <strong>Origine:</strong> {{ viewData.origine || 'Non spécifiée' }}
              </div>
              <div class="detail-item">
                <strong>Site officiel:</strong>
                <a v-if="viewData.site_officiel" :href="viewData.site_officiel" target="_blank">
                  {{ viewData.site_officiel }}
                </a>
                <span v-else>Non spécifié</span>
              </div>
              <div class="detail-item">
                <strong>Statut:</strong> {{ getStatusText(viewData.statut) }}
              </div>
            </div>
            <div v-if="viewData.autres_denominations" class="detail-section">
              <strong>Autres dénominations:</strong>
              <p>{{ viewData.autres_denominations }}</p>
            </div>
            <div v-if="viewData.notes" class="detail-section">
              <strong>Notes:</strong>
              <p>{{ viewData.notes }}</p>
            </div>
            <div v-if="viewData.relations" class="detail-section">
              <strong>Relations:</strong>
              <div class="relations-details">
                <div v-if="viewData.relations.animes?.length" class="relation-group">
                  <h4>Animes ({{ viewData.relations.animes.length }})</h4>
                  <ul>
                    <li v-for="anime in viewData.relations.animes" :key="anime.id_anime">
                      {{ anime.titre }} 
                      <span v-if="anime.precisions" class="relation-precision">({{ anime.precisions }})</span>
                    </li>
                  </ul>
                </div>
                <div v-if="viewData.relations.mangas?.length" class="relation-group">
                  <h4>Mangas ({{ viewData.relations.mangas.length }})</h4>
                  <ul>
                    <li v-for="manga in viewData.relations.mangas" :key="manga.id_manga">
                      {{ manga.titre }}
                      <span v-if="manga.precisions" class="relation-precision">({{ manga.precisions }})</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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
          <p>Êtes-vous sûr de vouloir supprimer la fiche business <strong>{{ businessToDelete?.denomination }}</strong> ?</p>
          <p class="warning-text">Cette action est irréversible et supprimera toutes les relations associées.</p>
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
// Imports
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useImageUrl } from '~/composables/useImageUrl'

// Layout
definePageMeta({
  layout: 'admin'
})

// Head
useHead({
  title: 'Gestion des Fiches Business - Administration'
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase
const { getImageUrl } = useImageUrl()

// Reactive data
const business = ref([])
const totalBusiness = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const itemsPerPage = ref(50)
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('all')
const loading = ref(false)
const error = ref('')

// Filter data
const availableTypes = ref([])
const statusCounts = ref({})

// Modal states
const showEditModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const businessToDelete = ref(null)
const viewData = ref({})

// Form data
const formData = ref({
  denomination: '',
  type: '',
  origine: '',
  site_officiel: '',
  image: '',
  autres_denominations: '',
  notes: '',
  statut: 1
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

// Filter change handler
const onFilterChange = () => {
  currentPage.value = 1 // Reset to first page when filters change
  loadBusiness()
}

// Load business data
const loadBusiness = async () => {
  loading.value = true
  error.value = ''
  
  console.log('🔧 Debug: Starting loadBusiness')
  console.log('🔧 Debug: authStore:', authStore)
  console.log('🔧 Debug: authStore.getAuthHeaders:', typeof authStore.getAuthHeaders)
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
      statut: statusFilter.value
    })
    
    if (searchQuery.value.trim()) {
      params.append('denomination', searchQuery.value.trim())
    }
    
    if (typeFilter.value) {
      params.append('type', typeFilter.value)
    }
    
    const url = `${API_BASE}/api/admin/business?${params}`
    const headers = authStore.getAuthHeaders()
    console.log('🔧 Debug: API call URL:', url)
    console.log('🔧 Debug: Headers:', headers)
    
    const response = await $fetch(url, { 
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
    
    business.value = response.data || []
    totalBusiness.value = response.pagination?.total || 0
    totalPages.value = response.pagination?.pages || 0
    currentPage.value = response.pagination?.page || 1
    
    // Update filter data
    if (response.filters) {
      availableTypes.value = response.filters.types || []
      statusCounts.value = response.filters.statuts || {}
    }
    
  } catch (err) {
    console.error('Load business error:', err)
    if (err.status === 401) {
      error.value = 'Authentification requise. Veuillez vous reconnecter.'
    } else if (err.status === 403) {
      error.value = 'Accès non autorisé. Droits administrateur requis.'
    } else {
      error.value = err.message || 'Erreur lors du chargement des fiches business'
    }
  } finally {
    loading.value = false
  }
}

// Pagination
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadBusiness()
  }
}

// Business actions
const addBusiness = () => {
  isEditing.value = false
  formData.value = {
    denomination: '',
    type: '',
    origine: '',
    site_officiel: '',
    image: '',
    autres_denominations: '',
    notes: '',
    statut: 1
  }
  showEditModal.value = true
}

const editBusiness = (item) => {
  isEditing.value = true
  formData.value = { ...item }
  showEditModal.value = true
}

const viewBusiness = async (item) => {
  try {
    const headers = authStore.getAuthHeaders()
    const response = await $fetch(`${API_BASE}/api/admin/business/${item.id_business}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
    viewData.value = response.data
    showViewModal.value = true
  } catch (err) {
    console.error('View business error:', err)
    error.value = 'Erreur lors du chargement des détails'
  }
}

const confirmDelete = (item) => {
  businessToDelete.value = item
  showDeleteModal.value = true
}

const saveBusiness = async () => {
  saving.value = true
  try {
    if (isEditing.value) {
      await $fetch(`${API_BASE}/api/admin/business/${formData.value.id_business}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders()
        },
        body: formData.value
      })
    } else {
      await $fetch(`${API_BASE}/api/admin/business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeaders()
        },
        body: formData.value
      })
    }
    
    closeModal()
    loadBusiness()
  } catch (err) {
    error.value = err.message || 'Erreur lors de l\'enregistrement'
  } finally {
    saving.value = false
  }
}

const deleteBusiness = async () => {
  deleting.value = true
  try {
    const headers = authStore.getAuthHeaders()
    await $fetch(`${API_BASE}/api/admin/business/${businessToDelete.value.id_business}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
    
    showDeleteModal.value = false
    loadBusiness()
  } catch (err) {
    console.error('Delete business error:', err)
    error.value = err.message || 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

const closeModal = () => {
  showEditModal.value = false
  showViewModal.value = false
  saving.value = false
}

// Utility functions
const getStatusClass = (statut) => {
  switch (parseInt(statut)) {
    case 1: return 'status-active'
    case 0: return 'status-inactive'
    case 2: return 'status-pending'
    default: return 'status-unknown'
  }
}

const getStatusText = (statut) => {
  switch (parseInt(statut)) {
    case 1: return 'Actif'
    case 0: return 'Inactif'
    case 2: return 'En attente'
    default: return 'Inconnu'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-business.jpg'
}

// Initialize
onMounted(() => {
  // Only load data on client side to avoid SSR hydration mismatches
  loadBusiness()
})
</script>

<style scoped src="~/assets/css/admin-business-index.css"></style>
