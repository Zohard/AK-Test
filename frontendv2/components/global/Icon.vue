<template>
  <component :is="iconComponent" v-if="iconComponent" :class="$attrs.class" />
  <span v-else :class="$attrs.class">{{ name }}</span>
</template>

<script setup lang="ts">
interface Props {
  name: string
}

const props = defineProps<Props>()

function toPascalCase(str: string) {
  return str
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// Import all heroicons using relative paths so Vite's glob can resolve them
const outlineIcons = import.meta.glob(
  '../../node_modules/@heroicons/vue/24/outline/*Icon.js'
)
const solidIcons = import.meta.glob(
  '../../node_modules/@heroicons/vue/24/solid/*Icon.js'
)

const iconComponent = computed(() => {
  if (props.name.startsWith('heroicons:')) {
    const rawName = props.name.replace('heroicons:', '')
    const fileName = `${toPascalCase(rawName)}Icon.js`

    const importer =
      outlineIcons[
        `../../node_modules/@heroicons/vue/24/outline/${fileName}`
      ] ||
      solidIcons[`../../node_modules/@heroicons/vue/24/solid/${fileName}`]

    return importer ? defineAsyncComponent(importer) : null
  }

  return null
})
</script>