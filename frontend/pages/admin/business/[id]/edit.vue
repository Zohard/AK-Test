<template>
  <div class="admin-business-edit">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <NuxtLink to="/admin/business" class="back-btn">
          <span class="back-icon">←</span>
          Retour à la liste
        </NuxtLink>
        <h1 class="page-title">
          {{ businessData?.denomination || 'Modifier la fiche business' }}
        </h1>
        <p class="page-subtitle">
          ID: {{ $route.params.id }} • 
          {{ businessData ? getStatusText(businessData.statut) : '' }}
        </p>
      </div>
      <div class="page-header-right">
        <button @click="saveBusiness" :disabled="saving" class="btn btn-primary">
          <span class="btn-icon">💾</span>
          {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
        </button>
        <button @click="confirmDelete" class="btn btn-danger">
          <span class="btn-icon">🗑️</span>
          Supprimer
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <ClientOnly>
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Chargement de la fiche business...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="loadBusiness" class="retry-btn">Réessayer</button>
      </div>

      <!-- Edit Container -->
      <div v-else-if="businessData" class="edit-container">
        <div class="form-container">
          <form @submit.prevent="saveBusiness" class="business-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Dénomination <span class="required">*</span></label>
                <input 
                  v-model="formData.denomination" 
                  type="text" 
                  class="form-input" 
                  required 
                  placeholder="Nom de la fiche business"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Type <span class="required">*</span></label>
                <select v-model="formData.type" class="form-select" required>
                  <option value="">Sélectionner un type</option>
                  <option value="Personnalité">Personnalité</option>
                  <option value="Studio">Studio</option>
                  <option value="Editeur">Editeur</option>
                  <option value="Distributeur">Distributeur</option>
                  <option value="Chaîne TV">Chaîne TV</option>
                  <option value="Magazine">Magazine</option>
                  <option value="Evénement">Evénement</option>
                  <option value="Association">Association</option>
                  <option value="Divers">Divers</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Origine</label>
                <input 
                  v-model="formData.origine" 
                  type="text" 
                  class="form-input" 
                  placeholder="Pays d'origine"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Site officiel</label>
                <input 
                  v-model="formData.site_officiel" 
                  type="url" 
                  class="form-input" 
                  placeholder="https://exemple.com"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Image</label>
                
                <!-- Hidden file input -->
                <input 
                  ref="fileInput"
                  type="file" 
                  accept="image/*"
                  @change="handleFileUpload"
                  style="display: none"
                />
                
                <!-- Current image filename -->
                <input 
                  v-model="formData.image" 
                  type="text" 
                  class="form-input" 
                  placeholder="nom-fichier.jpg"
                  readonly
                />
                
                <!-- Upload controls -->
                <div class="upload-controls">
                  <button 
                    type="button"
                    @click="$refs.fileInput.click()" 
                    class="btn btn-secondary"
                  >
                    📁 Choisir un fichier
                  </button>
                  <button 
                    v-if="imagePreview"
                    type="button"
                    @click="uploadImage"
                    :disabled="uploadingImage"
                    class="btn btn-primary"
                  >
                    📤 {{ uploadingImage ? 'Upload...' : 'Télécharger' }}
                  </button>
                </div>
                
                <!-- Preview -->
                <div v-if="imagePreview" class="image-preview">
                  <img 
                    :src="imagePreview" 
                    alt="Aperçu de l'image"
                    class="preview-image"
                  />
                </div>
                
                <small class="form-help">Formats acceptés: JPG, PNG, GIF (max 2MB)</small>
              </div>

              <div class="form-group">
                <label class="form-label">Statut</label>
                <select v-model="formData.statut" class="form-select">
                  <option :value="1">Actif</option>
                  <option :value="0">Inactif</option>
                  <option :value="2">En attente</option>
                </select>
              </div>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Autres dénominations</label>
              <textarea 
                v-model="formData.autres_denominations" 
                class="form-textarea" 
                rows="2"
                placeholder="Noms alternatifs, séparés par des virgules"
              ></textarea>
              <small class="form-help">Noms alternatifs ou traductions du nom principal</small>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Notes</label>
              <textarea 
                v-model="formData.notes" 
                class="form-textarea" 
                rows="4"
                placeholder="Informations complémentaires..."
              ></textarea>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Informations système</label>
              <div class="system-info">
                <div class="info-item">
                  <strong>Date de création :</strong> {{ businessData.date_ajout ? formatDate(businessData.date_ajout) : 'Non disponible' }}
                </div>
                <div class="info-item">
                  <strong>Dernière modification :</strong> {{ businessData.date_modification ? formatDate(businessData.date_modification) : 'Jamais modifiée' }}
                </div>
              </div>
            </div>
          </form>
        </div>
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
          <p>Êtes-vous sûr de vouloir supprimer la fiche business <strong>{{ businessData?.denomination }}</strong> ?</p>
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

// Layout
definePageMeta({
  layout: 'admin'
})

// Head
useHead({
  title: 'Modifier la fiche business - Administration'
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase
const route = useRoute()

// Reactive data
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const uploadingImage = ref(false)
const error = ref('')
const businessData = ref(null)
const showDeleteModal = ref(false)
const imagePreview = ref('')
const uploadedFile = ref(null)

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

// Load business data
const loadBusiness = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const headers = authStore.getAuthHeaders()
    const response = await $fetch(`${API_BASE}/api/admin/business/${route.params.id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
    
    businessData.value = response
    
    // Populate form data
    formData.value = {
      denomination: response.denomination || '',
      type: response.type || '',
      origine: response.origine || '',
      site_officiel: response.site_officiel || '',
      image: response.image || '',
      autres_denominations: response.autres_denominations || '',
      notes: response.notes || '',
      statut: response.statut ?? 1
    }
    
  } catch (err) {
    console.error('Load business error:', err)
    if (err.status === 404) {
      error.value = 'Fiche business introuvable'
    } else if (err.status === 401) {
      error.value = 'Authentification requise'
    } else if (err.status === 403) {
      error.value = 'Accès non autorisé'
    } else {
      error.value = err.data?.error || err.message || 'Erreur lors du chargement de la fiche business'
    }
  } finally {
    loading.value = false
  }
}

// Save business
const saveBusiness = async () => {
  if (!formData.value.denomination.trim() || !formData.value.type) {
    error.value = 'La dénomination et le type sont obligatoires'
    return
  }

  saving.value = true
  error.value = ''

  try {
    const headers = authStore.getAuthHeaders()
    await $fetch(`${API_BASE}/api/admin/business/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: formData.value
    })

    // Reload business data to show updated info
    await loadBusiness()
  } catch (err) {
    console.error('Save business error:', err)
    error.value = err.data?.error || err.message || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}

// Delete business
const confirmDelete = () => {
  showDeleteModal.value = true
}

const deleteBusiness = async () => {
  deleting.value = true
  
  try {
    const headers = authStore.getAuthHeaders()
    await $fetch(`${API_BASE}/api/admin/business/${route.params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
    
    // Redirect to business list on success
    await navigateTo('/admin/business')
  } catch (err) {
    console.error('Delete business error:', err)
    error.value = err.data?.error || err.message || 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

// Utility functions
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
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Veuillez sélectionner un fichier image valide'
    return
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    error.value = 'Le fichier image ne doit pas dépasser 2MB'
    return
  }
  
  // Store the file for upload and show preview
  uploadedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
  error.value = ''
}

// Upload image
const uploadImage = async () => {
  if (!uploadedFile.value || uploadingImage.value) return
  
  try {
    uploadingImage.value = true
    
    const formData = new FormData()
    formData.append('business_id', route.params.id)
    formData.append('image', uploadedFile.value)
    
    const headers = authStore.getAuthHeaders()
    const response = await $fetch(`${API_BASE}/api/admin/business/${route.params.id}/upload-image`, {
      method: 'POST',
      headers,
      body: formData
    })
    
    // Update the form data with the new filename
    if (response && response.filename) {
      formData.value.image = response.filename
    }
    
    // Reset upload state
    imagePreview.value = ''
    uploadedFile.value = null
    if ($refs.fileInput) {
      $refs.fileInput.value = ''
    }
    
    // Reload business data to reflect changes
    await loadBusiness()
    
  } catch (err) {
    console.error('Upload image error:', err)
    error.value = err.data?.error || err.message || 'Erreur lors du téléchargement de l\'image'
  } finally {
    uploadingImage.value = false
  }
}

// Initialize
onMounted(() => {
  loadBusiness()
})
</script>

<style scoped src="~/assets/css/admin-business-edit.css"></style>