<template>
  <div class="review-rating">
    <!-- Display Mode -->
    <div v-if="mode === 'display'" class="flex items-center space-x-2">
      <div v-if="modelValue && modelValue > 0" class="flex items-center space-x-0.5">
        <Icon 
          v-for="star in maxStars" 
          :key="star"
          name="heroicons:star-solid" 
          :class="[
            starSize,
            star <= displayStars ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          ]"
        />
      </div>
      <span :class="['font-medium', textSize, 'text-gray-700 dark:text-gray-300']">
        {{ displayValue }}<span v-if="showMaxValue && modelValue && modelValue > 0" class="text-gray-500 dark:text-gray-400">/{{ maxValue }}</span>
      </span>
      <span v-if="showOriginalValue && originalValue && originalValue > 0 && originalValue !== displayValue" :class="['text-xs text-gray-500 dark:text-gray-400', showMaxValue ? '' : 'ml-1']">
        ({{ originalValue }}/10)
      </span>
    </div>

    <!-- Input Mode -->
    <div v-else-if="mode === 'input'" class="space-y-2">
      <div class="flex items-center space-x-1">
        <button
          v-for="star in maxStars"
          :key="star"
          type="button"
          @click="setRating(star)"
          @mouseenter="hoverRating = star"
          @mouseleave="hoverRating = 0"
          :class="[
            'transition-colors duration-150 hover:scale-110 transform',
            star <= (hoverRating || currentStars) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          ]"
        >
          <Icon 
            name="heroicons:star-solid" 
            :class="[starSize]"
          />
        </button>
        <span :class="['ml-2 font-medium', textSize, 'text-gray-700 dark:text-gray-300']">
          {{ inputValue || 0 }}/{{ maxValue }}
        </span>
      </div>
      <div v-if="showLabels" :class="['text-xs text-gray-500 dark:text-gray-400']">
        {{ getRatingLabel(inputValue) }}
      </div>
    </div>

    <!-- Compact Mode -->
    <div v-else-if="mode === 'compact'" class="flex items-center space-x-1">
      <Icon 
        :name="modelValue && modelValue > 0 ? 'heroicons:star-solid' : 'heroicons:star'" 
        :class="[
          starSize, 
          modelValue && modelValue > 0 ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        ]" 
      />
      <span :class="['font-medium', textSize, 'text-gray-700 dark:text-gray-300']">
        {{ displayValue }}
      </span>
    </div>

    <!-- Large Mode -->
    <div v-else-if="mode === 'large'" class="text-center space-y-2">
      <div v-if="modelValue && modelValue > 0" class="flex items-center justify-center space-x-1">
        <Icon 
          v-for="star in maxStars" 
          :key="star"
          name="heroicons:star-solid" 
          :class="[
            'w-8 h-8',
            star <= displayStars ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          ]"
        />
      </div>
      <div v-else class="flex items-center justify-center">
        <Icon name="heroicons:star" class="w-8 h-8 text-gray-300 dark:text-gray-600" />
      </div>
      <div>
        <div :class="['text-2xl font-bold text-gray-900 dark:text-white']">
          <span v-if="modelValue && modelValue > 0">{{ displayValue }}/{{ maxValue }}</span>
          <span v-else>{{ displayValue }}</span>
        </div>
        <div v-if="showOriginalValue && originalValue && originalValue > 0 && originalValue !== displayValue" class="text-sm text-gray-500 dark:text-gray-400">
          {{ originalValue }}/10 en détail
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Rating value (1-10 scale) */
  modelValue?: number
  /** Display mode */
  mode?: 'display' | 'input' | 'compact' | 'large'
  /** Maximum value for display (5 or 10) */
  maxValue?: number
  /** Maximum number of stars */
  maxStars?: number
  /** Show original 10-scale value */
  showOriginalValue?: boolean
  /** Show max value (e.g., "4.2/5") */
  showMaxValue?: boolean
  /** Show rating labels in input mode */
  showLabels?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

interface Emits {
  'update:modelValue': [value: number]
  'change': [value: number]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  mode: 'display',
  maxValue: 5,
  maxStars: 5,
  showOriginalValue: false,
  showMaxValue: true,
  showLabels: false,
  size: 'md'
})

const emit = defineEmits<Emits>()

// State for input mode
const hoverRating = ref(0)

// Computed properties
const inputValue = computed({
  get: () => props.modelValue,
  set: (value: number) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

const originalValue = computed(() => props.modelValue)

const displayValue = computed(() => {
  // Handle null, undefined, or 0 ratings
  if (!props.modelValue || props.modelValue === 0) {
    return 'Non noté'
  }
  
  if (props.maxValue === 5) {
    // Convert 10-scale to 5-scale
    return (props.modelValue / 2).toFixed(1)
  }
  return props.modelValue.toFixed(1)
})

const displayStars = computed(() => {
  // Don't show stars if no rating
  if (!props.modelValue || props.modelValue === 0) {
    return 0
  }
  
  if (props.maxValue === 5) {
    return Math.round(props.modelValue / 2)
  }
  return Math.round(props.modelValue / 2) // Always use 5-star display
})

const currentStars = computed(() => {
  if (props.maxValue === 5) {
    return Math.round(props.modelValue / 2)
  }
  return Math.round(props.modelValue / 2)
})

const starSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-3 h-3'
    case 'lg': return 'w-5 h-5'
    default: return 'w-4 h-4'
  }
})

const textSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-xs'
    case 'lg': return 'text-lg'
    default: return 'text-sm'
  }
})

// Methods
const setRating = (star: number) => {
  if (props.mode !== 'input') return
  
  // Convert 5-star rating to 10-scale
  const value = props.maxValue === 5 ? star * 2 : star
  inputValue.value = value
}

const getRatingLabel = (value?: number) => {
  if (!value) return 'Aucune note'
  
  const labels = {
    1: 'Très mauvais',
    2: 'Très mauvais',
    3: 'Mauvais',
    4: 'Mauvais', 
    5: 'Moyen',
    6: 'Moyen',
    7: 'Bien',
    8: 'Bien',
    9: 'Excellent',
    10: 'Excellent'
  }
  
  return labels[Math.round(value)] || 'Non noté'
}
</script>

<style scoped>
.review-rating {
  @apply inline-block;
}

/* Smooth hover transitions for interactive stars */
.review-rating button {
  @apply transition-all duration-150 ease-in-out;
}

.review-rating button:hover {
  @apply transform scale-110;
}

/* Prevent text selection on interactive elements */
.review-rating button {
  user-select: none;
  -webkit-user-select: none;
}
</style>