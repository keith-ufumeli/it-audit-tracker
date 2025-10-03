/**
 * Email Simulation Utility
 * 
 * Simulates email notifications for the audit tracker system.
 * In a production environment, this would integrate with a service like:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Postmark
 */

export interface EmailNotification {
  to: string
  subject: string
  message: string
  type: string
  metadata?: Record<string, unknown>
}

export interface SimulatedEmail extends EmailNotification {
  id: string
  from: string
  sentAt: string
  status: "sent" | "failed"
}

interface DocumentUploadData {
  documentTitle: string
  uploadedByName: string
  uploadedAt: string
  notes?: string
}

interface AuditUpdateData {
  auditTitle: string
  updatedByName: string
  updatedAt: string
  changes: string
}

interface ReportGeneratedData {
  reportTitle: string
  reportType: string
  generatedByName: string
  generatedAt: string
  downloadUrl?: string
}

interface SecurityAlertData {
  alertType: string
  severity: string
  triggeredByName: string
  triggeredAt: string
  description: string
}

interface DocumentRequestData {
  documentTitle: string
  description: string
  dueDate: string
  requestedByName: string
}

interface AuditAssignmentData {
  auditTitle: string
  assignedByName: string
  assignedAt: string
  dueDate: string
  description: string
  startDate: string
  endDate: string
}

interface ReportReadyData {
  auditTitle: string
  reportTitle: string
  generatedByName: string
  generatedAt: string
  downloadUrl?: string
  preparedByName: string
  submittedAt: string
}

type EmailTemplateData = DocumentUploadData | DocumentRequestData | AuditAssignmentData | ReportReadyData | AuditUpdateData | ReportGeneratedData | SecurityAlertData

// In-memory storage for simulated emails
const simulatedEmails: SimulatedEmail[] = []

/**
 * Simulates sending an email notification
 * Logs to console and stores in memory for inspection
 */
export async function sendEmailNotification(
  notification: EmailNotification
): Promise<SimulatedEmail> {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const email: SimulatedEmail = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    from: "noreply@audit-tracker.com",
    ...notification,
    sentAt: new Date().toISOString(),
    status: "sent"
  }

  // Store simulated email
  simulatedEmails.push(email)

  // Log to console (simulating email service)
  console.log("\n📧 ===== EMAIL NOTIFICATION =====")
  console.log(`Email ID: ${email.id}`)
  console.log(`From: ${email.from}`)
  console.log(`To: ${email.to}`)
  console.log(`Subject: ${email.subject}`)
  console.log(`Type: ${email.type}`)
  console.log(`Sent At: ${email.sentAt}`)
  console.log("\n--- Message ---")
  console.log(email.message)
  
  if (email.metadata && Object.keys(email.metadata).length > 0) {
    console.log("\n--- Metadata ---")
    console.log(JSON.stringify(email.metadata, null, 2))
  }
  
  console.log("================================\n")

  return email
}

/**
 * Send bulk email notifications
 */
export async function sendBulkEmailNotifications(
  recipients: string[],
  notification: Omit<EmailNotification, "to">
): Promise<SimulatedEmail[]> {
  const emails = await Promise.all(
    recipients.map(to => 
      sendEmailNotification({ ...notification, to })
    )
  )
  
  console.log(`📧 Sent ${emails.length} bulk email notifications`)
  return emails
}

/**
 * Get all simulated emails (for testing/debugging)
 */
export function getSimulatedEmails(): SimulatedEmail[] {
  return [...simulatedEmails]
}

/**
 * Get emails for a specific recipient
 */
export function getEmailsForRecipient(email: string): SimulatedEmail[] {
  return simulatedEmails.filter(e => e.to === email)
}

/**
 * Clear simulated email history
 */
export function clearSimulatedEmails(): void {
  simulatedEmails.length = 0
  console.log("📧 Cleared simulated email history")
}

/**
 * Email templates for different notification types
 */
export const emailTemplates = {
  document_upload: (data: DocumentUploadData) => ({
    subject: `Document Uploaded: ${data.documentTitle}`,
    message: `
Hello,

${data.uploadedByName} has uploaded the document "${data.documentTitle}" as requested.

Document Details:
- Title: ${data.documentTitle}
- Uploaded By: ${data.uploadedByName}
- Uploaded At: ${new Date(data.uploadedAt).toLocaleString()}
${data.notes ? `- Notes: ${data.notes}` : ''}

Please log in to the audit tracker to review the document.

Best regards,
IT Audit Trail Tracker
    `.trim()
  }),

  document_request: (data: DocumentRequestData) => ({
    subject: `Document Request: ${data.documentTitle}`,
    message: `
Hello,

You have received a new document request from ${data.requestedByName}.

Document Details:
- Title: ${data.documentTitle}
- Description: ${data.description}
- Due Date: ${new Date(data.dueDate).toLocaleDateString()}
- Requested By: ${data.requestedByName}

Please upload the requested document by the due date.

Best regards,
IT Audit Trail Tracker
    `.trim()
  }),

  audit_assignment: (data: AuditAssignmentData) => ({
    subject: `Audit Assignment: ${data.auditTitle}`,
    message: `
Hello,

You have been assigned to the following audit:

Audit Details:
- Title: ${data.auditTitle}
- Assigned By: ${data.assignedByName}
- Start Date: ${new Date(data.startDate).toLocaleDateString()}
- End Date: ${new Date(data.endDate).toLocaleDateString()}

Please log in to the audit tracker to review the audit scope and begin your assessment.

Best regards,
IT Audit Trail Tracker
    `.trim()
  }),

  report_ready: (data: ReportReadyData) => ({
    subject: `Audit Report Ready: ${data.auditTitle}`,
    message: `
Hello,

The audit report for "${data.auditTitle}" is ready for your review.

Report Details:
- Prepared By: ${data.preparedByName}
- Submitted At: ${new Date(data.submittedAt).toLocaleString()}

Please log in to the audit tracker to review and approve the report.

Best regards,
IT Audit Trail Tracker
    `.trim()
  })
}

/**
 * Send templated email
 */
export async function sendTemplatedEmail(
  to: string,
  type: keyof typeof emailTemplates,
  data: EmailTemplateData
): Promise<SimulatedEmail> {
  const template = emailTemplates[type](data as any)
  
  return sendEmailNotification({
    to,
    ...template,
    type,
    metadata: data as unknown as Record<string, unknown>
  })
}

