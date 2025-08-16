<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title">Connexion</h1>
          <p v-if="ssoParams.sso && ssoParams.sig" class="login-subtitle">
            Connectez-vous pour accéder au forum
          </p>
          <p v-else class="login-subtitle">Connectez-vous à votre compte Anime-Kun</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">
              Nom d'utilisateur ou Email
            </label>
            <input
              id="username"
              v-model="credentials.username"
              type="text"
              class="form-input"
              :class="{ 'form-input-error': errors.username }"
              placeholder="Votre nom d'utilisateur ou email"
              required
              :disabled="loading"
            />
            <span v-if="errors.username" class="error-message">
              {{ errors.username }}
            </span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              Mot de passe
            </label>
            <div class="password-input-container">
              <input
                id="password"
                v-model="credentials.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                :class="{ 'form-input-error': errors.password }"
                placeholder="Votre mot de passe"
                required
                :disabled="loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
                :disabled="loading"
              >
                <span v-if="showPassword">🙈</span>
                <span v-else>👁️</span>
              </button>
            </div>
            <span v-if="errors.password" class="error-message">
              {{ errors.password }}
            </span>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input
                id="remember"
                v-model="credentials.remember"
                type="checkbox"
                class="form-checkbox"
                :disabled="loading"
              />
              <label for="remember" class="checkbox-label">
                Se souvenir de moi
              </label>
            </div>
          </div>

          <div v-if="errorMessage" class="error-alert">
            <span class="error-icon">⚠️</span>
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="success-alert">
            <span class="success-icon">✅</span>
            {{ successMessage }}
          </div>

          <button
            type="submit"
            class="login-button"
            :disabled="loading || !isFormValid"
            :class="{ 'login-button-loading': loading }"
          >
            <span v-if="loading" class="loading-spinner"></span>
            <span v-if="loading">Connexion en cours...</span>
            <span v-else>Se connecter</span>
          </button>
        </form>

        <div class="login-footer">
          <div class="login-links">
            <NuxtLink to="/register" class="auth-link">
              Créer un compte
            </NuxtLink>
            <span class="link-separator">•</span>
            <NuxtLink to="/forgot-password" class="auth-link">
              Mot de passe oublié ?
            </NuxtLink>
          </div>
          
          <div class="back-to-site">
            <NuxtLink to="/" class="back-link">
              ← Retour au site
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Page metadata
useHead({
  title: 'Connexion - Anime-Kun',
  meta: [
    { name: 'description', content: 'Connectez-vous à votre compte Anime-Kun' }
  ]
})

// API configuration
const config = useRuntimeConfig()
const API_BASE = config.public.apiBase

// Reactive data
const credentials = ref({
  username: '',
  password: '',
  remember: false
})

const errors = ref({})
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)
const showPassword = ref(false)

// Computed properties
const isFormValid = computed(() => {
  return credentials.value.username.trim() !== '' && 
         credentials.value.password.trim() !== ''
})

// Methods
const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
  errors.value = {}
}

const validateForm = () => {
  const newErrors = {}
  
  if (!credentials.value.username.trim()) {
    newErrors.username = 'Le nom d\'utilisateur ou email est requis'
  }
  
  if (!credentials.value.password.trim()) {
    newErrors.password = 'Le mot de passe est requis'
  } else if (credentials.value.password.length < 3) {
    newErrors.password = 'Le mot de passe doit contenir au moins 3 caractères'
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleLogin = async () => {
  clearMessages()
  
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  
  try {
    const response = await $fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: credentials.value.username.trim(),
        password: credentials.value.password
      })
    })
    
    if (response.token && response.user) {
      // Store authentication data
      const authStore = useAuthStore()
      await authStore.login(response.token, response.user)
      
      successMessage.value = 'Connexion réussie ! Redirection en cours...'
      
      // Redirect after successful login
      setTimeout(() => {
        // If SSO parameters exist, redirect to SSO endpoint
        if (ssoParams.value.sso && ssoParams.value.sig) {
          const ssoUrl = `${API_BASE}/sso?sso=${encodeURIComponent(ssoParams.value.sso)}&sig=${encodeURIComponent(ssoParams.value.sig)}`
          window.location.href = ssoUrl
        } else {
          navigateTo('/')
        }
      }, 1500)
    } else {
      errorMessage.value = 'Erreur lors de la connexion'
    }
  } catch (error) {
    console.error('Login error:', error)
    
    if (error.response?.status === 401) {
      errorMessage.value = 'Nom d\'utilisateur ou mot de passe incorrect'
    } else if (error.response?.status === 400) {
      const details = error.response.data?.details
      if (details && Array.isArray(details)) {
        const fieldErrors = {}
        details.forEach(detail => {
          if (detail.path) {
            fieldErrors[detail.path] = detail.msg
          }
        })
        errors.value = fieldErrors
      } else {
        errorMessage.value = 'Données de connexion invalides'
      }
    } else {
      errorMessage.value = 'Erreur de connexion. Veuillez réessayer.'
    }
  } finally {
    loading.value = false
  }
}

// SSO parameters from URL
const route = useRoute()
const ssoParams = computed(() => ({
  sso: route.query.sso,
  sig: route.query.sig
}))

// Check if user is already logged in
onMounted(() => {
  if (process.client) {
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      // If user is authenticated and there are SSO params, redirect to SSO
      if (ssoParams.value.sso && ssoParams.value.sig) {
        const ssoUrl = `${API_BASE}/sso?sso=${encodeURIComponent(ssoParams.value.sso)}&sig=${encodeURIComponent(ssoParams.value.sig)}`
        window.location.href = ssoUrl
        return
      }
      navigateTo('/')
    }
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: var(--surface-color);
  border-radius: 16px;
  box-shadow: var(--shadow-hover);
  padding: 2.5rem;
  animation: slideUp 0.5s ease-out;
  border: 1px solid var(--border-color);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
}

.login-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.95rem;
}

.login-form {
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
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--surface-color);
  color: var(--text-color);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background-color: var(--bg-secondary);
  cursor: not-allowed;
}

.form-input-error {
  border-color: #ef4444;
}

.password-input-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 1.2rem;
  transition: background-color 0.2s ease;
}

.password-toggle:hover:not(:disabled) {
  background-color: var(--bg-secondary);
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--accent-color);
}

.checkbox-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-alert, .success-alert {
  padding: 0.875rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-alert {
  background-color: var(--error-color);
  color: white;
  border: 1px solid var(--error-color);
}

.success-alert {
  background-color: var(--success-color);
  color: white;
  border: 1px solid var(--success-color);
}

.login-button {
  background: linear-gradient(135deg, var(--accent-color) 0%, #5a67d8 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-button-loading {
  background: #9ca3af;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.login-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.auth-link {
  color: var(--accent-color);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.auth-link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.link-separator {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.back-to-site {
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--text-color);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
  }
  
  .login-card {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 1.75rem;
  }
  
  .login-links {
    flex-direction: column;
    gap: 1rem;
  }
  
  .link-separator {
    display: none;
  }
}
</style>