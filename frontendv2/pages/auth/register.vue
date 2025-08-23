<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Already have an account?
          <NuxtLink to="/auth/login" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign in here
          </NuxtLink>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="pseudo" class="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="pseudo"
              v-model="form.pseudo"
              name="pseudo"
              type="text"
              autocomplete="username"
              required
              :class="[
                'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
                errors.pseudo ? 'border-red-300 text-red-900' : 'border-gray-300'
              ]"
              placeholder="Choose a username (3-20 characters)"
              :disabled="loading"
            />
            <p v-if="errors.pseudo" class="mt-1 text-sm text-red-600">
              {{ errors.pseudo }}
            </p>
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              :class="[
                'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
                errors.email ? 'border-red-300 text-red-900' : 'border-gray-300'
              ]"
              placeholder="Enter your email address"
              :disabled="loading"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">
              {{ errors.email }}
            </p>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              :class="[
                'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
                errors.password ? 'border-red-300 text-red-900' : 'border-gray-300'
              ]"
              placeholder="Choose a strong password (8+ characters)"
              :disabled="loading"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">
              {{ errors.password }}
            </p>
            <div class="mt-1 text-xs text-gray-500">
              Password strength:
              <span :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
            </div>
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              :class="[
                'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
                errors.confirmPassword ? 'border-red-300 text-red-900' : 'border-gray-300'
              ]"
              placeholder="Confirm your password"
              :disabled="loading"
            />
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">
              {{ errors.confirmPassword }}
            </p>
          </div>
        </div>
        
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="agreeToTerms"
              v-model="form.agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              required
              :class="[
                'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
                errors.agreeToTerms ? 'border-red-300' : ''
              ]"
              :disabled="loading"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="agreeToTerms" :class="errors.agreeToTerms ? 'text-red-600' : 'text-gray-700'">
              I agree to the 
              <NuxtLink to="/legal/terms" class="font-medium text-blue-600 hover:text-blue-500 transition-colors" target="_blank">
                Terms of Service
              </NuxtLink>
              and
              <NuxtLink to="/legal/privacy" class="font-medium text-blue-600 hover:text-blue-500 transition-colors" target="_blank">
                Privacy Policy
              </NuxtLink>
            </label>
            <p v-if="errors.agreeToTerms" class="mt-1 text-red-600">
              {{ errors.agreeToTerms }}
            </p>
          </div>
        </div>
        
        <div v-if="generalError" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Registration Failed
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ generalError }}
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
            <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-blue-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? 'Creating account...' : 'Create account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RegisterData } from '~/composables/useAuthAPI'

// Set page metadata
useHead({
  title: 'Create Account - Reviews',
  meta: [
    { name: 'description', content: 'Create a new account to write and share anime and manga reviews.' }
  ]
})

// Define page layout
definePageMeta({
  layout: 'auth',
  middleware: 'guest' // Redirect if already authenticated
})

// Auth composable
const { register, loading } = useAuthAPI()

// Form state
const form = reactive<RegisterData>({
  pseudo: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
})

// Error handling
const errors = reactive({
  pseudo: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: ''
})
const generalError = ref('')

// Password strength calculation
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0
  
  let strength = 0
  
  // Length
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  
  // Character types
  if (/[a-z]/.test(password)) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[0-9]/.test(password)) strength += 1
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1
  
  return Math.min(strength, 5)
})

const passwordStrengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1: return 'Very Weak'
    case 2: return 'Weak'
    case 3: return 'Fair'
    case 4: return 'Good'
    case 5: return 'Strong'
    default: return 'Very Weak'
  }
})

const passwordStrengthClass = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1: return 'text-red-600'
    case 2: return 'text-orange-600'
    case 3: return 'text-yellow-600'
    case 4: return 'text-blue-600'
    case 5: return 'text-green-600'
    default: return 'text-red-600'
  }
})

// Form validation
const isFormValid = computed(() => {
  return form.pseudo.length >= 3 &&
    form.email.includes('@') &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword &&
    form.agreeToTerms
})

// Clear field errors when user types
const clearFieldError = (field: keyof typeof errors) => {
  errors[field] = ''
  generalError.value = ''
}

watch(() => form.pseudo, () => clearFieldError('pseudo'))
watch(() => form.email, () => clearFieldError('email'))
watch(() => form.password, () => clearFieldError('password'))
watch(() => form.confirmPassword, () => clearFieldError('confirmPassword'))
watch(() => form.agreeToTerms, () => clearFieldError('agreeToTerms'))

// Form validation
const validateForm = (): boolean => {
  let isValid = true
  
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
  generalError.value = ''
  
  // Username validation
  if (!form.pseudo) {
    errors.pseudo = 'Username is required'
    isValid = false
  } else if (form.pseudo.length < 3) {
    errors.pseudo = 'Username must be at least 3 characters'
    isValid = false
  } else if (form.pseudo.length > 20) {
    errors.pseudo = 'Username must be 20 characters or less'
    isValid = false
  } else if (!/^[a-zA-Z0-9_-]+$/.test(form.pseudo)) {
    errors.pseudo = 'Username can only contain letters, numbers, underscores, and hyphens'
    isValid = false
  }
  
  // Email validation
  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }
  
  // Password validation
  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  }
  
  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }
  
  // Terms agreement validation
  if (!form.agreeToTerms) {
    errors.agreeToTerms = 'You must agree to the terms and conditions'
    isValid = false
  }
  
  return isValid
}

// Handle registration submission
const handleRegister = async () => {
  if (!validateForm()) return
  
  try {
    const response = await register(form)
    
    if (!response.success && response.error) {
      // Handle field-specific errors
      if (response.error.field && response.error.field in errors) {
        errors[response.error.field as keyof typeof errors] = response.error.message
      } else {
        generalError.value = response.error.message
      }
    }
  } catch (err: any) {
    generalError.value = err.message || 'An unexpected error occurred'
  }
}

// Auto-focus username field on mount
onMounted(() => {
  const usernameInput = document.getElementById('pseudo')
  usernameInput?.focus()
})
</script>