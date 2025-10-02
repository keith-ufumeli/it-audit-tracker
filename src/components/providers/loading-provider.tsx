"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { FullPageLoader } from '@/components/ui/loader'

interface LoadingContextType {
  isLoading: boolean
  loadingText: string
  progress?: number
  startLoading: (text?: string, progress?: number) => void
  stopLoading: () => void
  updateLoading: (text?: string, progress?: number) => void
  setProgress: (progress: number) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("Loading...")
  const [progress, setProgress] = useState<number | undefined>(undefined)

  const startLoading = useCallback((text?: string, progress?: number) => {
    setIsLoading(true)
    if (text) setLoadingText(text)
    if (progress !== undefined) setProgress(progress)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const updateLoading = useCallback((text?: string, progress?: number) => {
    if (text) setLoadingText(text)
    if (progress !== undefined) setProgress(progress)
  }, [])

  const setProgressValue = useCallback((progress: number) => {
    setProgress(progress)
  }, [])

  const value: LoadingContextType = {
    isLoading,
    loadingText,
    progress,
    startLoading,
    stopLoading,
    updateLoading,
    setProgress: setProgressValue
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <FullPageLoader 
            text={loadingText} 
            variant="primary"
          />
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider')
  }
  return context
}
