import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { Database } from "@/lib/database"
import { PersistentDatabase } from "@/lib/persistent-database"
import { sendEmailNotification } from "@/lib/email-simulation"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const documentId = formData.get("documentId") as string
    const notes = formData.get("notes") as string | null

    if (!file || !documentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get document from database
    const document = Database.getDocumentById(documentId)
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "data", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${documentId}_${timestamp}_${originalName}`
    const filepath = path.join(uploadsDir, filename)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update document in database (both in-memory and persistent)
    Database.updateDocument(documentId, {
      status: "submitted",
      uploadedBy: session.user.id,
      uploadedAt: new Date().toISOString(),
      fileName: originalName,
      fileSize: file.size,
      filePath: filename
    })
    
    // Also update in persistent database
    await PersistentDatabase.updateDocument(documentId, {
      status: "submitted",
      uploadedBy: session.user.id,
      uploadedAt: new Date().toISOString(),
      fileName: originalName,
      fileSize: file.size,
      filePath: filename
    })

    // Log activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "document_upload",
      description: `Uploaded document: ${document.title}`,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "document",
      metadata: {
        documentId,
        fileName: originalName,
        fileSize: file.size,
        notes: notes || null,
      }
    })

    // Send email notification to auditor
    const auditor = Database.getUserById(document.requestedBy)
    if (auditor) {
      await sendEmailNotification({
        to: auditor.email,
        subject: `Document Uploaded: ${document.title}`,
        message: `${session.user.name} has uploaded the requested document "${document.title}".`,
        type: "document_upload",
        metadata: {
          documentId,
          documentTitle: document.title,
          uploadedBy: session.user.name,
          uploadedAt: new Date().toISOString(),
          notes: notes || null,
        }
      })
    }

    // Create notification for auditor
    const auditorInfo = Database.getUserById(document.requestedBy)
    if (auditorInfo) {
      Database.addNotification({
        userId: document.requestedBy,
        userName: auditorInfo.name,
        userRole: auditorInfo.role,
        title: "Document Uploaded",
        message: `${session.user.name} has uploaded "${document.title}". Click to review.`,
        type: "document_upload",
        priority: "medium",
        metadata: {
          documentId,
          documentTitle: document.title,
          uploadedBy: session.user.id,
          uploadedByName: session.user.name,
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        documentId,
        filename,
        fileSize: file.size,
      }
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    )
  }
}

