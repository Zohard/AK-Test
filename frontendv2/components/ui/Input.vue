<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="computedId"
      class="mb-1.5 block text-sm font-medium text-text"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input wrapper -->
    <div
      :class="[
        'relative flex items-center rounded-lg border bg-surface transition-colors',
        sizeClasses.wrapper,
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary-400',
        error ? 'border-red-400 focus-within:ring-red-500/20' : 'border-border focus-within:ring-primary-500/20',
        'focus-within:border-primary-500 focus-within:ring-2'
      ]"
    >
      <!-- Left slot -->
      <div v-if="$slots.left" class="pl-3 text-text-muted">
        <slot name="left" />
      </div>

      <input
        :id="computedId"
        :name="name || computedId"
        :type="type"
        class="peer w-full bg-transparent outline-none text-text placeholder-text-muted"
        :class="[
          sizeClasses.input,
          $slots.left ? 'pl-2' : 'pl-3',
          $slots.right ? 'pr-2' : 'pr-3'
        ]"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="(!!error).toString()"
        :aria-describedby="describedBy"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />

      <!-- Right slot -->
      <div v-if="$slots.right" class="pr-3 text-text-muted">
        <slot name="right" />
      </div>
    </div>

    <!-- Help & Error -->
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
interface Props {
  modelValue?: string | number
  label?: string
  name?: string
  placeholder?: string
  type?: string
  id?: string
  autocomplete?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  error?: string
  help?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  autocomplete: 'off',
  required: false,
  disabled: false,
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined]
  'blur': [e: FocusEvent]
  'focus': [e: FocusEvent]
}>()

const uid = Math.random().toString(36).slice(2)
const computedId = computed(() => props.id || `input-${uid}`)
const errorId = computed(() => `${computedId.value}-error`)
const helpId = computed(() => `${computedId.value}-help`)
const describedBy = computed(() => props.error ? errorId.value : (props.help ? helpId.value : undefined))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return { wrapper: 'min-h-9', input: 'text-sm py-2' }
    case 'lg':
      return { wrapper: 'min-h-12', input: 'text-base py-3' }
    default:
      return { wrapper: 'min-h-10', input: 'text-sm py-2.5' }
  }
})

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
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

