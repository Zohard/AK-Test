<template>
  <div class="theme-toggle-wrapper" ref="toggleRef">
    <!-- Simple toggle button -->
    <button 
      v-if="!showDropdown"
      class="theme-toggle"
      @click="handleToggleClick"
      :aria-label="`Thème actuel: ${currentThemeLabel}. Cliquer pour changer.`"
      :title="`Thème: ${currentThemeLabel}`"
    >
      <span class="theme-icon" :class="{ 'animate-spin': !isHydrated }">
        {{ themeIcon }}
      </span>
    </button>

    <!-- Advanced dropdown toggle -->
    <div v-else class="theme-dropdown" :class="{ 'is-open': isDropdownOpen }">
      <button 
        class="theme-toggle dropdown-toggle"
        @click="toggleDropdown"
        :aria-label="`Sélecteur de thème. Thème actuel: ${currentThemeLabel}`"
        :aria-expanded="isDropdownOpen"
      >
        <span class="theme-icon" :class="{ 'animate-spin': !isHydrated }">
          {{ themeIcon }}
        </span>
        <span class="theme-label">{{ currentThemeLabel }}</span>
        <svg 
          class="dropdown-arrow" 
          :class="{ 'rotate-180': isDropdownOpen }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      <Transition 
        name="dropdown"
        enter-active-class="dropdown-enter-active"
        enter-from-class="dropdown-enter-from"
        enter-to-class="dropdown-enter-to"
        leave-active-class="dropdown-leave-active"
        leave-from-class="dropdown-leave-from"
        leave-to-class="dropdown-leave-to"
      >
        <div v-if="isDropdownOpen" class="theme-menu">
          <button
            v-for="mode in themeOptions"
            :key="mode.value"
            class="theme-option"
            :class="{ 'is-active': themeMode === mode.value }"
            @click="selectTheme(mode.value)"
            :aria-pressed="themeMode === mode.value"
          >
            <span class="option-icon">{{ mode.icon }}</span>
            <span class="option-label">{{ mode.label }}</span>
            <span class="option-description">{{ mode.description }}</span>
            <svg 
              v-if="themeMode === mode.value"
              class="check-icon"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  showDropdown: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

// Composables
const { 
  isDarkMode, 
  themeMode, 
  isHydrated,
  currentThemeLabel, 
  themeIcon,
  toggleTheme, 
  cycleTheme, 
  setThemeMode,
  THEME_MODES 
} = useDarkMode()

// Local state
const isDropdownOpen = ref(false)
const toggleRef = ref(null)

// Theme options for dropdown
const themeOptions = computed(() => [
  {
    value: THEME_MODES.LIGHT,
    label: 'Clair',
    description: 'Thème clair permanent',
    icon: '☀️'
  },
  {
    value: THEME_MODES.DARK,
    label: 'Sombre',
    description: 'Thème sombre permanent', 
    icon: '🌙'
  },
  {
    value: THEME_MODES.SYSTEM,
    label: 'Système',
    description: 'Suivre les préférences système',
    icon: '⚙️'
  }
])

// Methods
const handleToggleClick = () => {
  if (props.showDropdown) {
    toggleDropdown()
  } else {
    toggleTheme()
  }
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const selectTheme = (mode) => {
  setThemeMode(mode)
  isDropdownOpen.value = false
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (toggleRef.value && !toggleRef.value.contains(event.target)) {
    closeDropdown()
  }
}

// Close dropdown on escape key
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  if (props.showDropdown) {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
  }
})

onBeforeUnmount(() => {
  if (props.showDropdown) {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
  }
})

// Watch for dropdown prop changes
watch(() => props.showDropdown, (newVal) => {
  if (newVal) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
    isDropdownOpen.value = false
  }
})
</script>

<style scoped>
.theme-toggle-wrapper {
  position: relative;
  display: inline-block;
}

.theme-toggle {
  background: none;
  border: 2px solid var(--border-color);
  border-radius: 50px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.3s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 2.5rem;
  justify-content: center;
}

.theme-toggle:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.theme-toggle:active {
  transform: translateY(0);
}

.theme-icon {
  display: inline-block;
  transition: transform 0.3s ease;
  font-size: 1.1em;
}

.theme-icon.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.theme-label {
  font-weight: 500;
  white-space: nowrap;
}

.dropdown-toggle {
  min-width: auto;
  padding: 0.5rem 1rem;
}

.dropdown-arrow {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
  margin-left: 0.25rem;
}

.dropdown-arrow.rotate-180 {
  transform: rotate(180deg);
}

.theme-dropdown {
  position: relative;
}

.theme-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
  z-index: 1000;
}

.theme-option {
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
}

.theme-option:hover {
  background-color: var(--bg-color);
  color: var(--accent-color);
}

.theme-option.is-active {
  background-color: rgba(52, 152, 219, 0.1);
  color: var(--accent-color);
  font-weight: 500;
}

.option-icon {
  font-size: 1.1em;
  min-width: 1.5rem;
}

.option-label {
  font-weight: 500;
  flex: 1;
}

.option-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: block;
  margin-top: 0.1rem;
}

.check-icon {
  width: 1rem;
  height: 1rem;
  color: var(--accent-color);
}

/* Dropdown animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.95);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Size variants */
.theme-toggle-wrapper.small .theme-toggle {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.theme-toggle-wrapper.large .theme-toggle {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* Dark mode enhancements */
.dark-mode .theme-menu {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.dark-mode .theme-option:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Responsive */
@media (max-width: 768px) {
  .theme-menu {
    right: -1rem;
    left: -1rem;
    min-width: auto;
  }
  
  .theme-label {
    display: none;
  }
  
  .dropdown-toggle {
    min-width: 2.5rem;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .theme-toggle,
  .theme-icon,
  .dropdown-arrow,
  .theme-option {
    transition: none;
  }
  
  .theme-icon.animate-spin {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .theme-toggle {
    border-width: 3px;
  }
  
  .theme-menu {
    border-width: 2px;
  }
}
</style>