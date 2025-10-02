import { useState, useCallback } from 'react'

interface LoadingState {
  isLoading: boolean
  loadingText: string
  progress?: number
}

export function useLoading(initialText: string = "Loading...") {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingText: initialText,
    progress: undefined
  })

  const startLoading = useCallback((text?: string, progress?: number) => {
    setLoadingState({
      isLoading: true,
      loadingText: text || initialText,
      progress
    })
  }, [initialText])

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }))
  }, [])

  const updateLoading = useCallback((text?: string, progress?: number) => {
    setLoadingState(prev => ({
      ...prev,
      loadingText: text || prev.loadingText,
      progress: progress !== undefined ? progress : prev.progress
    }))
  }, [])

  const setProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress
    }))
  }, [])

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    updateLoading,
    setProgress
  }
}

// Hook for async operations with loading states
export function useAsyncLoading<T>() {
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean
    error: Error | null
    data: T | null
  }>({
    isLoading: false,
    error: null,
    data: null
  })

  const execute = useCallback(async (
    asyncFn: () => Promise<T>,
    loadingText?: string
  ) => {
    setLoadingState({
      isLoading: true,
      error: null,
      data: null
    })

    try {
      const result = await asyncFn()
      setLoadingState({
        isLoading: false,
        error: null,
        data: result
      })
      return result
    } catch (error) {
      setLoadingState({
        isLoading: false,
        error: error as Error,
        data: null
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      error: null,
      data: null
    })
  }, [])

  return {
    ...loadingState,
    execute,
    reset
  }
}

// Hook for multiple loading states
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)
  const isLoading = (key: string) => loadingStates[key] || false

  return {
    setLoading,
    isAnyLoading,
    isLoading,
    loadingStates
  }
}
