import "server-only";

import { hasPermission, PermissionError, type Permission } from "@/lib/permissions";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { logUserActivity } from "@/lib/observability";
import { createRiskAssessmentSnapshot } from "@/lib/risk";
import {
  createInviteSchema,
  createBackupJobSchema,
  createComplianceCheckSchema,
  createDeviceSchema,
  createIncidentSchema,
  createTrainingRecordSchema,
  createVendorSchema,
  createVulnerabilitySchema,
  securityAlertStatusSchema,
  updateBackupJobSchema,
  updateComplianceCheckSchema,
  updateDeviceSchema,
  updateIncidentSchema,
  updateTrainingRecordSchema,
  updateVendorSchema,
  updateVulnerabilitySchema,
} from "@/lib/validation";
import type {
  BackupJob,
  OrganizationInvite,
  SecurityAlertStatus,
  TrainingRecord,
  UserProfile,
  UserRole,
  Vendor,
} from "@/types/database";

async function getActorContext(permission?: Permission) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  const profileResult = await supabase.from("users").select("*").eq("id", user.id).single();
  const profile = (profileResult.data ?? null) as UserProfile | null;

  if (!profile?.organization_id) {
    throw new Error("Your account is not assigned to an organization.");
  }

  if (permission && !hasPermission(profile.role, permission)) {
    throw new PermissionError();
  }

  return {
    supabase,
    profile: {
      ...profile,
      organization_id: profile.organization_id,
    },
  };
}

async function writeAuditLog(userId: string, organizationId: string, action: string) {
  const supabase = await createServerSupabaseClient();

  await supabase.from("audit_logs").insert({
    user_id: userId,
    organization_id: organizationId,
    action,
  });
}

async function trackActivity(args: {
  userId: string;
  organizationId: string;
  action: string;
  module: string;
  auditAction: string;
}) {
  await Promise.all([
    writeAuditLog(args.userId, args.organizationId, args.auditAction),
    logUserActivity({
      userId: args.userId,
      action: args.action,
      module: args.module,
    }),
  ]);
}

async function syncBackupAlert(organizationId: string, status: BackupJob["status"]) {
  const supabase = await createServerSupabaseClient();
  const title = "Backup monitoring alert";
  const { data: existing } = await supabase
    .from("security_alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("title", title)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const shouldOpen = status === "failed" || status === "warning";

  if (shouldOpen && !existing) {
    await supabase.from("security_alerts").insert({
      organization_id: organizationId,
      title,
      severity: status === "failed" ? "critical" : "high",
      message:
        status === "failed"
          ? "Latest monitored backup job failed and requires immediate review."
          : "Latest monitored backup job completed with warnings.",
      status: "open",
    });
    return;
  }

  if (shouldOpen && existing) {
    await supabase
      .from("security_alerts")
      .update({
        severity: status === "failed" ? "critical" : "high",
        message:
          status === "failed"
            ? "Latest monitored backup job failed and requires immediate review."
            : "Latest monitored backup job completed with warnings.",
        status: "open",
      })
      .eq("id", existing.id);
    return;
  }

  if (!shouldOpen && existing?.status === "open") {
    await supabase.from("security_alerts").update({ status: "resolved" }).eq("id", existing.id);
  }
}

export async function createDevice(payload: unknown) {
  const input = createDeviceSchema.parse(payload);
  const { supabase, profile } = await getActorContext("create_device");

  const { data, error } = await supabase
    .from("devices")
    .insert({
      ...input,
      organization_id: profile.organization_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "device_created",
    module: "devices",
    auditAction: `device_created:${data.id}`,
  });

  return data;
}

export async function updateDevice(id: string, payload: unknown) {
  const input = updateDeviceSchema.parse(payload);
  const { supabase, profile } = await getActorContext("edit_device");

  const { data, error } = await supabase
    .from("devices")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "device_updated",
    module: "devices",
    auditAction: `device_updated:${id}`,
  });

  return data;
}

export async function deleteDevice(id: string) {
  const { supabase, profile } = await getActorContext("delete_device");
  const { error } = await supabase.from("devices").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "device_deleted",
    module: "devices",
    auditAction: `device_deleted:${id}`,
  });
}

export async function createVulnerability(payload: unknown) {
  const input = createVulnerabilitySchema.parse(payload);
  const { supabase, profile } = await getActorContext("create_vulnerability");

  const { data, error } = await supabase.from("vulnerabilities").insert(input).select().single();

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "vulnerability_created",
      module: "vulnerabilities",
      auditAction: `vulnerability_created:${data.id}`,
    }),
    createRiskAssessmentSnapshot(profile.organization_id),
  ]);

  return data;
}

export async function updateVulnerability(id: string, payload: unknown) {
  const input = updateVulnerabilitySchema.parse(payload);
  const { supabase, profile } = await getActorContext("edit_vulnerability");

  const { data, error } = await supabase
    .from("vulnerabilities")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "vulnerability_updated",
      module: "vulnerabilities",
      auditAction: `vulnerability_updated:${id}`,
    }),
    createRiskAssessmentSnapshot(profile.organization_id),
  ]);

  return data;
}

export async function deleteVulnerability(id: string) {
  const { supabase, profile } = await getActorContext("delete_vulnerability");
  const { error } = await supabase.from("vulnerabilities").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "vulnerability_deleted",
      module: "vulnerabilities",
      auditAction: `vulnerability_deleted:${id}`,
    }),
    createRiskAssessmentSnapshot(profile.organization_id),
  ]);
}

export async function createIncident(payload: unknown) {
  const input = createIncidentSchema.parse(payload);
  const { supabase, profile } = await getActorContext("create_incident");

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      ...input,
      organization_id: profile.organization_id,
      reported_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "incident_reported",
      module: "incidents",
      auditAction: `incident_created:${data.id}`,
    }),
    createRiskAssessmentSnapshot(profile.organization_id),
  ]);

  return data;
}

export async function updateIncident(id: string, payload: unknown) {
  const input = updateIncidentSchema.parse(payload);
  const { supabase, profile } = await getActorContext("edit_incident");

  const { data, error } = await supabase
    .from("incidents")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "incident_updated",
      module: "incidents",
      auditAction: `incident_updated:${id}`,
    }),
    createRiskAssessmentSnapshot(profile.organization_id),
  ]);

  return data;
}

export async function deleteIncident(id: string) {
  const { supabase, profile } = await getActorContext("delete_incident");
  const { error } = await supabase.from("incidents").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "incident_deleted",
      module: "incidents",
      auditAction: `incident_deleted:${id}`,
    }),
    createRiskAssessmentSnapshot(profile.organization_id),
  ]);
}

export async function createComplianceCheck(payload: unknown) {
  const input = createComplianceCheckSchema.parse(payload);
  const { supabase, profile } = await getActorContext("create_compliance_check");

  const { data, error } = await supabase
    .from("compliance_checks")
    .insert({
      ...input,
      organization_id: profile.organization_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "compliance_check_created",
    module: "compliance",
    auditAction: `compliance_check_created:${data.id}`,
  });

  return data;
}

export async function updateComplianceCheck(id: string, payload: unknown) {
  const input = updateComplianceCheckSchema.parse(payload);
  const { supabase, profile } = await getActorContext("edit_compliance_check");

  const { data, error } = await supabase
    .from("compliance_checks")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "compliance_check_updated",
    module: "compliance",
    auditAction: `compliance_check_updated:${id}`,
  });

  return data;
}

export async function deleteComplianceCheck(id: string) {
  const { supabase, profile } = await getActorContext("delete_compliance_check");
  const { error } = await supabase.from("compliance_checks").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "compliance_check_deleted",
    module: "compliance",
    auditAction: `compliance_check_deleted:${id}`,
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { supabase, profile } = await getActorContext("manage_users");

  if (profile.id === userId && role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const { data: targetUser } = await supabase.from("users").select("*").eq("id", userId).single();

  if (!targetUser || targetUser.organization_id !== profile.organization_id) {
    throw new Error("User not found in your organization.");
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "user_role_updated",
    module: "users",
    auditAction: `user_role_updated:${userId}:${role}`,
  });

  return data;
}

export async function createOrganizationInvite(payload: unknown) {
  const input = createInviteSchema.parse(payload);
  const { supabase, profile } = await getActorContext("manage_users");

  const { data: existingInvite } = await supabase
    .from("organization_invites")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending")
    .ilike("email", input.email)
    .maybeSingle();

  if (existingInvite) {
    throw new Error("A pending invite already exists for this email address.");
  }

  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: profile.organization_id,
      email: input.email,
      role: input.role,
      invited_by: profile.id,
    })
    .select("*")
    .single<OrganizationInvite>();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "user_invited",
    module: "users",
    auditAction: `user_invited:${data.email}:${data.role}`,
  });

  return data;
}

export async function createVendor(payload: unknown) {
  const input = createVendorSchema.parse(payload);
  const { supabase, profile } = await getActorContext("create_vendor");
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      ...input,
      organization_id: profile.organization_id,
    })
    .select("*")
    .single<Vendor>();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "vendor_created",
    module: "vendors",
    auditAction: `vendor_created:${data.id}`,
  });

  return data;
}

export async function updateVendor(id: string, payload: unknown) {
  const input = updateVendorSchema.parse(payload);
  const { supabase, profile } = await getActorContext("edit_vendor");
  const { data, error } = await supabase
    .from("vendors")
    .update(input)
    .eq("id", id)
    .select("*")
    .single<Vendor>();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "vendor_updated",
    module: "vendors",
    auditAction: `vendor_updated:${id}`,
  });

  return data;
}

export async function deleteVendor(id: string) {
  const { supabase, profile } = await getActorContext("delete_vendor");
  const { error } = await supabase.from("vendors").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "vendor_deleted",
    module: "vendors",
    auditAction: `vendor_deleted:${id}`,
  });
}

export async function createTrainingRecord(payload: unknown) {
  const input = createTrainingRecordSchema.parse(payload);
  const { supabase, profile } = await getActorContext("assign_training");
  const { data: assignee } = await supabase.from("users").select("*").eq("id", input.user_id).single();

  if (!assignee || assignee.organization_id !== profile.organization_id) {
    throw new Error("Training can only be assigned within your organization.");
  }

  const { data, error } = await supabase
    .from("training_records")
    .insert(input)
    .select("*")
    .single<TrainingRecord>();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "training_assigned",
    module: "training",
    auditAction: `training_created:${data.id}`,
  });

  return data;
}

export async function updateTrainingRecord(id: string, payload: unknown) {
  const input = updateTrainingRecordSchema.parse(payload);
  const { supabase, profile } = await getActorContext("edit_training");

  if (input.user_id) {
    const { data: assignee } = await supabase.from("users").select("*").eq("id", input.user_id).single();

    if (!assignee || assignee.organization_id !== profile.organization_id) {
      throw new Error("Training can only be assigned within your organization.");
    }
  }

  const { data, error } = await supabase
    .from("training_records")
    .update(input)
    .eq("id", id)
    .select("*")
    .single<TrainingRecord>();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "training_updated",
    module: "training",
    auditAction: `training_updated:${id}`,
  });

  return data;
}

export async function createBackupJob(payload: unknown) {
  const input = createBackupJobSchema.parse(payload);
  const { supabase, profile } = await getActorContext("create_backup_job");
  const { data, error } = await supabase
    .from("backup_jobs")
    .insert({
      ...input,
      organization_id: profile.organization_id,
    })
    .select("*")
    .single<BackupJob>();

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "backup_job_recorded",
      module: "backups",
      auditAction: `backup_created:${data.id}`,
    }),
    syncBackupAlert(profile.organization_id, data.status),
  ]);

  return data;
}

export async function updateBackupJob(id: string, payload: unknown) {
  const input = updateBackupJobSchema.parse(payload);
  const { supabase, profile } = await getActorContext("edit_backup_job");
  const { data, error } = await supabase
    .from("backup_jobs")
    .update(input)
    .eq("id", id)
    .select("*")
    .single<BackupJob>();

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all([
    trackActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: "backup_job_updated",
      module: "backups",
      auditAction: `backup_updated:${id}`,
    }),
    syncBackupAlert(profile.organization_id, data.status),
  ]);

  return data;
}

export async function updateSecurityAlertStatus(id: string, status: SecurityAlertStatus) {
  const { supabase, profile } = await getActorContext("edit_alert");
  const normalizedStatus = securityAlertStatusSchema.parse(status);
  const { data, error } = await supabase
    .from("security_alerts")
    .update({ status: normalizedStatus })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await trackActivity({
    userId: profile.id,
    organizationId: profile.organization_id,
    action: "security_alert_updated",
    module: "dashboard",
    auditAction: `security_alert_updated:${id}:${normalizedStatus}`,
  });

  return data;
}
