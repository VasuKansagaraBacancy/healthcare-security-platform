import "server-only";

import { createServerSupabaseClient } from "@/lib/supabaseClient";
import type { BackupJob, RiskAssessment, SecurityAlert } from "@/types/database";

export function calculateRiskScore(args: {
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  openIncidents: number;
}) {
  return (
    args.criticalVulnerabilities * 5 +
    args.highVulnerabilities * 3 +
    args.mediumVulnerabilities * 2 +
    args.openIncidents * 4
  );
}

async function syncRiskAlerts(args: {
  organizationId: string;
  criticalVulnerabilities: number;
  openIncidents: number;
  highRiskDevices: number;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: existingAlerts } = await supabase
    .from("security_alerts")
    .select("*")
    .eq("organization_id", args.organizationId)
    .in("title", [
      "Critical vulnerability detected",
      "Open security incident backlog",
      "High risk device detected",
    ]);

  const alerts = (existingAlerts ?? []) as SecurityAlert[];

  const reconcileAlert = async (params: {
    title: string;
    severity: SecurityAlert["severity"];
    message: string;
    shouldBeOpen: boolean;
  }) => {
    const existing = alerts.find((item) => item.title === params.title);

    if (params.shouldBeOpen && !existing) {
      await supabase.from("security_alerts").insert({
        organization_id: args.organizationId,
        title: params.title,
        severity: params.severity,
        message: params.message,
        status: "open",
      });
      return;
    }

    if (params.shouldBeOpen && existing && existing.status !== "open") {
      await supabase
        .from("security_alerts")
        .update({
          severity: params.severity,
          message: params.message,
          status: "open",
        })
        .eq("id", existing.id);
      return;
    }

    if (!params.shouldBeOpen && existing && existing.status === "open") {
      await supabase.from("security_alerts").update({ status: "resolved" }).eq("id", existing.id);
    }
  };

  await reconcileAlert({
    title: "Critical vulnerability detected",
    severity: "critical",
    message: `${args.criticalVulnerabilities} critical vulnerabilities are still active in the environment.`,
    shouldBeOpen: args.criticalVulnerabilities > 0,
  });

  await reconcileAlert({
    title: "Open security incident backlog",
    severity: args.openIncidents > 2 ? "high" : "medium",
    message: `${args.openIncidents} incidents remain open or under investigation.`,
    shouldBeOpen: args.openIncidents > 0,
  });

  await reconcileAlert({
    title: "High risk device detected",
    severity: args.highRiskDevices > 1 ? "high" : "medium",
    message: `${args.highRiskDevices} devices are marked high or critical risk.`,
    shouldBeOpen: args.highRiskDevices > 0,
  });
}

export async function createRiskAssessmentSnapshot(organizationId: string) {
  const supabase = await createServerSupabaseClient();
  const [devicesResult, vulnerabilitiesResult, incidentsResult, latestResult] = await Promise.all([
    supabase.from("devices").select("id, risk_level").eq("organization_id", organizationId),
    supabase.from("vulnerabilities").select("severity, status, device_id"),
    supabase
      .from("incidents")
      .select("status")
      .eq("organization_id", organizationId),
    supabase
      .from("risk_assessments")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const devices = devicesResult.data ?? [];
  const deviceIds = new Set(devices.map((item) => item.id));
  const vulnerabilities = (vulnerabilitiesResult.data ?? []).filter((item) => deviceIds.has(item.device_id));
  const incidents = incidentsResult.data ?? [];

  const criticalVulnerabilities = vulnerabilities.filter(
    (item) => item.severity === "critical" && item.status !== "remediated",
  ).length;
  const highVulnerabilities = vulnerabilities.filter(
    (item) => item.severity === "high" && item.status !== "remediated",
  ).length;
  const mediumVulnerabilities = vulnerabilities.filter(
    (item) => item.severity === "medium" && item.status !== "remediated",
  ).length;
  const openIncidents = incidents.filter(
    (item) => item.status === "open" || item.status === "investigating",
  ).length;
  const highRiskDevices = devices.filter(
    (item) => item.risk_level === "high" || item.risk_level === "critical",
  ).length;

  const riskScore = calculateRiskScore({
    criticalVulnerabilities,
    highVulnerabilities,
    mediumVulnerabilities,
    openIncidents,
  });

  const latest = (latestResult.data ?? null) as RiskAssessment | null;

  const needsSnapshot =
    !latest ||
    latest.risk_score !== riskScore ||
    latest.critical_vulnerabilities !== criticalVulnerabilities ||
    latest.high_vulnerabilities !== highVulnerabilities ||
    latest.medium_vulnerabilities !== mediumVulnerabilities ||
    latest.open_incidents !== openIncidents;

  let snapshot = latest;

  if (needsSnapshot) {
    const { data } = await supabase
      .from("risk_assessments")
      .insert({
        organization_id: organizationId,
        risk_score: riskScore,
        critical_vulnerabilities: criticalVulnerabilities,
        high_vulnerabilities: highVulnerabilities,
        medium_vulnerabilities: mediumVulnerabilities,
        open_incidents: openIncidents,
      })
      .select("*")
      .single();

    snapshot = (data ?? null) as RiskAssessment | null;
  }

  await syncRiskAlerts({
    organizationId,
    criticalVulnerabilities,
    openIncidents,
    highRiskDevices,
  });

  return snapshot;
}

export function summarizeBackupStatus(backups: BackupJob[]) {
  const latest = [...backups].sort((left, right) =>
    new Date(right.last_backup_time).getTime() - new Date(left.last_backup_time).getTime(),
  )[0];

  if (!latest) {
    return {
      label: "No backups",
      tone: "critical" as const,
      detail: "No backup jobs recorded yet",
    };
  }

  return {
    label: latest.status[0].toUpperCase() + latest.status.slice(1),
    tone:
      latest.status === "success"
        ? ("positive" as const)
        : latest.status === "running"
          ? ("warning" as const)
          : ("critical" as const),
    detail: `Last backup ${new Date(latest.last_backup_time).toLocaleString()}`,
  };
}
