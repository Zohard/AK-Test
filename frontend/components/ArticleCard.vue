<template>
  <div class="article-card">
    <img 
      v-if="imageAndTitle.image"
      :src="`/images/${imageAndTitle.image}`" 
      :alt="imageAndTitle.title"
      class="article-image"
      @error="hideImage"
    />
    <div class="article-content">
      <div class="article-meta">
        <span class="article-type">{{ imageAndTitle.type }}</span>
        <span v-if="article.notation" class="article-rating">
          ★ {{ article.notation }}/10
        </span>
      </div>
      <h3 class="article-title">{{ imageAndTitle.title }}</h3>
      <div v-if="article.critique" class="article-excerpt">
        <FormattedText 
          :text="article.critique"
          :max-length="150"
          :show-read-more="true"
          class="text-sm text-gray-600"
        />
      </div>
      <div class="article-footer">
        <p class="article-date">
          {{ formatDate(article.date_critique || article.date_ajout) }}
        </p>
        <p v-if="article.username" class="article-author">
          Par {{ article.username }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  article: {
    type: Object,
    required: true
  }
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const imageAndTitle = computed(() => {
  if (props.article.id_anime && props.article.id_anime !== 0) {
    return {
      image: props.article.anime_image,
      title: props.article.anime_titre || 'Anime',
      type: 'Anime'
    }
  } else if (props.article.id_manga && props.article.id_manga !== 0) {
    return {
      image: props.article.manga_image,
      title: props.article.manga_titre || 'Manga',
      type: 'Manga'
    }
  }
  return {
    image: null,
    title: props.article.titre || 'Critique',
    type: 'Critique'
  }
})

const hideImage = (event) => {
  event.target.style.display = 'none'
}
</script>