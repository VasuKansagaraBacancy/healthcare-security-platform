"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  createOrganizationInvite,
  createBackupJob,
  createComplianceCheck,
  createDevice,
  createIncident,
  createTrainingRecord,
  createVendor,
  createVulnerability,
  updateBackupJob,
  updateSecurityAlertStatus,
  updateTrainingRecord,
  updateUserRole,
  updateComplianceCheck,
  updateIncident,
  updateVendor,
  updateVulnerability,
} from "@/lib/mutations";
import { logUserActivity } from "@/lib/observability";
import { getPendingInviteDetails } from "@/lib/data";
import {
  createBackupJobSchema,
  createComplianceCheckSchema,
  createDeviceSchema,
  createInviteSchema,
  createIncidentSchema,
  createTrainingRecordSchema,
  createVendorSchema,
  createVulnerabilitySchema,
  incidentStatusSchema,
  loginSchema,
  registerSchema,
  roleSchema,
  securityAlertStatusSchema,
  updateBackupJobSchema,
  updateTrainingRecordSchema,
  updateVendorSchema,
  vulnerabilityStatusSchema,
} from "@/lib/validation";

export interface ActionResult {
  success: boolean;
  message: string;
  redirectTo?: string;
  inviteLink?: string;
}

function notConfiguredResult(): ActionResult {
  return {
    success: false,
    message: "Supabase environment variables are not configured.",
  };
}

export async function loginAction(payload: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return notConfiguredResult();
  }

  const input = loginSchema.parse(payload);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) {
    return { success: false, message: error.message };
  }

  if (data.user) {
    await logUserActivity({
      userId: data.user.id,
      action: "login",
      module: "authentication",
    });
  }

  return {
    success: true,
    message: "Login successful.",
    redirectTo: "/dashboard",
  };
}

export async function registerAction(payload: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return notConfiguredResult();
  }

  const input = registerSchema.parse(payload);
  const invite = input.inviteToken ? await getPendingInviteDetails(input.inviteToken) : null;

  if (input.inviteToken && !invite) {
    return {
      success: false,
      message: "This invite is invalid, expired, or already used.",
    };
  }

  if (invite && invite.email.toLowerCase() !== input.email.toLowerCase()) {
    return {
      success: false,
      message: "This invite can only be used with the invited email address.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        ...(input.inviteToken
          ? { invite_token: input.inviteToken }
          : {
              organization_name: input.organizationName,
              role: "admin",
            }),
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  if (data.user && data.session) {
    await logUserActivity({
      userId: data.user.id,
      action: "register",
      module: "authentication",
    }).catch(() => undefined);
  }

  return {
    success: true,
    message: data.session
      ? invite
        ? "Invite accepted. Redirecting to your dashboard."
        : "Workspace created. Redirecting to your dashboard."
      : invite
        ? "Invite accepted. Check your email to confirm the session."
        : "Workspace created. Check your email to confirm the session.",
    redirectTo: data.session ? "/dashboard" : "/login",
  };
}

function buildAbsoluteUrl() {
  return headers().then((headerStore) => {
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}`;
  });
}

export async function createInviteAction(payload: unknown): Promise<ActionResult> {
  try {
    const invite = await createOrganizationInvite(createInviteSchema.parse(payload));
    const baseUrl = await buildAbsoluteUrl();
    revalidatePath("/users");
    return {
      success: true,
      message: "Invite link created successfully.",
      inviteLink: `${baseUrl}/register?invite=${invite.token}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create invite.",
    };
  }
}

export async function logoutAction() {
  if (!isSupabaseConfigured()) {
    return { success: true, message: "Logged out." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logUserActivity({
      userId: user.id,
      action: "logout",
      module: "authentication",
    });
  }

  await supabase.auth.signOut();
  return { success: true, message: "Logged out." };
}

export async function createDeviceAction(payload: unknown): Promise<ActionResult> {
  try {
    await createDevice(createDeviceSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/devices");
    return { success: true, message: "Device added successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add device.",
    };
  }
}

export async function createVulnerabilityAction(payload: unknown): Promise<ActionResult> {
  try {
    await createVulnerability(createVulnerabilitySchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/vulnerabilities");
    return { success: true, message: "Vulnerability logged successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to log vulnerability.",
    };
  }
}

export async function updateVulnerabilityStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    await updateVulnerability(id, { status: vulnerabilityStatusSchema.parse(status) });
    revalidatePath("/dashboard");
    revalidatePath("/vulnerabilities");
    return { success: true, message: "Vulnerability status updated." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update vulnerability.",
    };
  }
}

export async function createIncidentAction(payload: unknown): Promise<ActionResult> {
  try {
    await createIncident(createIncidentSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/incidents");
    return { success: true, message: "Incident reported successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to report incident.",
    };
  }
}

export async function updateIncidentStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  try {
    await updateIncident(id, { status: incidentStatusSchema.parse(status) });
    revalidatePath("/dashboard");
    revalidatePath("/incidents");
    return { success: true, message: "Incident status updated." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update incident.",
    };
  }
}

export async function createComplianceCheckAction(payload: unknown): Promise<ActionResult> {
  try {
    await createComplianceCheck(createComplianceCheckSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/compliance");
    return { success: true, message: "Compliance check created successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create compliance check.",
    };
  }
}

export async function updateComplianceCheckAction(
  id: string,
  payload: unknown,
): Promise<ActionResult> {
  try {
    await updateComplianceCheck(id, createComplianceCheckSchema.partial().parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/compliance");
    return { success: true, message: "Compliance check updated successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update compliance check.",
    };
  }
}

export async function updateUserRoleAction(id: string, role: string): Promise<ActionResult> {
  try {
    await updateUserRole(id, roleSchema.parse(role));
    revalidatePath("/users");
    return { success: true, message: "User role updated successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update user role.",
    };
  }
}

export async function createVendorAction(payload: unknown): Promise<ActionResult> {
  try {
    await createVendor(createVendorSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/vendors");
    return { success: true, message: "Vendor added successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add vendor.",
    };
  }
}

export async function updateVendorAction(id: string, payload: unknown): Promise<ActionResult> {
  try {
    await updateVendor(id, updateVendorSchema.parse(payload));
    revalidatePath("/vendors");
    return { success: true, message: "Vendor updated successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update vendor.",
    };
  }
}

export async function createTrainingRecordAction(payload: unknown): Promise<ActionResult> {
  try {
    await createTrainingRecord(createTrainingRecordSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/training");
    return { success: true, message: "Training assigned successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to assign training.",
    };
  }
}

export async function updateTrainingRecordAction(
  id: string,
  payload: unknown,
): Promise<ActionResult> {
  try {
    await updateTrainingRecord(id, updateTrainingRecordSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/training");
    return { success: true, message: "Training record updated successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update training record.",
    };
  }
}

export async function createBackupJobAction(payload: unknown): Promise<ActionResult> {
  try {
    await createBackupJob(createBackupJobSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/backups");
    return { success: true, message: "Backup job recorded successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to record backup job.",
    };
  }
}

export async function updateBackupJobAction(id: string, payload: unknown): Promise<ActionResult> {
  try {
    await updateBackupJob(id, updateBackupJobSchema.parse(payload));
    revalidatePath("/dashboard");
    revalidatePath("/backups");
    return { success: true, message: "Backup job updated successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update backup job.",
    };
  }
}

export async function updateAlertStatusAction(id: string, status: string): Promise<ActionResult> {
  try {
    await updateSecurityAlertStatus(id, securityAlertStatusSchema.parse(status));
    revalidatePath("/dashboard");
    return { success: true, message: "Alert status updated successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update alert.",
    };
  }
}
