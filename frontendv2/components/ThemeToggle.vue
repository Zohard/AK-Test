<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    :title="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
  >
    <Icon 
      :name="isDark ? 'heroicons:sun' : 'heroicons:moon'" 
      class="w-5 h-5" 
    />
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>