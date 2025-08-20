<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="mx-auto h-12 w-12 flex items-center justify-center">
          <img 
            src="/logo.svg" 
            alt="Anime-Kun" 
            class="h-12 w-12"
            @error="hideImage"
          />
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Connexion à votre compte
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Ou
          <NuxtLink 
            to="/register" 
            class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            créez un nouveau compte
          </NuxtLink>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="emailOrUsername" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email ou nom d'utilisateur
            </label>
            <input
              id="emailOrUsername"
              v-model="form.emailOrUsername"
              name="emailOrUsername"
              type="text"
              autocomplete="username"
              required
              class="form-input"
              placeholder="votre@email.com ou votre nom d'utilisateur"
              :class="{ 'border-red-500': errors.emailOrUsername }"
            />
            <p v-if="errors.emailOrUsername" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.emailOrUsername }}
            </p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="form-input pr-10"
                placeholder="Votre mot de passe"
                :class="{ 'border-red-500': errors.password }"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon 
                  :name="showPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" 
                  class="h-5 w-5 text-gray-400" 
                />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              name="remember-me"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-white">
              Se souvenir de moi
            </label>
          </div>

          <div class="text-sm">
            <NuxtLink 
              to="/forgot-password" 
              class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Mot de passe oublié ?
            </NuxtLink>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="loginError" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                Erreur de connexion
              </h3>
              <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                {{ loginError }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <Icon v-else name="heroicons:lock-closed" class="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
            </span>
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </div>

        <!-- Social login (placeholder for future) -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Ou continuez avec
              </span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled
            >
              <span class="sr-only">Se connecter avec Google</span>
              <Icon name="heroicons:globe-alt" class="w-5 h-5" />
            </button>

            <button
              type="button"
              class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled
            >
              <span class="sr-only">Se connecter avec Discord</span>
              <Icon name="heroicons:chat-bubble-left" class="w-5 h-5" />
            </button>
          </div>
          <p class="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Connexions sociales disponibles prochainement
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'Connexion - Anime-Kun V2',
  meta: [
    { name: 'description', content: 'Connectez-vous à votre compte Anime-Kun' }
  ]
})

// Redirect if already authenticated
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

if (authStore.isAuthenticated) {
  await navigateTo(route.query.redirect as string || '/')
}

// Form state
const form = reactive({
  emailOrUsername: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const loading = ref(false)
const loginError = ref('')
const errors = reactive({
  emailOrUsername: '',
  password: ''
})

// Helper function to check if input is email
const isEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Validation
const validateForm = () => {
  errors.emailOrUsername = ''
  errors.password = ''
  
  if (!form.emailOrUsername) {
    errors.emailOrUsername = 'L\'email ou nom d\'utilisateur est requis'
    return false
  }
  
  // If it looks like an email, validate email format
  if (form.emailOrUsername.includes('@') && !isEmail(form.emailOrUsername)) {
    errors.emailOrUsername = 'Format d\'email invalide'
    return false
  }
  
  // If it's not an email, it should be a username (minimum 3 characters)
  if (!form.emailOrUsername.includes('@') && form.emailOrUsername.length < 3) {
    errors.emailOrUsername = 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
    return false
  }
  
  if (!form.password) {
    errors.password = 'Le mot de passe est requis'
    return false
  }
  
  if (form.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    return false
  }
  
  return true
}

// Login handler
const handleLogin = async () => {
  if (!validateForm()) return
  
  loading.value = true
  loginError.value = ''
  
  try {
    // Send emailOrUsername field as expected by the API
    const credentials: any = {
      emailOrUsername: form.emailOrUsername,
      password: form.password
    }
    
    await authStore.login(credentials)
    
    // Redirect to intended page or home
    const redirectTo = route.query.redirect as string || '/'
    await navigateTo(redirectTo)
  } catch (error: any) {
    loginError.value = error.message || 'Une erreur est survenue lors de la connexion'
  } finally {
    loading.value = false
  }
}

const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

// Auto-fill for development (remove in production)
if (process.dev) {
  onMounted(() => {
    // Uncomment for testing
    // form.emailOrUsername = 'test@example.com' // or 'username'
    // form.password = 'password123'
  })
}
</script>

<style scoped>
/* Custom styles for login page */
.form-input:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}
</style>