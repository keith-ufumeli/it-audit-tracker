import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { encryptionService } from "@/lib/encryption"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only super admin can view encryption status
    if (session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      )
    }

    const status = encryptionService.getEncryptionStatus()

    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error("Error getting encryption status:", error)
    return NextResponse.json(
      { error: "Failed to get encryption status" },
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

    // Only super admin can manage encryption
    if (session.user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'encrypt':
        if (!data || !data.text || !data.dataType) {
          return NextResponse.json(
            { error: "Missing required fields: text, dataType" },
            { status: 400 }
          )
        }
        
        const encrypted = encryptionService.encrypt(data.text, data.dataType)
        return NextResponse.json({
          success: true,
          data: { encrypted }
        })

      case 'decrypt':
        if (!data || !data.encryptedData || !data.dataType) {
          return NextResponse.json(
            { error: "Missing required fields: encryptedData, dataType" },
            { status: 400 }
          )
        }
        
        const decrypted = encryptionService.decrypt(data.encryptedData, data.dataType)
        return NextResponse.json({
          success: true,
          data: { decrypted }
        })

      case 'hash':
        if (!data || !data.text) {
          return NextResponse.json(
            { error: "Missing required field: text" },
            { status: 400 }
          )
        }
        
        const hashed = encryptionService.hash(data.text, data.salt)
        return NextResponse.json({
          success: true,
          data: { hashed }
        })

      case 'verify_hash':
        if (!data || !data.text || !data.hashedData) {
          return NextResponse.json(
            { error: "Missing required fields: text, hashedData" },
            { status: 400 }
          )
        }
        
        const isValid = encryptionService.verifyHash(data.text, data.hashedData)
        return NextResponse.json({
          success: true,
          data: { isValid }
        })

      case 'generate_token':
        const tokenLength = data?.length || 32
        const token = encryptionService.generateSecureToken(tokenLength)
        return NextResponse.json({
          success: true,
          data: { token }
        })

      case 'generate_password':
        const passwordLength = data?.length || 16
        const password = encryptionService.generateSecurePassword(passwordLength)
        return NextResponse.json({
          success: true,
          data: { password }
        })

      case 'mask_data':
        if (!data || !data.text) {
          return NextResponse.json(
            { error: "Missing required field: text" },
            { status: 400 }
          )
        }
        
        const masked = encryptionService.maskSensitiveData(data.text, data.visibleChars)
        return NextResponse.json({
          success: true,
          data: { masked }
        })

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error processing encryption request:", error)
    return NextResponse.json(
      { error: "Failed to process encryption request" },
      { status: 500 }
    )
  }
}
