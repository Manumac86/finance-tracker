import { supabase } from "@/lib/db/postgres";

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN = "auth.login",
  LOGOUT = "auth.logout",
  LOGIN_FAILED = "auth.login_failed",

  // Account management
  ACCOUNT_CREATED = "account.created",
  ACCOUNT_UPDATED = "account.updated",
  ACCOUNT_DELETED = "account.deleted",
  ACCOUNT_BALANCE_UPDATED = "account.balance_updated",

  // Transaction events
  TRANSACTION_CREATED = "transaction.created",
  TRANSACTION_UPDATED = "transaction.updated",
  TRANSACTION_DELETED = "transaction.deleted",
  TRANSACTION_BULK_DELETED = "transaction.bulk_deleted",

  // Budget events
  BUDGET_CREATED = "budget.created",
  BUDGET_UPDATED = "budget.updated",
  BUDGET_DELETED = "budget.deleted",

  // Goal events
  GOAL_CREATED = "goal.created",
  GOAL_UPDATED = "goal.updated",
  GOAL_DELETED = "goal.deleted",

  // Security events
  ENCRYPTION_KEY_ACCESSED = "security.encryption_key_accessed",
  SUSPICIOUS_ACTIVITY = "security.suspicious_activity",
  DATA_EXPORT = "security.data_export",

  // System events
  MIGRATION_EXECUTED = "system.migration_executed",
  BULK_OPERATION = "system.bulk_operation",
}

export enum AuditSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  event_type: AuditEventType;
  event_description: string;
  severity: AuditSeverity;
  resource_type?: string; // e.g., 'transaction', 'account', 'budget'
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  entry: Omit<AuditLogEntry, "id" | "created_at">
): Promise<void> {
  try {
    // In production, consider using a dedicated audit log table or external service
    const auditEntry = {
      ...entry,
      created_at: new Date().toISOString(),
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    };

    // For MVP, we'll log to console and optionally to database
    console.log("🔒 AUDIT LOG:", {
      timestamp: auditEntry.created_at,
      user: entry.user_id,
      event: entry.event_type,
      severity: entry.severity,
      description: entry.event_description,
      resource: entry.resource_type
        ? `${entry.resource_type}:${entry.resource_id}`
        : undefined,
      metadata: entry.metadata,
    });

    // TODO: In production, implement proper audit log storage
    // This could be a separate database, external logging service, or blockchain-based system

    // For now, we'll store critical events in a simple table
    if (
      entry.severity === AuditSeverity.HIGH ||
      entry.severity === AuditSeverity.CRITICAL
    ) {
      await supabase.from("audit_logs").insert(auditEntry).select().single();
    }
  } catch (error) {
    // Audit logging should not break the application
    console.error("Failed to log audit event:", error);
    console.error("Original audit entry:", entry);
  }
}

/**
 * Convenience functions for common audit events
 */
export const auditLogger = {
  // Authentication
  loginSuccess: (userId: string, ipAddress?: string, userAgent?: string) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.LOGIN,
      event_description: "User logged in successfully",
      severity: AuditSeverity.LOW,
      ip_address: ipAddress,
      user_agent: userAgent,
    }),

  loginFailed: (userId: string, reason: string, ipAddress?: string) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.LOGIN_FAILED,
      event_description: `Login failed: ${reason}`,
      severity: AuditSeverity.MEDIUM,
      ip_address: ipAddress,
    }),

  // Account operations
  accountCreated: (userId: string, accountId: string, accountName: string) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.ACCOUNT_CREATED,
      event_description: `Created account: ${accountName}`,
      severity: AuditSeverity.LOW,
      resource_type: "account",
      resource_id: accountId,
    }),

  accountDeleted: (userId: string, accountId: string, accountName: string) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.ACCOUNT_DELETED,
      event_description: `Deleted account: ${accountName}`,
      severity: AuditSeverity.MEDIUM,
      resource_type: "account",
      resource_id: accountId,
    }),

  balanceUpdated: (
    userId: string,
    accountId: string,
    oldBalance: number,
    newBalance: number
  ) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.ACCOUNT_BALANCE_UPDATED,
      event_description: `Balance updated from ${oldBalance} to ${newBalance}`,
      severity: AuditSeverity.LOW,
      resource_type: "account",
      resource_id: accountId,
      metadata: { old_balance: oldBalance, new_balance: newBalance },
    }),

  // Transaction operations
  transactionCreated: (
    userId: string,
    transactionId: string,
    amount: number,
    description: string
  ) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.TRANSACTION_CREATED,
      event_description: `Created transaction: ${description} (${amount})`,
      severity: AuditSeverity.LOW,
      resource_type: "transaction",
      resource_id: transactionId,
      metadata: { amount },
    }),

  transactionBulkDeleted: (
    userId: string,
    transactionIds: string[],
    count: number
  ) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.TRANSACTION_BULK_DELETED,
      event_description: `Bulk deleted ${count} transactions`,
      severity: AuditSeverity.MEDIUM,
      resource_type: "transaction",
      metadata: { transaction_ids: transactionIds, count },
    }),

  // Security events
  suspiciousActivity: (
    userId: string,
    description: string,
    metadata?: Record<string, unknown>
  ) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
      event_description: description,
      severity: AuditSeverity.HIGH,
      metadata,
    }),

  dataExport: (userId: string, exportType: string, recordCount: number) =>
    logAuditEvent({
      user_id: userId,
      event_type: AuditEventType.DATA_EXPORT,
      event_description: `Exported ${recordCount} records (${exportType})`,
      severity: AuditSeverity.MEDIUM,
      metadata: { export_type: exportType, record_count: recordCount },
    }),
};

/**
 * Create audit logs table migration
 */
export const AUDIT_LOGS_MIGRATION = `
-- Create audit logs table for critical security events
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own audit logs, admins can view all
CREATE POLICY audit_logs_user_policy ON audit_logs
FOR SELECT
USING (
    user_id = auth.uid()::VARCHAR
    OR 
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid()::VARCHAR 
        AND role = 'admin'
    )
);

-- Only the system can insert audit logs (no user inserts)
CREATE POLICY audit_logs_insert_policy ON audit_logs
FOR INSERT
WITH CHECK (false); -- Prevent user inserts, only system inserts allowed
`;
