<template>
  <div class="admin-container">
    <AdminLayout>
      <div class="page-header">
        <div class="header-content">
          <h1>Ajouter un nouveau manga</h1>
          <div class="header-actions">
            <NuxtLink to="/admin/mangas" class="btn btn-secondary">
              ← Retour à la liste
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="content-section">
        <form @submit.prevent="submitForm" class="manga-form" enctype="multipart/form-data">
            <!-- Titre le plus couramment utilisé -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Titre le plus couramment utilisé <span class="required">*</span>
                <a href="#" @click.prevent="togglePrecisions('titre')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.titre" class="precisions">
                - c'est le titre de la fiche - si licencié, mettre le titre fr en priorité<br>
                - si plusieurs titres importants, utiliser des parenthèses pour les titres alternatifs<br>
                - exemple: Larme Ultime (Saikano, Saichu Heiki Kanojo)
              </div>
              <input
                id="titre"
                v-model="form.titre"
                type="text"
                class="form-input required"
                required
                placeholder="Entrez le titre du manga"
              >
            </div>

            <!-- Code ISBN-13 -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Code ISBN-13 pour les artbooks et one-shots
                <a href="#" @click.prevent="togglePrecisions('isbn')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.isbn" class="precisions">
                - International Standard Book Number (<a href="http://fr.wikipedia.org/wiki/Num%C3%A9ro_international_normalis%C3%A9_du_livre" target="_blank">WIKIPEDIA</a>)<br>
                - Ce champ n'est pas obligatoire car il peut être difficile à trouver mais il est très utile pour les artbooks<br>
                - Vous trouverez cette info essentiellement sur les sites de vente en ligne (beNippon et Amazon l'utilisent)
              </div>
              <input
                id="isbn"
                v-model="form.isbn"
                type="text"
                class="form-input"
                placeholder="Code ISBN-13"
              >
            </div>

            <!-- Upload image -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Uploader l'image
                <a href="#" @click.prevent="togglePrecisions('image')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.image" class="precisions">
                - Dimensions idéales de l'image: largeur supérieure à 180px<br>
                - Poids max: 200ko. (+200% par rapport à la v6!)<br>
                - Formats acceptés: jpg, jpeg, gif
              </div>
              <input
                id="image"
                @change="handleImageUpload"
                type="file"
                class="form-input"
                accept=".jpg,.jpeg,.gif"
              >
            </div>

            <div class="form-grid">
              <!-- Origine -->
              <div class="form-group">
                <legend class="form-legend">
                  Origine <span class="required">*</span>
                  <a href="#" @click.prevent="togglePrecisions('origine')" class="toggle-link">(précisions)</a>
                </legend>
                <div v-show="showPrecisions.origine" class="precisions">
                  - Le pays en toutes lettres (Japon, Corée...)
                </div>
                <input
                  id="origine"
                  v-model="form.origine"
                  type="text"
                  class="form-input required"
                  required
                  placeholder="Japon"
                >
              </div>

              <!-- Année de parution -->
              <div class="form-group">
                <legend class="form-legend">
                  Année de 1ere parution (dans le pays d'origine) <span class="required">*</span>
                  <a href="#" @click.prevent="togglePrecisions('annee')" class="toggle-link">(précisions)</a>
                </legend>
                <div v-show="showPrecisions.annee" class="precisions">
                  - sur 4 chiffres, tout autre format sera refusé
                </div>
                <input
                  id="annee"
                  v-model="form.annee"
                  type="text"
                  class="form-input required"
                  required
                  placeholder="2024"
                  maxlength="4"
                >
              </div>
            </div>

            <!-- Titre original -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Titre original <span class="required">*</span>
                <a href="#" @click.prevent="togglePrecisions('titre_orig')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.titre_orig" class="precisions">
                - Le titre <strong>officiel</strong> dans le pays d'origine
              </div>
              <input
                id="titre_orig"
                v-model="form.titre_orig"
                type="text"
                class="form-input required"
                required
                placeholder="Titre original en japonais"
              >
            </div>

            <!-- Titres alternatifs -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Titres alternatifs
                <a href="#" @click.prevent="togglePrecisions('titres_alternatifs')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.titres_alternatifs" class="precisions">
                - Mettez ici tous les titres possibles du manga<br>
                - <strong>Un titre par ligne</strong><br>
                - <strong>Mettez le titre en kanji en premier</strong><br>
                - Les titres alternatifs incluent: le titre original en kanji, les titres en anglais et US, les abréviations françaises, anglaises et US<br>
                - Évitez les titres alternatifs en espagnol, arabe sauf s'ils sont très connus
              </div>
              <textarea
                id="titres_alternatifs"
                v-model="form.titres_alternatifs"
                class="form-textarea"
                rows="3"
                placeholder="Un titre par ligne"
              ></textarea>
            </div>

            <div class="form-grid">
              <!-- Manga licencié en France -->
              <div class="form-group">
                <legend class="form-legend">Manga licencié en France ? <span class="required">*</span></legend>
                <select id="licence" v-model="form.licence" class="form-select required" required @change="toggleLicenceInput">
                  <option value="">---</option>
                  <option value="0">Non</option>
                  <option value="1">Oui</option>
                </select>
              </div>

              <!-- Titre français (si licencié) -->
              <div v-show="form.licence === '1'" class="form-group">
                <legend class="form-legend">
                  Titre français <span class="required">*</span>
                  <a href="#" @click.prevent="togglePrecisions('titre_fr')" class="toggle-link">(précisions)</a>
                </legend>
                <div v-show="showPrecisions.titre_fr" class="precisions">
                  - ne rien mettre si le manga n'est pas licencié
                </div>
                <input
                  id="titre_fr"
                  v-model="form.titre_fr"
                  type="text"
                  class="form-input"
                  :class="{ required: form.licence === '1' }"
                  placeholder="Titre français officiel"
                >
              </div>
            </div>

            <!-- Nombre de volumes -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Nombre de volumes <span class="required">*</span>
                <a href="#" @click.prevent="togglePrecisions('nb_volumes')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.nb_volumes" class="precisions">
                - "nb+" (ex: 15+) si en cours ou "nc" si non dispo
              </div>
              <input
                id="nb_volumes"
                v-model="form.nb_volumes"
                type="text"
                class="form-input required"
                required
                placeholder="12 ou 15+ ou nc"
              >
            </div>

            <!-- Synopsis -->
            <div class="form-group full-width">
              <legend class="form-legend">Synopsis</legend>
              <textarea
                id="synopsis"
                v-model="form.synopsis"
                class="form-textarea bigtxt"
                rows="8"
                placeholder="Synopsis du manga..."
              ></textarea>
            </div>

            <div class="form-grid">
              <!-- Lien vers topic du forum -->
              <div class="form-group">
                <legend class="form-legend">
                  Lien vers un topic du forum
                  <a href="#" @click.prevent="togglePrecisions('topic')" class="toggle-link">(précisions)</a>
                </legend>
                <div v-show="showPrecisions.topic" class="precisions">
                  - Entrez l'ID du topic (inutile de mettre le ".0") du manga
                </div>
                <input
                  id="topic"
                  v-model="form.topic"
                  type="text"
                  class="form-input"
                  placeholder="0"
                >
              </div>
            </div>

            <!-- Commentaire sur la fiche -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Commentaire sur la fiche
                <a href="#" @click.prevent="togglePrecisions('commentaire')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.commentaire" class="precisions">
                - Vous pouvez indiquer ici des commentaires sur le fiche. <strong>Attention, c'est public.</strong><br>
                - Exemple: "la série originale compte 13 épisodes auxquels se sont ajoutés 3 épisodes sous la forme de bonus dans les DVD." (Baccano!)<br>
                - Vous pouvez aussi préciser qu'une fiche a un caractère provisoire<br>
                - bbcode utilisable (url, b, i) <strong>Attention à bien fermer les balises!! ([b]texte[/b])</strong><br>
                - Merci de faire des phrases aussi courtes que possible
              </div>
              <textarea
                id="commentaire"
                v-model="form.commentaire"
                class="form-textarea"
                rows="3"
                placeholder="Commentaires publics sur la fiche..."
              ></textarea>
            </div>

            <!-- Boutons d'action -->
            <div class="form-actions">
              <button type="button" @click="resetForm" class="btn btn-secondary">
                Réinitialiser
              </button>
              <button type="submit" :disabled="isLoading" class="btn btn-primary">
                <span v-if="isLoading" class="loading-spinner"></span>
                {{ isLoading ? 'Création...' : 'Créer le manga' }}
              </button>
            </div>
        </form>
      </div>
    </AdminLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
  middleware: 'admin'
})

// Form state
const form = ref({
  titre: '',
  isbn: '',
  image: null,
  origine: '',
  annee: '',
  titre_orig: '',
  titres_alternatifs: '',
  licence: '',
  titre_fr: '',
  nb_volumes: '',
  synopsis: '',
  topic: '',
  commentaire: ''
})

const isLoading = ref(false)

// Precisions toggles
const showPrecisions = ref({
  titre: false,
  isbn: false,
  image: false,
  origine: false,
  annee: false,
  titre_orig: false,
  titres_alternatifs: false,
  titre_fr: false,
  nb_volumes: false,
  topic: false,
  commentaire: false
})

// Toggle precisions
const togglePrecisions = (field) => {
  showPrecisions.value[field] = !showPrecisions.value[field]
}

// Toggle licence input
const toggleLicenceInput = () => {
  if (form.value.licence === '0') {
    form.value.titre_fr = ''
  }
}

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file size (200KB max)
    if (file.size > 200 * 1024) {
      ElMessage.error('L\'image doit faire moins de 200Ko')
      event.target.value = ''
      return
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      ElMessage.error('Format autorisé: JPG, JPEG, GIF uniquement')
      event.target.value = ''
      return
    }
    
    form.value.image = file
  }
}

// API configuration
const { $config } = useNuxtApp()
const apiBase = $config.public.apiBase

// Submit form
const submitForm = async () => {
  try {
    isLoading.value = true

    // Prepare form data for multipart upload
    const formData = new FormData()
    
    // Add all form fields
    Object.keys(form.value).forEach(key => {
      if (form.value[key] !== '' && form.value[key] !== null) {
        if (key === 'image' && form.value[key]) {
          formData.append('image', form.value[key])
        } else if (key !== 'image') {
          formData.append(key, form.value[key])
        }
      }
    })

    const response = await $fetch(`${apiBase}/api/admin/mangas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('auth-token').value}`
        // Don't set Content-Type for multipart/form-data, let browser set it
      },
      body: formData
    })

    if (response.success) {
      // Show success message
      ElMessage.success('Manga créé avec succès!')
      
      // Redirect to manga list
      await navigateTo('/admin/mangas')
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (error) {
    console.error('Error creating manga:', error)
    ElMessage.error(error.message || 'Erreur lors de la création du manga')
  } finally {
    isLoading.value = false
  }
}

// Reset form
const resetForm = () => {
  form.value = {
    titre: '',
    isbn: '',
    image: null,
    origine: '',
    annee: '',
    titre_orig: '',
    titres_alternatifs: '',
    licence: '',
    titre_fr: '',
    nb_volumes: '',
    synopsis: '',
    topic: '',
    commentaire: ''
  }
  
  // Reset all precisions
  Object.keys(showPrecisions.value).forEach(key => {
    showPrecisions.value[key] = false
  })
  
  // Reset file input
  const fileInput = document.getElementById('image')
  if (fileInput) {
    fileInput.value = ''
  }
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.page-header {
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.manga-form {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.form-legend {
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
  margin-bottom: 0.5rem;
  display: block;
}

.required {
  color: #dc2626;
}

.toggle-link {
  color: var(--accent-color);
  text-decoration: none;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.toggle-link:hover {
  text-decoration: underline;
}

.precisions {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.precisions strong {
  font-weight: 600;
}

.precisions a {
  color: var(--accent-color);
}

.bigtxt {
  min-height: 150px;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: var(--bg-primary);
  color: var(--text-color);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-color-dark);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .content-section {
    padding: 0 1rem;
  }

  .manga-form {
    padding: 1.5rem;
  }
}
</style>