import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isSuperAdmin } from "@/lib/auth"
import { SystemSettingsManager } from "@/lib/system-settings"
import { Database } from "@/lib/database"
import { checkPermissions } from "@/lib/permission-middleware"

const settingsManager = SystemSettingsManager.getInstance()

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await checkPermissions(request, {
      allowSuperAdmin: true
    })

    if (!permissionCheck.allowed) {
      return permissionCheck.error!
    }

    const settings = settingsManager.getAllSettings()

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can update system settings
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can update system settings" }, { status: 403 })
    }

    const body = await request.json()
    const { section, settings } = body

    if (!section || !settings) {
      return NextResponse.json({ error: "Missing section or settings" }, { status: 400 })
    }

    // Validate settings
    const validationErrors = settingsManager.validateSettings({ [section]: settings })
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 })
    }

    let success = false
    let updatedSettings = null

    switch (section) {
      case "database":
        success = settingsManager.updateDatabaseSettings(settings)
        updatedSettings = settingsManager.getDatabaseSettings()
        break
      case "security":
        success = settingsManager.updateSecuritySettings(settings)
        updatedSettings = settingsManager.getSecuritySettings()
        break
      case "notifications":
        success = settingsManager.updateNotificationSettings(settings)
        updatedSettings = settingsManager.getNotificationSettings()
        break
      case "audit":
        success = settingsManager.updateAuditSettings(settings)
        updatedSettings = settingsManager.getAuditSettings()
        break
      case "reporting":
        success = settingsManager.updateReportingSettings(settings)
        updatedSettings = settingsManager.getReportingSettings()
        break
      case "system":
        success = settingsManager.updateSystemSettings(settings)
        updatedSettings = settingsManager.getSystemSettings()
        break
      case "integrations":
        success = settingsManager.updateIntegrationSettings(settings)
        updatedSettings = settingsManager.getIntegrationSettings()
        break
      default:
        return NextResponse.json({ error: "Invalid settings section" }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    // Log the activity
    Database.addActivity({
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: "update_system_settings",
      description: `Updated ${section} settings`,
      timestamp: new Date().toISOString(),
      ipAddress: request.ip || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "Unknown",
      severity: "info",
      resource: "system_settings",
      metadata: {
        section: section,
        settings: settings
      }
    })

    return NextResponse.json({ 
      message: "Settings updated successfully",
      section,
      settings: updatedSettings
    })
  } catch (error) {
    console.error("Error updating system settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Super Admin can reset system settings
    if (!isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Only Super Admin can reset system settings" }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "reset_to_defaults") {
      const success = settingsManager.resetToDefaults()
      if (!success) {
        return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 })
      }

      // Log the activity
      Database.addActivity({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: "reset_system_settings",
        description: "Reset all system settings to defaults",
        timestamp: new Date().toISOString(),
        ipAddress: request.ip || "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "Unknown",
        severity: "warning",
        resource: "system_settings",
        metadata: {
          action: "reset_to_defaults"
        }
      })

      return NextResponse.json({ 
        message: "Settings reset to defaults successfully",
        settings: settingsManager.getAllSettings()
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error resetting system settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
