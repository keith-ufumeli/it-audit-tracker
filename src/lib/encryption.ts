// Data Encryption Utility for Sensitive Information
// Provides encryption/decryption capabilities for sensitive data

import crypto from 'crypto'

export interface EncryptionConfig {
  algorithm: string
  keyLength: number
  ivLength: number
  tagLength: number
}

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
  algorithm: string
}

export class EncryptionService {
  private static instance: EncryptionService
  private config: EncryptionConfig
  private masterKey: Buffer

  private constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32, // 256 bits
      ivLength: 16,  // 128 bits
      tagLength: 16  // 128 bits
    }

    // Get master key from environment or generate one
    const masterKeyString = process.env.ENCRYPTION_MASTER_KEY || this.generateMasterKey()
    this.masterKey = Buffer.from(masterKeyString, 'hex')
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  // Generate a new master key (for initial setup)
  private generateMasterKey(): string {
    const key = crypto.randomBytes(this.config.keyLength)
    console.warn('Generated new encryption master key. Store this in ENCRYPTION_MASTER_KEY environment variable:', key.toString('hex'))
    return key.toString('hex')
  }

  // Derive a key for specific data type
  private deriveKey(dataType: string, salt?: string): Buffer {
    const keySalt = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16)
    return crypto.pbkdf2Sync(this.masterKey, new Uint8Array(Buffer.concat([Buffer.from(dataType), keySalt])), 100000, this.config.keyLength, 'sha256')
  }

  // Encrypt sensitive data
  public encrypt(data: string, dataType: string = 'default'): EncryptedData {
    try {
      const iv = crypto.randomBytes(this.config.ivLength)
      const key = this.deriveKey(dataType)
      const cipher = crypto.createCipher(this.config.algorithm, key)

      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: '', // Basic cipher doesn't support auth tags
        algorithm: this.config.algorithm
      }
    } catch (error) {
      console.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  // Decrypt sensitive data
  public decrypt(encryptedData: EncryptedData, dataType: string = 'default'): string {
    try {
      const key = this.deriveKey(dataType)
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const decipher = crypto.createDecipher(encryptedData.algorithm, key)

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  // Encrypt user data
  public encryptUserData(userData: any): any {
    const sensitiveFields = ['email', 'phone', 'ssn', 'address', 'personalNotes']
    const encryptedData = { ...userData }

    for (const field of sensitiveFields) {
      if (userData[field] && typeof userData[field] === 'string') {
        encryptedData[field] = this.encrypt(userData[field], 'user_data')
      }
    }

    return encryptedData
  }

  // Decrypt user data
  public decryptUserData(encryptedUserData: any): any {
    const sensitiveFields = ['email', 'phone', 'ssn', 'address', 'personalNotes']
    const decryptedData = { ...encryptedUserData }

    for (const field of sensitiveFields) {
      if (encryptedUserData[field] && typeof encryptedUserData[field] === 'object' && encryptedUserData[field].encrypted) {
        try {
          decryptedData[field] = this.decrypt(encryptedUserData[field], 'user_data')
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error)
          decryptedData[field] = '[ENCRYPTED]'
        }
      }
    }

    return decryptedData
  }

  // Encrypt document content
  public encryptDocumentContent(content: string, documentId: string): EncryptedData {
    return this.encrypt(content, `document_${documentId}`)
  }

  // Decrypt document content
  public decryptDocumentContent(encryptedContent: EncryptedData, documentId: string): string {
    return this.decrypt(encryptedContent, `document_${documentId}`)
  }

  // Encrypt audit trail entry
  public encryptAuditTrailEntry(entry: any): any {
    const sensitiveFields = ['ipAddress', 'userAgent', 'beforeState', 'afterState', 'metadata']
    const encryptedEntry = { ...entry }

    for (const field of sensitiveFields) {
      if (entry[field]) {
        if (typeof entry[field] === 'string') {
          encryptedEntry[field] = this.encrypt(entry[field], 'audit_trail')
        } else if (typeof entry[field] === 'object') {
          encryptedEntry[field] = this.encrypt(JSON.stringify(entry[field]), 'audit_trail')
        }
      }
    }

    return encryptedEntry
  }

  // Decrypt audit trail entry
  public decryptAuditTrailEntry(encryptedEntry: any): any {
    const sensitiveFields = ['ipAddress', 'userAgent', 'beforeState', 'afterState', 'metadata']
    const decryptedEntry = { ...encryptedEntry }

    for (const field of sensitiveFields) {
      if (encryptedEntry[field] && typeof encryptedEntry[field] === 'object' && encryptedEntry[field].encrypted) {
        try {
          const decrypted = this.decrypt(encryptedEntry[field], 'audit_trail')
          if (field === 'beforeState' || field === 'afterState' || field === 'metadata') {
            decryptedEntry[field] = JSON.parse(decrypted)
          } else {
            decryptedEntry[field] = decrypted
          }
        } catch (error) {
          console.error(`Failed to decrypt audit trail field ${field}:`, error)
          decryptedEntry[field] = '[ENCRYPTED]'
        }
      }
    }

    return decryptedEntry
  }

  // Hash sensitive data (one-way)
  public hash(data: string, salt?: string): string {
    const hashSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(data, hashSalt, 100000, 64, 'sha256')
    return `${hashSalt}:${hash.toString('hex')}`
  }

  // Verify hashed data
  public verifyHash(data: string, hashedData: string): boolean {
    try {
      const [salt, hash] = hashedData.split(':')
      const newHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha256')
      return newHash.toString('hex') === hash
    } catch (error) {
      return false
    }
  }

  // Generate secure random token
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  // Generate secure password
  public generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  // Mask sensitive data for display
  public maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length)
    }
    return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars)
  }

  // Check if data is encrypted
  public isEncrypted(data: any): boolean {
    return data && typeof data === 'object' && data.encrypted && data.iv && data.tag
  }

  // Get encryption status
  public getEncryptionStatus(): {
    enabled: boolean
    algorithm: string
    keyLength: number
    masterKeySet: boolean
  } {
    return {
      enabled: true,
      algorithm: this.config.algorithm,
      keyLength: this.config.keyLength * 8, // Convert to bits
      masterKeySet: !!process.env.ENCRYPTION_MASTER_KEY
    }
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance()

// Utility functions for common encryption tasks
export const encryptUserEmail = (email: string) => encryptionService.encrypt(email, 'user_email')
export const decryptUserEmail = (encryptedEmail: EncryptedData) => encryptionService.decrypt(encryptedEmail, 'user_email')

export const encryptDocumentContent = (content: string, documentId: string) => 
  encryptionService.encryptDocumentContent(content, documentId)

export const decryptDocumentContent = (encryptedContent: EncryptedData, documentId: string) => 
  encryptionService.decryptDocumentContent(encryptedContent, documentId)

export const hashPassword = (password: string) => encryptionService.hash(password)
export const verifyPassword = (password: string, hashedPassword: string) => 
  encryptionService.verifyHash(password, hashedPassword)

export const generateSecureToken = (length?: number) => encryptionService.generateSecureToken(length)
export const generateSecurePassword = (length?: number) => encryptionService.generateSecurePassword(length)
export const maskSensitiveData = (data: string, visibleChars?: number) => 
  encryptionService.maskSensitiveData(data, visibleChars)
