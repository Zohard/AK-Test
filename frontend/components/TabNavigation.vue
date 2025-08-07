<template>
  <div class="tab-navigation">
    <!-- Desktop Tab Navigation -->
    <div v-if="!mobile" class="desktop-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('update:activeTab', tab.id)"
        type="button"
        class="tab-btn"
        :class="{ 'active': activeTab === tab.id }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>
    
    <!-- Mobile Tab Select -->
    <div v-else class="mobile-tabs">
      <select
        :value="activeTab"
        @change="$emit('update:activeTab', $event.target.value)"
        class="tab-select"
      >
        <option v-for="tab in tabs" :key="tab.id" :value="tab.id">
          {{ tab.icon }} {{ tab.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true
  },
  activeTab: {
    type: String,
    required: true
  },
  mobile: Boolean
})

defineEmits(['update:activeTab'])
</script>

<style scoped src="~/assets/css/tab-navigation.css"></style>