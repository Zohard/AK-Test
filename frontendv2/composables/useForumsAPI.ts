interface ForumMessage {
  id: number
  topicId: number
  boardId: number
  subject: string
  body: string
  posterTime: number
  posterName: string
  memberId: number
  boardName: string
  topicReplies: number
  topicViews: number
  isFirstMessage: boolean
  lastMessageTime?: number
  lastPosterName?: string
}

interface ForumMessageResponse {
  messages: ForumMessage[]
  total: number
  limit: number
  offset: number
}

interface ForumBoard {
  id: number
  name: string
  description: string
}

interface ForumMessageQuery {
  limit?: number
  offset?: number
  boardId?: number
}

export const useForumsAPI = () => {
  const config = useRuntimeConfig()
  
  const fetchLatestMessages = async (query: ForumMessageQuery = {}): Promise<ForumMessageResponse> => {
    try {
      const url = `${config.public.apiBase}/api/forums/messages/latest`
      const params = {
        limit: query.limit || 10,
        offset: query.offset || 0,
        ...(query.boardId && { boardId: query.boardId })
      }
      
      const response = await $fetch<ForumMessageResponse>(url, {
        method: 'GET',
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      return response
    } catch (error) {
      console.error('useForumsAPI: Error fetching forum messages:', error)
      console.error('useForumsAPI: Error details:', {
        name: error?.name,
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText
      })
      return {
        messages: [],
        total: 0,
        limit: query.limit || 10,
        offset: query.offset || 0
      }
    }
  }

  const fetchBoards = async (): Promise<ForumBoard[]> => {
    try {
      const response = await $fetch<ForumBoard[]>(
        `${config.public.apiBase}/api/forums/boards`
      )
      
      return response || []
    } catch (error) {
      console.error('Error fetching forum boards:', error)
      return []
    }
  }

  const formatMessageTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000) // SMF uses Unix timestamp
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInHours < 48) return "Hier"
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const formatLastActivity = (timestamp?: number): string => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes} min`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`
    return `${Math.floor(diffInHours / 24)}j`
  }

  const buildForumUrl = (topicId: number, messageId?: number): string => {
    // Build URL to SMF forum topic using the configured forum URL
    const forumBaseUrl = config.public.forumUrl || 'http://localhost:8083'
    const baseUrl = `${forumBaseUrl}/index.php?topic=${topicId}`
    return messageId ? `${baseUrl}.msg${messageId}#msg${messageId}` : baseUrl
  }

  return {
    fetchLatestMessages,
    fetchBoards,
    formatMessageTime,
    formatLastActivity,
    buildForumUrl
  }
}

export type { ForumMessage, ForumMessageResponse, ForumBoard, ForumMessageQuery }