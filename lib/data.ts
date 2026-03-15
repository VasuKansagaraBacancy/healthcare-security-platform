import "server-only";

import { requireUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createRiskAssessmentSnapshot, summarizeBackupStatus } from "@/lib/risk";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type {
  BackupJob,
  ComplianceCheck,
  DashboardMetric,
  Device,
  DeviceWithCounts,
  Incident,
  InviteDetails,
  OrganizationInvite,
  RiskAssessment,
  SecurityAlert,
  SeverityChartPoint,
  TrainingChartPoint,
  TrainingRecord,
  TrainingRecordWithUser,
  TrendChartPoint,
  UserActivityLog,
  UserActivityLogWithUser,
  UserProfile,
  Vendor,
  Vulnerability,
  VulnerabilityWithDevice,
} from "@/types/database";

function buildSeveritySeries(vulnerabilities: Vulnerability[]): SeverityChartPoint[] {
  const counts = new Map<string, number>([
    ["Low", 0],
    ["Medium", 0],
    ["High", 0],
    ["Critical", 0],
  ]);

  vulnerabilities.forEach((item) => {
    const key = item.severity[0].toUpperCase() + item.severity.slice(1);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

function buildIncidentStatusSeries(incidents: Incident[]): SeverityChartPoint[] {
  const counts = new Map<string, number>([
    ["Open", 0],
    ["Investigating", 0],
    ["Mitigated", 0],
    ["Closed", 0],
  ]);

  incidents.forEach((item) => {
    const key = item.status
      .split("_")
      .map((segment) => segment[0].toUpperCase() + segment.slice(1))
      .join(" ");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

function buildTrainingCompletionSeries(records: TrainingRecord[]): TrainingChartPoint[] {
  const counts = new Map<string, number>([
    ["Assigned", 0],
    ["In progress", 0],
    ["Completed", 0],
    ["Overdue", 0],
  ]);

  records.forEach((item) => {
    const key = item.completion_status
      .split("_")
      .map((segment) => segment[0].toUpperCase() + segment.slice(1))
      .join(" ");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

function buildRiskTrendSeries(riskAssessments: RiskAssessment[]): TrendChartPoint[] {
  return [...riskAssessments]
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .slice(-8)
    .map((item) => ({
      label: new Date(item.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      value: item.risk_score,
    }));
}

function calculateComplianceScore(checks: ComplianceCheck[]) {
  if (!checks.length) {
    return 0;
  }

  const total = checks.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / checks.length);
}

function calculateSecurityScore(args: {
  complianceScore: number;
  vulnerabilities: Vulnerability[];
  incidents: Incident[];
  devices: Device[];
}) {
  const criticalVulnerabilities = args.vulnerabilities.filter(
    (item) => item.severity === "critical",
  ).length;
  const activeIncidents = args.incidents.filter((item) => item.status !== "closed").length;
  const criticalDevices = args.devices.filter((item) => item.risk_level === "critical").length;
  const score =
    args.complianceScore -
    criticalVulnerabilities * 8 -
    activeIncidents * 6 -
    criticalDevices * 4 +
    42;

  return Math.max(0, Math.min(100, Math.round(score)));
}

async function getOrganizationContext() {
  const currentUser = await requireUser();
  const supabase = isSupabaseConfigured() ? await createServerSupabaseClient() : null;
  return { currentUser, supabase };
}

async function getUsersForOrganization(organizationId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return (data ?? []) as UserProfile[];
}

export async function getOrgScopedData() {
  const { currentUser, supabase } = await getOrganizationContext();

  if (!supabase) {
    return {
      currentUser,
      devices: [] as Device[],
      vulnerabilities: [] as Vulnerability[],
      incidents: [] as Incident[],
      complianceChecks: [] as ComplianceCheck[],
      auditLogs: [] as { action: string; created_at: string }[],
      openAlerts: [] as SecurityAlert[],
      backupJobs: [] as BackupJob[],
    };
  }

  const organizationId = currentUser.profile.organization_id!;
  if (hasPermission(currentUser.profile.role, "run_risk_assessment")) {
    await createRiskAssessmentSnapshot(organizationId);
  }

  const users = await getUsersForOrganization(organizationId);
  const userIds = users.map((user) => user.id);

  const [devicesResult, vulnerabilitiesResult, incidentsResult, complianceResult, auditResult, alertsResult, backupsResult] =
    await Promise.all([
      supabase
        .from("devices")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase.from("vulnerabilities").select("*").order("created_at", { ascending: false }),
      supabase
        .from("incidents")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("compliance_checks")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("audit_logs")
        .select("action, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("security_alerts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("backup_jobs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("last_backup_time", { ascending: false }),
    ]);

  const devices = (devicesResult.data ?? []) as Device[];
  const vulnerabilities = ((vulnerabilitiesResult.data ?? []) as Vulnerability[]).filter((item) =>
    devices.some((device) => device.id === item.device_id),
  );
  const incidents = (incidentsResult.data ?? []) as Incident[];
  const complianceChecks = (complianceResult.data ?? []) as ComplianceCheck[];
  const openAlerts = ((alertsResult.data ?? []) as SecurityAlert[]).filter(
    (item) => item.status === "open",
  );

  return {
    currentUser,
    users,
    userIds,
    devices,
    vulnerabilities,
    incidents,
    complianceChecks,
    auditLogs: auditResult.data ?? [],
    openAlerts,
    alerts: (alertsResult.data ?? []) as SecurityAlert[],
    backupJobs: (backupsResult.data ?? []) as BackupJob[],
  };
}

export async function getDashboardData() {
  const {
    currentUser,
    users,
    userIds = [],
    devices,
    vulnerabilities,
    incidents,
    complianceChecks,
    auditLogs,
    openAlerts,
    alerts,
    backupJobs,
  } = await getOrgScopedData();

  const supabase = await createServerSupabaseClient();
  const organizationId = currentUser.profile.organization_id!;
  const [riskResult, trainingResult] = await Promise.all([
    supabase
      .from("risk_assessments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("training_records")
      .select("*")
      .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const riskAssessments = (riskResult.data ?? []) as RiskAssessment[];
  const currentRisk = riskAssessments[0] ?? null;
  const trainingRecords = (trainingResult.data ?? []) as TrainingRecord[];

  const complianceScore = calculateComplianceScore(complianceChecks);
  const securityScore = calculateSecurityScore({
    complianceScore,
    vulnerabilities,
    incidents,
    devices,
  });
  const activeIncidents = incidents.filter((item) => item.status !== "closed").length;
  const criticalOpen = vulnerabilities.filter(
    (item) => item.severity === "critical" && item.status !== "remediated",
  ).length;
  const backupSummary = summarizeBackupStatus(backupJobs);

  const metrics: DashboardMetric[] = [
    {
      label: "Security score",
      value: `${securityScore}%`,
      change: `${criticalOpen} critical items require action`,
      tone: securityScore >= 80 ? "positive" : securityScore >= 60 ? "warning" : "critical",
    },
    {
      label: "Overall risk score",
      value: `${currentRisk?.risk_score ?? 0}`,
      change: `${currentRisk?.critical_vulnerabilities ?? 0} critical, ${currentRisk?.open_incidents ?? 0} open incidents`,
      tone:
        (currentRisk?.risk_score ?? 0) <= 20
          ? "positive"
          : (currentRisk?.risk_score ?? 0) <= 45
            ? "warning"
            : "critical",
    },
    {
      label: "Vulnerabilities",
      value: vulnerabilities.length.toString(),
      change: `${criticalOpen} critical still open`,
      tone: criticalOpen > 0 ? "critical" : "neutral",
    },
    {
      label: "Active incidents",
      value: activeIncidents.toString(),
      change: `${incidents.filter((item) => item.status === "mitigated").length} mitigated`,
      tone: activeIncidents > 0 ? "warning" : "positive",
    },
    {
      label: "Compliance score",
      value: `${complianceScore}%`,
      change: `${complianceChecks.filter((item) => item.status === "compliant").length} controls compliant`,
      tone: complianceScore >= 85 ? "positive" : complianceScore >= 70 ? "warning" : "critical",
    },
    {
      label: "Backup status",
      value: backupSummary.label,
      change: backupSummary.detail,
      tone: backupSummary.tone,
    },
  ];

  const deviceMap = new Map(devices.map((item) => [item.id, item]));
  const deviceList: DeviceWithCounts[] = devices.map((device) => ({
    ...device,
    vulnerability_count: vulnerabilities.filter((item) => item.device_id === device.id).length,
  }));
  const vulnerabilityList: VulnerabilityWithDevice[] = vulnerabilities.map((item) => ({
    ...item,
    device_name: deviceMap.get(item.device_id)?.name ?? "Unknown device",
    device_risk_level: deviceMap.get(item.device_id)?.risk_level ?? "low",
  }));

  return {
    currentUser,
    metrics,
    riskTrendSeries: buildRiskTrendSeries(riskAssessments),
    severitySeries: buildSeveritySeries(vulnerabilities),
    incidentStatusSeries: buildIncidentStatusSeries(incidents),
    trainingCompletionSeries: buildTrainingCompletionSeries(trainingRecords),
    devices: deviceList,
    vulnerabilities: vulnerabilityList,
    incidents,
    complianceChecks,
    auditLogs,
    alerts,
    openAlerts,
    backupJobs,
    summary: {
      securityScore,
      complianceScore,
      currentRisk,
      latestBackup: backupJobs[0] ?? null,
    },
    users,
  };
}

export async function getReportData() {
  const dashboard = await getDashboardData();

  return {
    generated_at: new Date().toISOString(),
    organization: dashboard.currentUser.organization?.name ?? "Unassigned organization",
    overview: dashboard.metrics,
    devices: dashboard.devices,
    vulnerabilities: dashboard.vulnerabilities,
    incidents: dashboard.incidents,
    compliance_checks: dashboard.complianceChecks,
    alerts: dashboard.alerts,
    backup_jobs: dashboard.backupJobs,
    audit_logs: dashboard.auditLogs,
  };
}

export async function getOrganizationUsers() {
  const currentUser = await requireUser();

  if (!isSupabaseConfigured()) {
    return {
      currentUser,
      users: [] as UserProfile[],
      invites: [] as OrganizationInvite[],
      alertCount: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  const organizationId = currentUser.profile.organization_id!;
  const [usersResult, invitesResult, alertsResult] = await Promise.all([
    supabase
      .from("users")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .order("invited_at", { ascending: false }),
    supabase
      .from("security_alerts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("status", "open"),
  ]);

  return {
    currentUser,
    users: ((usersResult.data ?? []) as UserProfile[]).sort((left, right) => {
      if (left.role === right.role) {
        return left.email.localeCompare(right.email);
      }

      if (left.role === "admin") {
        return -1;
      }

      if (right.role === "admin") {
        return 1;
      }

      return left.email.localeCompare(right.email);
    }),
    invites: (invitesResult.data ?? []) as OrganizationInvite[],
    alertCount: alertsResult.data?.length ?? 0,
  };
}

export async function getPendingInviteDetails(token?: string | null) {
  if (!token || !isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_pending_invite_details", {
    invite_token: token,
  });

  if (error) {
    return null;
  }

  const invite = Array.isArray(data) ? data[0] : data;
  return (invite ?? null) as InviteDetails | null;
}

export async function getRiskData() {
  const { currentUser, supabase } = await getOrganizationContext();

  if (!supabase) {
    return {
      currentUser,
      currentRisk: null as RiskAssessment | null,
      history: [] as RiskAssessment[],
      trend: [] as TrendChartPoint[],
      alertCount: 0,
    };
  }

  if (hasPermission(currentUser.profile.role, "run_risk_assessment")) {
    await createRiskAssessmentSnapshot(currentUser.profile.organization_id!);
  }

  const [historyResult, alertsResult] = await Promise.all([
    supabase
      .from("risk_assessments")
      .select("*")
      .eq("organization_id", currentUser.profile.organization_id!)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("security_alerts")
      .select("id")
      .eq("organization_id", currentUser.profile.organization_id!)
      .eq("status", "open"),
  ]);

  const history = (historyResult.data ?? []) as RiskAssessment[];

  return {
    currentUser,
    currentRisk: history[0] ?? null,
    history,
    trend: buildRiskTrendSeries(history),
    alertCount: alertsResult.data?.length ?? 0,
  };
}

export async function getAuditActivityData(filters?: { user?: string; action?: string }) {
  const { currentUser, supabase } = await getOrganizationContext();

  if (!supabase) {
    return {
      currentUser,
      users: [] as UserProfile[],
      rows: [] as UserActivityLogWithUser[],
      alertCount: 0,
    };
  }

  const users = await getUsersForOrganization(currentUser.profile.organization_id!);
  const userIds = users.map((user) => user.id);
  let logs: UserActivityLog[] = [];
  const { data: alerts } = await supabase
    .from("security_alerts")
    .select("id")
    .eq("organization_id", currentUser.profile.organization_id!)
    .eq("status", "open");

  if (userIds.length > 0) {
    let query = supabase
      .from("user_activity_logs")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .limit(150);

    if (filters?.user) {
      query = query.eq("user_id", filters.user);
    }

    if (filters?.action) {
      query = query.ilike("action", `%${filters.action}%`);
    }

    const { data } = await query;
    logs = (data ?? []) as UserActivityLog[];
  }

  const userMap = new Map(users.map((user) => [user.id, user.email]));

  return {
    currentUser,
    users,
    rows: logs.map((log) => ({
      ...log,
      user_email: userMap.get(log.user_id) ?? "Unknown user",
    })),
    alertCount: alerts?.length ?? 0,
  };
}

export async function getVendorData() {
  const { currentUser, supabase } = await getOrganizationContext();

  if (!supabase) {
    return {
      currentUser,
      vendors: [] as Vendor[],
      alertCount: 0,
    };
  }

  const [vendorsResult, alertsResult] = await Promise.all([
    supabase
      .from("vendors")
      .select("*")
      .eq("organization_id", currentUser.profile.organization_id!)
      .order("created_at", { ascending: false }),
    supabase
      .from("security_alerts")
      .select("id")
      .eq("organization_id", currentUser.profile.organization_id!)
      .eq("status", "open"),
  ]);

  return {
    currentUser,
    vendors: (vendorsResult.data ?? []) as Vendor[],
    alertCount: alertsResult.data?.length ?? 0,
  };
}

export async function getTrainingData() {
  const { currentUser, supabase } = await getOrganizationContext();

  if (!supabase) {
    return {
      currentUser,
      users: [] as UserProfile[],
      rows: [] as TrainingRecordWithUser[],
      chart: [] as TrainingChartPoint[],
      alertCount: 0,
    };
  }

  const users = await getUsersForOrganization(currentUser.profile.organization_id!);
  const userIds = users.map((user) => user.id);
  let rows: TrainingRecord[] = [];

  if (userIds.length > 0) {
    const { data } = await supabase
      .from("training_records")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });
    rows = (data ?? []) as TrainingRecord[];
  }

  const userMap = new Map(users.map((user) => [user.id, user.email]));
  const resolvedRows = rows.map((row) => ({
    ...row,
    user_email: userMap.get(row.user_id) ?? "Unknown user",
  }));

  const { data: alerts } = await supabase
    .from("security_alerts")
    .select("id")
    .eq("organization_id", currentUser.profile.organization_id!)
    .eq("status", "open");

  return {
    currentUser,
    users,
    rows: resolvedRows,
    chart: buildTrainingCompletionSeries(rows),
    alertCount: alerts?.length ?? 0,
  };
}

export async function getBackupData() {
  const { currentUser, supabase } = await getOrganizationContext();

  if (!supabase) {
    return {
      currentUser,
      backups: [] as BackupJob[],
      summary: summarizeBackupStatus([]),
      alertCount: 0,
    };
  }

  const [backupsResult, alertsResult] = await Promise.all([
    supabase
      .from("backup_jobs")
      .select("*")
      .eq("organization_id", currentUser.profile.organization_id!)
      .order("last_backup_time", { ascending: false }),
    supabase
      .from("security_alerts")
      .select("id")
      .eq("organization_id", currentUser.profile.organization_id!)
      .eq("status", "open"),
  ]);
  const backups = (backupsResult.data ?? []) as BackupJob[];

  return {
    currentUser,
    backups,
    summary: summarizeBackupStatus(backups),
    alertCount: alertsResult.data?.length ?? 0,
  };
}
