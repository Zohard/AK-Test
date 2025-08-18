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
          Créer votre compte
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Ou
          <NuxtLink 
            to="/login" 
            class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            connectez-vous à votre compte existant
          </NuxtLink>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adresse email
            </label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="form-input"
              placeholder="votre@email.com"
              :class="{ 'border-red-500': errors.email }"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label for="pseudo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom d'utilisateur
            </label>
            <input
              id="pseudo"
              v-model="form.pseudo"
              name="pseudo"
              type="text"
              autocomplete="username"
              required
              class="form-input"
              placeholder="Votre pseudo"
              :class="{ 'border-red-500': errors.pseudo }"
            />
            <p v-if="errors.pseudo" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.pseudo }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              3-20 caractères, lettres, chiffres et _ uniquement
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
                autocomplete="new-password"
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
            
            <!-- Password strength indicator -->
            <div class="mt-2">
              <div class="flex space-x-1">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  class="h-1 flex-1 rounded"
                  :class="getPasswordStrengthColor(i)"
                ></div>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ getPasswordStrengthText() }}
              </p>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmer le mot de passe
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                name="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="form-input pr-10"
                placeholder="Confirmez votre mot de passe"
                :class="{ 'border-red-500': errors.confirmPassword }"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon 
                  :name="showConfirmPassword ? 'heroicons:eye-slash' : 'heroicons:eye'" 
                  class="h-5 w-5 text-gray-400" 
                />
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.confirmPassword }}
            </p>
          </div>
        </div>

        <!-- Terms and conditions -->
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="terms"
              v-model="form.acceptTerms"
              name="terms"
              type="checkbox"
              required
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              :class="{ 'border-red-500': errors.acceptTerms }"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="terms" class="text-gray-700 dark:text-gray-300">
              J'accepte les 
              <NuxtLink 
                to="/terms" 
                class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                target="_blank"
              >
                conditions d'utilisation
              </NuxtLink>
              et la 
              <NuxtLink 
                to="/privacy" 
                class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                target="_blank"
              >
                politique de confidentialité
              </NuxtLink>
            </label>
            <p v-if="errors.acceptTerms" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.acceptTerms }}
            </p>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="registerError" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                Erreur d'inscription
              </h3>
              <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                {{ registerError }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <Icon v-else name="heroicons:user-plus" class="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
            </span>
            {{ loading ? 'Création du compte...' : 'Créer mon compte' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'Inscription - Anime-Kun V2',
  meta: [
    { name: 'description', content: 'Créez votre compte Anime-Kun pour rejoindre la communauté' }
  ]
})

// Redirect if already authenticated
const authStore = useAuthStore()
const router = useRouter()

if (authStore.isAuthenticated) {
  await navigateTo('/')
}

// Form state
const form = reactive({
  email: '',
  pseudo: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const registerError = ref('')
const errors = reactive({
  email: '',
  pseudo: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
})

// Password strength calculation
const passwordStrength = computed(() => {
  const password = form.password
  let strength = 0
  
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return Math.min(strength, 4)
})

const getPasswordStrengthColor = (index: number) => {
  if (index <= passwordStrength.value) {
    switch (passwordStrength.value) {
      case 1: return 'bg-red-500'
      case 2: return 'bg-orange-500'
      case 3: return 'bg-yellow-500'
      case 4: return 'bg-green-500'
      default: return 'bg-gray-200 dark:bg-gray-700'
    }
  }
  return 'bg-gray-200 dark:bg-gray-700'
}

const getPasswordStrengthText = () => {
  switch (passwordStrength.value) {
    case 0: return 'Entrez un mot de passe'
    case 1: return 'Très faible'
    case 2: return 'Faible'
    case 3: return 'Moyen'
    case 4: return 'Fort'
    default: return ''
  }
}

// Form validation
const isFormValid = computed(() => {
  return form.email && 
         form.pseudo && 
         form.password && 
         form.confirmPassword && 
         form.acceptTerms &&
         form.password === form.confirmPassword &&
         passwordStrength.value >= 2
})

const validateForm = () => {
  errors.email = ''
  errors.pseudo = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.acceptTerms = ''
  
  let isValid = true
  
  // Email validation
  if (!form.email) {
    errors.email = 'L\'adresse email est requise'
    isValid = false
  } else if (!form.email.includes('@')) {
    errors.email = 'Adresse email invalide'
    isValid = false
  }
  
  // Pseudo validation
  if (!form.pseudo) {
    errors.pseudo = 'Le nom d\'utilisateur est requis'
    isValid = false
  } else if (form.pseudo.length < 3) {
    errors.pseudo = 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
    isValid = false
  } else if (form.pseudo.length > 20) {
    errors.pseudo = 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères'
    isValid = false
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.pseudo)) {
    errors.pseudo = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et _'
    isValid = false
  }
  
  // Password validation
  if (!form.password) {
    errors.password = 'Le mot de passe est requis'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    isValid = false
  } else if (passwordStrength.value < 2) {
    errors.password = 'Le mot de passe est trop faible'
    isValid = false
  }
  
  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Veuillez confirmer votre mot de passe'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    isValid = false
  }
  
  // Terms validation
  if (!form.acceptTerms) {
    errors.acceptTerms = 'Vous devez accepter les conditions d\'utilisation'
    isValid = false
  }
  
  return isValid
}

// Register handler
const handleRegister = async () => {
  if (!validateForm()) return
  
  loading.value = true
  registerError.value = ''
  
  try {
    await authStore.register({
      email: form.email,
      pseudo: form.pseudo,
      password: form.password,
      confirmPassword: form.confirmPassword
    })
    
    // Redirect to home page
    await navigateTo('/')
  } catch (error: any) {
    registerError.value = error.message || 'Une erreur est survenue lors de l\'inscription'
  } finally {
    loading.value = false
  }
}

const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}
</script>

<style scoped>
/* Custom styles for register page */
.form-input:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}
</style>