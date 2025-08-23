<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <NuxtLink to="/auth/register" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            create a new account
          </NuxtLink>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
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
              placeholder="Enter your email"
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
              autocomplete="current-password"
              required
              :class="[
                'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
                errors.password ? 'border-red-300 text-red-900' : 'border-gray-300'
              ]"
              placeholder="Enter your password"
              :disabled="loading"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">
              {{ errors.password }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              name="remember"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              :disabled="loading"
            />
            <label for="remember" class="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          
          <div class="text-sm">
            <NuxtLink to="/auth/forgot-password" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Forgot your password?
            </NuxtLink>
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
                Login Failed
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
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-blue-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoginCredentials } from '~/composables/useAuthAPI'

// Set page metadata
useHead({
  title: 'Sign In - Reviews',
  meta: [
    { name: 'description', content: 'Sign in to your account to create and manage anime and manga reviews.' }
  ]
})

// Define page layout
definePageMeta({
  layout: 'auth',
  middleware: 'guest' // Redirect if already authenticated
})

// Auth composable
const { login, loading, error } = useAuthAPI()

// Form state
const form = reactive<LoginCredentials>({
  email: '',
  password: '',
  remember: false
})

// Error handling
const errors = reactive({
  email: '',
  password: ''
})
const generalError = ref('')

// Clear field errors when user types
watch(() => form.email, () => {
  errors.email = ''
  generalError.value = ''
})

watch(() => form.password, () => {
  errors.password = ''
  generalError.value = ''
})

// Form validation
const validateForm = (): boolean => {
  let isValid = true
  
  // Reset errors
  errors.email = ''
  errors.password = ''
  generalError.value = ''
  
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
  }
  
  return isValid
}

// Handle login submission
const handleLogin = async () => {
  if (!validateForm()) return
  
  try {
    const response = await login(form)
    
    if (!response.success && response.error) {
      // Handle field-specific errors
      if (response.error.field) {
        errors[response.error.field as keyof typeof errors] = response.error.message
      } else {
        generalError.value = response.error.message
      }
    }
  } catch (err: any) {
    generalError.value = err.message || 'An unexpected error occurred'
  }
}

// Auto-focus email field on mount
onMounted(() => {
  const emailInput = document.getElementById('email')
  emailInput?.focus()
})
</script>