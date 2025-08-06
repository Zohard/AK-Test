<template>
  <div class="admin-anime-edit">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <NuxtLink to="/admin/animes" class="back-btn">
          <span class="back-icon">←</span>
          Retour à la liste
        </NuxtLink>
        <h1 class="page-title">
          {{ isCreating ? 'Ajouter un anime' : 'Modifier l\'anime' }}
        </h1>
        <p v-if="!isCreating && anime" class="page-subtitle">{{ anime.titre }}</p>
      </div>
      <div class="page-header-right">
        <button 
          @click="previewMode = !previewMode" 
          type="button" 
          class="btn btn-secondary"
          :class="{ 'active': previewMode }"
        >
          <span class="btn-icon">👁️</span>
          {{ previewMode ? 'Édition' : 'Aperçu' }}
        </button>
        <button 
          @click="saveAnime" 
          type="submit" 
          class="btn btn-primary" 
          :disabled="saving || !formData.titre"
        >
          <span class="btn-icon">💾</span>
          {{ saving ? 'Enregistrement...' : (isCreating ? 'Créer l\'anime' : 'Sauvegarder') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement de l'anime...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadAnime" class="retry-btn">Réessayer</button>
    </div>

    <!-- Edit Form -->
    <div v-else-if="!previewMode" class="edit-container">
      <!-- Tab Navigation -->
      <!-- Desktop Tab Navigation -->
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
          @click="switchTab('screenshots')"
          :disabled="isCreating"
          :class="['tab-btn', { 'active': activeTab === 'screenshots', 'disabled': isCreating }]"
          :title="isCreating ? 'Sauvegardez d\'abord les informations de base' : ''"
        >
          <span class="tab-icon">📸</span>
          Screenshots
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

      <!-- Mobile Tab Select -->
      <div class="mobile-tab-select">
        <select 
          v-model="activeTab" 
          @change="switchTab(activeTab)"
          class="tab-select"
        >
          <option value="basic">📝 Informations de base</option>
          <option value="staff" :disabled="isCreating">👥 Gestion du staff</option>
          <option value="relations" :disabled="isCreating">🔗 Relations</option>
          <option value="screenshots" :disabled="isCreating">📸 Screenshots</option>
          <option value="tags" :disabled="isCreating">🏷️ Tags</option>
        </select>
      </div>

      <!-- Basic Info Tab -->
      <div v-show="activeTab === 'basic'" class="tab-content">
        <!-- New anime notice -->
        <div v-if="isCreating" class="creation-notice">
          <div class="notice-icon">ℹ️</div>
          <div class="notice-text">
            <strong>Nouvel anime :</strong> Sauvegardez d'abord les informations de base pour accéder aux autres onglets (staff, relations, screenshots, tags).
          </div>
        </div>
        
        <form @submit.prevent="saveAnime" class="anime-form">
        <div class="form-sections">
          <!-- Basic Information -->
          <section class="form-section">
            <h2 class="section-title">Informations de base</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">Titre</label>
                <input 
                  v-model="formData.titre" 
                  type="text" 
                  class="form-input" 
                  placeholder="Entrez le titre de l'anime"
                  required 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Titre original</label>
                <input 
                  v-model="formData.titre_orig" 
                  type="text" 
                  class="form-input"
                  placeholder="Titre original (japonais, anglais...)"
                />
              </div>
              <div class="form-group full-width">
                <label class="form-label">Titres alternatifs
                  <span class="form-help-inline">Un titre par ligne</span>
                </label>
                <textarea 
                  v-model="formData.titres_alternatifs" 
                  class="form-textarea" 
                  rows="4"
                  placeholder="Entrez chaque titre alternatif sur une nouvelle ligne...&#10;とある魔術の禁書目録&#10;Toaru Majutsu no Index&#10;A Certain Magical Index"
                ></textarea>
                <div class="textarea-info">
                  <span class="char-count">{{ formData.titres_alternatifs?.split('\n').filter(line => line.trim()).length || 0 }} titre(s)</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Année</label>
                <input 
                  v-model="formData.annee" 
                  type="number" 
                  min="1900" 
                  max="2030" 
                  class="form-input" 
                  required 
                />
              </div>
              <div class="form-group">
                <label class="form-label">Format</label>
                <select 
                  v-model="formData.format" 
                  class="form-select"
                >
                  <option value="">Sélectionner un format</option>
                  <option value="Série TV">Série TV</option>
                  <option value="OAV">OAV</option>
                  <option value="Film">Film</option>
                  <option value="ONA">ONA</option>
                  <option value="Clip">Clip</option>
                  <option value="Spécial">Spécial</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nombre d'épisodes</label>
                <input 
                  v-model="formData.nb_ep" 
                  type="number" 
                  min="1" 
                  class="form-input"
                  placeholder="Nombre total d'épisodes"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Studio d'animation</label>
                <input 
                  v-model="formData.studio" 
                  type="text" 
                  class="form-input"
                  placeholder="Studio d'animation"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Anime licencié en France ?</label>
                <select 
                  v-model="formData.licence" 
                  class="form-select"
                  @change="onLicenceChange"
                >
                  <option :value="0">Non</option>
                  <option :value="1">Oui</option>
                </select>
              </div>
              <div v-show="formData.licence == 1" class="form-group">
                <label class="form-label required">Titre français</label>
                <input 
                  v-model="formData.titre_fr" 
                  type="text" 
                  class="form-input"
                  placeholder="Titre français officiel"
                  :required="formData.licence == 1"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Site officiel</label>
                <input 
                  v-model="formData.official_site" 
                  type="url" 
                  class="form-input"
                  placeholder="https://..."
                />
              </div>
              <div class="form-group">
                <label class="form-label">Statut</label>
                <div class="checkbox-group">
                  <label class="form-checkbox">
                    <input v-model="formData.statut" type="checkbox" />
                    <span class="checkbox-label">Anime actif et visible</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <!-- Visual Content -->
          <section class="form-section">
            <h2 class="section-title">Contenu visuel</h2>
            <div class="image-section">
              <div class="image-upload-group">
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
          </section>

          <!-- Synopsis and Additional Info -->
          <section class="form-section">
            <h2 class="section-title">Synopsis et informations complémentaires</h2>
            <div class="form-group full-width">
              <label class="form-label">Doubleurs</label>
              <textarea 
                v-model="formData.doubleurs" 
                class="form-textarea" 
                rows="3"
                placeholder="NomDoubleur (NomPersonnage), séparés par une virgule...&#10;Exemple: Atsushi Abe (Toma Kamijo), Rina Satou (Mikoto Misaka)"
              ></textarea>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Synopsis</label>
              <textarea 
                v-model="formData.synopsis" 
                class="form-textarea synopsis-textarea" 
                rows="8"
                placeholder="Décrivez l'histoire, les personnages principaux, l'univers..."
              ></textarea>
              <div class="textarea-info">
                <span class="char-count">{{ formData.synopsis?.length || 0 }} caractères</span>
              </div>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Commentaire sur la fiche</label>
              <textarea 
                v-model="formData.commentaire" 
                class="form-textarea" 
                rows="3"
                placeholder="Commentaires publics sur cette fiche (optionnel)..."
              ></textarea>
              <div class="textarea-info">
                <span class="form-help">Commentaires visibles publiquement. Exemple: informations sur les épisodes bonus, précisions sur le format, etc.</span>
              </div>
            </div>
          </section>

          <!-- Save Button at Bottom -->
          <section class="form-section form-actions">
            <div class="form-actions-content">
              <button 
                @click="saveAnime" 
                type="submit" 
                class="btn btn-primary btn-large" 
                :disabled="saving || !formData.titre"
              >
                <span class="btn-icon">💾</span>
                {{ saving ? 'Enregistrement...' : (isCreating ? 'Créer l\'anime' : 'Sauvegarder les modifications') }}
              </button>
              <button 
                @click="previewMode = true" 
                type="button" 
                class="btn btn-secondary"
              >
                <span class="btn-icon">👁️</span>
                Aperçu
              </button>
            </div>
          </section>
        </div>
        </form>
      </div>

      <!-- Staff Management Tab -->
      <div v-show="activeTab === 'staff'" class="tab-content">
        <div class="staff-management">
          <!-- Current Anime Info -->
          <div class="anime-info-banner">
            <h3 class="anime-banner-title">
              {{ formData.titre || 'Nouvel anime' }}
              <span v-if="!isCreating" class="anime-id">ID: {{ animeId }}</span>
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
                <li>Vous pouvez ajouter des précisions à chaque relation (épisode 4, OP, etc.)</li>
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
                            Supprimer
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
                    @focus="showAutocomplete = true"
                    @blur="hideAutocomplete"
                    autocomplete="off"
                  />
                  
                  <!-- Autocomplete Dropdown -->
                  <div v-if="showAutocomplete && filteredRoles.length > 0" class="autocomplete-dropdown">
                    <div 
                      v-for="(role, index) in filteredRoles" 
                      :key="role"
                      @mousedown="selectRoleFromAutocomplete(role)"
                      :class="['autocomplete-item', { 'highlighted': index === highlightedIndex }]"
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
                  placeholder="Ex: épisode 4, OP, ED..."
                />
                <p class="form-help">
                  Indiquez les éventuelles précisions (ne mettez pas de parenthèses)
                </p>
              </div>
            </div>

            <!-- Predefined Roles -->
            <div class="predefined-roles">
              <!-- Primary Roles -->
              <div class="role-category-section">
                <h3 class="roles-category collapsible" @click="roleCategories.primary = !roleCategories.primary">
                  <span class="category-toggle" :class="{ 'expanded': roleCategories.primary }">
                    {{ roleCategories.primary ? '▼' : '▶' }}
                  </span>
                  Fonctions traditionnelles
                </h3>
                <div 
                  v-show="roleCategories.primary" 
                  class="role-buttons primary"
                >
                  <button 
                    v-for="role in primaryRoles" 
                    :key="role"
                    type="button"
                    @click="selectRole(role)"
                    :class="['role-btn', { 'active': selectedRole === role }]"
                  >
                    {{ role }}
                  </button>
                </div>
              </div>

              <!-- Secondary Roles -->
              <div class="role-category-section">
                <h3 class="roles-category collapsible" @click="roleCategories.secondary = !roleCategories.secondary">
                  <span class="category-toggle" :class="{ 'expanded': roleCategories.secondary }">
                    {{ roleCategories.secondary ? '▼' : '▶' }}
                  </span>
                  Fonctions avancées
                </h3>
                <div 
                  v-show="roleCategories.secondary" 
                  class="role-buttons secondary"
                >
                  <button 
                    v-for="role in secondaryRoles" 
                    :key="role"
                    type="button"
                    @click="selectRole(role)"
                    :class="['role-btn', { 'active': selectedRole === role }]"
                  >
                    {{ role }}
                  </button>
                </div>
              </div>

              <!-- Technical Roles -->
              <div class="role-category-section">
                <h3 class="roles-category collapsible" @click="roleCategories.technical = !roleCategories.technical">
                  <span class="category-toggle" :class="{ 'expanded': roleCategories.technical }">
                    {{ roleCategories.technical ? '▼' : '▶' }}
                  </span>
                  Fonctions techniques
                </h3>
                <div 
                  v-show="roleCategories.technical" 
                  class="role-buttons technical"
                >
                  <button 
                    v-for="role in technicalRoles" 
                    :key="role"
                    type="button"
                    @click="selectRole(role)"
                    :class="['role-btn', { 'active': selectedRole === role }]"
                  >
                    {{ role }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Add Staff Button -->
            <div class="add-staff-section">
              <button 
                @click="addStaffMember"
                type="button"
                :disabled="!selectedBusiness || !selectedRole || addingStaff"
                class="btn btn-primary add-staff-btn"
              >
                <span class="btn-icon">➕</span>
                {{ addingStaff ? 'Ajout en cours...' : 'Ajouter au staff' }}
              </button>
            </div>
          </section>
            </div>
          </div>
        </div>
      </div>

      <!-- Relations Tab -->
      <div v-show="activeTab === 'relations'" class="tab-content">
        <div class="relations-management">
          <!-- Current Anime Info -->
          <div class="anime-info-banner">
            <h3 class="anime-banner-title">
              {{ formData.titre || 'Nouvel anime' }}
              <span v-if="!isCreating" class="anime-id">ID: {{ animeId }}</span>
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
                          :src="content.image ? `/images/${content.image}` : '/placeholder-anime.jpg'" 
                          :alt="content.titre"
                          class="autocomplete-thumbnail"
                          @error="handleImageError"
                        />
                      </div>
                      <div class="autocomplete-content">
                        <div class="autocomplete-title">{{ content.titre }}</div>
                        <div class="autocomplete-meta">
                          <span class="autocomplete-id">ID: {{ content.id }}</span>
                          <span v-if="content.annee" class="autocomplete-year">{{ content.annee }}</span>
                          <span class="autocomplete-type">{{ selectedRelationType === 'anime' ? 'Anime' : 'Manga' }}</span>
                        </div>
                      </div>
                      <div class="autocomplete-select-icon">
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- No Results Message -->
                <div v-else-if="relationSearchQuery.trim() && !relationSearchLoading && searchAttempted" class="no-results">
                  <div class="no-results-icon">🔍</div>
                  <p>Aucun {{ selectedRelationType === 'anime' ? 'anime' : 'manga' }} trouvé pour "{{ relationSearchQuery }}"</p>
                </div>
              </section>

              <!-- Add Relation Section -->
              <section v-if="selectedRelationTarget" class="relations-section">
                <h2 class="section-title">Confirmer la relation</h2>
                
                <div class="relation-preview">
                  <div class="relation-from">
                    <div class="relation-card current">
                      <span class="relation-type-icon">🎬</span>
                      <div class="relation-info">
                        <div class="relation-title">{{ formData.titre || 'Cet anime' }}</div>
                        <div class="relation-id">ID: {{ animeId }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="relation-arrow">→</div>
                  
                  <div class="relation-to">
                    <div class="relation-card target">
                      <span class="relation-type-icon">{{ selectedRelationType === 'anime' ? '🎬' : '📚' }}</span>
                      <div class="relation-info">
                        <div class="relation-title">{{ selectedRelationTarget.titre }}</div>
                        <div class="relation-id">ID: {{ selectedRelationTarget.id }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="add-relation-section">
                  <button 
                    @click="addRelation"
                    type="button"
                    :disabled="!selectedRelationTarget || addingRelation"
                    class="btn btn-primary add-relation-btn"
                  >
                    <span class="btn-icon">🔗</span>
                    {{ addingRelation ? 'Ajout en cours...' : 'Ajouter la relation' }}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <!-- Screenshots Tab -->
      <div v-show="activeTab === 'screenshots'" class="tab-content">
        <div class="screenshots-management">
          <div class="screenshots-header">
            <h2 class="section-title">Gestion des Screenshots</h2>
            <p class="section-description">
              Uploadez et gérez les captures d'écran de l'anime. Formats acceptés : JPG, JPEG, GIF, PNG. Poids max : 200Ko par image.
            </p>
          </div>

          <div class="screenshots-grid">
            <!-- Upload Section -->
            <section class="upload-section">
              <h3 class="subsection-title">Uploader des screenshots</h3>
              
              <div class="upload-form">
                <div class="upload-drop-zone" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
                  <input 
                    ref="screenshotFileInput"
                    type="file" 
                    multiple
                    accept="image/jpeg,image/jpg,image/gif,image/png"
                    @change="handleScreenshotSelection"
                    style="display: none"
                  />
                  <div class="upload-icon">📸</div>
                  <div class="upload-text">
                    <p>Cliquez pour sélectionner des images ou glissez-déposez</p>
                    <small>Maximum 1.6Mo total, 200Ko par image</small>
                  </div>
                </div>

                <div v-if="selectedScreenshots.length > 0" class="selected-files">
                  <h4>Images sélectionnées ({{ selectedScreenshots.length }}) :</h4>
                  <div class="file-list">
                    <div v-for="(file, index) in selectedScreenshots" :key="index" class="file-item">
                      <div class="file-preview">
                        <img :src="file.preview" alt="Preview" class="file-thumbnail" />
                      </div>
                      <div class="file-info">
                        <div class="file-name">{{ file.name }}</div>
                        <div class="file-size">{{ formatFileSize(file.size) }}</div>
                      </div>
                      <button 
                        @click="removeSelectedFile(index)"
                        type="button" 
                        class="remove-file-btn"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div class="upload-actions">
                    <button 
                      @click="uploadScreenshots"
                      type="button" 
                      :disabled="uploadingScreenshots || isCreating"
                      class="btn btn-primary upload-btn"
                    >
                      <span class="btn-icon">📤</span>
                      {{ uploadingScreenshots ? 'Upload en cours...' : 'Uploader les screenshots' }}
                    </button>
                    <button 
                      @click="clearSelectedFiles"
                      type="button" 
                      class="btn btn-secondary"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Screenshots Gallery -->
            <section class="gallery-section">
              <h3 class="subsection-title">
                Screenshots existants
                <span v-if="screenshotsList.length > 0" class="screenshot-count">({{ screenshotsList.length }})</span>
              </h3>
              
              <div v-if="screenshotsList.length === 0" class="empty-screenshots">
                <div class="empty-icon">📸</div>
                <p>Aucun screenshot disponible</p>
                <small>Uploadez vos premières captures d'écran ci-dessus</small>
              </div>
              
              <div v-else class="screenshots-gallery">
                <div 
                  v-for="screenshot in screenshotsList" 
                  :key="screenshot.id_screen"
                  class="screenshot-item"
                >
                  <div class="screenshot-image">
                    <img 
                      :src="`/images/${screenshot.filename}`"
                      :alt="`Screenshot #${screenshot.id_screen}`"
                      class="screenshot-thumbnail"
                      @error="handleScreenshotError"
                      @click="openScreenshotModal(screenshot)"
                    />
                  </div>
                  <div class="screenshot-actions">
                    <button 
                      @click="deleteScreenshot(screenshot)"
                      type="button"
                      class="delete-screenshot-btn"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </section>
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
                <h3>Tags des mangas en relations :</h3>
                <div v-if="relatedMangaTags.length === 0" class="no-related">
                  Aucun manga en relation
                </div>
                <div v-else class="related-items">
                  <div 
                    v-for="manga in relatedMangaTags" 
                    :key="manga.id_manga"
                    class="related-item"
                  >
                    <a :href="`/mangas/${manga.id_manga}`" target="_blank" class="related-link">
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

    <!-- Preview Mode -->
    <div v-else class="preview-container">
      <div class="anime-preview">
        <div class="preview-header">
          <div class="preview-image-large">
            <img 
:src="getImageSrc()" 
              :alt="formData.titre"
              class="preview-cover"
              @error="handleImageError"
            />
          </div>
          <div class="preview-info">
            <h1 class="preview-title">{{ formData.titre || 'Titre de l\'anime' }}</h1>
            <p v-if="formData.titre_orig" class="preview-orig-title">{{ formData.titre_orig }}</p>
            <div class="preview-meta">
              <div class="meta-item">
                <span class="meta-label">Année:</span>
                <span class="meta-value">{{ formData.annee || '—' }}</span>
              </div>
              <div v-if="formData.nb_ep" class="meta-item">
                <span class="meta-label">Épisodes:</span>
                <span class="meta-value">{{ formData.nb_ep }}</span>
              </div>
              <div v-if="formData.studio" class="meta-item">
                <span class="meta-label">Studio:</span>
                <span class="meta-value">{{ formData.studio }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Statut:</span>
                <span class="meta-value" :class="formData.statut ? 'status-active' : 'status-inactive'">
                  {{ formData.statut ? 'Actif' : 'Inactif' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="formData.synopsis" class="preview-synopsis">
          <h3>Synopsis</h3>
          <p class="synopsis-text">{{ formData.synopsis }}</p>
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
  title: 'Édition Anime - Administration'
})

// Route params
const route = useRoute()
const animeId = route.params.id
const isCreating = animeId === 'new'

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase || 'http://localhost:3001'

// Reactive data
const anime = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const previewMode = ref(false)
const imagePreview = ref('')
const fileInput = ref(null)
const activeTab = ref('basic')
const uploadedFile = ref(null)

// Tab switching with auto-save for new anime
const switchTab = async (tabName) => {
  if (isCreating && tabName !== 'basic') {
    // For new anime, prevent switching to other tabs
    return false
  }
  activeTab.value = tabName
}

// Staff management data
const businessSearchQuery = ref('')
const businessSearchResults = ref([])
const businessSearchLoading = ref(false)
const selectedBusiness = ref(null)
const customRole = ref('')
const selectedRole = ref('')
const staffPrecisions = ref('')
const staffList = ref([])
const addingStaff = ref(false)

// Relations management data
const selectedRelationType = ref('anime')
const relationSearchQuery = ref('')
const relationSearchResults = ref([])
const relationSearchLoading = ref(false)
const selectedRelationTarget = ref(null)
const relationsList = ref([])
const addingRelation = ref(false)
const searchAttempted = ref(false)
const highlightedIndex = ref(-1)
const showAutocomplete = ref(false)

// Watch for relation type changes to clear search
watch(selectedRelationType, () => {
  clearSearch()
})

// Screenshots management data
const screenshotsList = ref([])
const selectedScreenshots = ref([])
const uploadingScreenshots = ref(false)
const screenshotFileInput = ref(null)

// Tags management data
const showTagsInfo = ref(false)
const tagSearchQuery = ref('')
const tagCategories = ref([])
const selectedTags = ref([])
const relatedAnimeTags = ref([])
const relatedMangaTags = ref([])

// Collapsible role categories state
const roleCategories = ref({
  primary: false,    // collapsed by default
  secondary: false,  // collapsed by default
  technical: false   // collapsed by default
})

// Form data
const formData = ref({
  titre: '',
  titre_orig: '',
  titres_alternatifs: '',
  annee: new Date().getFullYear(),
  format: '',
  nb_ep: null,
  studio: '',
  licence: 0,
  titre_fr: '',
  official_site: '',
  doubleurs: '',
  synopsis: '',
  commentaire: '',
  image: '',
  statut: true
})

// Predefined roles based on the original form
const primaryRoles = [
  'Studio d\'animation',
  'Production',
  'Réalisation',
  'Chara-design',
  'Auteur',
  'Musique',
  'Diffuseur'
]

const secondaryRoles = [
  'Animation clé',
  'Art design',
  'Chara-design original',
  'Chara-design animation',
  'Décors',
  'Chef animateur',
  'Composition de la série',
  'Design work',
  'Directeur de l\'animation',
  'Directeur artistique',
  'Directeur d\'épisode',
  'Idée originale',
  'Illustrations originales',
  'Mecha-design',
  'Monster-design',
  'Planning',
  'Script',
  'Scénario',
  'Storyboard',
  'Supervision'
]

const technicalRoles = [
  'Assistance à la réalisation',
  'Couleurs',
  'Directeur de la photographie',
  'Directeur du son',
  'CGI',
  'Animation CGI',
  'Distribution',
  'Effets spéciaux',
  'Title Design',
  'Intervaliste',
  'Layout',
  'Mecha-design animation',
  'Montage',
  'Motion Design',
  'Producteur (staff)',
  'Producteur délégué',
  'Producteur exécutif',
  'Production manager',
  'Production de la musique',
  'Production du son',
  'Prop-design',
  'Scene-design',
  'Set design',
  'Studio d\'animation (sous-traitance)',
  'Animation',
  'Design'
]

// Computed property for filtered roles based on input
const allRoles = computed(() => {
  return [...primaryRoles, ...secondaryRoles, ...technicalRoles]
})

const filteredRoles = computed(() => {
  if (!customRole.value || customRole.value.length < 1) {
    return allRoles.value.slice(0, 10) // Show first 10 roles when empty
  }
  
  const query = customRole.value.toLowerCase()
  return allRoles.value.filter(role => 
    role.toLowerCase().includes(query)
  ).slice(0, 10) // Limit to 10 results
})

// Group staff by function for display
const groupedStaff = computed(() => {
  const groups = {}
  staffList.value.forEach(member => {
    const fonction = member.fonction || 'Non défini'
    if (!groups[fonction]) {
      groups[fonction] = []
    }
    groups[fonction].push(member)
  })
  return groups
})

// Load anime data
const loadAnime = async () => {
  if (isCreating) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/animes/${animeId}`, {
      headers: authStore.getAuthHeaders()
    })
    
    anime.value = response.data || response
    
    // Populate form data
    formData.value = {
      titre: anime.value.titre || '',
      titre_orig: anime.value.titre_orig || '',
      titres_alternatifs: anime.value.titres_alternatifs || '',
      annee: anime.value.annee || new Date().getFullYear(),
      format: anime.value.format || '',
      nb_ep: anime.value.nb_ep || null,
      studio: anime.value.studio || '',
      licence: anime.value.licence || 0,
      titre_fr: anime.value.titre_fr || '',
      official_site: anime.value.official_site || '',
      doubleurs: anime.value.doublage || '',  // Database column is 'doublage'
      synopsis: anime.value.synopsis || '',
      commentaire: anime.value.commentaire || '',
      image: anime.value.image || '',
      statut: Boolean(anime.value.statut)
    }
  } catch (err) {
    console.error('Load anime error:', err)
    if (err.response?.status === 404) {
      error.value = 'Anime non trouvé'
      // Redirect to anime list after a delay
      setTimeout(() => {
        navigateTo('/admin/animes')
      }, 3000)
    } else if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else {
      error.value = 'Erreur lors du chargement de l\'anime'
    }
  } finally {
    loading.value = false
  }
}

// Save anime
const saveAnime = async () => {
  if (!formData.value.titre) return
  
  saving.value = true
  
  try {
    // Create FormData for file upload
    const formDataToSend = new FormData()
    
    // Add all text fields
    formDataToSend.append('titre', formData.value.titre)
    formDataToSend.append('titre_orig', formData.value.titre_orig || '')
    formDataToSend.append('titres_alternatifs', formData.value.titres_alternatifs || '')
    formDataToSend.append('annee', parseInt(formData.value.annee))
    formDataToSend.append('format', formData.value.format || '')
    formDataToSend.append('nb_ep', formData.value.nb_ep ? parseInt(formData.value.nb_ep) : '')
    formDataToSend.append('studio', formData.value.studio || '')
    formDataToSend.append('licence', parseInt(formData.value.licence))
    formDataToSend.append('titre_fr', formData.value.licence == 1 ? formData.value.titre_fr : '')
    formDataToSend.append('official_site', formData.value.official_site || '')
    formDataToSend.append('doubleurs', formData.value.doubleurs || '')
    formDataToSend.append('synopsis', formData.value.synopsis || '')
    formDataToSend.append('commentaire', formData.value.commentaire || '')
    formDataToSend.append('statut', formData.value.statut ? 1 : 0)
    
    // Add existing image if no new file uploaded
    if (!uploadedFile.value && formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }
    
    // Add uploaded file if present
    if (uploadedFile.value) {
      formDataToSend.append('image', uploadedFile.value)
    }
    
    if (isCreating) {
      const response = await $fetch(`${API_BASE}/api/admin/animes`, {
        method: 'POST',
        headers: {
          ...authStore.getAuthHeaders(),
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formDataToSend
      })
      
      // Redirect to edit page for the new anime
      const newId = response.data?.id_anime || response.data?.id
      if (newId) {
        await navigateTo(`/admin/animes/${newId}/edit`)
      } else {
        await navigateTo('/admin/animes')
      }
    } else {
      await $fetch(`${API_BASE}/api/admin/animes/${animeId}`, {
        method: 'PUT',
        headers: {
          ...authStore.getAuthHeaders(),
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formDataToSend
      })
      
      // Clear uploaded file and reload
      uploadedFile.value = null
      imagePreview.value = ''
      await loadAnime()
    }
  } catch (err) {
    console.error('Save anime error:', err)
    if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else {
      error.value = err.response?.data?.error || 'Erreur lors de l\'enregistrement'
    }
  } finally {
    saving.value = false
  }
}

// Handle image preview update
const updateImagePreview = () => {
  imagePreview.value = formData.value.image
}

// Handle file upload
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
      return `/images/${formData.value.image}`
    }
  }
  return '/placeholder-anime.jpg'
}

// Handle image error
const handleImageError = (event) => {
  // Prevent infinite loop by checking current src
  if (event.target.src.endsWith('/placeholder-anime.jpg')) {
    // If placeholder also fails, show a data URL fallback
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjZjNmNGY2Ii8+CjxyZWN0IHg9IjcwIiB5PSI5MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNSIgZmlsbD0iI2Q1ZDhkYyIvPgo8cGF0aCBkPSJNODUgMTA1bDEwIDEwIDIwLTIwIDMwIDMwdjQwSDcwdi00MHoiIGZpbGw9IiNiYmJmYzMiLz4KPHRleHQgeD0iMTAwIiB5PSIyMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+QW5pbWUgSW1hZ2U8L3RleHQ+Cjx0ZXh0IHg9IjEwMCIgeT0iMjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPk5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+'
    return
  }
  // Otherwise, try the placeholder
  event.target.src = '/placeholder-anime.jpg'
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

const selectRole = (role) => {
  selectedRole.value = role
  customRole.value = role
}

const updateSelectedRole = () => {
  selectedRole.value = customRole.value
  highlightedIndex.value = -1
}

// Autocomplete methods
const selectRoleFromAutocomplete = (role) => {
  customRole.value = role
  selectedRole.value = role
  showAutocomplete.value = false
  highlightedIndex.value = -1
}

const hideAutocomplete = () => {
  // Use setTimeout to allow click events to fire first
  setTimeout(() => {
    showAutocomplete.value = false
    highlightedIndex.value = -1
  }, 150)
}

// Handle licence change
const onLicenceChange = () => {
  // Clear French title if anime is no longer licensed
  if (formData.value.licence == 0) {
    formData.value.titre_fr = ''
  }
}

const addStaffMember = async () => {
  if (!selectedBusiness.value || !selectedRole.value) return
  
  // If creating new anime, just add to local list
  if (isCreating) {
    staffList.value.push({
      business_id: selectedBusiness.value.id,
      business_name: selectedBusiness.value.nom,
      fonction: selectedRole.value,
      precisions: staffPrecisions.value
    })
    
    // Reset form
    selectedBusiness.value = null
    selectedRole.value = ''
    customRole.value = ''
    staffPrecisions.value = ''
    businessSearchQuery.value = ''
    return
  }
  
  addingStaff.value = true
  try {
    console.log('Adding staff member:', {
      animeId,
      business_id: selectedBusiness.value.id,
      fonction: selectedRole.value,
      precisions: staffPrecisions.value
    })
    
    await $fetch(`${API_BASE}/api/admin/animes/${animeId}/staff`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: {
        business_id: selectedBusiness.value.id,
        fonction: selectedRole.value,
        precisions: staffPrecisions.value || null
      }
    })
    
    // Add to local list
    staffList.value.push({
      business_id: selectedBusiness.value.id,
      business_name: selectedBusiness.value.nom,
      fonction: selectedRole.value,
      precisions: staffPrecisions.value
    })
    
    // Reset form
    selectedBusiness.value = null
    selectedRole.value = ''
    customRole.value = ''
    staffPrecisions.value = ''
    businessSearchQuery.value = ''
  } catch (err) {
    console.error('Add staff error:', err)
    if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 409) {
      error.value = 'Cette combinaison business/fonction existe déjà'
    } else {
      error.value = err.response?.data?.error || 'Erreur lors de l\'ajout du staff'
    }
  } finally {
    addingStaff.value = false
  }
}

const removeStaffMember = async (staffMember) => {
  if (isCreating) {
    // Remove from local list only
    const index = staffList.value.findIndex(s => 
      s.business_id === staffMember.business_id && s.fonction === staffMember.fonction
    )
    if (index > -1) {
      staffList.value.splice(index, 1)
    }
    return
  }
  
  try {
    await $fetch(`${API_BASE}/api/admin/animes/${animeId}/staff`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders(),
      body: {
        business_id: staffMember.business_id,
        fonction: staffMember.fonction
      }
    })
    
    // Remove from local list
    const index = staffList.value.findIndex(s => 
      s.business_id === staffMember.business_id && s.fonction === staffMember.fonction
    )
    if (index > -1) {
      staffList.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Remove staff error:', err)
    error.value = 'Erreur lors de la suppression du staff'
  }
}

const loadStaffList = async () => {
  if (isCreating) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/animes/${animeId}/staff`, {
      headers: authStore.getAuthHeaders()
    })
    staffList.value = response.data || []
  } catch (err) {
    console.error('Load staff error:', err)
  }
}

// Relations management methods
let relationSearchTimeout = null
const searchRelations = () => {
  clearTimeout(relationSearchTimeout)
  
  // Reset search attempted flag when starting new search
  if (!relationSearchQuery.value.trim()) {
    relationSearchResults.value = []
    searchAttempted.value = false
    selectedRelationTarget.value = null
    return
  }
  
  relationSearchTimeout = setTimeout(async () => {
    relationSearchLoading.value = true
    searchAttempted.value = true
    
    try {
      const response = await $fetch(`${API_BASE}/api/search`, {
        params: { 
          q: relationSearchQuery.value.trim(),
          type: selectedRelationType.value,
          limit: 10 // Limit autocomplete results
        }
      })
      
      // Map results to unified format and filter out current anime if needed
      let results = (response.data || []).map(item => ({
        id: item.id,
        titre: item.titre,
        annee: item.annee,
        image: item.image
      }))
      
      // Filter out current anime if searching for anime relations
      if (selectedRelationType.value === 'anime') {
        results = results.filter(item => item.id != animeId)
      }
      
      relationSearchResults.value = results
      showAutocomplete.value = results.length > 0
      highlightedIndex.value = -1
    } catch (err) {
      console.error('Relations search error:', err)
      relationSearchResults.value = []
      showAutocomplete.value = false
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
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1, 
        relationSearchResults.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectRelationTarget(relationSearchResults.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      relationSearchResults.value = []
      showAutocomplete.value = false
      highlightedIndex.value = -1
      break
  }
}

const clearSearch = () => {
  relationSearchQuery.value = ''
  relationSearchResults.value = []
  selectedRelationTarget.value = null
  searchAttempted.value = false
  showAutocomplete.value = false
  highlightedIndex.value = -1
}

const addRelation = async () => {
  if (!selectedRelationTarget.value || isCreating) return
  
  addingRelation.value = true
  try {
    const response = await $fetch(`${API_BASE}/api/admin/animes/${animeId}/relations`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: {
        target_type: selectedRelationType.value,
        target_id: selectedRelationTarget.value.id
      }
    })
    
    // Add to local list with the expected structure
    relationsList.value.push({
      id_relation: response.id_relation || Date.now(),
      type: selectedRelationType.value,
      titre: selectedRelationTarget.value.titre,
      image: selectedRelationTarget.value.image,
      [selectedRelationType.value === 'anime' ? 'id_anime' : 'id_manga']: selectedRelationTarget.value.id
    })
    
    // Reset form
    selectedRelationTarget.value = null
    relationSearchQuery.value = ''
    relationSearchResults.value = []
  } catch (err) {
    console.error('Add relation error:', err)
    if (err.response?.status === 400 && err.response?._data?.error?.includes('already exists')) {
      error.value = 'Cette relation existe déjà'
    } else {
      error.value = 'Erreur lors de l\'ajout de la relation'
    }
  } finally {
    addingRelation.value = false
  }
}

const removeRelation = async (relation) => {
  if (isCreating) {
    // Remove from local list only
    const index = relationsList.value.findIndex(r => 
      r.type === relation.type && 
      (r.id_anime === relation.id_anime || r.id_manga === relation.id_manga)
    )
    if (index > -1) {
      relationsList.value.splice(index, 1)
    }
    return
  }
  
  try {
    await $fetch(`${API_BASE}/api/admin/animes/${animeId}/relations/${relation.id_relation}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders()
    })
    
    // Remove from local list
    const index = relationsList.value.findIndex(r => r.id_relation === relation.id_relation)
    if (index > -1) {
      relationsList.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Remove relation error:', err)
    error.value = 'Erreur lors de la suppression de la relation'
  }
}

const loadRelationsList = async () => {
  if (isCreating) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/animes/${animeId}/relations`, {
      headers: authStore.getAuthHeaders()
    })
    
    // Transform API response to match frontend expectations
    relationsList.value = (response.data || []).map(relation => ({
      id_relation: relation.id_relation,
      target_type: relation.type,
      target_title: relation.titre,
      target_id: relation.type === 'anime' ? relation.id_anime : relation.id_manga,
      id_anime: relation.id_anime,
      id_manga: relation.id_manga
    }))
  } catch (err) {
    console.error('Load relations error:', err)
  }
}

// Screenshots management methods
const triggerFileInput = () => {
  screenshotFileInput.value?.click()
}

const handleScreenshotSelection = (event) => {
  const files = Array.from(event.target.files || [])
  processSelectedFiles(files)
}

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files || [])
  processSelectedFiles(files)
}

const processSelectedFiles = (files) => {
  const validFiles = []
  let totalSize = 0
  
  for (const file of files) {
    // Check file type
    if (!file.type.match(/^image\/(jpeg|jpg|gif|png)$/i)) {
      error.value = `Format non supporté: ${file.name}`
      continue
    }
    
    // Check file size (200KB max)
    if (file.size > 200 * 1024) {
      error.value = `Fichier trop lourd: ${file.name} (max 200Ko)`
      continue
    }
    
    totalSize += file.size
    validFiles.push(file)
  }
  
  // Check total size (1.6MB max)
  if (totalSize > 1.6 * 1024 * 1024) {
    error.value = 'Taille totale dépassée (max 1.6Mo)'
    return
  }
  
  // Create previews
  validFiles.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedScreenshots.value.push({
        file: file,
        name: file.name,
        size: file.size,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
  })
  
  error.value = ''
}

const removeSelectedFile = (index) => {
  selectedScreenshots.value.splice(index, 1)
}

const clearSelectedFiles = () => {
  selectedScreenshots.value = []
  if (screenshotFileInput.value) {
    screenshotFileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const uploadScreenshots = async () => {
  if (selectedScreenshots.value.length === 0 || isCreating) return
  
  uploadingScreenshots.value = true
  try {
    const formData = new FormData()
    
    selectedScreenshots.value.forEach((screenshot, index) => {
      formData.append(`screenshots`, screenshot.file)
    })
    
    const response = await $fetch(`${API_BASE}/api/admin/animes/${animeId}/screenshots`, {
      method: 'POST',
      headers: authStore.getAuthHeaders(),
      body: formData
    })
    
    // Add uploaded screenshots to local list
    if (response.data) {
      screenshotsList.value.push(...response.data)
    }
    
    // Clear selection
    clearSelectedFiles()
    
    // Refresh screenshots list
    await loadScreenshotsList()
  } catch (err) {
    console.error('Upload screenshots error:', err)
    error.value = 'Erreur lors de l\'upload des screenshots'
  } finally {
    uploadingScreenshots.value = false
  }
}

const deleteScreenshot = async (screenshot) => {
  if (isCreating) {
    // Remove from local list only
    const index = screenshotsList.value.findIndex(s => s.id_screen === screenshot.id_screen)
    if (index > -1) {
      screenshotsList.value.splice(index, 1)
    }
    return
  }
  
  try {
    await $fetch(`${API_BASE}/api/admin/animes/${animeId}/screenshots/${screenshot.id_screen}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders()
    })
    
    // Remove from local list
    const index = screenshotsList.value.findIndex(s => s.id_screen === screenshot.id_screen)
    if (index > -1) {
      screenshotsList.value.splice(index, 1)
    }
  } catch (err) {
    console.error('Delete screenshot error:', err)
    error.value = 'Erreur lors de la suppression du screenshot'
  }
}

const loadScreenshotsList = async () => {
  if (isCreating) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/animes/${animeId}/screenshots`, {
      headers: authStore.getAuthHeaders()
    })
    screenshotsList.value = response.data || []
  } catch (err) {
    console.error('Load screenshots error:', err)
  }
}

const handleScreenshotError = (event) => {
  event.target.src = '/placeholder-anime.jpg'
}

const openScreenshotModal = (screenshot) => {
  // TODO: Implement modal for viewing full-size screenshot
  window.open(`/images/${screenshot.filename}`, '_blank')
}

// Tags management methods
const searchTags = () => {
  if (!tagSearchQuery.value.trim()) {
    // Reset to all categories
    loadTagCategories()
    return
  }
  
  // Filter tags based on search query
  const filteredCategories = []
  tagCategories.value.forEach(category => {
    const filteredTags = category.tags.filter(tag => 
      tag.tag_name.toLowerCase().includes(tagSearchQuery.value.toLowerCase())

    )
    if (filteredTags.length > 0) {
      filteredCategories.push({
        name: category.name,
        tags: filteredTags
      })
    }
  })
  
  tagCategories.value = filteredCategories
}

const toggleTag = async (tag) => {
  const isSelected = isTagSelected(tag.id_tag)
  
  if (isSelected) {
    // Remove tag
    if (isCreating) {
      // Remove from local list only
      selectedTags.value = selectedTags.value.filter(t => t.id_tag !== tag.id_tag)
    } else {
      try {
        await $fetch(`${API_BASE}/api/admin/animes/${animeId}/tags/${tag.id_tag}`, {
          method: 'DELETE',
          headers: authStore.getAuthHeaders()
        })
        selectedTags.value = selectedTags.value.filter(t => t.id_tag !== tag.id_tag)
      } catch (err) {
        console.error('Remove tag error:', err)
        error.value = 'Erreur lors de la suppression du tag'
      }
    }
  } else {
    // Add tag
    if (isCreating) {
      // Add to local list only
      selectedTags.value.push(tag)
    } else {
      try {
        await $fetch(`${API_BASE}/api/admin/animes/${animeId}/tags`, {
          method: 'POST',
          headers: authStore.getAuthHeaders(),
          body: { tag_id: tag.id_tag }
        })
        selectedTags.value.push(tag)
      } catch (err) {
        console.error('Add tag error:', err)
        if (err.response?.status === 400 && err.response?._data?.error?.includes('already assigned')) {
          error.value = 'Ce tag est déjà assigné à cet anime'
        } else {
          error.value = 'Erreur lors de l\'ajout du tag'
        }
      }
    }
  }
}

const isTagSelected = (tagId) => {
  return selectedTags.value.some(tag => tag.id_tag === tagId)
}

const loadTagCategories = async () => {
  try {
    const response = await $fetch(`${API_BASE}/api/tags`)
    
    // Convert object to array format for easier handling
    const categories = []
    Object.keys(response.data).forEach(categoryName => {
      categories.push({
        name: categoryName,
        tags: response.data[categoryName]
      })
    })
    
    tagCategories.value = categories
  } catch (err) {
    console.error('Load tag categories error:', err)
  }
}

const loadAnimeTags = async () => {
  if (isCreating) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/animes/${animeId}/tags`)
    selectedTags.value = response.data || []
  } catch (err) {
    console.error('Load anime tags error:', err)
  }
}

const loadRelatedTags = async () => {
  if (isCreating) return
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/animes/${animeId}/related-tags`, {
      headers: authStore.getAuthHeaders()
    })
    relatedAnimeTags.value = response.animes || []
    relatedMangaTags.value = response.mangas || []
  } catch (err) {
    console.error('Load related tags error:', err)
  }
}

// Load data on mount
onMounted(() => {
  if (isAdmin.value) {
    loadAnime()
    loadStaffList()
    loadRelationsList()
    loadScreenshotsList()
    loadTagCategories()
    loadAnimeTags()
    loadRelatedTags()
  }
})

// Watch for admin status changes
watch(isAdmin, (newValue) => {
  if (newValue) {
    loadAnime()
    loadStaffList()
    loadRelationsList()
    loadScreenshotsList()
    loadTagCategories()
    loadAnimeTags()
    loadRelatedTags()
  } else {
    navigateTo('/login')
  }
})
</script>