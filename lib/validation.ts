import { z } from "zod";

export const roleSchema = z.enum(["admin", "analyst", "auditor"]);
export const deviceTypeSchema = z.enum([
  "medical_device",
  "server",
  "workstation",
  "network",
  "cloud_service",
  "application",
]);
export const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const vulnerabilitySeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export const vulnerabilityStatusSchema = z.enum([
  "open",
  "investigating",
  "remediated",
  "accepted_risk",
]);
export const incidentSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const incidentStatusSchema = z.enum([
  "open",
  "investigating",
  "mitigated",
  "closed",
]);
export const complianceStatusSchema = z.enum([
  "compliant",
  "in_progress",
  "at_risk",
  "non_compliant",
]);
export const trainingCompletionStatusSchema = z.enum([
  "assigned",
  "in_progress",
  "completed",
  "overdue",
]);
export const securityAlertStatusSchema = z.enum(["open", "acknowledged", "resolved"]);
export const backupJobStatusSchema = z.enum(["success", "warning", "failed", "running"]);
export const inviteStatusSchema = z.enum(["pending", "accepted", "revoked"]);

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = loginSchema.extend({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters.").optional(),
  role: roleSchema.optional(),
  inviteToken: z.uuid().optional(),
}).superRefine((value, ctx) => {
  if (!value.inviteToken && !value.organizationName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["organizationName"],
      message: "Organization name is required when creating a workspace.",
    });
  }
});

export const createInviteSchema = z.object({
  email: z.email(),
  role: roleSchema,
});

export const createDeviceSchema = z.object({
  name: z.string().min(2).max(120),
  type: deviceTypeSchema,
  risk_level: riskLevelSchema,
});

export const updateDeviceSchema = createDeviceSchema.partial();

export const createVulnerabilitySchema = z.object({
  title: z.string().min(3).max(180),
  severity: vulnerabilitySeveritySchema,
  status: vulnerabilityStatusSchema.default("open"),
  device_id: z.uuid(),
});

export const updateVulnerabilitySchema = createVulnerabilitySchema.partial();

export const createIncidentSchema = z.object({
  title: z.string().min(3).max(180),
  description: z.string().min(10).max(2000),
  severity: incidentSeveritySchema,
  status: incidentStatusSchema.default("open"),
});

export const updateIncidentSchema = createIncidentSchema.partial();

export const createComplianceCheckSchema = z.object({
  name: z.string().min(3).max(180),
  status: complianceStatusSchema,
  score: z.coerce.number().min(0).max(100),
});

export const updateComplianceCheckSchema = createComplianceCheckSchema.partial();

export const createVendorSchema = z.object({
  name: z.string().min(2).max(180),
  risk_level: riskLevelSchema,
  compliance_status: complianceStatusSchema,
  contact_email: z.email(),
});

export const updateVendorSchema = createVendorSchema.partial().extend({
  id: z.uuid().optional(),
});

export const createTrainingRecordSchema = z.object({
  user_id: z.uuid(),
  training_name: z.string().min(3).max(180),
  completion_status: trainingCompletionStatusSchema.default("assigned"),
  completion_date: z.string().date().nullable().optional(),
});

export const updateTrainingRecordSchema = createTrainingRecordSchema.partial().extend({
  id: z.uuid().optional(),
});

export const createBackupJobSchema = z.object({
  status: backupJobStatusSchema,
  last_backup_time: z.string().min(1),
  backup_size: z.coerce.number().min(0),
});

export const updateBackupJobSchema = createBackupJobSchema.partial().extend({
  id: z.uuid().optional(),
});

export const updateAlertStatusSchema = z.object({
  id: z.uuid(),
  status: securityAlertStatusSchema,
});

export const auditLogQuerySchema = z.object({
  user: z.uuid().optional(),
  action: z.string().optional(),
});

export const reportQuerySchema = z.object({
  type: z.enum(["executive", "operations", "compliance"]).default("executive"),
  format: z.enum(["json"]).default("json"),
});

export const aiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const aiChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(aiChatMessageSchema).max(12).optional(),
});
