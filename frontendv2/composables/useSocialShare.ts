export interface ShareData {
  title: string
  text?: string
  url?: string
  image?: string
}

export interface SharePlatform {
  name: string
  icon: string
  color: string
  shareUrl: (data: ShareData) => string
}

export const useSocialShare = () => {
  const route = useRoute()
  const config = useRuntimeConfig()
  
  const baseUrl = config.public.siteUrl || (process.client ? window.location.origin : '')

  // Social platforms configuration
  const platforms: SharePlatform[] = [
    {
      name: 'Twitter',
      icon: 'fa6-brands:x-twitter',
      color: 'bg-black text-white hover:bg-gray-800',
      shareUrl: (data: ShareData) => {
        const params = new URLSearchParams({
          text: `${data.title} ${data.text ? '- ' + data.text : ''}`,
          url: data.url || `${baseUrl}${route.fullPath}`,
          hashtags: 'anime,manga,critique,AK9'
        })
        return `https://twitter.com/intent/tweet?${params}`
      }
    },
    {
      name: 'Facebook',
      icon: 'fa6-brands:facebook-f',
      color: 'bg-blue-600 text-white hover:bg-blue-700',
      shareUrl: (data: ShareData) => {
        const params = new URLSearchParams({
          u: data.url || `${baseUrl}${route.fullPath}`,
          quote: `${data.title} ${data.text ? '- ' + data.text : ''}`
        })
        return `https://www.facebook.com/sharer/sharer.php?${params}`
      }
    },
    {
      name: 'LinkedIn',
      icon: 'fa6-brands:linkedin-in',
      color: 'bg-blue-700 text-white hover:bg-blue-800',
      shareUrl: (data: ShareData) => {
        const params = new URLSearchParams({
          url: data.url || `${baseUrl}${route.fullPath}`,
          title: data.title,
          summary: data.text || '',
          source: 'AK9'
        })
        return `https://www.linkedin.com/sharing/share-offsite/?${params}`
      }
    },
    {
      name: 'Reddit',
      icon: 'fa6-brands:reddit-alien',
      color: 'bg-orange-600 text-white hover:bg-orange-700',
      shareUrl: (data: ShareData) => {
        const params = new URLSearchParams({
          url: data.url || `${baseUrl}${route.fullPath}`,
          title: data.title
        })
        return `https://reddit.com/submit?${params}`
      }
    },
    {
      name: 'Telegram',
      icon: 'fa6-brands:telegram-plane',
      color: 'bg-blue-500 text-white hover:bg-blue-600',
      shareUrl: (data: ShareData) => {
        const params = new URLSearchParams({
          url: data.url || `${baseUrl}${route.fullPath}`,
          text: `${data.title} ${data.text ? '- ' + data.text : ''}`
        })
        return `https://t.me/share/url?${params}`
      }
    },
    {
      name: 'WhatsApp',
      icon: 'fa6-brands:whatsapp',
      color: 'bg-green-500 text-white hover:bg-green-600',
      shareUrl: (data: ShareData) => {
        const text = `${data.title} ${data.text ? '- ' + data.text : ''} ${data.url || `${baseUrl}${route.fullPath}`}`
        return `https://wa.me/?text=${encodeURIComponent(text)}`
      }
    },
    {
      name: 'Discord',
      icon: 'fa6-brands:discord',
      color: 'bg-indigo-600 text-white hover:bg-indigo-700',
      shareUrl: (data: ShareData) => {
        // Discord doesn't have a direct share URL, but we can create a message
        const text = `${data.title} ${data.text ? '- ' + data.text : ''} ${data.url || `${baseUrl}${route.fullPath}`}`
        return `https://discord.com/channels/@me?text=${encodeURIComponent(text)}`
      }
    }
  ]

  const shareNative = async (data: ShareData): Promise<boolean> => {
    if (!navigator.share) {
      return false
    }

    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url || `${baseUrl}${route.fullPath}`
      })
      return true
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Native share failed:', error)
      }
      return false
    }
  }

  const shareUrl = (platform: string, data: ShareData): string => {
    const platformConfig = platforms.find(p => p.name.toLowerCase() === platform.toLowerCase())
    if (!platformConfig) {
      throw new Error(`Platform ${platform} not supported`)
    }
    return platformConfig.shareUrl(data)
  }

  const openShareWindow = (url: string, platform: string = 'share'): void => {
    const width = 600
    const height = 400
    const left = (screen.width - width) / 2
    const top = (screen.height - height) / 2

    window.open(
      url,
      `share-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )
  }

  const shareToClipboard = async (data: ShareData): Promise<boolean> => {
    const shareText = `${data.title} ${data.text ? '- ' + data.text : ''} ${data.url || `${baseUrl}${route.fullPath}`}`
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText)
        return true
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        return successful
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error)
      return false
    }
  }

  const shareViaEmail = (data: ShareData): void => {
    const subject = encodeURIComponent(data.title)
    const body = encodeURIComponent(
      `${data.text || 'Découvrez ce contenu intéressant :'}\n\n${data.url || `${baseUrl}${route.fullPath}`}\n\nPartagé depuis AK9`
    )
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const generateShareImage = async (data: ShareData): Promise<string | null> => {
    // This would typically generate a dynamic share image
    // For now, return the provided image or a default one
    if (data.image) {
      return data.image.startsWith('http') ? data.image : `${baseUrl}${data.image}`
    }
    
    return `${baseUrl}/images/default-share.jpg`
  }

  const getShareStats = (): Record<string, number> => {
    // This would typically come from analytics
    // Return mock data for now
    return {
      twitter: 45,
      facebook: 23,
      linkedin: 12,
      reddit: 8,
      telegram: 15,
      whatsapp: 31,
      discord: 6,
      email: 9,
      copy: 67
    }
  }

  const trackShare = (platform: string, data: ShareData): void => {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        method: platform,
        content_type: 'review',
        content_id: data.url || route.fullPath
      })
    }
    
    console.log(`Shared to ${platform}:`, data.title)
  }

  const formatShareText = (data: ShareData, platform: string): string => {
    const maxLength = platform === 'twitter' ? 280 : 500
    let text = data.title
    
    if (data.text) {
      const remainingLength = maxLength - text.length - 3 // 3 for " - "
      if (data.text.length <= remainingLength) {
        text += ` - ${data.text}`
      } else {
        text += ` - ${data.text.substring(0, remainingLength - 3)}...`
      }
    }
    
    return text
  }

  const shareToPlatform = async (platform: string, data: ShareData): Promise<void> => {
    trackShare(platform, data)
    
    switch (platform.toLowerCase()) {
      case 'native':
        const nativeSuccess = await shareNative(data)
        if (!nativeSuccess) {
          // Fallback to clipboard if native share fails
          await shareToClipboard(data)
        }
        break
        
      case 'clipboard':
      case 'copy':
        await shareToClipboard(data)
        break
        
      case 'email':
        shareViaEmail(data)
        break
        
      default:
        const url = shareUrl(platform, data)
        openShareWindow(url, platform)
        break
    }
  }

  return {
    platforms,
    shareNative,
    shareUrl,
    openShareWindow,
    shareToClipboard,
    shareViaEmail,
    shareToPlatform,
    generateShareImage,
    getShareStats,
    trackShare,
    formatShareText
  }
}

// Export types
export type { ShareData, SharePlatform }
