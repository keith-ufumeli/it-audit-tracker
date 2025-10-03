// Import system settings data directly for Edge Runtime compatibility
import systemSettingsData from '../data/system-settings.json'

export interface DatabaseSettings {
  backupEnabled: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupRetentionDays: number
  autoCleanupEnabled: boolean
  cleanupFrequency: 'daily' | 'weekly' | 'monthly'
  maxLogRetentionDays: number
  maxActivityRetentionDays: number
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  lockoutDurationMinutes: number
  passwordMinLength: number
  requirePasswordComplexity: boolean
  twoFactorAuthEnabled: boolean
  ipWhitelistEnabled: boolean
  allowedIPs: string[]
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean
  systemNotificationsEnabled: boolean
  auditReminderEnabled: boolean
  auditReminderDays: number
  reportGenerationNotifications: boolean
  securityAlertNotifications: boolean
}

export interface AuditSettings {
  defaultAuditDurationDays: number
  autoCloseInactiveAudits: boolean
  inactiveAuditThresholdDays: number
  requireApprovalForAuditClosure: boolean
  allowBulkAuditOperations: boolean
  maxConcurrentAudits: number
}

export interface ReportingSettings {
  defaultReportFormat: 'pdf' | 'excel' | 'csv'
  autoGenerateReports: boolean
  reportRetentionDays: number
  allowCustomReportTemplates: boolean
  maxReportSizeMB: number
  enableReportScheduling: boolean
}

export interface SystemSettings {
  maintenanceMode: boolean
  debugMode: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxFileUploadSizeMB: number
  allowedFileTypes: string[]
  enableActivityLogging: boolean
  enablePerformanceMonitoring: boolean
}

export interface IntegrationSettings {
  emailServiceEnabled: boolean
  emailServiceProvider: 'smtp' | 'sendgrid' | 'mailgun'
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword: string
  webhookNotificationsEnabled: boolean
  webhookUrl: string
  apiAccessEnabled: boolean
  apiRateLimit: number
}

export interface SystemConfiguration {
  database: DatabaseSettings
  security: SecuritySettings
  notifications: NotificationSettings
  audit: AuditSettings
  reporting: ReportingSettings
  system: SystemSettings
  integrations: IntegrationSettings
}

export class SystemSettingsManager {
  private static instance: SystemSettingsManager
  private settings!: SystemConfiguration

  private constructor() {
    this.loadSettings()
  }

  public static getInstance(): SystemSettingsManager {
    if (!SystemSettingsManager.instance) {
      SystemSettingsManager.instance = new SystemSettingsManager()
    }
    return SystemSettingsManager.instance
  }

  private loadSettings(): void {
    try {
      // Use imported data for Edge Runtime compatibility
      this.settings = systemSettingsData as SystemConfiguration
    } catch (error) {
      console.error('Error loading system settings:', error)
      this.settings = this.getDefaultSettings()
    }
  }

  private getDefaultSettings(): SystemConfiguration {
    return {
      database: {
        backupEnabled: true,
        backupFrequency: 'daily',
        backupRetentionDays: 30,
        autoCleanupEnabled: true,
        cleanupFrequency: 'weekly',
        maxLogRetentionDays: 90,
        maxActivityRetentionDays: 180
      },
      security: {
        sessionTimeoutMinutes: 60,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
        passwordMinLength: 8,
        requirePasswordComplexity: true,
        twoFactorAuthEnabled: false,
        ipWhitelistEnabled: false,
        allowedIPs: []
      },
      notifications: {
        emailNotificationsEnabled: true,
        systemNotificationsEnabled: true,
        auditReminderEnabled: true,
        auditReminderDays: 3,
        reportGenerationNotifications: true,
        securityAlertNotifications: true
      },
      audit: {
        defaultAuditDurationDays: 30,
        autoCloseInactiveAudits: true,
        inactiveAuditThresholdDays: 90,
        requireApprovalForAuditClosure: true,
        allowBulkAuditOperations: true,
        maxConcurrentAudits: 50
      },
      reporting: {
        defaultReportFormat: 'pdf',
        autoGenerateReports: false,
        reportRetentionDays: 365,
        allowCustomReportTemplates: true,
        maxReportSizeMB: 100,
        enableReportScheduling: true
      },
      system: {
        maintenanceMode: false,
        debugMode: false,
        logLevel: 'info',
        maxFileUploadSizeMB: 50,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'png'],
        enableActivityLogging: true,
        enablePerformanceMonitoring: true
      },
      integrations: {
        emailServiceEnabled: false,
        emailServiceProvider: 'smtp',
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        webhookNotificationsEnabled: false,
        webhookUrl: '',
        apiAccessEnabled: true,
        apiRateLimit: 1000
      }
    }
  }

  public getAllSettings(): SystemConfiguration {
    return this.settings
  }

  public getDatabaseSettings(): DatabaseSettings {
    return this.settings.database
  }

  public getSecuritySettings(): SecuritySettings {
    return this.settings.security
  }

  public getNotificationSettings(): NotificationSettings {
    return this.settings.notifications
  }

  public getAuditSettings(): AuditSettings {
    return this.settings.audit
  }

  public getReportingSettings(): ReportingSettings {
    return this.settings.reporting
  }

  public getSystemSettings(): SystemSettings {
    return this.settings.system
  }

  public getIntegrationSettings(): IntegrationSettings {
    return this.settings.integrations
  }

  public updateDatabaseSettings(settings: Partial<DatabaseSettings>): boolean {
    try {
      this.settings.database = { ...this.settings.database, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating database settings:', error)
      return false
    }
  }

  public updateSecuritySettings(settings: Partial<SecuritySettings>): boolean {
    try {
      this.settings.security = { ...this.settings.security, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating security settings:', error)
      return false
    }
  }

  public updateNotificationSettings(settings: Partial<NotificationSettings>): boolean {
    try {
      this.settings.notifications = { ...this.settings.notifications, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating notification settings:', error)
      return false
    }
  }

  public updateAuditSettings(settings: Partial<AuditSettings>): boolean {
    try {
      this.settings.audit = { ...this.settings.audit, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating audit settings:', error)
      return false
    }
  }

  public updateReportingSettings(settings: Partial<ReportingSettings>): boolean {
    try {
      this.settings.reporting = { ...this.settings.reporting, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating reporting settings:', error)
      return false
    }
  }

  public updateSystemSettings(settings: Partial<SystemSettings>): boolean {
    try {
      this.settings.system = { ...this.settings.system, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating system settings:', error)
      return false
    }
  }

  public updateIntegrationSettings(settings: Partial<IntegrationSettings>): boolean {
    try {
      this.settings.integrations = { ...this.settings.integrations, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating integration settings:', error)
      return false
    }
  }

  public updateAllSettings(settings: Partial<SystemConfiguration>): boolean {
    try {
      this.settings = { ...this.settings, ...settings }
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error updating all settings:', error)
      return false
    }
  }

  public resetToDefaults(): boolean {
    try {
      this.settings = this.getDefaultSettings()
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Error resetting settings to defaults:', error)
      return false
    }
  }

  private saveSettings(): void {
    try {
      // Note: In Edge Runtime, we can't write to files
      // Settings are updated in memory only
      // In production, this would save to a database or external API
      console.log('Settings updated in memory (Edge Runtime compatible)')
    } catch (error) {
      console.error('Error saving system settings:', error)
    }
  }

  public validateSettings(settings: Partial<SystemConfiguration>): string[] {
    const errors: string[] = []

    if (settings.database) {
      if (settings.database.backupRetentionDays && settings.database.backupRetentionDays < 1) {
        errors.push('Backup retention days must be at least 1')
      }
      if (settings.database.maxLogRetentionDays && settings.database.maxLogRetentionDays < 1) {
        errors.push('Log retention days must be at least 1')
      }
    }

    if (settings.security) {
      if (settings.security.sessionTimeoutMinutes && settings.security.sessionTimeoutMinutes < 5) {
        errors.push('Session timeout must be at least 5 minutes')
      }
      if (settings.security.maxLoginAttempts && settings.security.maxLoginAttempts < 1) {
        errors.push('Max login attempts must be at least 1')
      }
      if (settings.security.passwordMinLength && settings.security.passwordMinLength < 6) {
        errors.push('Password minimum length must be at least 6 characters')
      }
    }

    if (settings.audit) {
      if (settings.audit.defaultAuditDurationDays && settings.audit.defaultAuditDurationDays < 1) {
        errors.push('Default audit duration must be at least 1 day')
      }
      if (settings.audit.maxConcurrentAudits && settings.audit.maxConcurrentAudits < 1) {
        errors.push('Max concurrent audits must be at least 1')
      }
    }

    if (settings.system) {
      if (settings.system.maxFileUploadSizeMB && settings.system.maxFileUploadSizeMB < 1) {
        errors.push('Max file upload size must be at least 1 MB')
      }
    }

    if (settings.integrations) {
      if (settings.integrations.smtpPort && (settings.integrations.smtpPort < 1 || settings.integrations.smtpPort > 65535)) {
        errors.push('SMTP port must be between 1 and 65535')
      }
      if (settings.integrations.apiRateLimit && settings.integrations.apiRateLimit < 1) {
        errors.push('API rate limit must be at least 1')
      }
    }

    return errors
  }
}
