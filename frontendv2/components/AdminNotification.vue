<template>
  <Teleport to="body">
    <div v-if="isVisible" class="notification-container">
      <div 
        :class="[
          'notification',
          `notification-${type}`,
          { 'notification-entering': isEntering }
        ]"
      >
        <div class="notification-icon">
          <Icon 
            :name="getIcon(type)" 
            :class="[
              'w-5 h-5',
              type === 'success' ? 'text-green-600' : 
              type === 'error' ? 'text-red-600' : 
              type === 'warning' ? 'text-amber-600' : 'text-blue-600'
            ]" 
          />
        </div>
        
        <div class="notification-content">
          <h4 v-if="title" class="notification-title">{{ title }}</h4>
          <p class="notification-message">{{ message }}</p>
        </div>
        
        <button 
          class="notification-close" 
          @click="close"
          aria-label="Fermer"
        >
          <Icon name="heroicons:x-mark" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Props {
  type?: NotificationType
  title?: string
  message: string
  duration?: number
  persistent?: boolean
}

interface Emits {
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
  persistent: false
})

const emit = defineEmits<Emits>()

const isVisible = ref(true)
const isEntering = ref(true)

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'heroicons:check-circle'
    case 'error':
      return 'heroicons:x-circle'
    case 'warning':
      return 'heroicons:exclamation-triangle'
    default:
      return 'heroicons:information-circle'
  }
}

const close = () => {
  isVisible.value = false
  emit('close')
}

// Auto close after duration unless persistent
onMounted(() => {
  // Remove entering animation after a short delay
  setTimeout(() => {
    isEntering.value = false
  }, 100)

  // Auto close if not persistent
  if (!props.persistent && props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
  min-width: 320px;
  max-width: 480px;
  pointer-events: auto;
  animation: slideInRight 0.3s ease-out;
}

.notification-success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.notification-error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.notification-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.notification-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.notification-entering {
  animation: slideInRight 0.3s ease-out;
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.notification-message {
  font-size: 14px;
  color: #4b5563;
  margin: 0;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  color: #6b7280;
  background: rgba(0, 0, 0, 0.05);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>