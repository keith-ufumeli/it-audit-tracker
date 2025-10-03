import jsPDF from 'jspdf'
import { Report } from './database'

export interface ReportDownloadOptions {
  format: 'pdf' | 'csv' | 'txt'
  includeMetadata?: boolean
  includeFindings?: boolean
  includeRecommendations?: boolean
}

export class ReportDownloader {
  /**
   * Download report as PDF
   */
  static async downloadAsPDF(report: Report, options: ReportDownloadOptions = { format: 'pdf' }): Promise<void> {
    try {
      const doc = new jsPDF()
      let yPosition = 20
      const pageHeight = 280
      const margin = 20

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        doc.setFontSize(fontSize)
        if (isBold) {
          doc.setFont(undefined, 'bold')
        } else {
          doc.setFont(undefined, 'normal')
        }

        const lines = doc.splitTextToSize(text, 170)
        lines.forEach((line: string) => {
          if (yPosition > pageHeight) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(line, margin, yPosition)
          yPosition += fontSize * 0.4
        })
        yPosition += 5
      }

      // Helper function to add section header
      const addSectionHeader = (text: string) => {
        yPosition += 10
        addText(text, 14, true)
        yPosition += 5
      }

      // Report Header
      addText(report.title, 16, true)
      addText(`Audit: ${report.auditTitle}`, 12)
      addText(`Type: ${report.reportType}`, 12)
      addText(`Status: ${report.status}`, 12)
      addText(`Created by: ${report.createdByName}`, 12)
      addText(`Created: ${new Date(report.createdAt).toLocaleDateString()}`, 12)
      
      if (report.submittedAt) {
        addText(`Submitted: ${new Date(report.submittedAt).toLocaleDateString()}`, 12)
      }
      if (report.approvedAt) {
        addText(`Approved: ${new Date(report.approvedAt).toLocaleDateString()}`, 12)
      }

      yPosition += 10

      // Report Content
      if (report.content) {
        addSectionHeader('Report Content')
        addText(report.content, 10)
      }

      // Findings
      if (options.includeFindings !== false && report.findings && report.findings.length > 0) {
        addSectionHeader('Key Findings')
        report.findings.forEach((finding: string, index: number) => {
          addText(`${index + 1}. ${finding}`, 10)
        })
      }

      // Recommendations
      if (options.includeRecommendations !== false && report.recommendations && report.recommendations.length > 0) {
        addSectionHeader('Recommendations')
        report.recommendations.forEach((recommendation: string, index: number) => {
          addText(`${index + 1}. ${recommendation}`, 10)
        })
      }

      // Footer
      const pageCount = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleDateString()}`,
          margin,
          290
        )
      }

      // Download the PDF
      const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  /**
   * Download report as CSV
   */
  static async downloadAsCSV(report: Report, options: ReportDownloadOptions = { format: 'csv' }): Promise<void> {
    try {
      const csvRows: string[] = []
      
      // Report metadata
      csvRows.push('Field,Value')
      csvRows.push(`Title,"${report.title}"`)
      csvRows.push(`Audit,"${report.auditTitle}"`)
      csvRows.push(`Type,"${report.reportType}"`)
      csvRows.push(`Status,"${report.status}"`)
      csvRows.push(`Created By,"${report.createdByName}"`)
      csvRows.push(`Created,"${new Date(report.createdAt).toLocaleDateString()}"`)
      
      if (report.submittedAt) {
        csvRows.push(`Submitted,"${new Date(report.submittedAt).toLocaleDateString()}"`)
      }
      if (report.approvedAt) {
        csvRows.push(`Approved,"${new Date(report.approvedAt).toLocaleDateString()}"`)
      }
      
      csvRows.push('') // Empty row
      
      // Report content
      if (report.content) {
        csvRows.push('Content')
        csvRows.push(`"${report.content.replace(/"/g, '""')}"`)
        csvRows.push('') // Empty row
      }
      
      // Findings
      if (options.includeFindings !== false && report.findings && report.findings.length > 0) {
        csvRows.push('Findings')
        report.findings.forEach((finding: string, index: number) => {
          csvRows.push(`${index + 1},"${finding.replace(/"/g, '""')}"`)
        })
        csvRows.push('') // Empty row
      }
      
      // Recommendations
      if (options.includeRecommendations !== false && report.recommendations && report.recommendations.length > 0) {
        csvRows.push('Recommendations')
        report.recommendations.forEach((recommendation: string, index: number) => {
          csvRows.push(`${index + 1},"${recommendation.replace(/"/g, '""')}"`)
        })
      }
      
      // Create and download CSV
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error generating CSV:', error)
      throw new Error('Failed to generate CSV report')
    }
  }

  /**
   * Download report as plain text
   */
  static async downloadAsText(report: Report, options: ReportDownloadOptions = { format: 'txt' }): Promise<void> {
    try {
      const textRows: string[] = []
      
      // Report header
      textRows.push(report.title)
      textRows.push('='.repeat(report.title.length))
      textRows.push('')
      textRows.push(`Audit: ${report.auditTitle}`)
      textRows.push(`Type: ${report.reportType}`)
      textRows.push(`Status: ${report.status}`)
      textRows.push(`Created by: ${report.createdByName}`)
      textRows.push(`Created: ${new Date(report.createdAt).toLocaleDateString()}`)
      
      if (report.submittedAt) {
        textRows.push(`Submitted: ${new Date(report.submittedAt).toLocaleDateString()}`)
      }
      if (report.approvedAt) {
        textRows.push(`Approved: ${new Date(report.approvedAt).toLocaleDateString()}`)
      }
      
      textRows.push('')
      textRows.push('')
      
      // Report content
      if (report.content) {
        textRows.push('REPORT CONTENT')
        textRows.push('-'.repeat(15))
        textRows.push('')
        textRows.push(report.content)
        textRows.push('')
      }
      
      // Findings
      if (options.includeFindings !== false && report.findings && report.findings.length > 0) {
        textRows.push('KEY FINDINGS')
        textRows.push('-'.repeat(12))
        textRows.push('')
        report.findings.forEach((finding: string, index: number) => {
          textRows.push(`${index + 1}. ${finding}`)
        })
        textRows.push('')
      }
      
      // Recommendations
      if (options.includeRecommendations !== false && report.recommendations && report.recommendations.length > 0) {
        textRows.push('RECOMMENDATIONS')
        textRows.push('-'.repeat(15))
        textRows.push('')
        report.recommendations.forEach((recommendation: string, index: number) => {
          textRows.push(`${index + 1}. ${recommendation}`)
        })
      }
      
      // Create and download text file
      const textContent = textRows.join('\n')
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error generating text file:', error)
      throw new Error('Failed to generate text report')
    }
  }

  /**
   * Download report in specified format
   */
  static async downloadReport(report: Report, format: 'pdf' | 'csv' | 'txt', options?: Partial<ReportDownloadOptions>): Promise<void> {
    const downloadOptions: ReportDownloadOptions = {
      format,
      includeMetadata: true,
      includeFindings: true,
      includeRecommendations: true,
      ...options
    }

    switch (format) {
      case 'pdf':
        await this.downloadAsPDF(report, downloadOptions)
        break
      case 'csv':
        await this.downloadAsCSV(report, downloadOptions)
        break
      case 'txt':
        await this.downloadAsText(report, downloadOptions)
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }
}
