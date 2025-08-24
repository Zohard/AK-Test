<template>
  <span :class="badgeClasses">
    <!-- Icon (left) -->
    <Icon
      v-if="iconLeft"
      :name="iconLeft"
      :size="iconSize"
      :variant="iconVariant"
      class="mr-1.5"
    />
    
    <!-- Content -->
    <span v-if="$slots.default" :class="contentClasses">
      <slot />
    </span>
    
    <!-- Icon (right) -->
    <Icon
      v-if="iconRight"
      :name="iconRight"
      :size="iconSize"
      :variant="iconVariant"
      class="ml-1.5"
    />
    
    <!-- Close button -->
    <button
      v-if="dismissible"
      @click="handleDismiss"
      class="ml-1.5 -mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
    >
      <Icon name="heroicons:x-mark" size="xs" />
    </button>
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  rounded?: boolean
  pill?: boolean
  dot?: boolean
  pulse?: boolean
  iconLeft?: string
  iconRight?: string
  iconVariant?: 'solid' | 'outline' | 'mini'
  dismissible?: boolean
}

interface Emits {
  dismiss: []
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  rounded: false,
  pill: false,
  dot: false,
  pulse: false,
  iconVariant: 'outline',
  dismissible: false
})

const emit = defineEmits<Emits>()

// Size configurations
const sizeConfig = {
  xs: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    iconSize: 'xs' as const,
    dotSize: 'w-1.5 h-1.5'
  },
  sm: {
    padding: 'px-2.5 py-1',
    text: 'text-xs',
    iconSize: 'xs' as const,
    dotSize: 'w-2 h-2'
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    iconSize: 'sm' as const,
    dotSize: 'w-2.5 h-2.5'
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    iconSize: 'sm' as const,
    dotSize: 'w-3 h-3'
  }
}

// Variant configurations
const variantConfig = {
  default: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-transparent'
  },
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    text: 'text-primary-700 dark:text-primary-300',
    border: 'border-transparent'
  },
  secondary: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-transparent'
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-transparent'
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-transparent'
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-transparent'
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-transparent'
  },
  outline: {
    bg: 'bg-transparent',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border border-gray-300 dark:border-gray-600'
  }
}

// Computed classes
const badgeClasses = computed(() => {
  const size = sizeConfig[props.size]
  const variant = variantConfig[props.variant]
  
  return [
    // Base styles
    'inline-flex items-center font-medium',
    
    // Size styles
    size.padding,
    size.text,
    
    // Variant styles
    variant.bg,
    variant.text,
    variant.border,
    
    // Shape styles
    props.pill ? 'rounded-full' : props.rounded ? 'rounded-lg' : 'rounded-md',
    
    // Animation
    props.pulse && 'animate-pulse',
    
    // Transition
    'transition-colors duration-200'
  ].filter(Boolean).join(' ')
})

const contentClasses = computed(() => {
  return props.dot ? 'sr-only' : ''
})

const iconSize = computed(() => sizeConfig[props.size].iconSize)

const handleDismiss = () => {
  emit('dismiss')
}

// Dot variant styles
const dotClasses = computed(() => {
  if (!props.dot) return ''
  
  const size = sizeConfig[props.size].dotSize
  const variant = variantConfig[props.variant]
  
  return [
    'rounded-full',
    size,
    variant.bg.replace('bg-', 'bg-opacity-100 bg-'),
    props.pulse && 'animate-pulse'
  ].filter(Boolean).join(' ')
})
</script>

<style scoped>
/* Additional badge styles for enhanced visual appeal */
.badge-glow {
  box-shadow: 0 0 20px currentColor;
  filter: drop-shadow(0 0 10px currentColor);
}

.badge-gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.badge-gradient-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.badge-gradient-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.badge-gradient-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

/* Notification dot positioning */
.badge-notification {
  position: relative;
}

.badge-notification::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}

/* Animated pulse for special badges */
@keyframes badge-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-badge-pulse {
  animation: badge-pulse 2s ease-in-out infinite;
}
</style>