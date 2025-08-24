<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :href="tag === 'a' ? href : undefined"
    :to="tag === 'NuxtLink' ? to : undefined"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <Icon
      v-if="loading"
      name="heroicons:arrow-path"
      :size="iconSize"
      spin
      class="mr-2"
    />
    
    <!-- Icon (left) -->
    <Icon
      v-else-if="iconLeft"
      :name="iconLeft"
      :size="iconSize"
      :variant="iconVariant"
      class="mr-2"
    />
    
    <!-- Content -->
    <span v-if="$slots.default" :class="contentClasses">
      <slot />
    </span>
    
    <!-- Icon (right) -->
    <Icon
      v-if="iconRight && !loading"
      :name="iconRight"
      :size="iconSize"
      :variant="iconVariant"
      class="ml-2"
    />
  </component>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  href?: string
  to?: string
  external?: boolean
  iconLeft?: string
  iconRight?: string
  iconVariant?: 'solid' | 'outline' | 'mini'
  block?: boolean
  rounded?: boolean
}

interface Emits {
  click: [event: MouseEvent]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  iconVariant: 'outline',
  block: false,
  rounded: false
})

const emit = defineEmits<Emits>()

// Determine component tag
const tag = computed(() => {
  if (props.href && !props.external) return 'NuxtLink'
  if (props.href && props.external) return 'a'
  if (props.to) return 'NuxtLink'
  return 'button'
})

// Size configurations
const sizeConfig = {
  xs: {
    padding: 'px-2.5 py-1.5',
    text: 'text-xs',
    iconSize: 'xs' as const,
    minHeight: 'min-h-[28px]'
  },
  sm: {
    padding: 'px-3 py-2',
    text: 'text-sm',
    iconSize: 'sm' as const,
    minHeight: 'min-h-[32px]'
  },
  md: {
    padding: 'px-4 py-2.5',
    text: 'text-sm',
    iconSize: 'sm' as const,
    minHeight: 'min-h-[38px]'
  },
  lg: {
    padding: 'px-6 py-3',
    text: 'text-base',
    iconSize: 'md' as const,
    minHeight: 'min-h-[44px]'
  },
  xl: {
    padding: 'px-8 py-4',
    text: 'text-lg',
    iconSize: 'md' as const,
    minHeight: 'min-h-[52px]'
  }
}

// Variant configurations
const variantConfig = {
  primary: {
    base: 'bg-primary-600 text-white border-transparent shadow-sm',
    hover: 'hover:bg-primary-700 hover:shadow-md',
    active: 'active:bg-primary-800',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    disabled: 'disabled:bg-primary-300 disabled:cursor-not-allowed'
  },
  secondary: {
    base: 'bg-surface text-text border-border',
    hover: 'hover:bg-surface-hover hover:shadow-md',
    active: 'active:bg-gray-100 dark:active:bg-gray-800',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    disabled: 'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed'
  },
  outline: {
    base: 'bg-transparent text-primary-600 border-primary-600',
    hover: 'hover:bg-primary-50 dark:hover:bg-primary-950',
    active: 'active:bg-primary-100 dark:active:bg-primary-900',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    disabled: 'disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed'
  },
  ghost: {
    base: 'bg-transparent text-text border-transparent',
    hover: 'hover:bg-surface-hover',
    active: 'active:bg-gray-100 dark:active:bg-gray-800',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    disabled: 'disabled:text-gray-400 disabled:cursor-not-allowed'
  },
  danger: {
    base: 'bg-red-600 text-white border-transparent shadow-sm',
    hover: 'hover:bg-red-700 hover:shadow-md',
    active: 'active:bg-red-800',
    focus: 'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    disabled: 'disabled:bg-red-300 disabled:cursor-not-allowed'
  },
  success: {
    base: 'bg-green-600 text-white border-transparent shadow-sm',
    hover: 'hover:bg-green-700 hover:shadow-md',
    active: 'active:bg-green-800',
    focus: 'focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
    disabled: 'disabled:bg-green-300 disabled:cursor-not-allowed'
  },
  warning: {
    base: 'bg-amber-600 text-white border-transparent shadow-sm',
    hover: 'hover:bg-amber-700 hover:shadow-md',
    active: 'active:bg-amber-800',
    focus: 'focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
    disabled: 'disabled:bg-amber-300 disabled:cursor-not-allowed'
  }
}

// Computed classes
const buttonClasses = computed(() => {
  const size = sizeConfig[props.size]
  const variant = variantConfig[props.variant]
  
  return [
    // Base styles
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'border focus:outline-none focus:ring-offset-white dark:focus:ring-offset-gray-900',
    
    // Size styles
    size.padding,
    size.text,
    size.minHeight,
    
    // Variant styles
    variant.base,
    !props.disabled && !props.loading && variant.hover,
    !props.disabled && !props.loading && variant.active,
    !props.disabled && !props.loading && variant.focus,
    (props.disabled || props.loading) && variant.disabled,
    
    // Shape styles
    props.rounded ? 'rounded-full' : 'rounded-lg',
    
    // Block styles
    props.block && 'w-full',
    
    // Loading styles
    props.loading && 'cursor-wait',
    
    // Disabled styles
    props.disabled && 'opacity-60'
  ].filter(Boolean).join(' ')
})

const contentClasses = computed(() => {
  return props.loading ? 'opacity-70' : ''
})

const iconSize = computed(() => sizeConfig[props.size].iconSize)

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
/* Additional styles for enhanced interactions */
.btn-gradient {
  background: var(--gradient-button);
}

.btn-glass {
  backdrop-filter: blur(16px) saturate(180%);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

/* Hover effects */
@keyframes button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.animate-press {
  animation: button-press 0.15s ease-in-out;
}
</style>