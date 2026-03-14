import { NextRequest, NextResponse } from "next/server";
import { getReportData } from "@/lib/data";
import { reportQuerySchema } from "@/lib/validation";
import { apiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const query = reportQuerySchema.parse({
      type: request.nextUrl.searchParams.get("type") ?? undefined,
      format: request.nextUrl.searchParams.get("format") ?? undefined,
    });
    const report = await getReportData();

    return NextResponse.json({
      type: query.type,
      generated_at: report.generated_at,
      organization: report.organization,
      overview: report.overview,
      devices: report.devices,
      vulnerabilities: report.vulnerabilities,
      incidents: report.incidents,
      compliance_checks: report.compliance_checks,
      audit_logs: report.audit_logs,
    });
  } catch (error) {
    return apiError(error);
  }
}
