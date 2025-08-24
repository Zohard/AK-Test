<template>
  <div class="w-full">
    <label v-if="label" :for="computedId" class="mb-1.5 block text-sm font-medium text-text">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div
      :class="[
        'relative rounded-lg border bg-surface transition-colors',
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary-400',
        error ? 'border-red-400 focus-within:ring-red-500/20' : 'border-border focus-within:ring-primary-500/20',
        'focus-within:border-primary-500 focus-within:ring-2'
      ]"
    >
      <select
        :id="computedId"
        :name="name || computedId"
        class="block w-full bg-transparent text-text outline-none appearance-none pr-10"
        :class="sizeClasses"
        :value="modelValue as any"
        :disabled="disabled"
        :aria-invalid="(!!error).toString()"
        :aria-describedby="describedBy"
        @change="onChange"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
        <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
        <option
          v-for="opt in normalizedOptions"
          :key="String(opt.value)"
          :value="opt.value as any"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Chevron -->
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted">
        <Icon name="heroicons:chevron-up-down" class="h-5 w-5" />
      </div>
    </div>

    <div class="mt-1 flex items-start justify-between gap-2">
      <p v-if="help && !error" :id="helpId" class="text-xs text-text-muted">{{ help }}</p>
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-0.5"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-0.5"
      >
        <p v-if="error" :id="errorId" class="text-xs text-red-600">{{ error }}</p>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
type Option = { label: string; value: string | number; disabled?: boolean }

interface Props {
  modelValue?: string | number
  options?: Array<Option | string | number>
  label?: string
  name?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  help?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  size: 'md',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined]
  'blur': [e: FocusEvent]
  'focus': [e: FocusEvent]
}>()

const uid = Math.random().toString(36).slice(2)
const computedId = computed(() => props.id || `select-${uid}`)
const errorId = computed(() => `${computedId.value}-error`)
const helpId = computed(() => `${computedId.value}-help`)
const describedBy = computed(() => props.error ? errorId.value : (props.help ? helpId.value : undefined))

const normalizedOptions = computed<Option[]>(() => {
  return (props.options || []).map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') return { label: String(opt), value: opt }
    return opt
  })
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm py-2 pl-3 min-h-9'
    case 'lg':
      return 'text-base py-3 pl-3 min-h-12'
    default:
      return 'text-sm py-2.5 pl-3 min-h-10'
  }
})

const onChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const value = target.value
  // Attempt number coercion if option value looks numeric
  emit('update:modelValue', isNaN(Number(value)) ? value : (Number(value) as any))
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

