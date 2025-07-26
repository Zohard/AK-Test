<template>
  <div class="admin-layout">
    <!-- Admin Header -->
    <header class="admin-header">
      <div class="admin-header-container">
        <div class="admin-header-left">
          <NuxtLink to="/" class="admin-logo">
            <span class="admin-logo-icon">🎌</span>
            <span class="admin-logo-text">Anime-Kun Admin</span>
          </NuxtLink>
        </div>
        
        <div class="admin-header-right">
          <div class="admin-user-info">
            <span class="admin-user-name">{{ user?.username || 'Admin' }}</span>
            <button @click="handleLogout" class="admin-logout-btn">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="admin-content">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar">
        <nav class="admin-nav">
          <div class="admin-nav-section">
            <h3 class="admin-nav-title">Tableau de bord</h3>
            <ul class="admin-nav-list">
              <li>
                <NuxtLink to="/admin/dashboard" class="admin-nav-link">
                  <span class="admin-nav-icon">📊</span>
                  <span>Dashboard</span>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="admin-nav-section">
            <h3 class="admin-nav-title">Contenu</h3>
            <ul class="admin-nav-list">
              <li>
                <NuxtLink to="/admin/animes" class="admin-nav-link">
                  <span class="admin-nav-icon">🎬</span>
                  <span>Animes</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/admin/mangas" class="admin-nav-link">
                  <span class="admin-nav-icon">📚</span>
                  <span>Mangas</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/admin/business" class="admin-nav-link">
                  <span class="admin-nav-icon">🏢</span>
                  <span>Entreprises</span>
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="admin-nav-section">
            <h3 class="admin-nav-title">Site</h3>
            <ul class="admin-nav-list">
              <li>
                <NuxtLink to="/" class="admin-nav-link" target="_blank">
                  <span class="admin-nav-icon">🌐</span>
                  <span>Voir le site</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
// Meta for admin pages
useHead({
  title: 'Administration - Anime-Kun',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

// Auth store
const authStore = useAuthStore()
const { user, isAdmin } = storeToRefs(authStore)

// Redirect if not admin
if (process.client) {
  watchEffect(() => {
    if (!authStore.isAuthenticated || !isAdmin.value) {
      navigateTo('/login')
    }
  })
}

// Logout handler
const handleLogout = async () => {
  await authStore.logout()
  navigateTo('/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: var(--bg-color);
}

/* Header */
.admin-header {
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: var(--shadow);
}

.admin-header-container {
  max-width: none;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-header-left {
  display: flex;
  align-items: center;
}

.admin-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 700;
  font-size: 1.125rem;
}

.admin-logo-icon {
  font-size: 1.5rem;
}

.admin-logo-text {
  color: var(--accent-color);
}

.admin-header-right {
  display: flex;
  align-items: center;
}

.admin-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-user-name {
  color: var(--text-secondary);
  font-weight: 500;
}

.admin-logout-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-logout-btn:hover {
  background-color: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

/* Content */
.admin-content {
  display: flex;
  min-height: calc(100vh - 80px);
}

/* Sidebar */
.admin-sidebar {
  width: 280px;
  background-color: var(--surface-color);
  border-right: 1px solid var(--border-color);
  padding: 2rem 0;
  overflow-y: auto;
}

.admin-nav {
  padding: 0 1.5rem;
}

.admin-nav-section {
  margin-bottom: 2rem;
}

.admin-nav-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.admin-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-bottom: 0.25rem;
}

.admin-nav-link:hover {
  background-color: var(--surface-hover);
  color: var(--accent-color);
}

.admin-nav-link.router-link-active {
  background-color: var(--accent-light);
  color: var(--accent-color);
}

.admin-nav-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
}

/* Main Content */
.admin-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-header-container {
    padding: 1rem;
  }
  
  .admin-sidebar {
    width: 240px;
  }
  
  .admin-main {
    padding: 1rem;
  }
  
  .admin-logo-text {
    display: none;
  }
}

@media (max-width: 640px) {
  .admin-content {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 0;
  }
  
  .admin-nav {
    padding: 0 1rem;
  }
  
  .admin-nav-section {
    margin-bottom: 1rem;
  }
  
  .admin-nav-link {
    padding: 0.5rem 0.75rem;
  }
}
</style>