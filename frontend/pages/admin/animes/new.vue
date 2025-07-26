<template>
  <div class="admin-container">
    <div class="page-header">
      <div class="header-content">
        <h1>Ajouter un nouvel anime</h1>
        <div class="header-actions">
          <NuxtLink to="/admin/animes" class="btn btn-secondary">
            ← Retour à la liste
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="content-section">
        <form @submit.prevent="submitForm" class="anime-form" enctype="multipart/form-data">
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
                placeholder="Entrez le titre de l'anime"
              >
            </div>

            <div class="form-grid">
              <!-- Format -->
              <div class="form-group">
                <legend class="form-legend">Format <span class="required">*</span></legend>
                <select id="format" v-model="form.format" class="form-select required" required>
                  <option value="">---</option>
                  <option value="Série TV">Série TV</option>
                  <option value="OAV">OAV</option>
                  <option value="Film">Film</option>
                  <option value="ONA">ONA</option>
                  <option value="Clip">Clip</option>
                  <option value="Spécial">Spécial</option>
                </select>
              </div>

              <!-- Année de 1ere diffusion -->
              <div class="form-group">
                <legend class="form-legend">
                  Année de 1ere diffusion <span class="required">*</span>
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
                - Mettez ici tous les titres possibles de l'anime<br>
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
              <!-- Anime licencié en France -->
              <div class="form-group">
                <legend class="form-legend">Anime licencié en France ?</legend>
                <select id="licence" v-model="form.licence" class="form-select" @change="toggleLicenceInput">
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
                  - ne rien mettre si l'anime n'est pas licencié
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

            <div class="form-grid">
              <!-- Nombre d'épisodes -->
              <div class="form-group">
                <legend class="form-legend">
                  Nombre d'épisodes
                  <a href="#" @click.prevent="togglePrecisions('nb_episodes')" class="toggle-link">(précisions)</a>
                </legend>
                <div v-show="showPrecisions.nb_episodes" class="precisions">
                  - "nb+" (ex: 153+) si en cours ou "nc" si non dispo
                </div>
                <input
                  id="nb_episodes"
                  v-model="form.nb_epduree"
                  type="text"
                  class="form-input required"
                  required
                  placeholder="12 ou 12+ ou nc"
                >
              </div>

              <!-- Site officiel -->
              <div class="form-group">
                <legend class="form-legend">
                  Site officiel
                  <a href="#" @click.prevent="togglePrecisions('site_officiel')" class="toggle-link">(précisions)</a>
                </legend>
                <div v-show="showPrecisions.site_officiel" class="precisions">
                  - une url classique du type http://...
                </div>
                <input
                  id="site_officiel"
                  v-model="form.official_site"
                  type="url"
                  class="form-input"
                  placeholder="http://example.com"
                >
              </div>
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

            <!-- Lien ADN -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Lien ADN
                <a href="#" @click.prevent="togglePrecisions('lien_adn')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.lien_adn" class="precisions">
                - Se rendre sur la page de l'anime sur le site d'ADN et cliquer sur "Intégrer" puis <strong>ne prendre que l'url de la vidéo</strong><br>
                - Merci de penser à vérifier que ça fonctionne correctement après la mise en ligne de la fiche!
              </div>
              <input
                id="lien_adn"
                v-model="form.lien_adn"
                type="url"
                class="form-input"
                placeholder="ex : http://animedigitalnetwork.fr/embedded/assassination-classroom/5885"
              >
            </div>

            <!-- Doubleurs -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Doubleurs
                <a href="#" @click.prevent="togglePrecisions('doubleurs')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.doubleurs" class="precisions">
                - NomDoubleur (NomPerso)<br>
                - séparés par une virgule si multiples
              </div>
              <textarea
                id="doubleurs"
                v-model="form.doublage"
                class="form-textarea"
                rows="3"
                placeholder="Nom Doubleur (Nom Personnage), Autre Doubleur (Autre Personnage)"
              ></textarea>
            </div>

            <!-- Synopsis -->
            <div class="form-group full-width">
              <legend class="form-legend">
                Synopsis
                <a href="#" @click.prevent="togglePrecisions('synopsis')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.synopsis" class="precisions">
                Attention à ce champ. <span class="required">Merci de vérifier ce que donnent les retours à la ligne après validation du formulaire.</span>
              </div>
              <textarea
                id="synopsis"
                v-model="form.synopsis"
                class="form-textarea bigtxt"
                rows="8"
                placeholder="Synopsis de l'anime..."
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
                  - Entrez l'ID du topic (inutile de mettre le ".0") de l'anime
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
                {{ isLoading ? 'Création...' : 'Créer l\'anime' }}
              </button>
            </div>
        </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Form state
const form = ref({
  titre: '',
  format: '',
  annee: '',
  titre_orig: '',
  titres_alternatifs: '',
  licence: '0',
  titre_fr: '',
  nb_epduree: '',
  official_site: '',
  image: null,
  lien_adn: '',
  doublage: '',
  synopsis: '',
  topic: '0',
  commentaire: ''
})

const isLoading = ref(false)

// Precisions toggles
const showPrecisions = ref({
  titre: false,
  annee: false,
  titre_orig: false,
  titres_alternatifs: false,
  titre_fr: false,
  nb_episodes: false,
  site_officiel: false,
  image: false,
  lien_adn: false,
  doubleurs: false,
  synopsis: false,
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

    const response = await $fetch(`${apiBase}/api/admin/animes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('auth-token').value}`
        // Don't set Content-Type for multipart/form-data, let browser set it
      },
      body: formData
    })

    if (response.success) {
      // Show success message
      ElMessage.success('Anime créé avec succès!')
      
      // Redirect to anime list
      await navigateTo('/admin/animes')
    } else {
      throw new Error(response.message || 'Erreur lors de la création')
    }
  } catch (error) {
    console.error('Error creating anime:', error)
    ElMessage.error(error.message || 'Erreur lors de la création de l\'anime')
  } finally {
    isLoading.value = false
  }
}

// Reset form
const resetForm = () => {
  form.value = {
    titre: '',
    format: '',
    annee: '',
    titre_orig: '',
    titres_alternatifs: '',
    licence: '0',
    titre_fr: '',
    nb_epduree: '',
    official_site: '',
    image: null,
    lien_adn: '',
    doublage: '',
    synopsis: '',
    topic: '0',
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


.anime-form {
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

  .anime-form {
    padding: 1.5rem;
  }
}
</style>