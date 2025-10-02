# Database & Loading System Setup

## Overview
This document outlines the mock database system and comprehensive loading components implemented for the IT Audit Trail Tracker.

## 📁 Mock Database Structure

### JSON Database Files
All mock data is stored in standalone JSON files in `src/data/`:

```
src/data/
├── users.json          # User accounts and roles
├── audits.json         # Audit tasks and findings
├── documents.json      # Document requests and uploads
├── activities.json     # System activity logs
└── notifications.json  # User notifications
```

### Database Entities

#### Users (`users.json`)
```typescript
interface User {
  id: string
  email: string
  name: string
  role: "audit_manager" | "auditor" | "management" | "client" | "department"
  department: string
  permissions: string[]
  createdAt: string
  lastLogin: string
  isActive: boolean
}
```

#### Audits (`audits.json`)
```typescript
interface Audit {
  id: string
  title: string
  description: string
  status: "planning" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "critical"
  auditManager: string
  assignedAuditors: string[]
  startDate: string
  endDate: string
  scope: string[]
  complianceFrameworks: string[]
  findings: AuditFinding[]
  progress: number
}
```

#### Documents (`documents.json`)
```typescript
interface Document {
  id: string
  title: string
  description: string
  type: "policy" | "procedure" | "log" | "plan" | "report" | "evidence"
  auditId: string
  requestedBy: string
  requestedFrom: string
  status: "draft" | "pending" | "submitted" | "approved" | "rejected"
  uploadedBy?: string
  uploadedAt?: string
  requestedAt: string
  dueDate: string
  fileSize?: number
  fileName?: string
  version?: string
  tags: string[]
  isConfidential: boolean
}
```

#### Activities (`activities.json`)
```typescript
interface Activity {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  description: string
  timestamp: string
  ipAddress: string
  userAgent: string
  severity: "info" | "warning" | "error" | "critical"
  resource: string
  metadata: Record<string, any>
}
```

#### Notifications (`notifications.json`)
```typescript
interface Notification {
  id: string
  userId: string
  userName: string
  userRole: string
  title: string
  message: string
  type: "audit_request" | "document_request" | "audit_assignment" | "report_ready" | "security_alert"
  status: "unread" | "read" | "archived"
  priority: "low" | "medium" | "high" | "critical"
  createdAt: string
  readAt: string | null
  expiresAt: string
  metadata: Record<string, any>
}
```

## 🗄️ Database Utility Class

### Database Operations
The `Database` class provides comprehensive CRUD operations:

```typescript
// User operations
Database.getUsers()
Database.getUserById(id)
Database.getUserByEmail(email)
Database.updateUser(id, updates)

// Audit operations
Database.getAudits()
Database.getAuditById(id)
Database.getAuditsByManager(managerId)
Database.getAuditsByAuditor(auditorId)
Database.updateAudit(id, updates)

// Document operations
Database.getDocuments()
Database.getDocumentById(id)
Database.getDocumentsByAudit(auditId)
Database.getDocumentsByUser(userId)
Database.updateDocument(id, updates)

// Activity operations
Database.getActivities()
Database.getActivitiesByUser(userId)
Database.getRecentActivities(limit)
Database.addActivity(activity)

// Notification operations
Database.getNotifications()
Database.getNotificationsByUser(userId)
Database.getUnreadNotificationsByUser(userId)
Database.updateNotification(id, updates)
Database.addNotification(notification)

// Statistics
Database.getStats()
```

## ⏳ Loading System

### Loader Components

#### 1. Basic Loader
```tsx
import { Loader } from "@/components/ui/loader"

<Loader size="md" variant="primary" text="Loading..." showText />
```

#### 2. Full Page Loader
```tsx
import { FullPageLoader } from "@/components/ui/loader"

<FullPageLoader text="Loading dashboard..." variant="primary" />
```

#### 3. Skeleton Loaders
```tsx
import { CardSkeleton, TableSkeleton, SkeletonLoader } from "@/components/ui/loader"

<CardSkeleton />
<TableSkeleton rows={5} columns={4} />
<SkeletonLoader lines={3} />
```

#### 4. Pulse Loader
```tsx
import { PulseLoader } from "@/components/ui/loader"

<PulseLoader text="Processing..." showText />
```

### Loading Hooks

#### 1. Basic Loading Hook
```tsx
import { useLoading } from "@/hooks/use-loading"

const { isLoading, startLoading, stopLoading, updateLoading } = useLoading("Loading...")

// Usage
startLoading("Fetching data...")
// ... async operation
stopLoading()
```

#### 2. Async Loading Hook
```tsx
import { useAsyncLoading } from "@/hooks/use-loading"

const { isLoading, error, data, execute, reset } = useAsyncLoading()

// Usage
const result = await execute(async () => {
  return await fetchData()
})
```

#### 3. Multiple Loading States
```tsx
import { useMultipleLoading } from "@/hooks/use-loading"

const { setLoading, isAnyLoading, isLoading } = useMultipleLoading()

// Usage
setLoading("users", true)
setLoading("audits", true)
// Check states
if (isLoading("users")) { /* show user loading */ }
if (isAnyLoading) { /* show global loading */ }
```

### Global Loading Provider
```tsx
import { useGlobalLoading } from "@/components/providers/loading-provider"

const { startLoading, stopLoading, isLoading } = useGlobalLoading()

// Shows full-page overlay loader
startLoading("Processing request...")
```

## 🎨 Loader Variants

### Sizes
- `sm`: 16px (4rem)
- `md`: 24px (6rem) - Default
- `lg`: 32px (8rem)
- `xl`: 48px (12rem)
- `2xl`: 64px (16rem)

### Variants
- `default`: Primary color
- `primary`: Primary color
- `secondary`: Secondary color
- `accent`: Accent color
- `destructive`: Error color
- `orange`: Custom orange
- `blue`: Custom blue
- `white`: White color

## 📊 Sample Data

### Demo Users
All accounts use password: `password`

| Role | Email | Name | Department |
|------|-------|------|------------|
| Audit Manager | manager@audit.com | John Manager | Audit Department |
| Auditor | auditor@audit.com | Jane Auditor | IT Security |
| Management | management@audit.com | Bob Executive | Executive |
| Client | client@company.com | Alice Client | Client Relations |
| Department | dept@company.com | Charlie Department | HR |

### Sample Audits
- **Q1 2024 IT Security Audit** (In Progress)
- **Data Privacy Compliance Review** (Planning)
- **Infrastructure Security Assessment** (Completed)

### Sample Documents
- Network Security Policy
- User Access Logs
- Data Classification Matrix
- Incident Response Plan

## 🔧 Usage Examples

### Loading Dashboard Data
```tsx
const { isLoading, startLoading, stopLoading } = useLoading("Loading dashboard...")

const loadData = async () => {
  startLoading("Fetching audit data...")
  try {
    const audits = Database.getAudits()
    const activities = Database.getRecentActivities(10)
    // Process data...
  } finally {
    stopLoading()
  }
}
```

### Real-time Activity Logging
```tsx
// Log user action
Database.addActivity({
  userId: user.id,
  userName: user.name,
  userRole: user.role,
  action: "document_upload",
  description: "Uploaded security policy document",
  timestamp: new Date().toISOString(),
  ipAddress: "192.168.1.100",
  userAgent: navigator.userAgent,
  severity: "info",
  resource: "document",
  metadata: {
    documentId: "doc-001",
    fileSize: 2048576
  }
})
```

### Notification Management
```tsx
// Create notification
Database.addNotification({
  userId: "4",
  userName: "Alice Client",
  userRole: "client",
  title: "New Audit Request",
  message: "A new audit has been initiated for your organization.",
  type: "audit_request",
  status: "unread",
  priority: "high",
  createdAt: new Date().toISOString(),
  readAt: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  metadata: {
    auditId: "audit-001",
    auditTitle: "Q1 2024 IT Security Audit"
  }
})
```

## 🚀 Benefits

### Database System
- ✅ **Standalone JSON files** - Easy to modify and version control
- ✅ **Type-safe operations** - Full TypeScript support
- ✅ **Comprehensive CRUD** - All necessary database operations
- ✅ **Activity logging** - Automatic audit trail
- ✅ **Statistics** - Built-in analytics and reporting
- ✅ **Production ready** - Easy to migrate to real database

### Loading System
- ✅ **Multiple variants** - Spinner, pulse, skeleton loaders
- ✅ **Responsive design** - Works on all screen sizes
- ✅ **Customizable** - Colors, sizes, and text options
- ✅ **Performance optimized** - Minimal re-renders
- ✅ **Accessibility** - Screen reader friendly
- ✅ **Global state** - Centralized loading management

## 🔄 Migration to Production

### Database Migration
1. Replace JSON file operations with database queries
2. Update `Database` class methods to use ORM/database client
3. Add connection pooling and error handling
4. Implement data validation and sanitization

### Loading Optimization
1. Add request caching and memoization
2. Implement optimistic updates
3. Add error boundaries and retry logic
4. Integrate with real-time updates (WebSockets)

The system is designed to be easily extensible and production-ready with minimal changes required for real-world deployment.
