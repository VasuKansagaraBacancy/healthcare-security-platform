export type UserRole = "admin" | "analyst" | "auditor";
export type DeviceType =
  | "medical_device"
  | "server"
  | "workstation"
  | "network"
  | "cloud_service"
  | "application";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type VulnerabilitySeverity = "low" | "medium" | "high" | "critical";
export type VulnerabilityStatus =
  | "open"
  | "investigating"
  | "remediated"
  | "accepted_risk";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "investigating" | "mitigated" | "closed";
export type ComplianceStatus =
  | "compliant"
  | "in_progress"
  | "at_risk"
  | "non_compliant";
export type TrainingCompletionStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "overdue";
export type SecurityAlertStatus = "open" | "acknowledged" | "resolved";
export type BackupJobStatus = "success" | "warning" | "failed" | "running";
export type InviteStatus = "pending" | "accepted" | "revoked";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          organization_id?: string | null;
          created_at?: string;
        };
      };
      organization_invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: UserRole;
          invited_by: string | null;
          token: string;
          status: InviteStatus;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role: UserRole;
          invited_by?: string | null;
          token?: string;
          status?: InviteStatus;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: UserRole;
          invited_by?: string | null;
          token?: string;
          status?: InviteStatus;
          invited_at?: string;
          accepted_at?: string | null;
        };
      };
      devices: {
        Row: {
          id: string;
          name: string;
          type: DeviceType;
          risk_level: RiskLevel;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: DeviceType;
          risk_level: RiskLevel;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: DeviceType;
          risk_level?: RiskLevel;
          organization_id?: string;
          created_at?: string;
        };
      };
      vulnerabilities: {
        Row: {
          id: string;
          title: string;
          severity: VulnerabilitySeverity;
          status: VulnerabilityStatus;
          device_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          severity: VulnerabilitySeverity;
          status?: VulnerabilityStatus;
          device_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          severity?: VulnerabilitySeverity;
          status?: VulnerabilityStatus;
          device_id?: string;
          created_at?: string;
        };
      };
      incidents: {
        Row: {
          id: string;
          title: string;
          description: string;
          severity: IncidentSeverity;
          status: IncidentStatus;
          organization_id: string;
          reported_by: string | null;
          owner_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          severity: IncidentSeverity;
          status?: IncidentStatus;
          organization_id: string;
          reported_by?: string | null;
          owner_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          organization_id?: string;
          reported_by?: string | null;
          owner_user_id?: string | null;
          created_at?: string;
        };
      };
      compliance_checks: {
        Row: {
          id: string;
          name: string;
          status: ComplianceStatus;
          score: number;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: ComplianceStatus;
          score: number;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: ComplianceStatus;
          score?: number;
          organization_id?: string;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          action: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          action?: string;
          created_at?: string;
        };
      };
      risk_assessments: {
        Row: {
          id: string;
          organization_id: string;
          risk_score: number;
          critical_vulnerabilities: number;
          high_vulnerabilities: number;
          medium_vulnerabilities: number;
          open_incidents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          risk_score: number;
          critical_vulnerabilities: number;
          high_vulnerabilities: number;
          medium_vulnerabilities: number;
          open_incidents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          risk_score?: number;
          critical_vulnerabilities?: number;
          high_vulnerabilities?: number;
          medium_vulnerabilities?: number;
          open_incidents?: number;
          created_at?: string;
        };
      };
      user_activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          module: string;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          module: string;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          module?: string;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          risk_level: RiskLevel;
          compliance_status: ComplianceStatus;
          contact_email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          risk_level: RiskLevel;
          compliance_status: ComplianceStatus;
          contact_email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          risk_level?: RiskLevel;
          compliance_status?: ComplianceStatus;
          contact_email?: string;
          created_at?: string;
        };
      };
      training_records: {
        Row: {
          id: string;
          user_id: string;
          training_name: string;
          completion_status: TrainingCompletionStatus;
          completion_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          training_name: string;
          completion_status?: TrainingCompletionStatus;
          completion_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          training_name?: string;
          completion_status?: TrainingCompletionStatus;
          completion_date?: string | null;
          created_at?: string;
        };
      };
      security_alerts: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          severity: VulnerabilitySeverity;
          message: string;
          status: SecurityAlertStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          severity: VulnerabilitySeverity;
          message: string;
          status?: SecurityAlertStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          severity?: VulnerabilitySeverity;
          message?: string;
          status?: SecurityAlertStatus;
          created_at?: string;
        };
      };
      backup_jobs: {
        Row: {
          id: string;
          organization_id: string;
          status: BackupJobStatus;
          last_backup_time: string;
          backup_size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          status: BackupJobStatus;
          last_backup_time: string;
          backup_size: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          status?: BackupJobStatus;
          last_backup_time?: string;
          backup_size?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      device_type: DeviceType;
      risk_level: RiskLevel;
      vulnerability_severity: VulnerabilitySeverity;
      vulnerability_status: VulnerabilityStatus;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
      compliance_status: ComplianceStatus;
      training_completion_status: TrainingCompletionStatus;
      security_alert_status: SecurityAlertStatus;
      backup_job_status: BackupJobStatus;
      invite_status: InviteStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = Database["public"]["Tables"][T]["Update"];

export type Organization = TableRow<"organizations">;
export type UserProfile = TableRow<"users">;
export type OrganizationInvite = TableRow<"organization_invites">;
export type Device = TableRow<"devices">;
export type Vulnerability = TableRow<"vulnerabilities">;
export type Incident = TableRow<"incidents">;
export type ComplianceCheck = TableRow<"compliance_checks">;
export type AuditLog = TableRow<"audit_logs">;
export type RiskAssessment = TableRow<"risk_assessments">;
export type UserActivityLog = TableRow<"user_activity_logs">;
export type Vendor = TableRow<"vendors">;
export type TrainingRecord = TableRow<"training_records">;
export type SecurityAlert = TableRow<"security_alerts">;
export type BackupJob = TableRow<"backup_jobs">;

export interface AuthContext {
  authUserId: string;
  email: string;
  profile: UserProfile;
  organization: Organization | null;
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  tone: "positive" | "warning" | "critical" | "neutral";
}

export interface SeverityChartPoint {
  label: string;
  value: number;
}

export interface IncidentChartPoint {
  label: string;
  open: number;
  mitigated: number;
}

export interface TrendChartPoint {
  label: string;
  value: number;
}

export interface TrainingChartPoint {
  label: string;
  value: number;
}

export interface DeviceWithCounts extends Device {
  vulnerability_count: number;
}

export interface VulnerabilityWithDevice extends Vulnerability {
  device_name: string;
  device_risk_level: RiskLevel;
}

export interface TrainingRecordWithUser extends TrainingRecord {
  user_email: string;
}

export interface UserActivityLogWithUser extends UserActivityLog {
  user_email: string;
}

export interface InviteDetails {
  email: string;
  role: UserRole;
  organization_name: string;
}
