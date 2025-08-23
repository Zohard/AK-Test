interface PerformanceMetrics {
  connectionType: string | null
  memoryInfo: any
  navigationTiming: PerformanceNavigationTiming | null
  paintTiming: PerformanceEntry[]
  resourceTiming: PerformanceEntry[]
}

export const usePerformance = () => {
  // Check if running in browser
  const isBrowser = typeof window !== 'undefined'

  const getConnectionInfo = (): string | null => {
    if (!isBrowser) return null
    
    // @ts-ignore - navigator.connection is not in TypeScript types yet
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown'
    }
    
    return null
  }

  const getMemoryInfo = (): any => {
    if (!isBrowser) return null
    
    // @ts-ignore - performance.memory is Chrome-specific
    return (performance as any).memory || null
  }

  const getNavigationTiming = (): PerformanceNavigationTiming | null => {
    if (!isBrowser || !performance.getEntriesByType) return null
    
    const navigationEntries = performance.getEntriesByType('navigation')
    return navigationEntries.length > 0 ? navigationEntries[0] as PerformanceNavigationTiming : null
  }

  const getPaintTiming = (): PerformanceEntry[] => {
    if (!isBrowser || !performance.getEntriesByType) return []
    
    return performance.getEntriesByType('paint')
  }

  const getResourceTiming = (filterBy?: string): PerformanceEntry[] => {
    if (!isBrowser || !performance.getEntriesByType) return []
    
    const resources = performance.getEntriesByType('resource')
    
    if (filterBy) {
      return resources.filter(resource => resource.name.includes(filterBy))
    }
    
    return resources
  }

  const getLargestContentfulPaint = (): Promise<PerformanceEntry | null> => {
    return new Promise((resolve) => {
      if (!isBrowser || !('PerformanceObserver' in window)) {
        resolve(null)
        return
      }

      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry)
            observer.disconnect()
          }
        })
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect()
          resolve(null)
        }, 10000)
      } catch (error) {
        console.warn('LCP observation failed:', error)
        resolve(null)
      }
    })
  }

  const getFirstInputDelay = (): Promise<PerformanceEntry | null> => {
    return new Promise((resolve) => {
      if (!isBrowser || !('PerformanceObserver' in window)) {
        resolve(null)
        return
      }

      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          if (entries.length > 0) {
            resolve(entries[0])
            observer.disconnect()
          }
        })
        
        observer.observe({ entryTypes: ['first-input'] })
        
        // FID is only measured on user interaction
        setTimeout(() => {
          observer.disconnect()
          resolve(null)
        }, 30000)
      } catch (error) {
        console.warn('FID observation failed:', error)
        resolve(null)
      }
    })
  }

  const getCumulativeLayoutShift = (): Promise<number> => {
    return new Promise((resolve) => {
      if (!isBrowser || !('PerformanceObserver' in window)) {
        resolve(0)
        return
      }

      let clsValue = 0
      const clsEntries: PerformanceEntry[] = []

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // @ts-ignore - layout-shift entries have value property
            if (!entry.hadRecentInput) {
              clsEntries.push(entry)
              // @ts-ignore
              clsValue += entry.value
            }
          }
        })
        
        observer.observe({ entryTypes: ['layout-shift'] })
        
        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 10000)
      } catch (error) {
        console.warn('CLS observation failed:', error)
        resolve(0)
      }
    })
  }

  const getAllMetrics = async (): Promise<PerformanceMetrics> => {
    return {
      connectionType: getConnectionInfo(),
      memoryInfo: getMemoryInfo(),
      navigationTiming: getNavigationTiming(),
      paintTiming: getPaintTiming(),
      resourceTiming: getResourceTiming()
    }
  }

  const getCoreWebVitals = async () => {
    const [lcp, fid, cls] = await Promise.all([
      getLargestContentfulPaint(),
      getFirstInputDelay(),
      getCumulativeLayoutShift()
    ])

    return {
      lcp: lcp ? (lcp as any).startTime : null,
      fid: fid ? (fid as any).processingStart - (fid as any).startTime : null,
      cls
    }
  }

  const measureResourceLoadTime = (resourceName: string): number | null => {
    const resources = getResourceTiming(resourceName)
    if (resources.length === 0) return null

    const resource = resources[0]
    return resource.responseEnd - resource.startTime
  }

  const measurePageLoadTime = (): number | null => {
    const navigation = getNavigationTiming()
    if (!navigation) return null

    return navigation.loadEventEnd - navigation.fetchStart
  }

  const measureDOMContentLoadedTime = (): number | null => {
    const navigation = getNavigationTiming()
    if (!navigation) return null

    return navigation.domContentLoadedEventEnd - navigation.fetchStart
  }

  const measureFirstPaint = (): number | null => {
    const paintEntries = getPaintTiming()
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : null
  }

  const measureFirstContentfulPaint = (): number | null => {
    const paintEntries = getPaintTiming()
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : null
  }

  const isSlowConnection = (): boolean => {
    const connectionType = getConnectionInfo()
    return connectionType === 'slow-2g' || connectionType === '2g'
  }

  const shouldOptimizeForSlowConnection = (): boolean => {
    return isSlowConnection()
  }

  const getOptimizedImageSizes = (): { small: number; medium: number; large: number } => {
    const connection = getConnectionInfo()
    
    switch (connection) {
      case 'slow-2g':
      case '2g':
        return { small: 300, medium: 600, large: 900 }
      case '3g':
        return { small: 400, medium: 800, large: 1200 }
      case '4g':
      default:
        return { small: 500, medium: 1000, large: 1600 }
    }
  }

  const shouldPreloadImages = (): boolean => {
    const connection = getConnectionInfo()
    return connection === '4g' || connection === null // Default to true if unknown
  }

  const getRecommendedChunkSize = (): 'small' | 'medium' | 'large' => {
    const connection = getConnectionInfo()
    
    switch (connection) {
      case 'slow-2g':
      case '2g':
        return 'small'
      case '3g':
        return 'medium'
      case '4g':
      default:
        return 'large'
    }
  }

  const monitorPerformance = () => {
    if (!isBrowser) return

    // Log performance metrics after page load
    setTimeout(async () => {
      const metrics = await getAllMetrics()
      const webVitals = await getCoreWebVitals()
      
      console.group('🔍 Performance Metrics')
      console.log('Navigation Timing:', {
        pageLoad: measurePageLoadTime(),
        domContentLoaded: measureDOMContentLoadedTime(),
        firstPaint: measureFirstPaint(),
        firstContentfulPaint: measureFirstContentfulPaint()
      })
      console.log('Core Web Vitals:', webVitals)
      console.log('Connection:', metrics.connectionType)
      console.log('Memory:', metrics.memoryInfo)
      console.groupEnd()
      
      // Send to analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_timing', {
          custom_map: {
            metric1: 'page_load_time',
            metric2: 'first_contentful_paint'
          }
        })
      }
    }, 1000)
  }

  const optimizeForConnection = () => {
    if (!isBrowser) return {}

    const connection = getConnectionInfo()
    const isLowBandwidth = isSlowConnection()

    return {
      shouldLazyLoad: true,
      shouldPreloadImages: shouldPreloadImages(),
      imageSizes: getOptimizedImageSizes(),
      chunkSize: getRecommendedChunkSize(),
      reducedAnimations: isLowBandwidth,
      deferNonCriticalScripts: isLowBandwidth,
      connectionType: connection
    }
  }

  return {
    // Core metrics
    getAllMetrics,
    getCoreWebVitals,
    
    // Individual measurements
    measureResourceLoadTime,
    measurePageLoadTime,
    measureDOMContentLoadedTime,
    measureFirstPaint,
    measureFirstContentfulPaint,
    
    // Connection-based optimizations
    getConnectionInfo,
    isSlowConnection,
    shouldOptimizeForSlowConnection,
    getOptimizedImageSizes,
    shouldPreloadImages,
    getRecommendedChunkSize,
    
    // Monitoring
    monitorPerformance,
    optimizeForConnection,
    
    // Individual getters
    getMemoryInfo,
    getNavigationTiming,
    getPaintTiming,
    getResourceTiming
  }
}