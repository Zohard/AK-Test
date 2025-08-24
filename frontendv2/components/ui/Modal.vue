<template>
  <!-- Modal overlay -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm px-4 py-6"
        @click.self="handleOverlayClick"
      >
        <!-- Modal container -->
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="show"
            :class="modalClasses"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="descriptionId"
          >
            <!-- Header -->
            <div
              v-if="$slots.header || title || showClose"
              :class="[
                'flex items-center justify-between p-6 border-b border-border',
                headerClass
              ]"
            >
              <div class="flex-1">
                <slot name="header">
                  <h2
                    v-if="title"
                    :id="titleId"
                    :class="[
                      'text-xl font-semibold text-text',
                      titleClass
                    ]"
                  >
                    {{ title }}
                  </h2>
                </slot>
              </div>
              
              <!-- Close button -->
              <button
                v-if="showClose"
                @click="handleClose"
                class="ml-4 p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text transition-colors duration-200"
                aria-label="Fermer"
              >
                <Icon name="heroicons:x-mark" size="md" />
              </button>
            </div>

            <!-- Body -->
            <div :class="['flex-1 overflow-y-auto', bodyClass]">
              <div :class="paddingClass">
                <slot>
                  <p
                    v-if="description"
                    :id="descriptionId"
                    class="text-text-secondary"
                  >
                    {{ description }}
                  </p>
                </slot>
              </div>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer || showDefaultFooter"
              :class="[
                'flex items-center justify-end gap-3 p-6 border-t border-border bg-background/50',
                footerClass
              ]"
            >
              <slot name="footer">
                <div v-if="showDefaultFooter" class="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    @click="handleCancel"
                  >
                    {{ cancelText }}
                  </Button>
                  <Button
                    :variant="confirmVariant"
                    :loading="loading"
                    @click="handleConfirm"
                  >
                    {{ confirmText }}
                  </Button>
                </div>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title?: string
  description?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  persistent?: boolean
  showClose?: boolean
  showDefaultFooter?: boolean
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning'
  loading?: boolean
  titleClass?: string
  headerClass?: string
  bodyClass?: string
  footerClass?: string
  containerClass?: string
  fullscreen?: boolean
  centered?: boolean
}

interface Emits {
  'update:show': [value: boolean]
  close: []
  confirm: []
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  persistent: false,
  showClose: true,
  showDefaultFooter: false,
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  confirmVariant: 'primary',
  loading: false,
  fullscreen: false,
  centered: true
})

const emit = defineEmits<Emits>()

// Generate unique IDs for accessibility
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)
const descriptionId = computed(() => `modal-description-${Math.random().toString(36).substr(2, 9)}`)

// Modal size configurations
const sizeConfig = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg', 
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  'full': 'max-w-full mx-4'
}

// Computed classes
const modalClasses = computed(() => {
  return [
    'relative w-full bg-surface rounded-2xl shadow-2xl border border-border',
    'flex flex-col max-h-[90vh]',
    props.fullscreen 
      ? 'h-full max-h-screen rounded-none' 
      : sizeConfig[props.size],
    props.containerClass
  ].filter(Boolean).join(' ')
})

const paddingClass = computed(() => {
  return props.bodyClass?.includes('p-') ? '' : 'p-6'
})

// Event handlers
const handleClose = () => {
  emit('update:show', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('update:show', false)
  emit('cancel')
}

const handleOverlayClick = () => {
  if (!props.persistent) {
    handleClose()
  }
}

// Keyboard handling
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.persistent) {
    handleClose()
  }
}

// Body scroll lock
const lockScroll = () => {
  document.body.style.overflow = 'hidden'
}

const unlockScroll = () => {
  document.body.style.overflow = ''
}

// Watchers and lifecycle
watch(() => props.show, (newValue) => {
  if (newValue) {
    lockScroll()
    document.addEventListener('keydown', handleKeydown)
  } else {
    unlockScroll()
    document.removeEventListener('keydown', handleKeydown)
  }
}, { immediate: true })

onUnmounted(() => {
  unlockScroll()
  document.removeEventListener('keydown', handleKeydown)
})

// Focus management
const focusFirstElement = () => {
  nextTick(() => {
    const modal = document.querySelector('[role="dialog"]') as HTMLElement
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusableElement = focusableElements[0] as HTMLElement
      if (firstFocusableElement) {
        firstFocusableElement.focus()
      }
    }
  })
}

watch(() => props.show, (newValue) => {
  if (newValue) {
    focusFirstElement()
  }
})
</script>

<style scoped>
/* Custom scrollbar for modal content */
.modal-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}

.modal-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.modal-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.modal-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

.modal-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-muted);
}

/* Glass morphism effect */
.modal-glass {
  backdrop-filter: blur(20px) saturate(180%);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

/* Enhanced shadow for better depth */
.modal-enhanced-shadow {
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Slide up animation for mobile */
@media (max-width: 640px) {
  .modal-slide-up-enter-active,
  .modal-slide-up-leave-active {
    transition: all 0.3s ease;
  }
  
  .modal-slide-up-enter-from {
    transform: translateY(100%);
    opacity: 0;
  }
  
  .modal-slide-up-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }
}
</style>