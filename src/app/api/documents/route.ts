import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get all documents
    const allDocuments = Database.getDocuments()
    
    // Filter documents based on user role and permissions
    let userDocuments = allDocuments
    
    if (session.user.role === "client" || session.user.role === "department") {
      // Clients can only see documents they requested or uploaded
      userDocuments = allDocuments.filter(doc => 
        doc.requestedFrom === session.user.id || doc.uploadedBy === session.user.id
      )
    }
    // Admin roles can see all documents (no filtering needed)

    // Sort by requested date (newest first)
    userDocuments = userDocuments.sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: userDocuments,
      count: userDocuments.length
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
