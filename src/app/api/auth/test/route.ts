import { NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    // Test if users are loaded
    const users = Database.getUsers()
    const userCount = users.length
    
    // Test if we can find a specific user
    const testUser = Database.getUserByEmail("manager@audit.com")
    
    return NextResponse.json({
      success: true,
      userCount,
      hasTestUser: !!testUser,
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        isActive: testUser.isActive
      } : null,
      allUsers: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive
      }))
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
