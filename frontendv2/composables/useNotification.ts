type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationOptions {
  type?: NotificationType
  title?: string
  duration?: number
  persistent?: boolean
}

interface Notification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration: number
  persistent: boolean
  timestamp: number
}

const notifications = ref<Notification[]>([])

let notificationId = 0

export const useNotification = () => {
  const show = (message: string, options: NotificationOptions = {}) => {
    const id = `notification-${++notificationId}`
    const notification: Notification = {
      id,
      type: options.type || 'info',
      title: options.title,
      message,
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      timestamp: Date.now()
    }

    notifications.value.push(notification)

    // Auto remove if not persistent
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, notification.duration)
    }

    return id
  }

  const remove = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clear = () => {
    notifications.value = []
  }

  // Convenience methods
  const success = (message: string, options: Omit<NotificationOptions, 'type'> = {}) => {
    return show(message, { ...options, type: 'success' })
  }

  const error = (message: string, options: Omit<NotificationOptions, 'type'> = {}) => {
    return show(message, { ...options, type: 'error' })
  }

  const warning = (message: string, options: Omit<NotificationOptions, 'type'> = {}) => {
    return show(message, { ...options, type: 'warning' })
  }

  const info = (message: string, options: Omit<NotificationOptions, 'type'> = {}) => {
    return show(message, { ...options, type: 'info' })
  }

  return {
    notifications: readonly(notifications),
    show,
    remove,
    clear,
    success,
    error,
    warning,
    info
  }
}