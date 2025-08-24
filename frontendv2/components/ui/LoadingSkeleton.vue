<template>
  <div :class="containerClasses">
    <!-- Card-like skeleton -->
    <div v-if="variant === 'card'" class="animate-pulse">
      <!-- Image placeholder -->
      <div class="bg-gray-200 dark:bg-gray-700 aspect-poster rounded-t-xl"></div>
      
      <!-- Content -->
      <div class="p-4 space-y-3">
        <!-- Title lines -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        
        <!-- Meta info -->
        <div class="flex space-x-4">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        
        <!-- Description lines -->
        <div class="space-y-2">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
        
        <!-- Action buttons -->
        <div class="flex justify-between items-center pt-2">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div class="flex space-x-2">
            <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- List item skeleton -->
    <div v-else-if="variant === 'list'" class="flex items-center space-x-4 animate-pulse">
      <div class="bg-gray-200 dark:bg-gray-700 rounded-lg w-16 h-20 flex-shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>
    
    <!-- Article skeleton -->
    <div v-else-if="variant === 'article'" class="animate-pulse">
      <!-- Featured image -->
      <div class="bg-gray-200 dark:bg-gray-700 aspect-banner rounded-xl mb-6"></div>
      
      <!-- Content -->
      <div class="space-y-4">
        <!-- Title -->
        <div class="space-y-2">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        
        <!-- Meta -->
        <div class="flex space-x-6">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
        
        <!-- Excerpt -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
        </div>
      </div>
    </div>
    
    <!-- Text-only skeleton -->
    <div v-else-if="variant === 'text'" class="animate-pulse">
      <div class="space-y-2">
        <div 
          v-for="line in lines" 
          :key="line"
          class="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          :class="{
            'w-full': line < lines,
            'w-3/4': line === lines
          }"
        ></div>
      </div>
    </div>
    
    <!-- Avatar skeleton -->
    <div v-else-if="variant === 'avatar'" class="animate-pulse">
      <div class="bg-gray-200 dark:bg-gray-700 rounded-full" :class="avatarSizeClasses"></div>
    </div>
    
    <!-- Button skeleton -->
    <div v-else-if="variant === 'button'" class="animate-pulse">
      <div class="bg-gray-200 dark:bg-gray-700 rounded-lg" :class="buttonSizeClasses"></div>
    </div>
    
    <!-- Custom skeleton -->
    <div v-else class="animate-pulse">
      <div class="bg-gray-200 dark:bg-gray-700 rounded" :style="{ width, height }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'card' | 'list' | 'article' | 'text' | 'avatar' | 'button' | 'custom'
  lines?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  width?: string
  height?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'custom',
  lines: 3,
  size: 'md',
  width: '100%',
  height: '1rem'
})

const containerClasses = computed(() => {
  const baseClasses = 'block'
  
  if (props.variant === 'card') {
    return `${baseClasses} bg-surface border border-border rounded-xl overflow-hidden shadow-sm`
  }
  
  if (props.variant === 'list') {
    return `${baseClasses} p-4`
  }
  
  return `${baseClasses} ${props.class || ''}`
})

const avatarSizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizes[props.size]
})

const buttonSizeClasses = computed(() => {
  const sizes = {
    xs: 'h-6 w-16',
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
    xl: 'h-14 w-40'
  }
  return sizes[props.size]
})
</script>

<style scoped>
/* Enhanced skeleton animation */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-pulse {
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.4) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.dark .animate-pulse {
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.1) 50%, 
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200px 100%;
}
</style>