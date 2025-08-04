<template>
  <div class="article-card">
    <img 
      v-if="imageAndTitle.image"
      :src="getImageUrl(imageAndTitle.image, imageAndTitle.type)" 
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
        <div class="critique-text" v-html="formatCritiqueText(article.critique)"></div>
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

const getImageUrl = (imagePath, type) => {
  if (!imagePath) return null
  
  // Return appropriate path based on content type
  if (type === 'Manga') {
    return `/public/images/manga/${imagePath}`
  } else if (type === 'Anime') {
    return `/public/images/anime/${imagePath}`
  }
  
  // Default fallback
  return `/public/images/${imagePath}`
}

const hideImage = (event) => {
  event.target.style.display = 'none'
}

const formatCritiqueText = (text) => {
  if (!text) return ''
  let formatted = text.replace(/<br\s*\/?>/gi, '<br>')
  formatted = formatted.replace(/\[url=([^\]]+)\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$2</a>')
  formatted = formatted.replace(/\[url\]([^\[]*)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  formatted = formatted.replace(/\[b\]([^\[]*)\[\/b\]/gi, '<strong>$1</strong>')
  formatted = formatted.replace(/\[i\]([^\[]*)\[\/i\]/gi, '<em>$1</em>')
  formatted = formatted.replace(/\[quote\]([^\[]*)\[\/quote\]/gi, '<blockquote>$1</blockquote>')
  formatted = formatted.replace(/\r\n/g, '<br>')
  formatted = formatted.replace(/\n/g, '<br>')
  // Limit to 300 characters for card display
  if (formatted.length > 300) {
    let truncated = formatted.substring(0, 300)
    const lastBreak = Math.max(
      truncated.lastIndexOf(' '),
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf(',')
    )
    if (lastBreak > 200) {
      truncated = truncated.substring(0, lastBreak)
    }
    formatted = truncated + '...'
  }
  return formatted
}
</script>

<style scoped>
















































</style>}  /* Your existing styles */.critique-text {}  /* Your existing styles */.article-author {}  /* Your existing styles */.article-date {}  /* Your existing styles */.article-footer {}  /* Your existing styles */.article-excerpt {}  /* Your existing styles */.article-title {}  /* Your existing styles */.article-rating {}  /* Your existing styles */.article-type {}  /* Your existing styles */.article-meta {}  /* Your existing styles */.article-content {}  /* Your existing styles */.article-image {}  /* Your existing styles */.article-card {