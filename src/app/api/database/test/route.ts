import { NextResponse } from 'next/server'
import { Database } from '@/lib/database'

export async function GET() {
  try {
    // Test database operations
    const stats = Database.getStats()
    const users = Database.getUsers()
    const audits = Database.getAudits()
    const recentActivities = Database.getRecentActivities(5)

    return NextResponse.json({
      success: true,
      message: 'Database operations successful',
      data: {
        stats,
        userCount: users.length,
        auditCount: audits.length,
        recentActivityCount: recentActivities.length,
        sampleUser: users[0],
        sampleAudit: audits[0]
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database operations failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
