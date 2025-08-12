<template>
  <div class="admin-business-edit">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <NuxtLink to="/admin/business" class="back-btn">
          <span class="back-icon">←</span>
          Retour à la liste
        </NuxtLink>
        <h1 class="page-title">Ajouter une fiche business</h1>
        <p class="page-subtitle">Créer une nouvelle fiche business dans la base de données</p>
      </div>
      <div class="page-header-right">
        <button @click="saveBusiness" :disabled="saving" class="btn btn-primary">
          <span class="btn-icon">💾</span>
          {{ saving ? 'Enregistrement...' : 'Créer la fiche' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <ClientOnly>
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Chargement...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="error = ''" class="retry-btn">Continuer</button>
      </div>

      <!-- Edit Container -->
      <div v-else class="edit-container">
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
                <input 
                  v-model="formData.image" 
                  type="text" 
                  class="form-input" 
                  placeholder="nom-fichier.jpg"
                />
                <small class="form-help">Nom du fichier image (sera stocké dans /images/business/)</small>
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
          </form>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup>
// Imports
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

// Layout
definePageMeta({
  layout: 'admin'
})

// Head
useHead({
  title: 'Ajouter une fiche business - Administration'
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase

// Reactive data
const loading = ref(false)
const saving = ref(false)
const error = ref('')

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
    await $fetch(`${API_BASE}/api/admin/business`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: formData.value
    })

    // Redirect to business list on success
    await navigateTo('/admin/business')
  } catch (err) {
    console.error('Save business error:', err)
    error.value = err.data?.error || err.message || 'Erreur lors de la création de la fiche business'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped src="~/assets/css/admin-business-edit.css"></style>