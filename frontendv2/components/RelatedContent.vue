<template>
  <div v-if="relations?.length" class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-semibold text-text">
        {{ title || 'Contenus liés' }}
      </h3>
      <Badge variant="secondary" class="text-xs">
        {{ relations.length }} {{ relations.length > 1 ? 'relations' : 'relation' }}
      </Badge>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="relation in relations"
        :key="`${relation.type}-${relation.id}`"
        class="group relative bg-surface rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:transform-none cursor-pointer"
        @click="navigateToContent(relation)"
      >
        <!-- Image -->
        <div class="aspect-[3/4] relative overflow-hidden">
          <SmartImage
            v-if="relation.image"
            :src="getImageUrl(relation.image, relation.type)"
            :alt="relation.title"
            aspect-ratio="3/4"
            container-class="w-full h-full"
            image-class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
            :placeholder-icon="relation.type === 'anime' ? 'heroicons:tv' : 'heroicons:book-open'"
          />
          <div 
            v-else 
            class="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center"
          >
            <Icon 
              :name="relation.type === 'anime' ? 'heroicons:tv' : 'heroicons:book-open'" 
              size="xl" 
              class="text-primary-500 dark:text-primary-400" 
            />
          </div>

          <!-- Type badge -->
          <div class="absolute top-2 left-2">
            <Badge
              :variant="relation.type === 'anime' ? 'primary' : 'secondary'"
              size="xs"
              class="capitalize font-medium"
            >
              {{ relation.type }}
            </Badge>
          </div>

          <!-- Rating -->
          <div 
            v-if="relation.rating && relation.rating > 0" 
            class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
          >
            <Icon name="heroicons:star" variant="solid" size="xs" class="text-yellow-400" />
            <span>{{ formatRating(relation.rating) }}</span>
          </div>

          <!-- Hover overlay -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:transition-none flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              rounded
              class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white"
            >
              <Icon name="heroicons:eye" size="xs" class="mr-2" />
              Voir
            </Button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-3">
          <h4 class="font-medium text-text text-sm line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors duration-200">
            {{ relation.title }}
          </h4>
          
          <div class="flex items-center justify-between text-xs text-text-secondary">
            <span v-if="relation.year" class="flex items-center gap-1">
              <Icon name="heroicons:calendar" size="xs" />
              {{ relation.year }}
            </span>
            
            <span 
              v-if="relation.relationType && relation.relationType !== 'related'" 
              class="px-2 py-1 bg-surface-hover rounded-full text-xs capitalize"
            >
              {{ formatRelationType(relation.relationType) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else-if="!loading" class="text-center py-8">
    <Icon name="heroicons:link" size="lg" class="mx-auto text-text-muted mb-3" />
    <p class="text-text-muted">Aucun contenu lié trouvé</p>
  </div>

  <!-- Loading state -->
  <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <div 
      v-for="i in 4" 
      :key="i"
      class="bg-surface rounded-lg overflow-hidden shadow-card animate-pulse"
    >
      <div class="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
      <div class="p-3 space-y-2">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RelatedItem {
  id: number
  type: 'anime' | 'manga'
  title: string
  image?: string
  year?: number
  rating?: number
  niceUrl?: string
  relationType?: string
}

interface Props {
  relations?: RelatedItem[]
  loading?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  relations: () => [],
  loading: false
})

const { getImageUrl } = useImageUrl()

const formatRating = (rating: number) => {
  if (!rating) return '0.0'
  return (rating / 10).toFixed(1)
}

const formatRelationType = (type: string) => {
  const relationTypes: Record<string, string> = {
    'adaptation': 'Adaptation',
    'sequel': 'Suite',
    'prequel': 'Préquel', 
    'side_story': 'Histoire parallèle',
    'parent_story': 'Histoire principale',
    'alternative_version': 'Version alternative',
    'spin_off': 'Spin-off',
    'related': 'Lié'
  }
  return relationTypes[type] || type
}

const createSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const navigateToContent = (relation: RelatedItem) => {
  const slug = relation.niceUrl || createSlug(relation.title)
  const path = relation.type === 'anime' 
    ? `/anime/${slug}-${relation.id}`
    : `/manga/${slug}-${relation.id}`
  
  navigateTo(path)
}
</script>