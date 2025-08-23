<template>
  <div class="article-card">
    <img 
      v-if="imageAndTitle.image"
      :src="getArticleImageUrl(imageAndTitle.image || '') || undefined" 
      :alt="imageAndTitle.title"
      class="article-image"
      loading="lazy"
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
          {{ formatDate(article.dateCritique || article.dateAjout) }}
        </p>
        <p v-if="article.username || article.membre?.pseudo" class="article-author">
          Par {{ article.membre?.pseudo || article.username }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Article {
  id?: number
  idCritique?: number
  titre?: string
  critique?: string
  notation?: number
  dateCritique?: string | Date
  dateAjout?: string | Date
  username?: string
  idAnime?: number
  idManga?: number
  animeImage?: string
  animeTitre?: string
  mangaImage?: string
  mangaTitre?: string
  // Relations from API
  anime?: {
    id: number
    titre: string
    image?: string
  }
  manga?: {
    id: number
    titre: string
    image?: string
  }
  membre?: {
    id: number
    pseudo: string
  }
}

interface Props {
  article: Article
}

const props = defineProps<Props>()
const { getArticleImageUrl } = useImageUrl()

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

const imageAndTitle = computed(() => {
  // Use relation data if available (from API)
  if (props.article.anime) {
    return {
      image: props.article.anime.image,
      title: props.article.anime.titre,
      type: 'anime' as const
    }
  } else if (props.article.manga) {
    return {
      image: props.article.manga.image,
      title: props.article.manga.titre,
      type: 'manga' as const
    }
  }
  // Fallback to legacy structure
  else if (props.article.idAnime && props.article.idAnime !== 0) {
    return {
      image: props.article.animeImage,
      title: props.article.animeTitre || 'Anime',
      type: 'anime' as const
    }
  } else if (props.article.idManga && props.article.idManga !== 0) {
    return {
      image: props.article.mangaImage,
      title: props.article.mangaTitre || 'Manga',
      type: 'manga' as const
    }
  }
  return {
    image: null,
    title: props.article.titre || 'Critique',
    type: 'anime' as const
  }
})

const hideImage = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

const formatCritiqueText = (text?: string) => {
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
.critique-text {
  @apply text-sm;
}

.critique-text a {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.critique-text blockquote {
  @apply border-l-4 border-gray-300 pl-4 italic;
}

.critique-text strong {
  @apply font-semibold;
}

.critique-text em {
  @apply italic;
}
</style>