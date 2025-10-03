"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import AdminLayout from "@/components/admin/admin-layout"
import { 
  Shield, 
  Lock, 
  Unlock, 
  Key, 
  Eye, 
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Settings
} from "lucide-react"

interface EncryptionStatus {
  enabled: boolean
  algorithm: string
  keyLength: number
  masterKeySet: boolean
}

export default function EncryptionPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [status, setStatus] = useState<EncryptionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Encryption/Decryption states
  const [encryptText, setEncryptText] = useState("")
  const [encryptDataType, setEncryptDataType] = useState("default")
  const [encryptedResult, setEncryptedResult] = useState("")
  const [decryptData, setDecryptData] = useState("")
  const [decryptDataType, setDecryptDataType] = useState("default")
  const [decryptedResult, setDecryptedResult] = useState("")
  
  // Hashing states
  const [hashText, setHashText] = useState("")
  const [hashSalt, setHashSalt] = useState("")
  const [hashedResult, setHashedResult] = useState("")
  const [verifyText, setVerifyText] = useState("")
  const [verifyHash, setVerifyHash] = useState("")
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  
  // Token/Password generation states
  const [tokenLength, setTokenLength] = useState(32)
  const [generatedToken, setGeneratedToken] = useState("")
  const [passwordLength, setPasswordLength] = useState(16)
  const [generatedPassword, setGeneratedPassword] = useState("")
  
  // Data masking states
  const [maskText, setMaskText] = useState("")
  const [maskVisibleChars, setMaskVisibleChars] = useState(4)
  const [maskedResult, setMaskedResult] = useState("")

  useEffect(() => {
    loadEncryptionStatus()
  }, [])

  const loadEncryptionStatus = async () => {
    try {
      const response = await fetch('/api/encryption')
      const result = await response.json()
      
      if (result.success) {
        setStatus(result.data)
      }
    } catch (error) {
      console.error("Error loading encryption status:", error)
      toast({
        title: "Error",
        description: "Failed to load encryption status",
        variant: "destructive"
      })
    }
  }

  const handleEncrypt = async () => {
    if (!encryptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to encrypt",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'encrypt',
          data: {
            text: encryptText,
            dataType: encryptDataType
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setEncryptedResult(JSON.stringify(result.data.encrypted, null, 2))
        toast({
          title: "Success",
          description: "Text encrypted successfully"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Encryption error:", error)
      toast({
        title: "Error",
        description: "Failed to encrypt text",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (!decryptData.trim()) {
      toast({
        title: "Error",
        description: "Please enter encrypted data to decrypt",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const encryptedData = JSON.parse(decryptData)
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decrypt',
          data: {
            encryptedData,
            dataType: decryptDataType
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setDecryptedResult(result.data.decrypted)
        toast({
          title: "Success",
          description: "Data decrypted successfully"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Decryption error:", error)
      toast({
        title: "Error",
        description: "Failed to decrypt data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleHash = async () => {
    if (!hashText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to hash",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hash',
          data: {
            text: hashText,
            salt: hashSalt || undefined
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setHashedResult(result.data.hashed)
        toast({
          title: "Success",
          description: "Text hashed successfully"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Hashing error:", error)
      toast({
        title: "Error",
        description: "Failed to hash text",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyHash = async () => {
    if (!verifyText.trim() || !verifyHash.trim()) {
      toast({
        title: "Error",
        description: "Please enter both text and hash to verify",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_hash',
          data: {
            text: verifyText,
            hashedData: verifyHash
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setVerifyResult(result.data.isValid)
        toast({
          title: "Success",
          description: `Hash verification ${result.data.isValid ? 'passed' : 'failed'}`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Hash verification error:", error)
      toast({
        title: "Error",
        description: "Failed to verify hash",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateToken = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_token',
          data: { length: tokenLength }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setGeneratedToken(result.data.token)
        toast({
          title: "Success",
          description: "Secure token generated"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Token generation error:", error)
      toast({
        title: "Error",
        description: "Failed to generate token",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePassword = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_password',
          data: { length: passwordLength }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setGeneratedPassword(result.data.password)
        toast({
          title: "Success",
          description: "Secure password generated"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Password generation error:", error)
      toast({
        title: "Error",
        description: "Failed to generate password",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMaskData = async () => {
    if (!maskText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to mask",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mask_data',
          data: {
            text: maskText,
            visibleChars: maskVisibleChars
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMaskedResult(result.data.masked)
        toast({
          title: "Success",
          description: "Data masked successfully"
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Data masking error:", error)
      toast({
        title: "Error",
        description: "Failed to mask data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Text copied to clipboard"
    })
  }

  if (session?.user?.role !== "super_admin") {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only super administrators can access encryption management.
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Encryption Management</h1>
            <p className="text-muted-foreground">
              Manage data encryption and security settings
            </p>
          </div>
        </div>

        {/* Encryption Status */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Encryption Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={status.enabled ? "default" : "destructive"}>
                    {status.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <span className="text-sm">Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{status.algorithm}</Badge>
                  <span className="text-sm">Algorithm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{status.keyLength} bits</Badge>
                  <span className="text-sm">Key Length</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.masterKeySet ? "default" : "destructive"}>
                    {status.masterKeySet ? "Set" : "Not Set"}
                  </Badge>
                  <span className="text-sm">Master Key</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Encryption Tools */}
        <Tabs defaultValue="encrypt" className="space-y-4">
          <TabsList>
            <TabsTrigger value="encrypt">Encrypt/Decrypt</TabsTrigger>
            <TabsTrigger value="hash">Hash/Verify</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="mask">Mask Data</TabsTrigger>
          </TabsList>

          <TabsContent value="encrypt" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Encryption */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Encrypt Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="encrypt-text">Text to Encrypt</Label>
                    <Textarea
                      id="encrypt-text"
                      value={encryptText}
                      onChange={(e) => setEncryptText(e.target.value)}
                      placeholder="Enter sensitive text to encrypt..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="encrypt-data-type">Data Type</Label>
                    <Select value={encryptDataType} onValueChange={setEncryptDataType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="user_data">User Data</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="audit_trail">Audit Trail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleEncrypt} disabled={loading} className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Encrypt
                  </Button>
                  {encryptedResult && (
                    <div>
                      <Label>Encrypted Result</Label>
                      <div className="relative">
                        <Textarea
                          value={encryptedResult}
                          readOnly
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(encryptedResult)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Decryption */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5" />
                    Decrypt Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="decrypt-data">Encrypted Data (JSON)</Label>
                    <Textarea
                      id="decrypt-data"
                      value={decryptData}
                      onChange={(e) => setDecryptData(e.target.value)}
                      placeholder="Enter encrypted data in JSON format..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="decrypt-data-type">Data Type</Label>
                    <Select value={decryptDataType} onValueChange={setDecryptDataType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="user_data">User Data</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="audit_trail">Audit Trail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleDecrypt} disabled={loading} className="w-full">
                    <Unlock className="h-4 w-4 mr-2" />
                    Decrypt
                  </Button>
                  {decryptedResult && (
                    <div>
                      <Label>Decrypted Result</Label>
                      <div className="relative">
                        <Textarea
                          value={decryptedResult}
                          readOnly
                          rows={4}
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(decryptedResult)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hash" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hashing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Hash Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="hash-text">Text to Hash</Label>
                    <Textarea
                      id="hash-text"
                      value={hashText}
                      onChange={(e) => setHashText(e.target.value)}
                      placeholder="Enter text to hash..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hash-salt">Salt (Optional)</Label>
                    <Input
                      id="hash-salt"
                      value={hashSalt}
                      onChange={(e) => setHashSalt(e.target.value)}
                      placeholder="Enter custom salt..."
                    />
                  </div>
                  <Button onClick={handleHash} disabled={loading} className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Hash
                  </Button>
                  {hashedResult && (
                    <div>
                      <Label>Hashed Result</Label>
                      <div className="relative">
                        <Input value={hashedResult} readOnly className="font-mono text-sm" />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute right-1 top-1"
                          onClick={() => copyToClipboard(hashedResult)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Hash Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Verify Hash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="verify-text">Original Text</Label>
                    <Textarea
                      id="verify-text"
                      value={verifyText}
                      onChange={(e) => setVerifyText(e.target.value)}
                      placeholder="Enter original text..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="verify-hash">Hash to Verify</Label>
                    <Input
                      id="verify-hash"
                      value={verifyHash}
                      onChange={(e) => setVerifyHash(e.target.value)}
                      placeholder="Enter hash to verify..."
                    />
                  </div>
                  <Button onClick={handleVerifyHash} disabled={loading} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                  {verifyResult !== null && (
                    <div className="flex items-center gap-2">
                      {verifyResult ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Hash verification passed</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Hash verification failed</span>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Token Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Generate Secure Token
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="token-length">Token Length (bytes)</Label>
                    <Input
                      id="token-length"
                      type="number"
                      value={tokenLength}
                      onChange={(e) => setTokenLength(parseInt(e.target.value) || 32)}
                      min="8"
                      max="128"
                    />
                  </div>
                  <Button onClick={handleGenerateToken} disabled={loading} className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Generate Token
                  </Button>
                  {generatedToken && (
                    <div>
                      <Label>Generated Token</Label>
                      <div className="relative">
                        <Input value={generatedToken} readOnly className="font-mono text-sm" />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute right-1 top-1"
                          onClick={() => copyToClipboard(generatedToken)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Password Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Generate Secure Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="password-length">Password Length</Label>
                    <Input
                      id="password-length"
                      type="number"
                      value={passwordLength}
                      onChange={(e) => setPasswordLength(parseInt(e.target.value) || 16)}
                      min="8"
                      max="64"
                    />
                  </div>
                  <Button onClick={handleGeneratePassword} disabled={loading} className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Generate Password
                  </Button>
                  {generatedPassword && (
                    <div>
                      <Label>Generated Password</Label>
                      <div className="relative">
                        <Input value={generatedPassword} readOnly className="font-mono text-sm" />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute right-1 top-1"
                          onClick={() => copyToClipboard(generatedPassword)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mask" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5" />
                  Mask Sensitive Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mask-text">Text to Mask</Label>
                  <Textarea
                    id="mask-text"
                    value={maskText}
                    onChange={(e) => setMaskText(e.target.value)}
                    placeholder="Enter sensitive text to mask..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="mask-visible-chars">Visible Characters</Label>
                  <Input
                    id="mask-visible-chars"
                    type="number"
                    value={maskVisibleChars}
                    onChange={(e) => setMaskVisibleChars(parseInt(e.target.value) || 4)}
                    min="0"
                    max="20"
                  />
                </div>
                <Button onClick={handleMaskData} disabled={loading} className="w-full">
                  <EyeOff className="h-4 w-4 mr-2" />
                  Mask Data
                </Button>
                {maskedResult && (
                  <div>
                    <Label>Masked Result</Label>
                    <div className="relative">
                      <Input value={maskedResult} readOnly className="font-mono text-sm" />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute right-1 top-1"
                        onClick={() => copyToClipboard(maskedResult)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
