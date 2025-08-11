<template>
  <div class="admin-dashboard">
    <!-- Page Header -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">Tableau de bord</h1>
      <p class="dashboard-subtitle">Vue d'ensemble de votre site Anime-Kun</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon">🎬</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_animes?.toLocaleString() || '0' }}</div>
          <div class="stat-label">Animes</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_mangas?.toLocaleString() || '0' }}</div>
          <div class="stat-label">Mangas</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_reviews?.toLocaleString() || '0' }}</div>
          <div class="stat-label">Critiques</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_users?.toLocaleString() || '0' }}</div>
          <div class="stat-label">Utilisateurs</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_articles?.toLocaleString() || '0' }}</div>
          <div class="stat-label">Articles</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🏢</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_business?.toLocaleString() || '0' }}</div>
          <div class="stat-label">Entreprises</div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement des statistiques...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="fetchDashboardData" class="retry-btn">
        Réessayer
      </button>
    </div>

    <!-- Recent Activity -->
    <div class="dashboard-section" v-if="recentActivity && recentActivity.length > 0">
      <h2 class="section-title">Activité récente</h2>
      <div class="activity-list">
        <div
          v-for="activity in recentActivity"
          :key="`${activity.type}-${activity.title}-${activity.date}`"
          class="activity-item"
        >
          <div class="activity-icon">
            {{ activity.type === 'review' ? '💬' : '📄' }}
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-meta">
              {{ activity.type === 'review' ? 'Nouvelle critique' : 'Nouvel article' }} • 
              {{ formatDate(activity.date) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="dashboard-section">
      <h2 class="section-title">Actions rapides</h2>
      <div class="quick-actions">
        <NuxtLink to="/admin/animes" class="quick-action-card">
          <div class="quick-action-icon">🎬</div>
          <div class="quick-action-content">
            <h3>Gérer les animes</h3>
            <p>Ajouter, modifier ou supprimer des animes</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/mangas" class="quick-action-card">
          <div class="quick-action-icon">📚</div>
          <div class="quick-action-content">
            <h3>Gérer les mangas</h3>
            <p>Ajouter, modifier ou supprimer des mangas</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/admin/business" class="quick-action-card">
          <div class="quick-action-icon">🏢</div>
          <div class="quick-action-content">
            <h3>Gérer les entreprises</h3>
            <p>Ajouter, modifier ou supprimer des entreprises</p>
          </div>
        </NuxtLink>

        <a href="/" target="_blank" class="quick-action-card">
          <div class="quick-action-icon">🌐</div>
          <div class="quick-action-content">
            <h3>Voir le site</h3>
            <p>Ouvrir le site public dans un nouvel onglet</p>
          </div>
        </a>
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
  title: 'Dashboard - Administration'
})

// Auth check
const authStore = useAuthStore()
const { isAdmin } = storeToRefs(authStore)

// API config
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase

// Reactive data
const stats = ref(null)
const recentActivity = ref([])
const loading = ref(true)
const error = ref('')

// Fetch dashboard data
const fetchDashboardData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch(`${API_BASE}/api/admin/dashboard`, {
      headers: authStore.getAuthHeaders()
    })
    
    stats.value = response.stats
    recentActivity.value = response.recent_activity || []
  } catch (err) {
    console.error('Dashboard fetch error:', err)
    if (err.response?.status === 403) {
      error.value = 'Accès non autorisé'
      await navigateTo('/login')
    } else if (err.response?.status === 401) {
      error.value = 'Session expirée'
      await authStore.logout()
      await navigateTo('/login')
    } else {
      error.value = 'Erreur lors du chargement des données'
    }
  } finally {
    loading.value = false
  }
}

// Format date utility
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// Fetch data on mount
onMounted(() => {
  if (isAdmin.value) {
    fetchDashboardData()
  }
})

// Watch for admin status changes
watch(isAdmin, (newValue) => {
  if (newValue) {
    fetchDashboardData()
  } else {
    navigateTo('/login')
  }
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.dashboard-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2.5rem;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  border-radius: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Loading and Error States */
.loading-state {
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

.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
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
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background: var(--accent-hover);
}

/* Dashboard Sections */
.dashboard-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1.5rem 0;
}

/* Recent Activity */
.activity-list {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.activity-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.quick-action-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.2s ease;
}

.quick-action-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
  border-color: var(--accent-color);
}

.quick-action-icon {
  font-size: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  border-radius: 1rem;
}

.quick-action-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
}

.quick-action-content p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    font-size: 2rem;
    width: 3rem;
    height: 3rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>