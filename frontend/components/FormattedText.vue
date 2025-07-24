<template>
  <div v-if="text" :class="['formatted-text', className]">
    <div 
      class="critique-content"
      v-html="finalText"
    />
    
    <button
      v-if="showReadMore && isTruncated"
      @click="toggleExpanded"
      class="read-more-btn"
      type="button"
    >
      {{ isExpanded ? 'Lire moins' : 'Lire plus' }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  className: {
    type: String,
    default: ''
  },
  maxLength: {
    type: Number,
    default: null
  },
  showReadMore: {
    type: Boolean,
    default: false
  }
})

const isExpanded = ref(false)

const truncatedText = computed(() => {
  if (!props.maxLength || props.text.length <= props.maxLength) {
    return props.text
  }
  
  const truncateAt = props.text.lastIndexOf(' ', props.maxLength)
  return props.text.substring(0, truncateAt > 0 ? truncateAt : props.maxLength) + '...'
})

const isTruncated = computed(() => {
  return props.maxLength && props.text.length > props.maxLength
})

const finalText = computed(() => {
  return (props.showReadMore && isTruncated.value && !isExpanded.value) 
    ? truncatedText.value 
    : props.text
})

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.formatted-text {
  line-height: 1.6;
}

.critique-content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.critique-content :deep(a:hover) {
  color: #1d4ed8;
}

.critique-content :deep(strong) {
  font-weight: 600;
}

.critique-content :deep(em) {
  font-style: italic;
}

.critique-content :deep(u) {
  text-decoration: underline;
}

.critique-content :deep(br) {
  margin-bottom: 0.5em;
}

.read-more-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: #2563eb;
  text-decoration: underline;
}

.read-more-btn:hover {
  color: #1d4ed8;
}
</style>