import { ref, reactive, computed } from 'vue'

export function useFormState(initialData = {}) {
  const formData = reactive({ ...initialData })
  const errors = reactive({})
  const touched = reactive({})
  const saving = ref(false)
  const loading = ref(false)
  
  const isValid = computed(() => {
    return Object.keys(errors).length === 0
  })
  
  const isDirty = computed(() => {
    return Object.keys(touched).length > 0
  })
  
  const setFieldValue = (field, value) => {
    formData[field] = value
    touched[field] = true
    // Clear error when field is modified
    if (errors[field]) {
      delete errors[field]
    }
  }
  
  const setFieldError = (field, error) => {
    errors[field] = error
  }
  
  const clearFieldError = (field) => {
    delete errors[field]
  }
  
  const clearAllErrors = () => {
    Object.keys(errors).forEach(key => delete errors[key])
  }
  
  const resetForm = (newData = initialData) => {
    Object.keys(formData).forEach(key => delete formData[key])
    Object.assign(formData, newData)
    Object.keys(errors).forEach(key => delete errors[key])
    Object.keys(touched).forEach(key => delete touched[key])
  }
  
  const validateField = (field, rules) => {
    const value = formData[field]
    
    for (const rule of rules) {
      if (rule.required && (!value || value.toString().trim() === '')) {
        setFieldError(field, rule.message || `${field} est requis`)
        return false
      }
      
      if (rule.minLength && value && value.length < rule.minLength) {
        setFieldError(field, rule.message || `${field} doit contenir au moins ${rule.minLength} caractères`)
        return false
      }
      
      if (rule.maxLength && value && value.length > rule.maxLength) {
        setFieldError(field, rule.message || `${field} ne peut pas dépasser ${rule.maxLength} caractères`)
        return false
      }
      
      if (rule.pattern && value && !rule.pattern.test(value)) {
        setFieldError(field, rule.message || `Format de ${field} invalide`)
        return false
      }
      
      if (rule.custom && value && !rule.custom(value)) {
        setFieldError(field, rule.message || `${field} n'est pas valide`)
        return false
      }
    }
    
    clearFieldError(field)
    return true
  }
  
  return {
    formData,
    errors,
    touched,
    saving,
    loading,
    isValid,
    isDirty,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    resetForm,
    validateField
  }
}