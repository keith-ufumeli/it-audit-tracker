-- IT Audit Tracker Database Schema
-- MySQL Database Schema for PHP Application

CREATE DATABASE IF NOT EXISTS it_audit_tracker;
USE it_audit_tracker;

-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'audit_manager', 'auditor', 'management', 'client', 'department') NOT NULL,
    department VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSON,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department),
    INDEX idx_is_active (is_active)
);

-- Audits table
CREATE TABLE audits (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status ENUM('planning', 'in_progress', 'completed', 'cancelled') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    audit_manager VARCHAR(50) NOT NULL,
    assigned_auditors JSON,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    scope JSON,
    compliance_frameworks JSON,
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_manager) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_audit_manager (audit_manager),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
);

-- Audit findings table
CREATE TABLE audit_findings (
    id VARCHAR(50) PRIMARY KEY,
    audit_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL,
    description TEXT,
    recommendation TEXT,
    assigned_to VARCHAR(50),
    due_date DATE,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_id (audit_id),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to)
);

-- Documents table
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type ENUM('policy', 'procedure', 'log', 'plan', 'report', 'evidence') NOT NULL,
    audit_id VARCHAR(50) NOT NULL,
    requested_by VARCHAR(50) NOT NULL,
    requested_from VARCHAR(50) NOT NULL,
    status ENUM('draft', 'pending', 'submitted', 'approved', 'rejected') NOT NULL,
    uploaded_by VARCHAR(50) NULL,
    uploaded_at TIMESTAMP NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    file_size INT NULL,
    file_name VARCHAR(500) NULL,
    file_path VARCHAR(1000) NULL,
    version VARCHAR(50) NULL,
    tags JSON,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_from) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_id (audit_id),
    INDEX idx_requested_by (requested_by),
    INDEX idx_requested_from (requested_from),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_due_date (due_date)
);

-- Activities table
CREATE TABLE activities (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    resource VARCHAR(255),
    metadata JSON,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity (severity),
    INDEX idx_action (action)
);

-- Notifications table
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    type ENUM('audit_request', 'document_request', 'document_upload', 'audit_assignment', 'report_ready', 'security_alert', 'system_update') NOT NULL,
    status ENUM('unread', 'read', 'archived') DEFAULT 'unread',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

-- Alerts table
CREATE TABLE alerts (
    id VARCHAR(50) PRIMARY KEY,
    rule_id VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') NOT NULL,
    description TEXT,
    triggered_by VARCHAR(50) NOT NULL,
    triggered_by_name VARCHAR(255) NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
    acknowledged_by VARCHAR(50) NULL,
    acknowledged_at TIMESTAMP NULL,
    resolved_by VARCHAR(50) NULL,
    resolved_at TIMESTAMP NULL,
    metadata JSON,
    FOREIGN KEY (triggered_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_triggered_by (triggered_by),
    INDEX idx_triggered_at (triggered_at)
);

-- Reports table
CREATE TABLE reports (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    audit_id VARCHAR(50) NOT NULL,
    audit_title VARCHAR(500) NOT NULL,
    report_type VARCHAR(255) NOT NULL,
    status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    created_by_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    approved_by VARCHAR(50) NULL,
    content LONGTEXT,
    findings JSON,
    recommendations JSON,
    FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_id (audit_id),
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_report_type (report_type)
);

-- System settings table
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('system_name', 'IT Audit Tracker', 'Name of the audit tracking system'),
('system_version', '1.0.0', 'Current system version'),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('allowed_file_types', 'pdf,doc,docx,xls,xlsx,txt,jpg,jpeg,png', 'Allowed file types for uploads'),
('session_timeout', '3600', 'Session timeout in seconds (1 hour)'),
('password_min_length', '8', 'Minimum password length'),
('audit_retention_days', '2555', 'Number of days to retain audit data (7 years)'),
('notification_retention_days', '90', 'Number of days to retain notifications'),
('backup_frequency', 'daily', 'Backup frequency: daily, weekly, monthly'),
('email_notifications', 'true', 'Enable email notifications'),
('maintenance_mode', 'false', 'System maintenance mode');

-- Insert default users (passwords are hashed with bcrypt, default password is 'password')
INSERT INTO users (id, name, email, password_hash, role, department, permissions) VALUES
('0', 'Super Administrator', 'superadmin@audit.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'System Administration', '["super_admin_access", "manage_all_users", "manage_permissions", "manage_system_settings", "manage_database_config", "view_all_logs", "export_all_data", "create_audit", "assign_tasks", "view_reports", "approve_audits", "manage_notifications", "manage_reports", "manage_alerts"]'),
('1', 'John Manager', 'manager@audit.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'audit_manager', 'Audit Department', '["create_audit", "assign_tasks", "view_reports", "manage_users", "view_all_logs", "approve_audits", "export_data"]'),
('2', 'Jane Auditor', 'auditor@audit.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor', 'IT Security', '["view_logs", "submit_reports", "request_documents", "flag_activities", "view_assigned_audits", "upload_evidence"]'),
('3', 'Bob Executive', 'management@audit.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'management', 'Executive', '["view_dashboards", "approve_reports", "view_summaries", "view_compliance_scores", "export_executive_reports"]'),
('4', 'Alice Client', 'client@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'Client Relations', '["view_notifications", "respond_requests", "view_audit_status", "download_reports"]'),
('5', 'Charlie Department', 'dept@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'department', 'HR', '["upload_documents", "view_requests", "respond_to_auditors", "track_submissions"]'),
('6', 'Mike Auditor', 'auditor2@audit.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor', 'IT Security', '["view_logs", "submit_reports", "request_documents", "flag_activities", "view_assigned_audits", "upload_evidence"]');

-- Insert sample audits
INSERT INTO audits (id, title, description, status, priority, audit_manager, assigned_auditors, start_date, end_date, scope, compliance_frameworks, progress) VALUES
('audit-001', 'Q1 2024 IT Security Audit', 'UI Test Update at 2025-10-03T01:19:56.913Z', 'in_progress', 'high', '1', '["2", "6"]', '2024-01-15', '2024-03-31', '["Network Security", "Access Controls", "Data Protection", "Incident Response"]', '["ISO 27001", "SOC 2"]', 85),
('audit-002', 'Data Privacy Compliance Review', 'Review of data handling practices and GDPR compliance measures.', 'planning', 'medium', '1', '["2"]', '2025-10-01', '2025-10-03', '["Data Collection", "Data Processing", "Data Storage", "Data Retention"]', '["GDPR", "CCPA"]', 5),
('audit-003', 'Infrastructure Security Assessment', 'Assessment of server infrastructure, cloud services, and backup systems.', 'completed', 'high', '1', '["2"]', '2023-12-01', '2023-12-31', '["Server Security", "Cloud Infrastructure", "Backup Systems", "Monitoring"]', '["ISO 27001"]', 100);

-- Insert sample audit findings
INSERT INTO audit_findings (id, audit_id, title, severity, status, description, recommendation, assigned_to, due_date) VALUES
('finding-001', 'audit-001', 'Weak Password Policy', 'medium', 'open', 'Current password policy does not meet industry standards', 'Implement stronger password requirements', '2', '2024-02-15'),
('finding-002', 'audit-003', 'Outdated Server Software', 'high', 'resolved', 'Several servers running outdated software versions', 'Update all server software to latest versions', '2', '2023-12-15');

-- Insert sample documents
INSERT INTO documents (id, title, description, type, audit_id, requested_by, requested_from, status, due_date, tags, is_confidential) VALUES
('doc-001', 'Security Policy Document', 'Current IT security policies and procedures', 'policy', 'audit-001', '1', '4', 'pending', '2024-02-01', '["security", "policy", "compliance"]', false),
('doc-002', 'Access Control Logs', 'Recent access control and authentication logs', 'log', 'audit-001', '2', '5', 'submitted', '2024-01-25', '["access", "logs", "authentication"]', true),
('doc-003', 'Data Processing Agreement', 'GDPR compliance data processing agreement', 'procedure', 'audit-002', '1', '4', 'draft', '2024-02-10', '["gdpr", "data", "processing"]', false);

-- Insert sample activities
INSERT INTO activities (id, user_id, user_name, user_role, action, description, ip_address, user_agent, severity, resource, metadata) VALUES
('activity-001', '1', 'John Manager', 'audit_manager', 'login', 'User logged into the system', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'info', 'authentication', '{"sessionId": "sess_1640995200000", "loginMethod": "credentials"}'),
('activity-002', '2', 'Jane Auditor', 'auditor', 'create_audit', 'Created new audit: Q1 2024 IT Security Audit', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'info', 'audit', '{"auditId": "audit-001", "auditTitle": "Q1 2024 IT Security Audit"}'),
('activity-003', '4', 'Alice Client', 'client', 'upload_document', 'Uploaded document: Security Policy Document', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'info', 'document', '{"documentId": "doc-001", "fileName": "security_policy.pdf"}');

-- Insert sample notifications
INSERT INTO notifications (id, user_id, user_name, user_role, title, message, type, priority, metadata) VALUES
('notif-001', '4', 'Alice Client', 'client', 'Document Request', 'New document request: Security Policy Document', 'document_request', 'medium', '{"documentId": "doc-001", "auditId": "audit-001"}'),
('notif-002', '2', 'Jane Auditor', 'auditor', 'Audit Assignment', 'You have been assigned to audit: Q1 2024 IT Security Audit', 'audit_assignment', 'high', '{"auditId": "audit-001", "auditTitle": "Q1 2024 IT Security Audit"}'),
('notif-003', '1', 'John Manager', 'audit_manager', 'System Update', 'System maintenance scheduled for tonight at 2 AM', 'system_update', 'low', '{"maintenanceWindow": "2024-01-21T02:00:00Z", "duration": "2 hours"}');

-- Insert sample alerts
INSERT INTO alerts (id, rule_id, rule_name, severity, description, triggered_by, triggered_by_name, status, metadata) VALUES
('alert-001', 'rule-001', 'Multiple Failed Login Attempts', 'error', 'User has attempted to login 5 times in the last 15 minutes', '2', 'Jane Auditor', 'active', '{"attemptCount": 5, "timeWindow": "15 minutes", "ipAddress": "192.168.1.100"}'),
('alert-002', 'rule-002', 'Suspicious Document Access', 'warning', 'User has accessed 8 confidential documents in the last 30 minutes', '4', 'Client User', 'acknowledged', '{"documentCount": 8, "timeWindow": "30 minutes", "documentTypes": ["financial", "confidential", "legal"]}'),
('alert-003', 'rule-003', 'Admin Privilege Escalation', 'critical', 'Non-admin user attempted to access admin dashboard', '5', 'Department User', 'active', '{"attemptedAction": "admin_dashboard_access", "userRole": "department", "requestedResource": "/admin/dashboard"}');

-- Insert sample reports
INSERT INTO reports (id, title, audit_id, audit_title, report_type, status, created_by, created_by_name, content, findings, recommendations) VALUES
('report-001', 'Q1 2024 IT Security Audit Report', 'audit-001', 'Q1 2024 IT Security Audit', 'executive_summary', 'draft', '2', 'Jane Auditor', 'This report summarizes the findings from the Q1 2024 IT Security Audit...', '["Weak password policy identified", "Access control gaps found"]', '["Implement stronger password requirements", "Review and update access control procedures"]'),
('report-002', 'Infrastructure Security Assessment Report', 'audit-003', 'Infrastructure Security Assessment', 'detailed_report', 'approved', '2', 'Jane Auditor', 'Comprehensive assessment of server infrastructure and security measures...', '["Outdated server software", "Backup system vulnerabilities"]', '["Update all server software", "Implement automated backup verification"]');
