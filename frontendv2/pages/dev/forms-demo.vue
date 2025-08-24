<template>
  <div class="space-y-8">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold text-text">Form Components Demo</h1>
      <p class="text-text-secondary">Preview of Input, Select, Checkbox, and Radio components with common states.</p>
      <div v-if="!enabled" class="mt-2 p-4 rounded-lg border border-border bg-background">
        <div class="flex items-start gap-3">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p class="text-sm text-text">Playground is disabled.</p>
            <p class="text-xs text-text-muted">Set env var <code>ENABLE_PLAYGROUND=true</code> and restart dev server to enable this page.</p>
          </div>
        </div>
      </div>
    </header>

    <div v-if="enabled" class="space-y-10">
      <!-- Inputs -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-text">Inputs</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="font-medium mb-3">Default</h3>
            <Input v-model="inputValue" label="Username" placeholder="Enter username" help="3–20 characters" />
          </div>
          <div class="card">
            <h3 class="font-medium mb-3">With Icons</h3>
            <Input v-model="email" label="Email" type="email" placeholder="you@example.com">
              <template #left>
                <Icon name="heroicons:envelope" class="w-5 h-5" />
              </template>
              <template #right>
                <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-500" v-if="emailValid" />
              </template>
            </Input>
          </div>
          <div class="card">
            <h3 class="font-medium mb-3">Error State</h3>
            <Input v-model="password" label="Password" type="password" :error="passwordError" placeholder="Enter password" />
            <div class="mt-3">
              <Button size="sm" variant="secondary" @click="togglePasswordError">Toggle Error</Button>
            </div>
          </div>
          <div class="card">
            <h3 class="font-medium mb-3">Disabled</h3>
            <Input v-model="disabledText" label="Disabled" placeholder="Disabled input" disabled />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card"><h3 class="font-medium mb-3">Size: sm</h3><Input v-model="sizeSm" label="Small" size="sm" placeholder="Small" /></div>
          <div class="card"><h3 class="font-medium mb-3">Size: md</h3><Input v-model="sizeMd" label="Medium" size="md" placeholder="Medium" /></div>
          <div class="card"><h3 class="font-medium mb-3">Size: lg</h3><Input v-model="sizeLg" label="Large" size="lg" placeholder="Large" /></div>
        </div>
      </section>

      <!-- Selects -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-text">Selects</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="font-medium mb-3">Default</h3>
            <Select v-model="selected" label="Favorite Genre" :options="genres" placeholder="Choose a genre" />
          </div>
          <div class="card">
            <h3 class="font-medium mb-3">Error / Disabled</h3>
            <Select v-model="selectedError" label="Select with Error" :options="genres" :error="'Please select a value'" />
            <div class="mt-3">
              <Select v-model="selectedDisabled" label="Disabled" :options="genres" disabled />
            </div>
          </div>
        </div>
      </section>

      <!-- Checkbox & Radio -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-text">Checkbox & Radio</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="font-medium mb-3">Checkbox</h3>
            <div class="space-y-3">
              <Checkbox v-model="terms" label="I agree to the terms" :error="!terms && triedSubmit ? 'You must accept' : ''" />
              <Checkbox v-model="newsletter" label="Subscribe to newsletter" description="Get occasional product updates" />
              <div class="pt-2">
                <Button size="sm" @click="submitTerms">Submit</Button>
              </div>
            </div>
          </div>
          <div class="card">
            <h3 class="font-medium mb-3">Radio Group</h3>
            <div class="space-y-3">
              <Radio v-model="rating" name="rating" :value="1" label="PG" description="General audiences" />
              <Radio v-model="rating" name="rating" :value="2" label="PG-13" description="Parents strongly cautioned" />
              <Radio v-model="rating" name="rating" :value="3" label="R" description="Restricted" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Forms Demo'
})

const config = useRuntimeConfig()
const enabled = computed(() => !!config.public.enablePlayground)

// Inputs
const inputValue = ref('')
const email = ref('')
const emailValid = computed(() => /.+@.+\..+/.test(email.value))
const password = ref('')
const passwordError = ref('')
const disabledText = ref('')
const sizeSm = ref('')
const sizeMd = ref('')
const sizeLg = ref('')

const togglePasswordError = () => {
  passwordError.value = passwordError.value ? '' : 'Invalid password'
}

// Selects
const genres = [
  { label: 'Action', value: 'action' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Drama', value: 'drama' },
  { label: 'Fantasy', value: 'fantasy' },
]
const selected = ref('')
const selectedError = ref('')
const selectedDisabled = ref('')

// Checkbox & Radio
const terms = ref(false)
const newsletter = ref(true)
const triedSubmit = ref(false)
const rating = ref<number | string>(2)

const submitTerms = () => {
  triedSubmit.value = true
}
</script>

<style scoped>
.card {
  @apply rounded-lg p-6 shadow-sm bg-surface border border-border;
}
</style>

