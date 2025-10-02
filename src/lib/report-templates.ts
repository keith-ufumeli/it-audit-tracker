import { ReportConfig } from './report-generator'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'audit' | 'compliance' | 'activity' | 'custom'
  config: ReportConfig
  isDefault: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export class ReportTemplateManager {
  private static templates: ReportTemplate[] = [
    {
      id: 'template-001',
      name: 'Executive Summary Report',
      description: 'High-level overview for management and executives',
      type: 'audit',
      config: {
        title: 'Executive Summary Report',
        subtitle: 'Comprehensive audit overview for management review',
        includeCharts: true,
        includeDetails: false,
        filters: {
          status: ['completed', 'in_progress']
        }
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-002',
      name: 'Compliance Assessment',
      description: 'Detailed compliance evaluation and findings',
      type: 'compliance',
      config: {
        title: 'Compliance Assessment Report',
        subtitle: 'Detailed compliance evaluation and recommendations',
        includeCharts: true,
        includeDetails: true,
        filters: {
          severity: ['critical', 'error']
        }
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-003',
      name: 'Security Activity Report',
      description: 'Security events and suspicious activities',
      type: 'activity',
      config: {
        title: 'Security Activity Report',
        subtitle: 'Security events and system activity analysis',
        includeCharts: false,
        includeDetails: true,
        filters: {
          severity: ['critical', 'error', 'warning']
        }
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-004',
      name: 'Monthly Audit Report',
      description: 'Monthly summary of all audit activities',
      type: 'audit',
      config: {
        title: 'Monthly Audit Report',
        subtitle: 'Monthly summary of audit activities and progress',
        includeCharts: true,
        includeDetails: true,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-005',
      name: 'Document Status Report',
      description: 'Current status of all document requests',
      type: 'audit',
      config: {
        title: 'Document Status Report',
        subtitle: 'Current status and progress of document requests',
        includeCharts: true,
        includeDetails: true,
        filters: {
          status: ['pending', 'submitted', 'draft']
        }
      },
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  public static getTemplates(): ReportTemplate[] {
    return this.templates
  }

  public static getTemplateById(id: string): ReportTemplate | undefined {
    return this.templates.find(template => template.id === id)
  }

  public static getTemplatesByType(type: string): ReportTemplate[] {
    return this.templates.filter(template => template.type === type)
  }

  public static getDefaultTemplates(): ReportTemplate[] {
    return this.templates.filter(template => template.isDefault)
  }

  public static createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ReportTemplate {
    const newTemplate: ReportTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.templates.push(newTemplate)
    return newTemplate
  }

  public static updateTemplate(id: string, updates: Partial<ReportTemplate>): boolean {
    const templateIndex = this.templates.findIndex(template => template.id === id)
    if (templateIndex === -1) return false

    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return true
  }

  public static deleteTemplate(id: string): boolean {
    const templateIndex = this.templates.findIndex(template => template.id === id)
    if (templateIndex === -1) return false

    // Don't allow deletion of default templates
    if (this.templates[templateIndex].isDefault) {
      return false
    }

    this.templates.splice(templateIndex, 1)
    return true
  }

  public static getTemplateCategories(): Array<{ type: string; count: number; description: string }> {
    const categories = [
      { type: 'audit', description: 'Audit-related reports and summaries' },
      { type: 'compliance', description: 'Compliance assessments and evaluations' },
      { type: 'activity', description: 'System activity and security reports' },
      { type: 'custom', description: 'Custom user-defined reports' }
    ]

    return categories.map(category => ({
      ...category,
      count: this.templates.filter(template => template.type === category.type).length
    }))
  }

  public static getPopularTemplates(): ReportTemplate[] {
    // In a real application, this would be based on usage statistics
    return this.templates.slice(0, 3)
  }

  public static cloneTemplate(id: string, newName: string, createdBy: string): ReportTemplate | null {
    const originalTemplate = this.getTemplateById(id)
    if (!originalTemplate) return null

    const clonedTemplate: ReportTemplate = {
      ...originalTemplate,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      isDefault: false,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.templates.push(clonedTemplate)
    return clonedTemplate
  }

  public static searchTemplates(query: string): ReportTemplate[] {
    const lowercaseQuery = query.toLowerCase()
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.type.toLowerCase().includes(lowercaseQuery)
    )
  }
}

export const reportTemplateManager = ReportTemplateManager
