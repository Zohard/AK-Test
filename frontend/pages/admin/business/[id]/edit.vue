<template>
  <div class="admin-business-edit">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>Chargement des informations de l'entreprise...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2>Erreur</h2>
      <p>{{ error }}</p>
      <NuxtLink to="/admin/business" class="back-link">← Retour aux entreprises</NuxtLink>
    </div>

    <!-- Edit Form -->
    <div v-else class="edit-content">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">
            {{ isNew ? 'Ajouter une entreprise' : `Modifier : ${business?.denomination || 'Entreprise'}` }}
          </h1>
          <div class="breadcrumb">
            <NuxtLink to="/admin/business" class="breadcrumb-link">Entreprises</NuxtLink>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">{{ isNew ? 'Nouveau' : 'Modification' }}</span>
          </div>
        </div>
        <div class="page-header-right">
          <NuxtLink to="/admin/business" class="btn btn-secondary">
            <span>← Retour</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Main Form -->
      <div class="form-container">
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">Informations principales</h3>
          </div>

          <form @submit.prevent="saveBusiness" class="business-form" novalidate>
            <!-- Type de fiche business -->
            <div class="form-group">
              <label class="form-label required">Type de fiche business :</label>
              <select v-model="formData.type" class="form-select" required>
                <option value="">---</option>
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

            <!-- Dénomination principale -->
            <div class="form-group">
              <label class="form-label required">
                Dénomination la plus couramment utilisée 
                <button type="button" @click="togglePrecisions('denomination')" class="toggle-btn">(précisions)</button>
              </label>
              <div v-if="showPrecisions.denomination" class="precisions">
                - c'est le titre de la fiche
              </div>
              <input 
                v-model="formData.denomination" 
                type="text" 
                class="form-input" 
                required 
                placeholder="Nom principal de l'entreprise"
              />
            </div>

            <!-- Autres dénominations -->
            <div class="form-group">
              <label class="form-label">
                Autres dénominations 
                <button type="button" @click="togglePrecisions('autres')" class="toggle-btn">(précisions)</button>
              </label>
              <div v-if="showPrecisions.autres" class="precisions">
                - Autres noms connus, séparés par des retours à la ligne
              </div>
              <textarea 
                v-model="formData.autres_denominations" 
                class="form-textarea" 
                rows="3"
                placeholder="Autres noms connus..."
              ></textarea>
            </div>

            <!-- Date de création -->
            <div class="form-group">
              <label class="form-label">Date de naissance/création :</label>
              <input 
                v-model="formData.date" 
                type="text" 
                class="form-input"
                placeholder="ex: 1985"
              />
            </div>

            <!-- Origine/Pays -->
            <div class="form-group">
              <label class="form-label">Origine :</label>
              <select v-model="formData.origine" class="form-select">
                <option value="">---</option>
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

            <!-- Site officiel -->
            <div class="form-group">
              <label class="form-label">
                Site officiel 
                <button type="button" @click="togglePrecisions('site')" class="toggle-btn">(précisions)</button>
              </label>
              <div v-if="showPrecisions.site" class="precisions">
                - N'oubliez pas le http:// ou https://
              </div>
              <input 
                v-model="formData.site_officiel" 
                type="url" 
                class="form-input" 
                placeholder="https://www.exemple.com"
              />
            </div>

            <!-- Image -->
            <div class="form-group">
              <label class="form-label">
                Image 
                <button type="button" @click="togglePrecisions('image')" class="toggle-btn">(précisions)</button>
              </label>
              <div v-if="showPrecisions.image" class="precisions">
                - Formats acceptés: JPG, PNG, GIF, WebP (max 5MB)
              </div>
              
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


            <!-- Form Actions -->
            <div class="form-actions">
              <button type="button" @click="$router.push('/admin/business')" class="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Enregistrement...' : (isNew ? 'Créer' : 'Modifier') }}
              </button>
            </div>
          </form>

          <!-- Success/Error Messages -->
          <div v-if="message" class="message" :class="messageType">
            {{ message }}
          </div>
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

// Get route parameter
const route = useRoute()
const businessId = route.params.id
const isNew = businessId === 'new'

// Page metadata
useHead({
  title: `${isNew ? 'Ajouter' : 'Modifier'} une entreprise - Administration`
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// API configuration
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'http://localhost:3001'

// Reactive data
const business = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const message = ref('')
const messageType = ref('')

// Image upload states
const uploading = ref(false)
const imagePreview = ref('')

// Form data
const formData = ref({
  type: '',
  denomination: '',
  autres_denominations: '',
  date: '',
  origine: '',
  site_officiel: '',
  image: ''
})

// Precisions toggles
const showPrecisions = ref({
  denomination: false,
  autres: false,
  site: false,
  image: false
})

// Methods
const togglePrecisions = (field) => {
  showPrecisions.value[field] = !showPrecisions.value[field]
}

const fetchBusinessDetails = async () => {
  if (isNew) {
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const response = await $fetch(`${API_BASE}/api/admin/business/${businessId}`, {
      headers: authStore.getAuthHeaders()
    })
    business.value = response
    
    // Populate form data
    formData.value = {
      type: response.data.type || '',
      denomination: response.data.denomination || '',
      autres_denominations: response.data.autres_denominations || '',
      date: response.data.date || '',
      origine: response.data.origine || '',
      site_officiel: response.data.site_officiel || '',
      image: response.data.image || ''
    }
    
  } catch (err) {
    console.error('Error fetching business details:', err)
    if (err.response?.status === 404) {
      error.value = 'Entreprise introuvable'
    } else if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else {
      error.value = 'Erreur lors du chargement'
    }
  } finally {
    loading.value = false
  }
}

const saveBusiness = async () => {
  saving.value = true
  message.value = ''
  
  try {
    // Prepare payload
    const payload = {
      type: formData.value.type,
      denomination: formData.value.denomination,
      autres_denominations: formData.value.autres_denominations,
      date: formData.value.date,
      origine: formData.value.origine,
      site_officiel: formData.value.site_officiel,
      image: formData.value.image
    }
    
    let response
    if (isNew) {
      response = await $fetch(`${API_BASE}/api/admin/business`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: payload
      })
      message.value = 'Entreprise créée avec succès'
      messageType.value = 'success'
      
      // Redirect to edit page with new ID after a short delay
      setTimeout(() => {
        navigateTo(`/admin/business/${response.data.id_business}/edit`)
      }, 1500)
    } else {
      await $fetch(`${API_BASE}/api/admin/business/${businessId}`, {
        method: 'PUT',
        headers: authStore.getAuthHeaders(),
        body: payload
      })
      message.value = 'Entreprise modifiée avec succès'
      messageType.value = 'success'
      
      // Refresh business data
      await fetchBusinessDetails()
    }
    
  } catch (err) {
    console.error('Save business error:', err)
    if (err.response?.status === 400) {
      message.value = 'Données invalides. Vérifiez les champs requis.'
    } else if (err.response?.status === 403) {
      message.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 401) {
      message.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else {
      message.value = 'Erreur lors de l\'enregistrement'
    }
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// Image upload methods
const onFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    message.value = 'Le fichier est trop volumineux (max 5MB)'
    messageType.value = 'error'
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    message.value = 'Seuls les fichiers image sont acceptés'
    messageType.value = 'error'
    return
  }

  try {
    uploading.value = true
    message.value = ''

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

      message.value = 'Image téléchargée avec succès'
      messageType.value = 'success'
    }
  } catch (err) {
    console.error('Upload error:', err)
    message.value = 'Erreur lors du téléchargement de l\'image'
    messageType.value = 'error'
  } finally {
    uploading.value = false
    // Reset file input
    event.target.value = ''
  }
}

const removeImage = () => {
  formData.value.image = ''
  imagePreview.value = ''
  message.value = 'Image supprimée'
  messageType.value = 'success'
}

const onImageError = () => {
  // Handle image load errors (e.g., file not found)
  console.warn('Image not found:', formData.value.image)
}

// Initialize data on mount
onMounted(() => {
  if (isAdmin.value) {
    fetchBusinessDetails()
  }
})

// Watch for admin status changes
watch(isAdmin, (newValue) => {
  if (newValue) {
    fetchBusinessDetails()
  } else {
    navigateTo('/login')
  }
})
</script>

<style scoped>
.admin-business-edit {
  max-width: 1000px;
  margin: 0 auto;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container h2 {
  color: var(--text-color);
  margin: 0 0 1rem 0;
}

.error-container p {
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent-color-hover);
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
  line-height: 1.2;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breadcrumb-link {
  color: var(--accent-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: var(--accent-color-hover);
}

.breadcrumb-separator {
  color: var(--text-muted);
}

.breadcrumb-current {
  font-weight: 500;
}

/* Form Container */
.form-container {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  overflow: hidden;
}

.form-section {
  padding: 2rem;
}

.section-header {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
}

/* Form Styles */
.business-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-label.required::after {
  content: '*';
  color: var(--error-color);
  font-weight: 700;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: color 0.2s ease;
}

.toggle-btn:hover {
  color: var(--accent-color-hover);
}

.precisions {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
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
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.5;
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
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

/* Messages */
.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 500;
}

.message.success {
  background: var(--success-light);
  color: var(--success-color);
  border: 1px solid var(--success-color);
}

.message.error {
  background: var(--error-light);
  color: var(--error-color);
  border: 1px solid var(--error-color);
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
  max-width: 200px;
  max-height: 200px;
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--error-color);
  color: white;
  border: none;
  font-size: 16px;
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
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

.image-upload-section {
  margin-top: 1rem;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.upload-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-progress {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
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
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-business-edit {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .form-section {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>