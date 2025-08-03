<template>
  <div class="admin-manga-edit">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <NuxtLink to="/admin/mangas" class="back-btn">
          <span class="back-icon">←</span>
          Retour à la liste
        </NuxtLink>
        <h1 class="page-title">Modifier le manga</h1>
        <p v-if="manga" class="page-subtitle">{{ manga.titre }}</p>
      </div>
      <div class="page-header-right">
        <button 
          @click="saveManga" 
          type="submit" 
          class="btn btn-primary" 
          :disabled="saving || !formData.titre"
        >
          <span class="btn-icon">💾</span>
          {{ saving ? 'Enregistrement...' : 'Sauvegarder' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement du manga...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadManga" class="retry-btn">Réessayer</button>
    </div>

    <!-- Edit Form -->
    <div v-else class="edit-container">
      <!-- Tab Navigation -->
      <div class="tab-navigation desktop-tabs">
        <button 
          type="button"
          @click="activeTab = 'basic'"
          :class="['tab-btn', { 'active': activeTab === 'basic' }]"
        >
          <span class="tab-icon">📝</span>
          Informations de base
        </button>
        <button 
          type="button"
          @click="switchTab('staff')"
          :disabled="isCreating"
          :class="['tab-btn', { 'active': activeTab === 'staff', 'disabled': isCreating }]"
          :title="isCreating ? 'Sauvegardez d\'abord les informations de base' : ''"
        >
          <span class="tab-icon">👥</span>
          Gestion du staff
        </button>
        <button 
          type="button"
          @click="switchTab('relations')"
          :disabled="isCreating"
          :class="['tab-btn', { 'active': activeTab === 'relations', 'disabled': isCreating }]"
          :title="isCreating ? 'Sauvegardez d\'abord les informations de base' : ''"
        >
          <span class="tab-icon">🔗</span>
          Relations
        </button>
        <button 
          type="button"
          @click="switchTab('covers')"
          :disabled="isCreating"
          :class="['tab-btn', { 'active': activeTab === 'covers', 'disabled': isCreating }]"
          :title="isCreating ? 'Sauvegardez d\'abord les informations de base' : ''"
        >
          <span class="tab-icon">🖼️</span>
          Couvertures
        </button>
        <button 
          type="button"
          @click="switchTab('tags')"
          :disabled="isCreating"
          :class="['tab-btn', { 'active': activeTab === 'tags', 'disabled': isCreating }]"
          :title="isCreating ? 'Sauvegardez d\'abord les informations de base' : ''"
        >
          <span class="tab-icon">🏷️</span>
          Tags
        </button>
      </div>

      <!-- Basic Information Tab -->
      <div v-show="activeTab === 'basic'" class="tab-content">
        <div class="form-container">
          <form @submit.prevent="saveManga" class="manga-form">
          
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
            <input v-model="formData.titre" type="text" class="form-input required" required />
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
            <input v-model="formData.isbn" type="text" class="form-input" />
          </div>

          <!-- Origine -->
          <div class="form-group full-width">
            <legend class="form-legend">
              Origine <span class="required">*</span>
              <a href="#" @click.prevent="togglePrecisions('origine')" class="toggle-link">(précisions)</a>
            </legend>
            <div v-show="showPrecisions.origine" class="precisions">
              - Le pays en toutes lettres (Japon, Corée...)
            </div>
            <input v-model="formData.origine" type="text" class="form-input required" required />
          </div>

          <!-- Année et Titre original -->
          <div class="form-grid">
            <div class="form-group">
              <legend class="form-legend">
                Année de 1ere parution (dans le pays d'origine) <span class="required">*</span>
                <a href="#" @click.prevent="togglePrecisions('annee')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.annee" class="precisions">
                - sur 4 chiffres, tout autre format sera refusé
              </div>
              <input v-model="formData.annee" type="number" min="1900" max="2030" class="form-input required" required />
            </div>
            
            <div class="form-group">
              <legend class="form-legend">
                Titre original <span class="required">*</span>
                <a href="#" @click.prevent="togglePrecisions('titre_orig')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.titre_orig" class="precisions">
                - Le titre <strong>officiel</strong> dans le pays d'origine
              </div>
              <input v-model="formData.titre_orig" type="text" class="form-input required" required />
            </div>
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
              - Les titres alternatifs incluent: le titre original en kanji, les titres en anglais et US<br>
              - Evitez les titres alternatifs en espagnol, arabe ou autres langues peu communes
            </div>
            <textarea 
              v-model="formData.titres_alternatifs" 
              class="form-textarea auto-resize" 
              rows="3"
              @input="autoResizeTextarea"
            ></textarea>
          </div>

          <!-- Licence et Titre français -->
          <div class="form-grid">
            <div class="form-group">
              <legend class="form-legend">Manga licencié en France ?</legend>
              <select v-model="formData.licence" class="form-select" @change="toggleLicenceFields">
                <option value="0">Non</option>
                <option value="1">Oui</option>
              </select>
            </div>
            
            <div class="form-group" v-show="formData.licence == '1'">
              <legend class="form-legend">
                Titre français <span class="required">*</span>
                <a href="#" @click.prevent="togglePrecisions('titre_fr')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.titre_fr" class="precisions">
                - ne rien mettre si le manga n'est pas licencié
              </div>
              <input v-model="formData.titre_fr" type="text" class="form-input" :required="formData.licence == '1'" />
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
            <input v-model="formData.nb_volumes" type="text" class="form-input required" required />
          </div>

          <!-- Synopsis -->
          <div class="form-group full-width">
            <legend class="form-legend">
              Synopsis
              <a href="#" @click.prevent="togglePrecisions('synopsis')" class="toggle-link">(précisions)</a>
            </legend>
            <div v-show="showPrecisions.synopsis" class="precisions">
              Attention à ce champ. Merci de vérifier ce que donnent les retours à la ligne après validation du formulaire.
            </div>
            <textarea 
              ref="synopsisTextarea"
              v-model="formData.synopsis" 
              class="form-textarea bigtxt auto-resize" 
              rows="6"
              @input="autoResizeTextarea"
            ></textarea>
          </div>

          <!-- Topic et Commentaire -->
          <div class="form-grid">
            <div class="form-group">
              <legend class="form-legend">
                Lien vers un topic du forum
                <a href="#" @click.prevent="togglePrecisions('topic')" class="toggle-link">(précisions)</a>
              </legend>
              <div v-show="showPrecisions.topic" class="precisions">
                - Entrez l'ID du topic (inutile de mettre le ".0") du manga
              </div>
              <input v-model="formData.topic" type="number" class="form-input" />
            </div>
            
            <!-- Image Upload Section -->
            <div class="form-group full-width">
              <label class="form-label">Image de couverture</label>
              <div class="image-upload">
                <div class="image-preview">
                  <img 
                    v-if="(formData.image && formData.image.trim()) || imagePreview" 
                    :src="getImageSrc()" 
                    :alt="formData.titre"
                    class="preview-image"
                    @error="handleImageError"
                  />
                  <div v-else class="no-image-placeholder">
                    <span class="placeholder-icon">🖼️</span>
                    <span class="placeholder-text">Aucune image</span>
                  </div>
                </div>
                <div class="image-controls">
                  <input 
                    v-model="formData.image" 
                    type="url" 
                    class="form-input"
                    placeholder="URL de l'image de couverture"
                    @input="updateImagePreview"
                  />
                  <input 
                    ref="fileInput"
                    type="file" 
                    accept="image/*" 
                    class="file-input"
                    @change="handleFileUpload"
                  />
                  <button 
                    type="button" 
                    @click="$refs.fileInput.click()" 
                    class="btn btn-secondary"
                  >
                    📁 Choisir un fichier
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Commentaire -->
          <div class="form-group full-width">
            <legend class="form-legend">
              Commentaire sur la fiche
              <a href="#" @click.prevent="togglePrecisions('commentaire')" class="toggle-link">(précisions)</a>
            </legend>
            <div v-show="showPrecisions.commentaire" class="precisions">
              - Vous pouvez indiquer ici des commentaires sur le fiche. <strong>Attention, c'est public.</strong><br>
              - bbcode utilisable (url, b, i) <strong>Attention à bien fermer les balises!! ([b]texte[/b])</strong><br>
              - Merci de faire des phrases aussi courtes que possible
            </div>
            <textarea 
              v-model="formData.commentaire" 
              class="form-textarea auto-resize" 
              rows="3"
              @input="autoResizeTextarea"
            ></textarea>
          </div>

          <!-- Statut -->
          <div class="form-group">
            <label class="form-checkbox">
              <input v-model="formData.statut" type="checkbox" />
              <span class="checkbox-label">Manga actif</span>
            </label>
          </div>

          </form>
        </div>
      </div>

      <!-- Staff Management Tab -->
      <div v-show="activeTab === 'staff'" class="tab-content">
        <div class="staff-management">
          <!-- Current Manga Info -->
          <div class="manga-info-banner">
            <h3 class="manga-banner-title">
              {{ formData.titre || 'Nouveau manga' }}
              <span v-if="!isCreating" class="manga-id">ID: {{ mangaId }}</span>
            </h3>
          </div>

          <!-- Important Notice -->
          <div class="info-notice">
            <div class="notice-header">
              <span class="notice-icon">⚠️</span>
              <span class="notice-title">Important</span>
            </div>
            <div class="notice-content">
              <ul class="notice-list">
                <li>N'entrez qu'une ID à chaque fois puis validez</li>
                <li>Vous pouvez ajouter des précisions à chaque relation</li>
                <li>Ne pas mettre de parenthèses, elles sont automatiques</li>
                <li>Si vous n'êtes pas sûr d'une fonction, demandez!</li>
              </ul>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="staff-two-column">
            <!-- Left Column: Staff List -->
            <div class="staff-list-column">
              <!-- Current Staff List -->
              <section class="staff-section staff-list-section">
                <div class="staff-header">
                  <h2 class="section-title">STAFF</h2>
                  <div class="staff-info-banner">
                    <img src="/mini_logo.png" alt="" class="staff-logo" />
                    Pas de fonction en dur, youhou!
                  </div>
                </div>
                
                <div v-if="staffList.length === 0" class="empty-staff">
                  <div class="empty-icon">👥</div>
                  <p>Aucun membre du staff ajouté</p>
                </div>
                
                <div v-else class="staff-display">
                  <h3 class="functions-title">Fonctions dynamiques</h3>
                  <ul class="functions-list">
                    <li 
                      v-for="(group, fonction) in groupedStaff" 
                      :key="fonction"
                      class="function-group"
                    >
                      <div class="function-name">{{ fonction }}:</div>
                      <div class="function-members">
                        <div 
                          v-for="member in group" 
                          :key="`${member.business_id}-${member.fonction}`"
                          class="staff-member"
                        >
                          <span class="business-id">#{{ member.business_id }}</span>
                          <span class="business-name">{{ member.business_name }}</span>
                          <span v-if="member.precisions" class="member-precisions">({{ member.precisions }})</span>
                          <button 
                            @click="removeStaffMember(member)"
                            class="remove-link"
                            title="Supprimer"
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            <!-- Right Column: Staff Management -->
            <div class="staff-management-column">
              <!-- Business Search Section -->
              <section class="staff-section">
                <h2 class="section-title">Recherche de fiches business</h2>
                <div class="business-search">
                  <div class="form-group">
                    <label class="form-label">Nom de la fiche business</label>
                    <div class="search-input-container">
                      <input 
                        v-model="businessSearchQuery"
                        type="text" 
                        class="form-input search-input"
                        placeholder="Rechercher une fiche business..."
                        @input="searchBusiness"
                      />
                      <div v-if="businessSearchLoading" class="search-spinner">
                        <div class="loading-spinner small"></div>
                      </div>
                    </div>
                    <p class="form-help">Si une fiche n'existe pas... créez-la! 😊</p>
                  </div>

                  <!-- Search Results -->
                  <div v-if="businessSearchResults.length > 0" class="search-results">
                    <h4 class="results-title">Résultats de recherche:</h4>
                    <div class="business-grid">
                      <div 
                        v-for="business in businessSearchResults" 
                        :key="business.id"
                        @click="selectBusiness(business)"
                        class="business-card"
                        :class="{ 'selected': selectedBusiness?.id === business.id }"
                      >
                        <div class="business-name">{{ business.nom }}</div>
                        <div class="business-meta">
                          <span class="business-id">ID: {{ business.id }}</span>
                          <span class="business-type">{{ business.type || 'N/A' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Staff Addition Section -->
              <section v-if="selectedBusiness" class="staff-section">
                <h2 class="section-title">Ajouter au staff</h2>
                
                <!-- Selected Business Info -->
                <div class="selected-business-info">
                  <div class="business-details">
                    <span class="label">Fiche business:</span>
                    <span class="value selected">{{ selectedBusiness.nom }}</span>
                  </div>
                  <div class="business-details">
                    <span class="label">ID:</span>
                    <span class="value">{{ selectedBusiness.id }}</span>
                  </div>
                  <div class="business-details">
                    <span class="label">Fonction:</span>
                    <span class="value function-preview">{{ selectedRole || 'Sélectionnez une fonction' }}</span>
                  </div>
                  <div v-if="staffPrecisions" class="business-details">
                    <span class="label">Précisions:</span>
                    <span class="value precisions-preview">{{ staffPrecisions }}</span>
                  </div>
                </div>

                <!-- Role Selection -->
                <div class="role-selection">
                  <div class="form-group">
                    <label class="form-label">Fonction personnalisée</label>
                    <div class="autocomplete-container">
                      <input 
                        v-model="customRole"
                        type="text" 
                        class="form-input"
                        placeholder="Tapez ou sélectionnez une fonction..."
                        @input="updateSelectedRole"
                        @focus="showStaffAutocomplete = true"
                        @blur="hideAutocomplete"
                        autocomplete="off"
                      />
                      
                      <!-- Autocomplete Dropdown -->
                      <div v-if="showStaffAutocomplete && filteredRoles.length > 0" class="autocomplete-dropdown">
                        <div 
                          v-for="(role, index) in filteredRoles" 
                          :key="role"
                          @mousedown="selectRoleFromAutocomplete(role)"
                          :class="['autocomplete-item', { 'highlighted': index === highlightedStaffIndex }]"
                        >
                          {{ role }}
                        </div>
                      </div>
                    </div>
                    <p class="form-help">
                      Attention: s'il n'y a aucun résultat, vous créerez une nouvelle fonction. 
                      Assurez-vous que ce ne soit pas une erreur.
                    </p>
                  </div>

                  <!-- Precisions -->
                  <div class="form-group">
                    <label class="form-label">Précisions</label>
                    <input 
                      v-model="staffPrecisions"
                      type="text" 
                      class="form-input"
                      placeholder="Ex: tome 1, chapitre 4..."
                    />
                    <p class="form-help">
                      Optionnel - Précisez le tome, chapitre, etc.
                    </p>
                  </div>

                  <!-- Add Button -->
                  <div class="form-actions">
                    <button 
                      @click="addStaffMember"
                      type="button"
                      class="btn btn-primary"
                      :disabled="!selectedBusiness || !selectedRole || addingStaff"
                    >
                      <span class="btn-icon">➕</span>
                      {{ addingStaff ? 'Ajout en cours...' : 'Ajouter au staff' }}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <!-- Relations Tab -->
      <div v-show="activeTab === 'relations'" class="tab-content">
        <div class="relations-management">
          <!-- Current Manga Info -->
          <div class="manga-info-banner">
            <h3 class="manga-banner-title">
              {{ formData.titre || 'Nouveau manga' }}
              <span v-if="!isCreating" class="manga-id">ID: {{ mangaId }}</span>
            </h3>
          </div>

          <!-- Two Column Layout -->
          <div class="relations-two-column">
            <!-- Left Column: Relations List -->
            <div class="relations-list-column">
              <section class="relations-section relations-list-section">
                <div class="relations-header">
                  <h2 class="section-title">RELATIONS ACTUELLES</h2>
                </div>
                
                <div v-if="relationsList.length === 0" class="empty-relations">
                  <div class="empty-icon">🔗</div>
                  <p>Aucune relation ajoutée</p>
                </div>
                
                <div v-else class="relations-display">
                  <div class="relations-list">
                    <div 
                      v-for="relation in relationsList" 
                      :key="relation.id_relation"
                      class="relation-item"
                    >
                      <div class="relation-type">
                        <span class="type-badge" :class="relation.target_type">
                          {{ relation.target_type === 'anime' ? '🎬' : '📚' }}
                          {{ relation.target_type === 'anime' ? 'Anime' : 'Manga' }}
                        </span>
                      </div>
                      <div class="relation-details">
                        <div class="target-title">{{ relation.target_title }}</div>
                        <div class="target-id">ID: {{ relation.target_id }}</div>
                      </div>
                      <button 
                        @click="removeRelation(relation)"
                        class="remove-relation-btn"
                        title="Supprimer la relation"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- Right Column: Add Relations -->
            <div class="relations-management-column">
              <!-- Search Section -->
              <section class="relations-section">
                <h2 class="section-title">Ajouter une relation</h2>
                
                <!-- Type Selection -->
                <div class="form-group">
                  <label class="form-label">Type de contenu</label>
                  <div class="type-selection">
                    <button 
                      type="button"
                      @click="selectedRelationType = 'anime'"
                      :class="['type-btn', { 'active': selectedRelationType === 'anime' }]"
                    >
                      🎬 Anime
                    </button>
                    <button 
                      type="button"
                      @click="selectedRelationType = 'manga'"
                      :class="['type-btn', { 'active': selectedRelationType === 'manga' }]"
                    >
                      📚 Manga
                    </button>
                  </div>
                </div>

                <!-- Search -->
                <div class="form-group">
                  <label class="form-label">Rechercher {{ selectedRelationType === 'anime' ? 'un anime' : 'un manga' }}</label>
                  <div class="search-input-container autocomplete-container">
                    <input 
                      v-model="relationSearchQuery"
                      type="text" 
                      class="form-input search-input autocomplete-input"
                      :placeholder="`Rechercher ${selectedRelationType === 'anime' ? 'un anime' : 'un manga'}...`"
                      @input="searchRelations"
                      @focus="onSearchFocus"
                      @blur="onSearchBlur"
                      @keydown="onSearchKeydown"
                      autocomplete="off"
                    />
                    <div v-if="relationSearchLoading" class="search-spinner">
                      <div class="loading-spinner small"></div>
                    </div>
                    <div v-if="relationSearchQuery && !relationSearchLoading" class="clear-search-btn" @click="clearSearch">
                      ✕
                    </div>
                  </div>
                </div>

                <!-- Autocomplete Results -->
                <div v-if="relationSearchResults.length > 0 && showAutocomplete" class="autocomplete-dropdown">
                  <div class="autocomplete-header">
                    <span class="results-count">{{ relationSearchResults.length }} résultat{{ relationSearchResults.length > 1 ? 's' : '' }}</span>
                    <span class="keyboard-hint">↑↓ pour naviguer, Entrée pour sélectionner</span>
                  </div>
                  <div class="autocomplete-results">
                    <div 
                      v-for="(content, index) in relationSearchResults" 
                      :key="`${selectedRelationType}-${content.id}`"
                      @click="selectRelationTarget(content)"
                      @mouseenter="highlightedIndex = index"
                      class="autocomplete-item"
                      :class="{ 
                        'selected': selectedRelationTarget?.id === content.id,
                        'highlighted': index === highlightedIndex
                      }"
                    >
                      <div class="autocomplete-image">
                        <img 
                          :src="content.image ? `/images/${selectedRelationType}s/${content.image}` : '/placeholder-anime.jpg'" 
                          :alt="content.titre"
                          class="autocomplete-thumbnail"
                          @error="handleImageError"
                        />
                      </div>
                      <div class="autocomplete-content">
                        <div class="autocomplete-title">{{ content.titre }}</div>
                        <div class="autocomplete-meta">
                          <span class="content-id">ID: {{ content.id }}</span>
                          <span v-if="content.annee" class="content-year">{{ content.annee }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Selected Item -->
                <div v-if="selectedRelationTarget" class="form-group">
                  <label class="form-label">{{ selectedRelationType === 'anime' ? 'Anime' : 'Manga' }} sélectionné</label>
                  <div class="selected-item">
                    <span class="selected-title">{{ selectedRelationTarget.titre }}</span>
                    <span class="selected-id">ID: {{ selectedRelationTarget.id }}</span>
                    <button type="button" @click="clearRelationSelection" class="clear-selection-btn">✕</button>
                  </div>
                </div>

                <!-- Add Button -->
                <div class="form-group">
                  <button 
                    type="button"
                    @click="addRelation"
                    :disabled="!selectedRelationTarget || addingRelation"
                    class="btn btn-primary add-relation-btn"
                  >
                    <span class="btn-icon">🔗</span>
                    {{ addingRelation ? 'Ajout...' : 'Ajouter la relation' }}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <!-- Covers Tab -->
      <div v-show="activeTab === 'covers'" class="tab-content">
        <div class="covers-management">
          <!-- Current Manga Info -->
          <div class="manga-info-banner">
            <h3 class="manga-banner-title">
              {{ formData.titre || 'Nouveau manga' }}
              <span v-if="!isCreating" class="manga-id">ID: {{ mangaId }}</span>
            </h3>
          </div>

          <!-- Two Column Layout -->
          <div class="covers-two-column">
            <!-- Left Column: Covers List -->
            <div class="covers-list-column">
              <section class="covers-section covers-list-section">
                <div class="covers-header">
                  <h2 class="section-title">COUVERTURES ACTUELLES</h2>
                </div>
                
                <div v-if="coversList.length === 0" class="empty-covers">
                  <div class="empty-icon">🖼️</div>
                  <p>Aucune couverture ajoutée</p>
                </div>
                
                <div v-else class="covers-display">
                  <div class="covers-grid">
                    <div 
                      v-for="cover in coversList" 
                      :key="cover.id_screen"
                      class="cover-item"
                    >
                      <div class="cover-image">
                        <img 
                          :src="`/images/mangas/${cover.url_screen}`" 
                          :alt="`Couverture ${cover.id_screen}`"
                          class="cover-thumbnail"
                          @error="handleCoverImageError"
                        />
                      </div>
                      <div class="cover-details">
                        <div class="cover-id">ID: {{ cover.id_screen }}</div>
                        <div class="cover-url">{{ cover.url_screen }}</div>
                      </div>
                      <button 
                        @click="removeCover(cover)"
                        class="remove-cover-btn"
                        title="Supprimer la couverture"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- Right Column: Upload Cover -->
            <div class="covers-management-column">
              <!-- Upload Section -->
              <section class="covers-section">
                <h2 class="section-title">Ajouter une couverture</h2>
                
                <!-- Upload by URL -->
                <div class="form-group">
                  <label class="form-label">URL de l'image</label>
                  <div class="url-input-container">
                    <input 
                      v-model="newCoverUrl"
                      type="url" 
                      class="form-input"
                      placeholder="https://exemple.com/image.jpg"
                      @input="previewCoverFromUrl"
                    />
                  </div>
                </div>

                <!-- File Upload -->
                <div class="form-group">
                  <label class="form-label">Ou télécharger un fichier</label>
                  <div class="file-upload-container">
                    <input 
                      ref="coverFileInput"
                      type="file" 
                      accept="image/*" 
                      class="file-input"
                      @change="handleCoverFileUpload"
                    />
                    <button 
                      type="button" 
                      @click="$refs.coverFileInput.click()" 
                      class="btn btn-secondary"
                    >
                      📁 Choisir un fichier
                    </button>
                  </div>
                  <p class="form-help">Formats acceptés: JPG, PNG, GIF (max 2MB)</p>
                </div>

                <!-- Preview -->
                <div v-if="coverPreview" class="form-group">
                  <label class="form-label">Aperçu</label>
                  <div class="cover-preview">
                    <img 
                      :src="coverPreview" 
                      alt="Aperçu de la couverture"
                      class="preview-cover-image"
                      @error="handlePreviewError"
                    />
                  </div>
                </div>

                <!-- Upload Button -->
                <div class="form-group">
                  <button 
                    type="button"
                    @click="uploadCover"
                    :disabled="!coverPreview || uploadingCover"
                    class="btn btn-primary upload-cover-btn"
                  >
                    <span class="btn-icon">📤</span>
                    {{ uploadingCover ? 'Téléchargement...' : 'Ajouter la couverture' }}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <!-- Tags Tab -->
      <div v-show="activeTab === 'tags'" class="tab-content">
        <div class="tags-management">
          <div class="tags-header">
            <h2 class="section-title">Gestion des Tags</h2>
            <div class="tags-important-info">
              <button type="button" @click="showTagsInfo = !showTagsInfo" class="toggle-info-btn">
                {{ showTagsInfo ? 'Masquer' : 'Afficher' }} les informations importantes
              </button>
              <div v-show="showTagsInfo" class="tags-info-content">
                <p>Ne rien mettre dans la classification lorsque c'est trop difficilement définissable. Pour ce type de tags, il est bon de se renseigner avant (Air TV et Love Hina sont des shonen par exemple hein). Mieux vaut ne rien mettre plutôt que d'avoir sans arrêt des contestations.</p>
                <p>De manière générale, ne mettez que les tags évidents et, surtout, vérifiez ce qui a déjà été mis dans le cas de suite ou de remake (naruto → naruto shippuden).</p>
              </div>
            </div>
          </div>

          <div class="tags-container">
            <!-- Tags Selection Panel -->
            <div class="tags-selection-panel">
              <div class="tags-search">
                <input 
                  v-model="tagSearchQuery" 
                  type="text" 
                  placeholder="Rechercher un tag..."
                  class="tag-search-input"
                  @input="searchTags"
                />
              </div>

              <div class="tags-categories">
                <div 
                  v-for="category in tagCategories" 
                  :key="category.name"
                  class="tag-category"
                >
                  <h3 class="category-title">{{ category.name }}</h3>
                  <div class="category-tags">
                    <button
                      v-for="tag in category.tags"
                      :key="tag.id_tag"
                      @click="toggleTag(tag)"
                      :class="['tag-btn', { 'selected': isTagSelected(tag.id_tag) }]"
                      type="button"
                    >
                      {{ tag.tag_name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Related Content Panel -->
            <div class="related-content-panel">
              <div class="related-anime-tags">
                <h3>Tags des animes en relations :</h3>
                <div v-if="relatedAnimeTags.length === 0" class="no-related">
                  Aucun anime en relation
                </div>
                <div v-else class="related-items">
                  <div 
                    v-for="anime in relatedAnimeTags" 
                    :key="anime.id_anime"
                    class="related-item"
                  >
                    <a :href="`/anime/${anime.id_anime}`" target="_blank" class="related-link">
                      {{ anime.titre }}
                    </a>
                    <div class="related-tags">
                      <span 
                        v-for="tag in anime.tags" 
                        :key="tag.id_tag"
                        class="related-tag"
                      >
                        {{ tag.tag_name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="related-manga-tags">
                <h3>Tags des autres mangas en relations :</h3>
                <div v-if="relatedMangaTags.length === 0" class="no-related">
                  Aucun manga en relation
                </div>
                <div v-else class="related-items">
                  <div 
                    v-for="manga in relatedMangaTags" 
                    :key="manga.id_manga"
                    class="related-item"
                  >
                    <a :href="`/manga/${manga.id_manga}`" target="_blank" class="related-link">
                      {{ manga.titre }}
                    </a>
                    <div class="related-tags">
                      <span 
                        v-for="tag in manga.tags" 
                        :key="tag.id_tag"
                        class="related-tag"
                      >
                        {{ tag.tag_name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Layout
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Modifier le manga - Administration'
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// Router
const route = useRoute()
const router = useRouter()
const mangaId = route.params.id

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'http://localhost:3001'

// Reactive data
const manga = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

// Form data
const formData = ref({
  titre: '',
  auteur: '',
  annee: new Date().getFullYear(),
  nb_volumes: '',
  synopsis: '',
  image: '',
  statut: true,
  isbn: '',
  origine: '',
  titre_orig: '',
  titres_alternatifs: '',
  licence: '0',
  titre_fr: '',
  topic: '',
  commentaire: ''
})

// Precision toggles
const showPrecisions = ref({
  titre: false,
  isbn: false,
  origine: false,
  annee: false,
  titre_orig: false,
  titres_alternatifs: false,
  titre_fr: false,
  nb_volumes: false,
  synopsis: false,
  topic: false,
  commentaire: false
})

// Toggle precision display
const togglePrecisions = (field) => {
  showPrecisions.value[field] = !showPrecisions.value[field]
}

// Toggle licence fields
const toggleLicenceFields = () => {
  if (formData.value.licence === '0') {
    formData.value.titre_fr = ''
  }
}

// Tab management
const activeTab = ref('basic')
const isCreating = computed(() => mangaId === 'new')

// Image upload
const imagePreview = ref('')
const fileInput = ref(null)
const uploadedFile = ref(null)

const switchTab = (tab) => {
  if (isCreating.value && tab !== 'basic') {
    alert('Sauvegardez d\'abord les informations de base')
    return
  }
  activeTab.value = tab
  if (tab === 'staff') {
    if (authStore.isAuthenticated && isAdmin.value) {
      loadStaffList()
    } else {
      console.warn('User not authenticated as admin, cannot load staff list')
    }
  } else if (tab === 'relations') {
    if (authStore.isAuthenticated && isAdmin.value) {
      loadRelationsList()
    }
  } else if (tab === 'covers') {
    if (authStore.isAuthenticated && isAdmin.value) {
      loadCoversList()
    }
  } else if (tab === 'tags') {
    if (authStore.isAuthenticated && isAdmin.value) {
      loadTagCategories()
      loadMangaTags()
      loadRelatedTags()
    }
  }
}

// Staff Management
const staffList = ref([])
const businessSearchQuery = ref('')
const businessSearchResults = ref([])
const businessSearchLoading = ref(false)
const selectedBusiness = ref(null)
const customRole = ref('')
const selectedRole = ref('')
const staffPrecisions = ref('')
const addingStaff = ref(false)
const showStaffAutocomplete = ref(false)
const highlightedStaffIndex = ref(-1)

// Common staff roles for manga
const commonRoles = ref([
  'Scénariste',
  'Dessinateur', 
  'Auteur',
  'Character Design',
  'Coloriste',
  'Traducteur',
  'Éditeur',
  'Superviseur',
  'Assistant',
  'Lettrage'
])

// Computed properties for staff
const groupedStaff = computed(() => {
  const groups = {}
  if (Array.isArray(staffList.value)) {
    staffList.value.forEach(member => {
      if (!groups[member.fonction]) {
        groups[member.fonction] = []
      }
      groups[member.fonction].push(member)
    })
  }
  return groups
})

const filteredRoles = computed(() => {
  if (!customRole.value) return commonRoles.value
  return commonRoles.value.filter(role => 
    role.toLowerCase().includes(customRole.value.toLowerCase())
  )
})

// Auto-resize textarea
const synopsisTextarea = ref(null)

const autoResizeTextarea = (event) => {
  const textarea = event?.target || synopsisTextarea.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.max(textarea.scrollHeight, 120) + 'px'
  }
}

// Auto-resize all textareas when data is loaded
const resizeAllTextareas = () => {
  nextTick(() => {
    // Find all textareas with auto-resize class and resize them
    const textareas = document.querySelectorAll('.auto-resize')
    textareas.forEach(textarea => {
      textarea.style.height = 'auto'
      textarea.style.height = Math.max(textarea.scrollHeight, 120) + 'px'
    })
  })
}

// Load manga
const loadManga = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('Loading manga with ID:', mangaId)
    console.log('API URL:', `${API_BASE}/api/admin/mangas/${mangaId}`)
    console.log('Auth headers:', authStore.getAuthHeaders())
    
    const response = await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}`, {
      headers: authStore.getAuthHeaders()
    })
    
    console.log('Manga response:', response)
    console.log('Synopsis from API:', response.synopsis)
    console.log('Titres alternatifs from API:', response.titres_alternatifs)
    console.log('Origine from API:', response.origine)
    console.log('Titre original from API:', response.titre_orig)
    manga.value = response
    formData.value = {
      titre: response.titre || '',
      auteur: response.auteur || '',
      annee: response.annee || new Date().getFullYear(),
      nb_volumes: response.nb_volumes || '',
      synopsis: response.synopsis || '',
      image: response.image || '',
      statut: Boolean(response.statut),
      isbn: response.isbn || '',
      origine: response.origine || '',
      titre_orig: response.titre_orig || '',
      titres_alternatifs: response.titres_alternatifs || '',
      licence: String(response.licence || '0'),
      titre_fr: response.titre_fr || '',
      topic: String(response.topic || ''),
      commentaire: response.commentaire || ''
    }
    
    // Auto-resize all textareas after data is loaded
    resizeAllTextareas()
  } catch (err) {
    console.error('Load manga error:', err)
    console.error('Error details:', err.response || err)
    if (err.response?.status === 404) {
      error.value = 'Manga non trouvé'
    } else if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else {
      error.value = `Erreur lors du chargement du manga: ${err.message || 'Erreur inconnue'}`
    }
  } finally {
    loading.value = false
  }
}

// Save manga
const saveManga = async () => {
  saving.value = true
  
  try {
    // Prepare form data for file upload
    const formDataToSend = new FormData()
    
    // Add form fields
    formDataToSend.append('titre', formData.value.titre)
    formDataToSend.append('auteur', formData.value.auteur || '')
    formDataToSend.append('annee', formData.value.annee ? parseInt(formData.value.annee) : '')
    formDataToSend.append('nb_volumes', formData.value.nb_volumes)
    formDataToSend.append('synopsis', formData.value.synopsis || '')
    formDataToSend.append('statut', formData.value.statut ? 1 : 0)
    formDataToSend.append('isbn', formData.value.isbn || '')
    formDataToSend.append('origine', formData.value.origine)
    formDataToSend.append('titre_orig', formData.value.titre_orig)
    formDataToSend.append('titres_alternatifs', formData.value.titres_alternatifs || '')
    formDataToSend.append('licence', parseInt(formData.value.licence))
    formDataToSend.append('titre_fr', formData.value.titre_fr || '')
    formDataToSend.append('topic', formData.value.topic ? parseInt(formData.value.topic) : '')
    formDataToSend.append('commentaire', formData.value.commentaire || '')
    
    // Add existing image if no new file uploaded
    if (!uploadedFile.value && formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }
    
    // Add uploaded file if exists
    if (uploadedFile.value) {
      formDataToSend.append('image', uploadedFile.value)
    }
    
    const response = await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}`, {
      method: 'PUT',
      headers: authStore.getAuthHeaders(),
      body: formDataToSend
    })
    
    // Reset upload state
    uploadedFile.value = null
    imagePreview.value = ''
    
    console.log('Manga updated successfully:', response)
    
    // Redirect back to manga list
    await router.push('/admin/mangas')
  } catch (err) {
    console.error('Save manga error:', err)
    error.value = 'Erreur lors de l\'enregistrement'
  } finally {
    saving.value = false
  }
}

// Load data on mount
onMounted(() => {
  // Wait for auth to load before checking admin status
  if (!authStore.loading && isAdmin.value) {
    loadManga()
  }
})

// Watch for admin status changes
watch([isAdmin, () => authStore.loading], ([newIsAdmin, newLoading]) => {
  if (!newLoading) {
    if (newIsAdmin) {
      loadManga()
    } else if (authStore.isAuthenticated) {
      navigateTo('/admin/unauthorized')
    } else {
      navigateTo('/login')
    }
  }
})

// Staff Management Functions
const loadStaffList = async () => {
  try {
    console.log('Loading staff for manga:', mangaId)
    console.log('Auth headers:', authStore.getAuthHeaders())
    const response = await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/staff`, {
      headers: authStore.getAuthHeaders()
    })
    console.log('Staff response:', response)
    staffList.value = Array.isArray(response.data) ? response.data : []
    console.log('Staff list set to:', staffList.value)
  } catch (error) {
    console.error('Error loading staff:', error)
    console.error('Error details:', error.response || error.message)
    staffList.value = []
  }
}

// Staff management methods
let businessSearchTimeout = null
const searchBusiness = () => {
  clearTimeout(businessSearchTimeout)
  businessSearchTimeout = setTimeout(async () => {
    if (!businessSearchQuery.value.trim()) {
      businessSearchResults.value = []
      return
    }
    
    businessSearchLoading.value = true
    try {
      const response = await $fetch(`${API_BASE}/api/business/search`, {
        params: { q: businessSearchQuery.value.trim(), limit: 10 }
      })
      businessSearchResults.value = response.data || []
    } catch (err) {
      console.error('Business search error:', err)
      businessSearchResults.value = []
    } finally {
      businessSearchLoading.value = false
    }
  }, 300)
}

const selectBusiness = (business) => {
  selectedBusiness.value = business
  businessSearchQuery.value = business.nom
  businessSearchResults.value = []
}

const updateSelectedRole = () => {
  selectedRole.value = customRole.value
}

const selectRoleFromAutocomplete = (role) => {
  customRole.value = role
  selectedRole.value = role
  showStaffAutocomplete.value = false
}

const hideAutocomplete = () => {
  setTimeout(() => {
    showStaffAutocomplete.value = false
  }, 150)
}

const addStaffMember = async () => {
  if (!selectedBusiness.value || !selectedRole.value) return
  
  addingStaff.value = true
  try {
    await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/staff`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: {
        business_id: selectedBusiness.value.id,
        fonction: selectedRole.value,
        precisions: staffPrecisions.value || null
      }
    })
    
    // Reset form
    selectedBusiness.value = null
    customRole.value = ''
    selectedRole.value = ''
    staffPrecisions.value = ''
    businessSearchQuery.value = ''
    
    // Reload staff list
    await loadStaffList()
    
  } catch (error) {
    console.error('Error adding staff member:', error)
    alert('Erreur lors de l\'ajout du membre du staff')
  } finally {
    addingStaff.value = false
  }
}

const removeStaffMember = async (member) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du staff ?')) return
  
  try {
    await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/staff/${member.business_id}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders(),
      params: { fonction: member.fonction }
    })
    
    // Reload staff list
    await loadStaffList()
    
  } catch (error) {
    console.error('Error removing staff member:', error)
    alert('Erreur lors de la suppression du membre du staff')
  }
}

// Relations Management
const relationsList = ref([])
const selectedRelationType = ref('anime')
const relationSearchQuery = ref('')
const relationSearchResults = ref([])
const relationSearchLoading = ref(false)
const selectedRelationTarget = ref(null)
const addingRelation = ref(false)
const highlightedIndex = ref(-1)
const showAutocomplete = ref(false)
const searchAttempted = ref(false)

// Covers Management
const coversList = ref([])
const newCoverUrl = ref('')
const coverPreview = ref('')
const uploadingCover = ref(false)
const coverFileInput = ref(null)
const uploadedCoverFile = ref(null)

// Tags Management
const showTagsInfo = ref(false)
const tagSearchQuery = ref('')
const tagCategories = ref([])
const selectedTags = ref([])
const relatedAnimeTags = ref([])
const relatedMangaTags = ref([])

const loadRelationsList = async () => {
  if (isCreating.value) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/relations`, {
      headers: authStore.getAuthHeaders()
    })
    
    relationsList.value = (response.data || []).map(relation => ({
      id_relation: relation.id_relation,
      target_type: relation.id_anime ? 'anime' : 'manga',
      target_title: relation.titre,
      target_id: relation.id_anime || relation.id_manga,
      id_anime: relation.id_anime,
      id_manga: relation.id_manga
    }))
  } catch (error) {
    console.error('Error loading relations:', error)
    relationsList.value = []
  }
}

let relationSearchTimeout = null
const searchRelations = () => {
  if (relationSearchTimeout) {
    clearTimeout(relationSearchTimeout)
  }
  
  relationSearchTimeout = setTimeout(async () => {
    if (!relationSearchQuery.value || relationSearchQuery.value.length < 2) {
      relationSearchResults.value = []
      showAutocomplete.value = false
      return
    }
    
    try {
      relationSearchLoading.value = true
      const endpoint = selectedRelationType.value === 'anime' 
        ? `/api/search?q=${encodeURIComponent(relationSearchQuery.value)}`
        : `/api/admin/mangas/search?q=${encodeURIComponent(relationSearchQuery.value)}`
      
      console.log('Searching with URL:', `${API_BASE}${endpoint}`)
      console.log('Auth headers:', authStore.getAuthHeaders())
      
      const response = await $fetch(`${API_BASE}${endpoint}`, {
        headers: authStore.getAuthHeaders()
      })
      
      relationSearchResults.value = (response.data || []).map(item => ({
        id: selectedRelationType.value === 'anime' ? item.id_anime : item.id_manga,
        titre: item.titre,
        image: item.image,
        annee: item.annee
      }))
      
      showAutocomplete.value = true
      searchAttempted.value = true
      highlightedIndex.value = -1
    } catch (error) {
      console.error('Relation search error:', error)
      relationSearchResults.value = []
    } finally {
      relationSearchLoading.value = false
    }
  }, 300)
}

const selectRelationTarget = (content) => {
  selectedRelationTarget.value = content
  relationSearchQuery.value = content.titre
  relationSearchResults.value = [] // Close autocomplete dropdown
  searchAttempted.value = false // Reset search state
  showAutocomplete.value = false
  highlightedIndex.value = -1
}

// Autocomplete interaction methods
const onSearchFocus = () => {
  if (relationSearchResults.value.length > 0) {
    showAutocomplete.value = true
  }
}

const onSearchBlur = () => {
  // Delay hiding to allow click on dropdown items
  setTimeout(() => {
    showAutocomplete.value = false
    highlightedIndex.value = -1
  }, 150)
}

const onSearchKeydown = (event) => {
  if (!relationSearchResults.value.length) return
  
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!showAutocomplete.value) {
      showAutocomplete.value = true
    }
    highlightedIndex.value = Math.min(
      highlightedIndex.value + 1,
      relationSearchResults.value.length - 1
    )
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!showAutocomplete.value) {
      showAutocomplete.value = true
    }
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
  } else if (event.key === 'Enter' && highlightedIndex.value >= 0) {
    event.preventDefault()
    selectRelationTarget(relationSearchResults.value[highlightedIndex.value])
  } else if (event.key === 'Escape') {
    showAutocomplete.value = false
    highlightedIndex.value = -1
  }
}

const clearSearch = () => {
  relationSearchQuery.value = ''
  relationSearchResults.value = []
  showAutocomplete.value = false
  highlightedIndex.value = -1
  selectedRelationTarget.value = null
  searchAttempted.value = false
}

const clearRelationSelection = () => {
  selectedRelationTarget.value = null
  relationSearchQuery.value = ''
}

const addRelation = async () => {
  if (!selectedRelationTarget.value || addingRelation.value) return
  
  try {
    addingRelation.value = true
    
    const relationData = {
      target_type: selectedRelationType.value,
      target_id: selectedRelationTarget.value.id
    }
    
    await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/relations`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: relationData
    })
    
    // Clear selection
    selectedRelationTarget.value = null
    relationSearchQuery.value = ''
    relationSearchResults.value = []
    searchAttempted.value = false
    
    // Reload relations list
    await loadRelationsList()
    
  } catch (error) {
    console.error('Error adding relation:', error)
    alert('Erreur lors de l\'ajout de la relation')
  } finally {
    addingRelation.value = false
  }
}

const removeRelation = async (relation) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette relation ?')) return
  
  try {
    await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/relations/${relation.id_relation}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders()
    })
    
    // Reload relations list
    await loadRelationsList()
    
  } catch (error) {
    console.error('Error removing relation:', error)
    alert('Erreur lors de la suppression de la relation')
  }
}

// Covers Management Functions
const loadCoversList = async () => {
  if (isCreating.value) return
  
  try {
    console.log('Loading covers for manga:', mangaId)
    const response = await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/covers`, {
      headers: authStore.getAuthHeaders()
    })
    
    coversList.value = response.data || []
    console.log('Covers loaded:', coversList.value)
  } catch (error) {
    console.error('Error loading covers:', error)
    coversList.value = []
  }
}

const previewCoverFromUrl = () => {
  if (newCoverUrl.value && newCoverUrl.value.trim()) {
    coverPreview.value = newCoverUrl.value.trim()
    uploadedCoverFile.value = null
  } else {
    coverPreview.value = ''
  }
}

const handleCoverFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner un fichier image valide')
    return
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('Le fichier image ne doit pas dépasser 2MB')
    return
  }
  
  // Store the file and show preview
  uploadedCoverFile.value = file
  newCoverUrl.value = ''
  
  const reader = new FileReader()
  reader.onload = (e) => {
    coverPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const uploadCover = async () => {
  if (!coverPreview.value || uploadingCover.value) return
  
  try {
    uploadingCover.value = true
    
    const formData = new FormData()
    formData.append('manga_id', mangaId)
    formData.append('type', '2') // Type 2 for manga covers based on the SQL query
    
    if (uploadedCoverFile.value) {
      // File upload
      formData.append('cover', uploadedCoverFile.value)
    } else if (newCoverUrl.value) {
      // URL upload
      formData.append('url_screen', newCoverUrl.value)
    }
    
    await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/covers`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: formData
    })
    
    // Reset form
    newCoverUrl.value = ''
    coverPreview.value = ''
    uploadedCoverFile.value = null
    if (coverFileInput.value) {
      coverFileInput.value.value = ''
    }
    
    // Reload covers list
    await loadCoversList()
    
  } catch (error) {
    console.error('Error uploading cover:', error)
    alert('Erreur lors du téléchargement de la couverture')
  } finally {
    uploadingCover.value = false
  }
}

const removeCover = async (cover) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette couverture ?')) return
  
  try {
    await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/covers/${cover.id_screen}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders()
    })
    
    // Reload covers list
    await loadCoversList()
    
  } catch (error) {
    console.error('Error removing cover:', error)
    alert('Erreur lors de la suppression de la couverture')
  }
}

const handleCoverImageError = (event) => {
  event.target.src = '/placeholder-manga.jpg'
}

const handlePreviewError = (event) => {
  console.error('Preview image failed to load:', event.target.src)
}

// Tags Management Functions
const searchTags = () => {
  if (!tagSearchQuery.value.trim()) {
    loadTagCategories()
    return
  }
  
  // Filter tags based on search query
  const filtered = tagCategories.value.map(category => {
    const filteredTags = category.tags.filter(tag => 
      tag.tag_name.toLowerCase().includes(tagSearchQuery.value.toLowerCase())
    )
    if (filteredTags.length > 0) {
      return {
        name: category.name,
        tags: filteredTags
      }
    }
    return null
  }).filter(Boolean)
  
  tagCategories.value = filtered
}

const toggleTag = async (tag) => {
  try {
    if (isTagSelected(tag.id_tag)) {
      // Remove tag
      selectedTags.value = selectedTags.value.filter(t => t.id_tag !== tag.id_tag)
      
      await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/tags/${tag.id_tag}`, {
        method: 'DELETE',
        headers: authStore.getAuthHeaders()
      })
      selectedTags.value = selectedTags.value.filter(t => t.id_tag !== tag.id_tag)
    } else {
      // Add tag
      selectedTags.value.push(tag)
      
      await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/tags`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: { 
          id_tag: tag.id_tag,
          type: 'manga'
        }
      })
      selectedTags.value.push(tag)
    }
  } catch (error) {
    console.error('Toggle tag error:', error)
    // Revert on error
    if (isTagSelected(tag.id_tag)) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value = selectedTags.value.filter(t => t.id_tag !== tag.id_tag)
    }
  }
}

const isTagSelected = (tagId) => {
  return selectedTags.value.some(tag => tag.id_tag === tagId)
}

const loadTagCategories = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/tags`)
    
    tagCategories.value = Object.keys(response.data).map(categoryName => ({
      name: categoryName,
      tags: response.data[categoryName]
    }))
  } catch (error) {
    console.error('Load tag categories error:', error)
  }
}

const loadMangaTags = async () => {
  if (isCreating.value) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/mangas/${mangaId}/tags`)
    selectedTags.value = response.data || []
  } catch (err) {
    console.error('Load manga tags error:', err)
  }
}

const loadRelatedTags = async () => {
  if (isCreating.value) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/mangas/${mangaId}/related-tags`, {
      headers: authStore.getAuthHeaders()
    })
    relatedAnimeTags.value = response.animes || []
    relatedMangaTags.value = response.mangas || []
  } catch (error) {
    console.error('Load related tags error:', error)
  }
}

// Image upload functions
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner un fichier image valide')
    return
  }
  
  // Validate file size (max 200KB)
  if (file.size > 200 * 1024) {
    alert('Le fichier image ne doit pas dépasser 200KB')
    return
  }
  
  // Store the file for upload and show preview
  uploadedFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Get image source with proper fallback
const getImageSrc = () => {
  if (imagePreview.value) {
    return imagePreview.value
  }
  if (formData.value.image && formData.value.image.trim()) {
    // Check if it's a full URL or just a filename
    if (formData.value.image.startsWith('http')) {
      return formData.value.image
    } else {
      return `/images/mangas/${formData.value.image}`
    }
  }
  return '/placeholder-manga.jpg'
}

// Handle image error
const handleImageError = (event) => {
  // Prevent infinite loop by checking current src
  if (event.target.src.endsWith('/placeholder-manga.jpg')) {
    // If placeholder also fails, show a data URL fallback
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjZjNmNGY2Ii8+CjxyZWN0IHg9IjcwIiB5PSI5MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNSIgZmlsbD0iI2Q1ZDhkYyIvPgo8cGF0aCBkPSJNODUgMTA1bDEwIDEwIDIwLTIwIDMwIDMwdjQwSDcwdi00MHoiIGZpbGw9IiNiYmJmYzMiLz4KPHRleHQgeD0iMTAwIiB5PSIyMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+TWFuZ2EgSW1hZ2U8L3RleHQ+Cjx0ZXh0IHg9IjEwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPk5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+'
    return
  }
  // Otherwise, try the placeholder
  event.target.src = '/placeholder-manga.jpg'
}

// Handle image preview update
const updateImagePreview = () => {
  imagePreview.value = formData.value.image
}
</script>

<style scoped>
.admin-manga-edit {
  max-width: 1200px;
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

.page-header-left {
  flex: 1;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 1rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: var(--accent-color);
}

.back-icon {
  font-size: 1.25rem;
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

.page-header-right {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
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

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1rem;
}

/* States */
.loading-state,
.error-state {
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

.error-icon {
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

/* Edit Container */
.edit-container {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  overflow: hidden;
}

.form-container {
  padding: 2rem;
}

/* Form */
.manga-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
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
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.form-textarea.bigtxt {
  min-height: 200px;
}

.form-textarea.auto-resize {
  resize: none;
  overflow: hidden;
  transition: height 0.2s ease;
}

.form-select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-legend {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
  display: block;
}

.required {
  color: var(--error-color);
}

.toggle-link {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: normal;
  font-size: 0.8rem;
}

.toggle-link:hover {
  text-decoration: underline;
}

.precisions {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.precisions a {
  color: var(--accent-color);
}

.precisions strong {
  color: var(--text-color);
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 0;
}

.checkbox-label {
  font-weight: 500;
  color: var(--text-color);
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  border-radius: 1rem 1rem 0 0;
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  color: var(--text-color);
  background: var(--surface-hover);
}

.tab-btn.active {
  color: var(--accent-color);
  background: var(--surface-color);
  border-bottom-color: var(--accent-color);
}

.tab-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.tab-icon {
  font-size: 1.25rem;
}

.tab-content {
  min-height: 400px;
}

/* Staff Management */
.staff-management {
  padding: 1.5rem;
}

.manga-info-banner {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  text-align: center;
}

.manga-banner-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.manga-id {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-left: 1rem;
}

.info-notice {
  background: var(--bg-warning);
  border: 1px solid var(--border-warning);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.notice-title {
  font-weight: 600;
  color: var(--text-warning);
}

.notice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notice-list li {
  padding: 0.25rem 0;
  color: var(--text-warning);
}

.staff-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.staff-section {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
}

.empty-staff {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.business-search .form-group {
  margin-bottom: 1.5rem;
}

.search-input-container {
  position: relative;
}

.search-spinner {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.business-grid {
  display: grid;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.business-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.business-card:hover {
  border-color: var(--accent-color);
  background: var(--surface-hover);
}

.business-card.selected {
  border-color: var(--accent-color);
  background: var(--accent-surface);
}

.business-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.business-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.selected-business-info {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.business-details {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.business-details:last-child {
  border-bottom: none;
}

.business-details .label {
  font-weight: 500;
  color: var(--text-secondary);
}

.business-details .value.selected {
  color: var(--accent-color);
  font-weight: 600;
}

.autocomplete-container {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.autocomplete-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.1s ease;
}

.autocomplete-item:hover,
.autocomplete-item.highlighted {
  background: var(--surface-hover);
}

.functions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.function-group {
  margin-bottom: 1.5rem;
}

.function-name {
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 0.5rem;
}

.staff-member {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-hover);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.business-id {
  font-weight: 600;
  color: var(--accent-color);
}

.business-name {
  flex: 1;
}

.member-precisions {
  font-style: italic;
  color: var(--text-secondary);
}

.remove-link {
  background: none;
  border: none;
  color: var(--text-danger);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.remove-link:hover {
  background: var(--bg-danger);
  color: var(--text-danger);
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-container {
    padding: 1.5rem;
  }

  .staff-two-column {
    grid-template-columns: 1fr;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .image-upload {
    flex-direction: column;
  }

  .image-preview {
    margin-bottom: 1rem;
  }
}

/* Image Upload Styles */
.image-upload {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.image-preview {
  flex: 0 0 200px;
  height: 280px;
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--surface-color);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.no-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-align: center;
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.image-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-input {
  display: none;
}

.btn.btn-secondary {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn.btn-secondary:hover {
  background: var(--surface-hover);
  border-color: var(--accent-color);
}

/* Relations Management */
.relations-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

/* Relations List Column */
.relations-list-column {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  min-height: 400px;
}

.relations-management-column {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  min-height: 400px;
}

.relations-section {
  margin-bottom: 2rem;
}

.relations-section:last-child {
  margin-bottom: 0;
}

.relations-header {
  margin-bottom: 1.5rem;
}

.relations-header .section-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.relations-header .section-title:before {
  content: "🔗";
  font-size: 1rem;
}

.empty-relations {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.relations-display .relations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.relation-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.relation-item:hover {
  background: var(--surface-hover);
  border-color: var(--accent-color);
}

.relation-type .type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.relation-type .type-badge.anime {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.relation-type .type-badge.manga {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.relation-details {
  flex: 1;
}

.target-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.target-id {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.remove-relation-btn {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.remove-relation-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}

/* Type Selection */
.type-selection {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.type-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-secondary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.type-btn:hover {
  border-color: var(--accent-color);
  background: var(--surface-hover);
}

.type-btn.active {
  border-color: var(--accent-color);
  background: var(--accent-color);
  color: white;
}

/* Autocomplete Container */
.autocomplete-container {
  position: relative;
}

/* Selected Item */
.selected-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.selected-title {
  font-weight: 500;
  color: var(--text-primary);
}

.selected-id {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.clear-selection-btn {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-left: auto;
}

.clear-selection-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.add-relation-btn {
  width: 100%;
  margin-top: 1rem;
}

/* Autocomplete Dropdown */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.autocomplete-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.keyboard-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.autocomplete-results {
  max-height: 240px;
  overflow-y: auto;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover,
.autocomplete-item.highlighted {
  background: var(--surface-hover);
}

.autocomplete-item.selected {
  background: var(--accent-color);
  color: white;
}

.autocomplete-image {
  width: 40px;
  height: 60px;
  border-radius: 0.25rem;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-secondary);
}

.autocomplete-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.autocomplete-content {
  flex: 1;
  min-width: 0;
}

.autocomplete-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.autocomplete-item.selected .autocomplete-title {
  color: white;
}

.autocomplete-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.autocomplete-item.selected .autocomplete-meta {
  color: rgba(255, 255, 255, 0.8);
}

.content-id {
  font-family: monospace;
}

.content-year {
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1024px) {
  .relations-two-column {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .relations-list-column,
  .relations-management-column {
    padding: 1rem;
  }
  
  .relation-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .remove-relation-btn {
    align-self: flex-end;
  }
}

/* Covers Management */
.covers-management {
  padding: 1.5rem;
}

.covers-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.covers-list-column,
.covers-management-column {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  min-height: 400px;
}

.covers-section {
  margin-bottom: 2rem;
}

.covers-section:last-child {
  margin-bottom: 0;
}

.covers-header {
  margin-bottom: 1.5rem;
}

.covers-header .section-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.covers-header .section-title:before {
  content: "🖼️";
  font-size: 1rem;
}

.empty-covers {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.covers-display .covers-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cover-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.cover-item:hover {
  background: var(--surface-hover);
  border-color: var(--accent-color);
}

.cover-image {
  width: 80px;
  height: 112px;
  border-radius: 0.25rem;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-secondary);
}

.cover-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-details {
  flex: 1;
  min-width: 0;
}

.cover-id {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.cover-url {
  font-size: 0.875rem;
  color: var(--text-muted);
  word-break: break-all;
}

.remove-cover-btn {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.remove-cover-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}

/* Upload Section */
.url-input-container,
.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-help {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.cover-preview {
  max-width: 200px;
  max-height: 280px;
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--surface-color);
}

.preview-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.upload-cover-btn {
  width: 100%;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .covers-two-column {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .covers-list-column,
  .covers-management-column {
    padding: 1rem;
  }
  
  .cover-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .cover-image {
    align-self: center;
  }
  
  .remove-cover-btn {
    align-self: flex-end;
  }
}

/* Tags Management */
.tags-management {
  padding: 1.5rem;
}

.tags-header {
  margin-bottom: 2rem;
}

.tags-header .section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.tags-important-info {
  margin-bottom: 1.5rem;
}

.toggle-info-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.toggle-info-btn:hover {
  background: var(--surface-hover);
  border-color: var(--accent-color);
}

.tags-info-content {
  background: var(--bg-warning);
  border: 1px solid var(--border-warning);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
}

.tags-info-content p {
  margin: 0 0 0.75rem 0;
  color: var(--text-warning);
  line-height: 1.5;
}

.tags-info-content p:last-child {
  margin-bottom: 0;
}

.tags-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-top: 1.5rem;
}

/* Tags Selection Panel */
.tags-selection-panel {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.tags-search {
  margin-bottom: 1.5rem;
}

.tag-search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.tag-search-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.tags-categories {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tag-category {
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

.category-title {
  background: var(--bg-secondary);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.category-tags {
  padding: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.tag-btn:hover {
  background: var(--surface-hover);
  border-color: var(--accent-color);
}

.tag-btn.selected {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

/* Related Content Panel */
.related-content-panel {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-height: 600px;
  overflow-y: auto;
}

.related-anime-tags,
.related-manga-tags {
  margin-bottom: 2rem;
}

.related-anime-tags:last-child,
.related-manga-tags:last-child {
  margin-bottom: 0;
}

.related-anime-tags h3,
.related-manga-tags h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.related-anime-tags h3:before {
  content: "🎬";
  font-size: 0.875rem;
}

.related-manga-tags h3:before {
  content: "📚";
  font-size: 0.875rem;
}

.no-related {
  color: var(--text-secondary);
  font-style: italic;
  padding: 1rem;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: 0.25rem;
}

.related-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.related-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  padding: 0.75rem;
}

.related-link {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
}

.related-link:hover {
  text-decoration: underline;
}

.related-tags {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.related-tag {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: 0.125rem;
  font-size: 0.75rem;
}

/* Tags Mobile Responsive */
@media (max-width: 1024px) {
  .tags-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .related-content-panel {
    max-height: none;
    order: -1;
  }
}

@media (max-width: 768px) {
  .tags-management {
    padding: 1rem;
  }
  
  .tags-header .section-title {
    font-size: 1.25rem;
  }
  
  .tags-container {
    gap: 1rem;
  }
  
  .tags-selection-panel,
  .related-content-panel {
    padding: 1rem;
  }
  
  .category-tags {
    padding: 0.75rem;
    gap: 0.375rem;
  }
}
</style>