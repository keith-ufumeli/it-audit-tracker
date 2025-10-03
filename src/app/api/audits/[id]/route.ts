import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database, InMemoryDatabase } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const adminRoles = ["super_admin", "audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Load data from files if in-memory database is empty
    if (InMemoryDatabase.audits.length === 0) {
      await InMemoryDatabase.loadDataFromFiles()
    }

    const auditId = params.id
    const audit = Database.getAuditById(auditId)

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: audit
    })
  } catch (error) {
    console.error("Error fetching audit:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    )
  }
}
