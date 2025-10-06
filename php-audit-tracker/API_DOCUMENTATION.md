# API Documentation - IT Audit Tracker

This document provides comprehensive documentation for the IT Audit Tracker REST API.

## Base URL

```
http://localhost/php-audit-tracker/api
```

## Authentication

All API endpoints require authentication. Include the session cookie in your requests or use the login endpoint to obtain a session.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "super_admin",
    "department": "IT"
  }
}
```

### Logout
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Endpoints

### Authentication

#### POST /api/auth/login
Authenticate a user and create a session.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string",
    "department": "string"
  }
}
```

#### POST /api/auth/logout
Logout the current user and destroy the session.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### User Management

#### GET /api/users
Get a list of all users.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of users per page
- `role` (optional): Filter by user role
- `department` (optional): Filter by department

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "super_admin",
      "department": "IT",
      "status": "active",
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-15 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### GET /api/users/{id}
Get a specific user by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "super_admin",
    "department": "IT",
    "status": "active",
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 10:00:00"
  }
}
```

#### POST /api/users
Create a new user.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "string",
  "department": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "2",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "auditor",
    "department": "Finance",
    "status": "active",
    "created_at": "2024-01-15 11:00:00",
    "updated_at": "2024-01-15 11:00:00"
  }
}
```

#### PUT /api/users/{id}
Update an existing user.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "department": "string",
  "status": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "1",
    "name": "John Doe Updated",
    "email": "john@example.com",
    "role": "super_admin",
    "department": "IT",
    "status": "active",
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 12:00:00"
  }
}
```

#### DELETE /api/users/{id}
Delete a user.

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Audit Management

#### GET /api/audits
Get a list of all audits.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of audits per page
- `status` (optional): Filter by audit status
- `manager_id` (optional): Filter by audit manager
- `auditor_id` (optional): Filter by auditor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Q1 2024 IT Security Audit",
      "description": "Comprehensive security audit",
      "status": "in_progress",
      "priority": "high",
      "start_date": "2024-01-01",
      "end_date": "2024-03-31",
      "manager_id": "1",
      "auditor_id": "2",
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-15 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### GET /api/audits/{id}
Get a specific audit by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Q1 2024 IT Security Audit",
    "description": "Comprehensive security audit",
    "status": "in_progress",
    "priority": "high",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "manager_id": "1",
    "auditor_id": "2",
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 10:00:00",
    "findings": [
      {
        "id": "1",
        "title": "Weak Password Policy",
        "description": "Password policy needs strengthening",
        "severity": "medium",
        "status": "open",
        "created_at": "2024-01-15 10:00:00"
      }
    ]
  }
}
```

#### POST /api/audits
Create a new audit.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "priority": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "manager_id": "string",
  "auditor_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audit created successfully",
  "data": {
    "id": "2",
    "title": "Q2 2024 Compliance Audit",
    "description": "Compliance audit for Q2",
    "status": "planned",
    "priority": "medium",
    "start_date": "2024-04-01",
    "end_date": "2024-06-30",
    "manager_id": "1",
    "auditor_id": "3",
    "created_at": "2024-01-15 11:00:00",
    "updated_at": "2024-01-15 11:00:00"
  }
}
```

#### PUT /api/audits/{id}
Update an existing audit.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "manager_id": "string",
  "auditor_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audit updated successfully",
  "data": {
    "id": "1",
    "title": "Q1 2024 IT Security Audit Updated",
    "description": "Updated comprehensive security audit",
    "status": "in_progress",
    "priority": "high",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "manager_id": "1",
    "auditor_id": "2",
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 12:00:00"
  }
}
```

#### DELETE /api/audits/{id}
Delete an audit.

**Response:**
```json
{
  "success": true,
  "message": "Audit deleted successfully"
}
```

### Document Management

#### GET /api/documents
Get a list of all documents.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of documents per page
- `audit_id` (optional): Filter by audit ID
- `user_id` (optional): Filter by user ID
- `type` (optional): Filter by document type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Security Policy Document",
      "description": "Company security policy",
      "type": "policy",
      "file_path": "/uploads/documents/security_policy.pdf",
      "file_size": 1024000,
      "audit_id": "1",
      "uploaded_by": "1",
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-15 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### GET /api/documents/{id}
Get a specific document by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Security Policy Document",
    "description": "Company security policy",
    "type": "policy",
    "file_path": "/uploads/documents/security_policy.pdf",
    "file_size": 1024000,
    "audit_id": "1",
    "uploaded_by": "1",
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 10:00:00"
  }
}
```

#### POST /api/documents
Upload a new document.

**Request Body (multipart/form-data):**
```
title: string
description: string
type: string
audit_id: string
file: file
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "2",
    "title": "New Policy Document",
    "description": "Updated policy document",
    "type": "policy",
    "file_path": "/uploads/documents/new_policy.pdf",
    "file_size": 2048000,
    "audit_id": "1",
    "uploaded_by": "1",
    "created_at": "2024-01-15 11:00:00",
    "updated_at": "2024-01-15 11:00:00"
  }
}
```

#### PUT /api/documents/{id}
Update document metadata.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "type": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": "1",
    "title": "Updated Security Policy Document",
    "description": "Updated company security policy",
    "type": "policy",
    "file_path": "/uploads/documents/security_policy.pdf",
    "file_size": 1024000,
    "audit_id": "1",
    "uploaded_by": "1",
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 12:00:00"
  }
}
```

#### DELETE /api/documents/{id}
Delete a document.

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Report Management

#### GET /api/reports
Get a list of all reports.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of reports per page
- `audit_id` (optional): Filter by audit ID
- `type` (optional): Filter by report type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Q1 2024 Security Audit Report",
      "type": "audit_report",
      "audit_id": "1",
      "generated_by": "1",
      "file_path": "/uploads/reports/q1_2024_security_report.pdf",
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-15 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### GET /api/reports/{id}
Get a specific report by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Q1 2024 Security Audit Report",
    "type": "audit_report",
    "audit_id": "1",
    "generated_by": "1",
    "file_path": "/uploads/reports/q1_2024_security_report.pdf",
    "created_at": "2024-01-15 10:00:00",
    "updated_at": "2024-01-15 10:00:00"
  }
}
```

#### POST /api/reports
Generate a new report.

**Request Body:**
```json
{
  "title": "string",
  "type": "string",
  "audit_id": "string",
  "format": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "id": "2",
    "title": "Q2 2024 Compliance Report",
    "type": "compliance_report",
    "audit_id": "2",
    "generated_by": "1",
    "file_path": "/uploads/reports/q2_2024_compliance_report.pdf",
    "created_at": "2024-01-15 11:00:00",
    "updated_at": "2024-01-15 11:00:00"
  }
}
```

#### DELETE /api/reports/{id}
Delete a report.

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

### Notification Management

#### GET /api/notifications
Get notifications for the current user.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of notifications per page
- `unread_only` (optional): Filter to show only unread notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "New Audit Assigned",
      "message": "You have been assigned to a new audit",
      "type": "info",
      "is_read": false,
      "created_at": "2024-01-15 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

#### PUT /api/notifications/{id}/read
Mark a notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### PUT /api/notifications/read-all
Mark all notifications as read.

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Activity Logging

#### GET /api/activities
Get activity logs.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of activities per page
- `user_id` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "user_id": "1",
      "action": "login",
      "description": "User logged in",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-15 10:00:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

## Data Types

### User Role
```json
{
  "super_admin": "Super Administrator",
  "audit_manager": "Audit Manager",
  "auditor": "Auditor",
  "management": "Management",
  "client": "Client",
  "department": "Department"
}
```

### Audit Status
```json
{
  "planned": "Planned",
  "in_progress": "In Progress",
  "completed": "Completed",
  "cancelled": "Cancelled"
}
```

### Audit Priority
```json
{
  "low": "Low",
  "medium": "Medium",
  "high": "High",
  "critical": "Critical"
}
```

### Document Type
```json
{
  "policy": "Policy",
  "procedure": "Procedure",
  "evidence": "Evidence",
  "report": "Report",
  "other": "Other"
}
```

### Report Type
```json
{
  "audit_report": "Audit Report",
  "compliance_report": "Compliance Report",
  "summary_report": "Summary Report",
  "detailed_report": "Detailed Report"
}
```

### Report Format
```json
{
  "pdf": "PDF",
  "excel": "Excel",
  "csv": "CSV"
}
```

### Notification Type
```json
{
  "info": "Information",
  "warning": "Warning",
  "error": "Error",
  "success": "Success"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **User management**: 100 requests per hour per user
- **Audit management**: 200 requests per hour per user
- **Document management**: 50 requests per hour per user
- **Report generation**: 10 requests per hour per user
- **Other endpoints**: 1000 requests per hour per user

## CORS

CORS is enabled for the following origins:
- `http://localhost`
- `http://localhost:3000`
- `http://127.0.0.1`
- `http://127.0.0.1:3000`

## WebSocket Support

Real-time notifications are available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost/php-audit-tracker/api/websocket');
ws.onmessage = function(event) {
  const notification = JSON.parse(event.data);
  // Handle notification
};
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost/php-audit-tracker/api',
  withCredentials: true
});

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Get users
const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

// Create audit
const createAudit = async (auditData) => {
  const response = await api.post('/audits', auditData);
  return response.data;
};
```

### PHP
```php
<?php
class AuditTrackerAPI {
    private $baseUrl;
    private $sessionId;
    
    public function __construct($baseUrl) {
        $this->baseUrl = $baseUrl;
    }
    
    public function login($email, $password) {
        $data = json_encode(['email' => $email, 'password' => $password]);
        $response = $this->makeRequest('POST', '/auth/login', $data);
        return json_decode($response, true);
    }
    
    public function getUsers() {
        $response = $this->makeRequest('GET', '/users');
        return json_decode($response, true);
    }
    
    private function makeRequest($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return $response;
    }
}
?>
```

### Python
```python
import requests
import json

class AuditTrackerAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, email, password):
        data = {'email': email, 'password': password}
        response = self.session.post(f'{self.base_url}/auth/login', json=data)
        return response.json()
    
    def get_users(self):
        response = self.session.get(f'{self.base_url}/users')
        return response.json()
    
    def create_audit(self, audit_data):
        response = self.session.post(f'{self.base_url}/audits', json=audit_data)
        return response.json()
```

## Testing

### Postman Collection
A Postman collection is available for testing all API endpoints. Import the collection and configure the environment variables.

### cURL Examples
```bash
# Login
curl -X POST http://localhost/php-audit-tracker/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Get users
curl -X GET http://localhost/php-audit-tracker/api/users \
  -b cookies.txt

# Create audit
curl -X POST http://localhost/php-audit-tracker/api/audits \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Test Audit","description":"Test audit description","priority":"medium","start_date":"2024-01-01","end_date":"2024-12-31","manager_id":"1","auditor_id":"2"}'
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid credentials |
| `AUTH_EXPIRED` | Session expired |
| `PERMISSION_DENIED` | Insufficient permissions |
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Duplicate entry |
| `FILE_TOO_LARGE` | File size exceeds limit |
| `INVALID_FILE_TYPE` | Invalid file type |
| `DATABASE_ERROR` | Database operation failed |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |

## Changelog

### Version 1.0.0
- Initial API release
- All core endpoints implemented
- Authentication and authorization
- CRUD operations for all entities
- File upload and download
- Real-time notifications
- Activity logging
- Comprehensive error handling

## Support

For API support and questions:
1. Check this documentation
2. Review error messages and codes
3. Test with provided examples
4. Check server logs for detailed errors
5. Contact system administrator

## License

This API is part of the IT Audit Tracker application and follows the same license terms.
