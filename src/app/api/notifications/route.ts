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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const status = searchParams.get('status')

    let notifications = Database.getNotificationsByUser(userId)

    // Apply status filter
    if (status) {
      notifications = notifications.filter(notif => notif.status === status)
    }

    // Sort by created date (newest first)
    notifications = notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: notifications,
      count: notifications.length
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, action } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    const notification = Database.getNotifications().find(n => n.id === notificationId)
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    // Verify user owns this notification
    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    let updates: any = {}

    switch (action) {
      case 'mark_read':
        updates = {
          status: 'read',
          readAt: new Date().toISOString()
        }
        break
      case 'mark_unread':
        updates = {
          status: 'unread',
          readAt: null
        }
        break
      case 'archive':
        updates = {
          status: 'archived'
        }
        break
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    const success = Database.updateNotification(notificationId, updates)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notification updated successfully"
    })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, title, message, type, priority, metadata } = body

    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const success = Database.addNotification({
      userId,
      userName: session.user.name,
      userRole: session.user.role,
      title,
      message,
      type,
      priority: priority || 'medium',
      metadata: metadata || {}
    })

    if (!success) {
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notification created successfully"
    })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}

