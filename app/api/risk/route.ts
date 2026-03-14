import { NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";
import { createRiskAssessmentSnapshot } from "@/lib/risk";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  try {
    await createRiskAssessmentSnapshot(context.profile.organization_id);
    const { data, error } = await context.supabase
      .from("risk_assessments")
      .select("*")
      .eq("organization_id", context.profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return apiError(error, 500);
    }

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
