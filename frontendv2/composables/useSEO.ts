export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  url?: string
  siteName?: string
  locale?: string
  alternateLocales?: string[]
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
}

export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: any
}

export const useSEO = () => {
  const config = useRuntimeConfig()
  const route = useRoute()
  
  const defaultSiteName = 'AK9 - Anime & Manga Community'
  const defaultLocale = 'fr_FR'
  const baseUrl = config.public.siteUrl || (process.client ? window.location.origin : '')

  const setPageSEO = (seoConfig: SEOConfig) => {
    const {
      title,
      description,
      keywords = [],
      image,
      type = 'website',
      author,
      publishedTime,
      modifiedTime,
      section,
      tags = [],
      url,
      siteName = defaultSiteName,
      locale = defaultLocale,
      alternateLocales = [],
      noIndex = false,
      noFollow = false,
      canonical
    } = seoConfig

    // Build full URL
    const fullUrl = url || `${baseUrl}${route.fullPath}`
    const canonicalUrl = canonical || fullUrl

    // Build title with site name
    const fullTitle = title.includes(siteName) ? title : `${title} - ${siteName}`

    // Meta configuration
    const metaConfig: Record<string, any> = {
      title: fullTitle,
      description,
      
      // Open Graph
      ogTitle: fullTitle,
      ogDescription: description,
      ogType: type,
      ogUrl: fullUrl,
      ogSiteName: siteName,
      ogLocale: locale,
      
      // Twitter Card
      twitterCard: 'summary_large_image',
      twitterTitle: fullTitle,
      twitterDescription: description,
      
      // Basic Meta
      robots: `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`,
      canonical: canonicalUrl,
      
      // Language and locale
      'og:locale': locale
    }

    // Add image if provided
    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`
      metaConfig.ogImage = fullImageUrl
      metaConfig.twitterImage = fullImageUrl
      metaConfig['og:image:alt'] = title
    }

    // Add keywords
    if (keywords.length > 0) {
      metaConfig.keywords = keywords.join(', ')
    }

    // Add article-specific meta
    if (type === 'article') {
      if (author) metaConfig['article:author'] = author
      if (publishedTime) metaConfig['article:published_time'] = publishedTime
      if (modifiedTime) metaConfig['article:modified_time'] = modifiedTime
      if (section) metaConfig['article:section'] = section
      
      // Add article tags
      if (tags.length > 0) {
        tags.forEach((tag, index) => {
          metaConfig[`article:tag:${index}`] = tag
        })
      }
    }

    // Add alternate locales
    if (alternateLocales.length > 0) {
      alternateLocales.forEach((altLocale, index) => {
        metaConfig[`og:locale:alternate:${index}`] = altLocale
      })
    }

    // Apply SEO meta
    useSeoMeta(metaConfig)

    // Add structured data if article
    if (type === 'article') {
      addArticleStructuredData({
        title: fullTitle,
        description,
        url: fullUrl,
        image,
        author,
        publishedTime,
        modifiedTime,
        keywords: tags.length > 0 ? tags : keywords
      })
    }
  }

  const addStructuredData = (data: StructuredData | StructuredData[]) => {
    const structuredData = Array.isArray(data) ? data : [data]
    
    structuredData.forEach((item, index) => {
      useHead({
        script: [
          {
            key: `structured-data-${index}`,
            type: 'application/ld+json',
            innerHTML: JSON.stringify(item)
          }
        ]
      })
    })
  }

  const addArticleStructuredData = (config: {
    title: string
    description: string
    url: string
    image?: string
    author?: string
    publishedTime?: string
    modifiedTime?: string
    keywords?: string[]
  }) => {
    const article: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: config.title,
      description: config.description,
      url: config.url,
      datePublished: config.publishedTime,
      dateModified: config.modifiedTime || config.publishedTime,
      keywords: config.keywords?.join(', '),
      publisher: {
        '@type': 'Organization',
        name: defaultSiteName,
        url: baseUrl
      }
    }

    if (config.image) {
      article.image = config.image.startsWith('http') ? config.image : `${baseUrl}${config.image}`
    }

    if (config.author) {
      article.author = {
        '@type': 'Person',
        name: config.author
      }
    }

    addStructuredData(article)
  }

  const addBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => {
    const breadcrumbList: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
      }))
    }

    addStructuredData(breadcrumbList)
  }

  const addReviewStructuredData = (review: {
    title: string
    content: string
    rating: number
    maxRating: number
    author: string
    datePublished: string
    itemReviewed: {
      name: string
      type: 'Movie' | 'Book' | 'TVSeries'
      image?: string
      datePublished?: string
      genre?: string[]
      creator?: string
    }
  }) => {
    const reviewData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Review',
      name: review.title,
      reviewBody: review.content,
      datePublished: review.datePublished,
      author: {
        '@type': 'Person',
        name: review.author
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: review.maxRating,
        worstRating: 1
      },
      itemReviewed: {
        '@type': review.itemReviewed.type,
        name: review.itemReviewed.name,
        image: review.itemReviewed.image,
        datePublished: review.itemReviewed.datePublished,
        genre: review.itemReviewed.genre,
        creator: review.itemReviewed.creator ? {
          '@type': review.itemReviewed.type === 'Book' ? 'Person' : 'Organization',
          name: review.itemReviewed.creator
        } : undefined
      }
    }

    addStructuredData(reviewData)
  }

  const estimateReadingTime = (content: string): number => {
    // Remove HTML tags and BBCode
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .replace(/\[.*?\]/g, '')
      .trim()

    // Average reading speed: 200-250 words per minute (using 225)
    const wordsPerMinute = 225
    const wordCount = cleanContent.split(/\s+/).length
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute)

    return Math.max(1, readingTimeMinutes) // Minimum 1 minute
  }

  const formatReadingTime = (minutes: number): string => {
    if (minutes < 1) return '< 1 min'
    if (minutes === 1) return '1 min'
    return `${minutes} min`
  }

  const generateImageAlt = (title: string, context?: string): string => {
    if (context) {
      return `${title} - ${context}`
    }
    return title
  }

  const optimizeImageUrl = (url: string, width?: number, height?: number, quality = 85): string => {
    // If it's already an external URL, return as is
    if (url.startsWith('http')) return url

    // For local images, we could add optimization parameters
    // This would depend on your image optimization setup
    let optimizedUrl = url

    if (width || height || quality !== 85) {
      const params = new URLSearchParams()
      if (width) params.set('w', width.toString())
      if (height) params.set('h', height.toString())
      if (quality !== 85) params.set('q', quality.toString())
      
      optimizedUrl += `?${params.toString()}`
    }

    return optimizedUrl
  }

  return {
    setPageSEO,
    addStructuredData,
    addArticleStructuredData,
    addBreadcrumbStructuredData,
    addReviewStructuredData,
    estimateReadingTime,
    formatReadingTime,
    generateImageAlt,
    optimizeImageUrl
  }
}

// Export types for use in components
export type { SEOConfig, StructuredData }
