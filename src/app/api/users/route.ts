import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database, InMemoryDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const adminRoles = ["audit_manager", "auditor", "management"]
    if (!adminRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Load data from files if in-memory database is empty
    if (InMemoryDatabase.users.length === 0) {
      await InMemoryDatabase.loadDataFromFiles()
    }

    const users = Database.getUsers()

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
