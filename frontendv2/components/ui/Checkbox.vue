<template>
  <div :class="['flex items-start gap-3', disabled && 'opacity-60 cursor-not-allowed']">
    <div class="relative flex items-center">
      <input
        :id="computedId"
        type="checkbox"
        class="h-5 w-5 rounded-md border-border text-primary-600 focus:ring-primary-500/20 focus:ring-2 focus:outline-none"
        :checked="modelValue"
        :name="name || computedId"
        :disabled="disabled"
        :aria-invalid="(!!error).toString()"
        :aria-describedby="describedBy"
        @change="onChange"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
    </div>

    <label :for="computedId" class="flex-1 select-none">
      <span class="block text-sm font-medium text-text">
        <slot>{{ label }}</slot>
        <span v-if="required" class="text-red-500">*</span>
      </span>
      <p v-if="description" class="text-xs text-text-muted">{{ description }}</p>

      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-0.5"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-0.5"
      >
        <p v-if="error" :id="errorId" class="mt-1 text-xs text-red-600">{{ error }}</p>
      </Transition>
    </label>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean
  label?: string
  description?: string
  name?: string
  id?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'blur': [e: FocusEvent]
  'focus': [e: FocusEvent]
}>()

const uid = Math.random().toString(36).slice(2)
const computedId = computed(() => props.id || `checkbox-${uid}`)
const errorId = computed(() => `${computedId.value}-error`)
const describedBy = computed(() => props.error ? errorId.value : undefined)

const onChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .transition,
  .transition-all,
  .transition-colors {
    transition: none !important;
  }
}
</style>

