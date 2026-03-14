import "server-only";

import { z } from "zod";
import { resolveIpAddress } from "@/lib/observability";
import { createRiskAssessmentSnapshot } from "@/lib/risk";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import { aiChatRequestSchema } from "@/lib/validation";
import type {
  ComplianceStatus,
  RiskLevel,
  SecurityAlertStatus,
  UserRole,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "@/types/database";

const openAiApiKey = process.env.OPENAI_API_KEY;
const aiModel = "gpt-4o-mini";

type RouteContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  profile: {
    id: string;
    organization_id: string;
    role: UserRole;
  };
};

type DeviceContextRow = {
  id: string;
  name: string;
  risk_level: RiskLevel;
};

type VulnerabilityContextRow = {
  id: string;
  title: string;
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  device_id: string;
  created_at: string;
};

type IncidentContextRow = {
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
};

type ComplianceContextRow = {
  score: number;
  status: ComplianceStatus;
};

type VendorContextRow = {
  name: string;
  risk_level: RiskLevel;
  compliance_status: ComplianceStatus;
};

type AlertContextRow = {
  title: string;
  severity: VulnerabilitySeverity;
  status: SecurityAlertStatus;
};

function calculateComplianceScore(checks: { score: number }[]) {
  if (!checks.length) {
    return 0;
  }

  return Math.round(checks.reduce((sum, item) => sum + item.score, 0) / checks.length);
}

function calculateRiskScore(args: {
  critical: number;
  high: number;
  medium: number;
  openIncidents: number;
}) {
  return args.critical * 5 + args.high * 3 + args.medium * 2 + args.openIncidents * 4;
}

async function buildAiContext(context: RouteContext) {
  await createRiskAssessmentSnapshot(context.profile.organization_id).catch(() => undefined);

  const devicesResult = await context.supabase
    .from("devices")
    .select("id, name, risk_level")
    .eq("organization_id", context.profile.organization_id);
  const devices = (devicesResult.data ?? []) as DeviceContextRow[];
  const deviceIds = devices.map((device) => device.id);
  const deviceNameMap = new Map(devices.map((device) => [device.id, device.name]));

  const [
    vulnerabilitiesResult,
    incidentsResult,
    complianceResult,
    vendorsResult,
    riskResult,
    alertsResult,
  ] = await Promise.all([
    deviceIds.length > 0
      ? context.supabase
          .from("vulnerabilities")
          .select("id, title, severity, status, device_id, created_at")
          .in("device_id", deviceIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    context.supabase
      .from("incidents")
      .select("title, description, severity, status, created_at")
      .eq("organization_id", context.profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(10),
    context.supabase
      .from("compliance_checks")
      .select("score, status")
      .eq("organization_id", context.profile.organization_id),
    context.supabase
      .from("vendors")
      .select("name, risk_level, compliance_status")
      .eq("organization_id", context.profile.organization_id)
      .order("created_at", { ascending: false }),
    context.supabase
      .from("risk_assessments")
      .select("risk_score, created_at")
      .eq("organization_id", context.profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    context.supabase
      .from("security_alerts")
      .select("title, severity, status")
      .eq("organization_id", context.profile.organization_id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const vulnerabilities = (vulnerabilitiesResult.data ?? []) as VulnerabilityContextRow[];
  const incidents = (incidentsResult.data ?? []) as IncidentContextRow[];
  const complianceChecks = (complianceResult.data ?? []) as ComplianceContextRow[];
  const vendors = (vendorsResult.data ?? []) as VendorContextRow[];
  const latestRisk = riskResult.data ?? null;
  const openAlerts = (alertsResult.data ?? []) as AlertContextRow[];

  const criticalVulnerabilities = vulnerabilities.filter((item) => item.severity === "critical");
  const highVulnerabilities = vulnerabilities.filter((item) => item.severity === "high");
  const mediumVulnerabilities = vulnerabilities.filter((item) => item.severity === "medium");
  const openIncidents = incidents.filter((item) => item.status === "open");
  const currentRiskScore =
    latestRisk?.risk_score ??
    calculateRiskScore({
      critical: criticalVulnerabilities.length,
      high: highVulnerabilities.length,
      medium: mediumVulnerabilities.length,
      openIncidents: openIncidents.length,
    });

  return {
    role: context.profile.role,
    risk_score: currentRiskScore,
    latest_recorded_risk_score: latestRisk?.risk_score ?? null,
    vulnerabilities: {
      total: vulnerabilities.length,
      critical: criticalVulnerabilities.length,
      high: highVulnerabilities.length,
      medium: mediumVulnerabilities.length,
      open: vulnerabilities.filter((item) => item.status === "open").length,
      most_critical: criticalVulnerabilities.slice(0, 3).map((item) => ({
        title: item.title,
        device: deviceNameMap.get(item.device_id) ?? "Unknown device",
        status: item.status,
      })),
    },
    incidents: {
      total: incidents.length,
      open: openIncidents.length,
      active: incidents.filter((item) => item.status !== "closed").length,
      latest: incidents[0]
        ? {
            title: incidents[0].title,
            severity: incidents[0].severity,
            status: incidents[0].status,
            description: incidents[0].description.slice(0, 320),
          }
        : null,
    },
    compliance_score: calculateComplianceScore(complianceChecks),
    vendor_risks: vendors
      .filter((item) => ["high", "critical"].includes(item.risk_level))
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        risk_level: item.risk_level,
        compliance_status: item.compliance_status,
      })),
    open_alerts: openAlerts.map((item) => ({
      title: item.title,
      severity: item.severity,
      status: item.status,
    })),
    devices: {
      total: devices.length,
      high_risk: devices.filter((item) => ["high", "critical"].includes(item.risk_level)).length,
    },
  };
}

function buildSystemPrompt(platformData: Awaited<ReturnType<typeof buildAiContext>>) {
  return [
    "You are a cybersecurity assistant for a Healthcare Cybersecurity Risk Management Platform.",
    "Use the platform data provided to answer user questions.",
    "Be concise and provide actionable security advice.",
    "Do not mention SQL, hidden policies, raw queries, or implementation details.",
    "If the answer is not available in the provided data, say that the platform data currently does not include it.",
    "If the user asks how to improve security, suggest specific steps to reduce current risk based on the data.",
    "Platform data:",
    JSON.stringify(platformData, null, 2),
  ].join("\n");
}

export async function generateAiReply(
  context: RouteContext,
  input: z.infer<typeof aiChatRequestSchema>,
) {
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const platformData = await buildAiContext(context);
  const systemPrompt = buildSystemPrompt(platformData);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: aiModel,
      temperature: 0.3,
      max_completion_tokens: 350,
      messages: [
        { role: "system", content: systemPrompt },
        ...(input.history ?? []).map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        { role: "user", content: input.message },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const reply = payload.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("The AI assistant returned an empty response.");
  }

  return {
    reply,
    platformData,
  };
}

export async function resolveAiIpAddress() {
  return resolveIpAddress();
}
