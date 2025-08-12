<template>
  <div class="admin-business">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Gestion des Fiches Business</h1>
        <p class="page-subtitle">{{ totalBusiness }} fiche(s) business au total</p>
      </div>
      <div class="page-header-right">
        <NuxtLink to="/admin/business/new" class="btn btn-primary">
          <span class="btn-icon">➕</span>
          Ajouter une fiche business
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
              <div class="actions-wrapper">
                <NuxtLink :to="`/admin/business/${item.id_business}/edit`" class="action-btn edit-btn" title="Modifier">
                  ✏️
                </NuxtLink>
                <button @click="confirmDelete(item)" class="action-btn delete-btn" title="Supprimer">
                  🗑️
                </button>
              </div>
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
        <NuxtLink v-if="!searchQuery" to="/admin/business/new" class="btn btn-primary">
          Ajouter une fiche business
        </NuxtLink>
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
const showDeleteModal = ref(false)
const deleting = ref(false)
const businessToDelete = ref(null)

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

const confirmDelete = (item) => {
  businessToDelete.value = item
  showDeleteModal.value = true
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
