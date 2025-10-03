import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { Database } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    console.log(`[VIEW API] Request for document: ${documentId}`)
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log(`[VIEW API] Unauthorized access attempt`)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    const document = Database.getDocumentById(documentId)
    
    console.log(`[VIEW API] Document found:`, document ? 'Yes' : 'No')
    if (document) {
      console.log(`[VIEW API] Document status: ${document.status}, filePath: ${document.filePath}`)
    }
    
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if user has access to this document
    const clientRoles = ["client", "department"]
    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    
    const hasAccess = 
      adminRoles.includes(session.user.role) ||
      (clientRoles.includes(session.user.role) && 
       (document.requestedFrom === session.user.id || document.uploadedBy === session.user.id))

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Check if document has been uploaded
    if (!document.filePath || document.status !== "submitted") {
      return NextResponse.json(
        { error: "Document not available for viewing" },
        { status: 404 }
      )
    }

    // Construct file path
    const filePath = path.join(process.cwd(), "data", "uploads", document.filePath)
    console.log(`[VIEW API] Looking for file at: ${filePath}`)
    console.log(`[VIEW API] File exists: ${existsSync(filePath)}`)
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found on server" },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filePath)
    
    // Get file extension for proper MIME type
    const fileExtension = path.extname(document.filePath).toLowerCase()
    let contentType = "application/octet-stream"
    
    switch (fileExtension) {
      case ".pdf":
        contentType = "application/pdf"
        break
      case ".txt":
        contentType = "text/plain"
        break
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg"
        break
      case ".png":
        contentType = "image/png"
        break
      case ".gif":
        contentType = "image/gif"
        break
      case ".html":
        contentType = "text/html"
        break
      case ".xml":
        contentType = "application/xml"
        break
      case ".json":
        contentType = "application/json"
        break
    }

    // Return file with proper headers for viewing (inline)
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${document.title}${fileExtension}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
  } catch (error) {
    console.error("View error:", error)
    return NextResponse.json(
      { error: "Failed to view document" },
      { status: 500 }
    )
  }
}
