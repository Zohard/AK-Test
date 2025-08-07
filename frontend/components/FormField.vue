<template>
  <div class="form-field">
    <label v-if="label" :for="id" class="form-label" :class="{ 'required': required }">
      {{ label }}
    </label>
    <div class="form-input-wrapper">
      <input
        v-if="type !== 'textarea' && type !== 'select'"
        :id="id"
        :type="type"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="form-input"
        :class="inputClass"
      />
      <textarea
        v-else-if="type === 'textarea'"
        :id="id"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        class="form-textarea"
        :class="inputClass"
      />
      <select
        v-else-if="type === 'select'"
        :id="id"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        :required="required"
        :disabled="disabled"
        class="form-select"
        :class="inputClass"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span v-if="error" class="form-error">{{ error }}</span>
      <span v-if="help" class="form-help">{{ help }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  id: String,
  label: String,
  type: {
    type: String,
    default: 'text'
  },
  modelValue: [String, Number],
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  error: String,
  help: String,
  rows: {
    type: Number,
    default: 4
  },
  options: Array,
  inputClass: String
})

defineEmits(['update:modelValue'])
</script>

<style scoped src="~/assets/css/form-field.css"></style>