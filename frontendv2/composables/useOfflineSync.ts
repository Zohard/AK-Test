interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  data: any
  timestamp: number
  retries: number
  lastError?: string
}

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingActions: number
  lastSync: Date | null
  errors: string[]
}

export const useOfflineSync = () => {
  // State
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const pendingActions = ref<OfflineAction[]>([])
  const lastSync = ref<Date | null>(null)
  const syncErrors = ref<string[]>([])

  // Storage keys
  const PENDING_ACTIONS_KEY = 'ak9_pending_actions'
  const LAST_SYNC_KEY = 'ak9_last_sync'

  // Load pending actions from localStorage
  const loadPendingActions = () => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(PENDING_ACTIONS_KEY)
      if (stored) {
        const actions = JSON.parse(stored)
        pendingActions.value = actions
      }

      const storedLastSync = localStorage.getItem(LAST_SYNC_KEY)
      if (storedLastSync) {
        lastSync.value = new Date(storedLastSync)
      }
    } catch (error) {
      console.error('Error loading pending actions:', error)
    }
  }

  // Save pending actions to localStorage
  const savePendingActions = () => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions.value))
      if (lastSync.value) {
        localStorage.setItem(LAST_SYNC_KEY, lastSync.value.toISOString())
      }
    } catch (error) {
      console.error('Error saving pending actions:', error)
    }
  }

  // Add action to offline queue
  const addOfflineAction = (
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ): string => {
    const action: OfflineAction = {
      id: `${type}-${endpoint}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    pendingActions.value.push(action)
    savePendingActions()
    
    console.log(`Added offline action: ${action.id}`, action)
    return action.id
  }

  // Remove action from queue
  const removeOfflineAction = (actionId: string) => {
    const index = pendingActions.value.findIndex(action => action.id === actionId)
    if (index > -1) {
      pendingActions.value.splice(index, 1)
      savePendingActions()
    }
  }

  // Execute a single offline action
  const executeOfflineAction = async (action: OfflineAction): Promise<boolean> => {
    try {
      const config = useRuntimeConfig()
      const apiBase = config.public.apiBase

      let method: string
      switch (action.type) {
        case 'create':
          method = 'POST'
          break
        case 'update':
          method = 'PUT'
          break
        case 'delete':
          method = 'DELETE'
          break
      }

      const response = await $fetch(`${apiBase}${action.endpoint}`, {
        method,
        body: action.type !== 'delete' ? action.data : undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log(`Offline action executed successfully: ${action.id}`)
      return true
      
    } catch (error: any) {
      action.retries++
      action.lastError = error.message || 'Unknown error'
      
      console.error(`Offline action failed: ${action.id}`, error)
      
      // Remove action if it has failed too many times
      if (action.retries >= 5) {
        syncErrors.value.push(`Action ${action.id} failed permanently: ${action.lastError}`)
        return false // This will cause the action to be removed
      }
      
      return false // This will keep the action for retry
    }
  }

  // Sync all pending actions
  const syncPendingActions = async (): Promise<void> => {
    if (!isOnline.value || isSyncing.value || pendingActions.value.length === 0) {
      return
    }

    isSyncing.value = true
    syncErrors.value = []
    
    console.log(`Starting sync of ${pendingActions.value.length} pending actions`)

    const actionsToExecute = [...pendingActions.value]
    const completedActions: string[] = []

    for (const action of actionsToExecute) {
      try {
        const success = await executeOfflineAction(action)
        if (success) {
          completedActions.push(action.id)
        }
      } catch (error) {
        console.error(`Error executing action ${action.id}:`, error)
      }

      // Small delay between actions to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Remove completed actions
    completedActions.forEach(actionId => {
      removeOfflineAction(actionId)
    })

    // Remove permanently failed actions (those with retries >= 5)
    const permanentlyFailedActions = pendingActions.value
      .filter(action => action.retries >= 5)
      .map(action => action.id)

    permanentlyFailedActions.forEach(actionId => {
      removeOfflineAction(actionId)
    })

    lastSync.value = new Date()
    savePendingActions()
    isSyncing.value = false
    
    console.log(`Sync completed. ${completedActions.length} actions executed, ${permanentlyFailedActions.length} permanently failed`)
  }

  // Force sync (ignores online status)
  const forceSync = async (): Promise<void> => {
    const wasOnline = isOnline.value
    isOnline.value = true
    
    try {
      await syncPendingActions()
    } finally {
      isOnline.value = wasOnline
    }
  }

  // Clear all pending actions
  const clearPendingActions = () => {
    pendingActions.value = []
    syncErrors.value = []
    savePendingActions()
  }

  // Get sync status
  const getSyncStatus = (): SyncStatus => {
    return {
      isOnline: isOnline.value,
      isSyncing: isSyncing.value,
      pendingActions: pendingActions.value.length,
      lastSync: lastSync.value,
      errors: syncErrors.value
    }
  }

  // Check if a specific action type is pending
  const hasPendingActionsOfType = (type: 'create' | 'update' | 'delete'): boolean => {
    return pendingActions.value.some(action => action.type === type)
  }

  // Get pending actions for a specific endpoint
  const getPendingActionsForEndpoint = (endpoint: string): OfflineAction[] => {
    return pendingActions.value.filter(action => action.endpoint === endpoint)
  }

  // Setup online/offline event listeners
  const setupEventListeners = () => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      isOnline.value = true
      console.log('Device came online, syncing pending actions...')
      syncPendingActions()
    }

    const handleOffline = () => {
      isOnline.value = false
      console.log('Device went offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  // Auto-sync interval (every 5 minutes when online)
  const setupAutoSync = () => {
    const interval = setInterval(() => {
      if (isOnline.value && !isSyncing.value && pendingActions.value.length > 0) {
        syncPendingActions()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }

  // Initialize
  onMounted(() => {
    loadPendingActions()
    const cleanupListeners = setupEventListeners()
    const cleanupAutoSync = setupAutoSync()

    // Initial sync if online and has pending actions
    if (isOnline.value && pendingActions.value.length > 0) {
      setTimeout(() => syncPendingActions(), 1000)
    }

    // Cleanup on unmount
    onUnmounted(() => {
      cleanupListeners?.()
      cleanupAutoSync?.()
    })
  })

  // Watch for visibility change to sync when user returns to tab
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && isOnline.value && pendingActions.value.length > 0) {
        setTimeout(() => syncPendingActions(), 500)
      }
    })
  }

  // Enhanced offline-aware API wrapper
  const offlineAwareRequest = async <T>(
    endpoint: string,
    options: {
      method?: string
      body?: any
      fallbackToOffline?: boolean
    } = {}
  ): Promise<T> => {
    const { method = 'GET', body, fallbackToOffline = true } = options

    if (isOnline.value) {
      try {
        const config = useRuntimeConfig()
        return await $fetch<T>(`${config.public.apiBase}${endpoint}`, {
          method,
          body,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (error) {
        if (!fallbackToOffline || method === 'GET') {
          throw error
        }
        
        // Fall through to offline handling for non-GET requests
      }
    }

    if (method !== 'GET' && fallbackToOffline) {
      // Add to offline queue for non-GET requests
      const actionType = method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete'
      addOfflineAction(actionType, endpoint, body)
      
      // Return a temporary response indicating offline operation
      return {
        offline: true,
        message: 'Action queued for sync when online'
      } as any
    } else {
      throw new Error('No offline data available and device is offline')
    }
  }

  return {
    // State
    isOnline: readonly(isOnline),
    isSyncing: readonly(isSyncing),
    pendingActions: readonly(pendingActions),
    lastSync: readonly(lastSync),
    syncErrors: readonly(syncErrors),

    // Actions
    addOfflineAction,
    removeOfflineAction,
    syncPendingActions,
    forceSync,
    clearPendingActions,

    // Queries
    getSyncStatus,
    hasPendingActionsOfType,
    getPendingActionsForEndpoint,

    // Enhanced request function
    offlineAwareRequest
  }
}