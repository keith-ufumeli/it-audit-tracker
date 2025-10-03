"use client"

import React, { useState, useEffect } from 'react'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Loader } from './loader'
import { 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

// Dynamic imports for client-side only libraries
let Document: any, Page: any, pdfjs: any

interface DocumentViewerProps {
  documentId: string
  documentTitle: string
  fileType: string
  onClose: () => void
}

interface ViewerState {
  loading: boolean
  error: string | null
  content: string | null
  numPages: number | null
  currentPage: number
  scale: number
  rotation: number
}

export function DocumentViewer({ documentId, documentTitle, fileType, onClose }: DocumentViewerProps) {
  const [state, setState] = useState<ViewerState>({
    loading: true,
    error: null,
    content: null,
    numPages: null,
    currentPage: 1,
    scale: 1.0,
    rotation: 0
  })

  const [showControls, setShowControls] = useState(true)
  const [pdfLibrariesLoaded, setPdfLibrariesLoaded] = useState<'loading' | 'loaded' | 'failed'>('loading')

  useEffect(() => {
    loadPdfLibraries()
    loadDocument()
  }, [documentId])

  const loadPdfLibraries = async () => {
    if (typeof window === 'undefined') return
    
    try {
      const { Document: PDFDocument, Page: PDFPage, pdfjs: PDFjs } = await import('react-pdf')
      Document = PDFDocument
      Page = PDFPage
      pdfjs = PDFjs
      
      // Set up PDF.js worker
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
      
      setPdfLibrariesLoaded('loaded')
    } catch (error) {
      console.error('Failed to load PDF libraries:', error)
      setPdfLibrariesLoaded('failed')
    }
  }

  const loadDocument = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(`/api/documents/${documentId}/view`)
      if (!response.ok) {
        throw new Error('Failed to load document')
      }

      const blob = await response.blob()
      
      switch (fileType.toLowerCase()) {
        case '.pdf':
          // PDF will be handled by react-pdf component
          setState(prev => ({ ...prev, loading: false }))
          break
          
        case '.doc':
        case '.docx':
          const docxArrayBuffer = await blob.arrayBuffer()
          const docxResult = await mammoth.convertToHtml({ arrayBuffer: docxArrayBuffer })
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            content: docxResult.value,
            error: docxResult.messages.length > 0 ? 'Some formatting may not display correctly' : null
          }))
          break
          
        case '.xls':
        case '.xlsx':
          const xlsxArrayBuffer = await blob.arrayBuffer()
          const workbook = XLSX.read(xlsxArrayBuffer, { type: 'array' })
          const htmlContent = XLSX.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]])
          setState(prev => ({ ...prev, loading: false, content: htmlContent }))
          break
          
        case '.txt':
          const textContent = await blob.text()
          setState(prev => ({ ...prev, loading: false, content: textContent }))
          break
          
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
          const imageUrl = URL.createObjectURL(blob)
          setState(prev => ({ ...prev, loading: false, content: imageUrl }))
          break
          
        default:
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'This file type is not supported for viewing' 
          }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load document' 
      }))
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setState(prev => ({ ...prev, numPages, loading: false }))
  }

  const onDocumentLoadError = (error: Error) => {
    setState(prev => ({ ...prev, error: error.message, loading: false }))
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = documentTitle
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const renderContent = () => {
    if (state.loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader />
        </div>
      )
    }

    if (state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Document</h3>
          <p className="text-muted-foreground mb-4">{state.error}</p>
          <Button onClick={loadDocument} variant="outline">
            Try Again
          </Button>
        </div>
      )
    }

    switch (fileType.toLowerCase()) {
      case '.pdf':
        if (pdfLibrariesLoaded === 'loading' || !Document || !Page) {
          return (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader />
                <p className="mt-2 text-sm text-muted-foreground">Loading PDF viewer...</p>
              </div>
            </div>
          )
        }
        
        // Fallback if PDF libraries failed to load
        if (pdfLibrariesLoaded === 'failed') {
          return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">PDF Viewer Unavailable</h3>
              <p className="text-muted-foreground mb-4">
                PDF viewer failed to load. You can still download the document.
              </p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )
        }
        
        return (
          <div className="flex flex-col items-center">
            <Document
              file={`/api/documents/${documentId}/view`}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Loader />}
            >
              <Page
                pageNumber={state.currentPage}
                scale={state.scale}
                rotate={state.rotation}
                className="shadow-lg"
              />
            </Document>
            
            {state.numPages && state.numPages > 1 && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState(prev => ({ 
                    ...prev, 
                    currentPage: Math.max(1, prev.currentPage - 1) 
                  }))}
                  disabled={state.currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {state.currentPage} of {state.numPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState(prev => ({ 
                    ...prev, 
                    currentPage: Math.min(state.numPages!, prev.currentPage + 1) 
                  }))}
                  disabled={state.currentPage >= state.numPages!}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )

      case '.doc':
      case '.docx':
        return (
          <div className="prose max-w-none">
            <div 
              dangerouslySetInnerHTML={{ __html: state.content || '' }}
              className="p-6 bg-white rounded-lg shadow-sm border"
            />
          </div>
        )

      case '.xls':
      case '.xlsx':
        return (
          <div className="overflow-auto">
            <div 
              dangerouslySetInnerHTML={{ __html: state.content || '' }}
              className="min-w-full"
            />
          </div>
        )

      case '.txt':
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {state.content}
            </pre>
          </div>
        )

      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
        return (
          <div className="flex justify-center">
            <img 
              src={state.content || ''} 
              alt={documentTitle}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
            <p className="text-muted-foreground mb-4">
              This file type cannot be previewed in the browser
            </p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download to View
            </Button>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{documentTitle}</CardTitle>
            <Badge variant="secondary">{fileType.toUpperCase()}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {fileType.toLowerCase() === '.pdf' && state.numPages && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.25) }))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {Math.round(state.scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.25) }))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowControls(!showControls)}
            >
              {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
