import { NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";
import { updateSecurityAlertStatus } from "@/lib/mutations";
import { updateAlertStatusSchema } from "@/lib/validation";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const { data, error } = await context.supabase
    .from("security_alerts")
    .select("*")
    .eq("organization_id", context.profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error, 500);
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  try {
    const payload = updateAlertStatusSchema.parse(await request.json());
    const data = await updateSecurityAlertStatus(payload.id, payload.status);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
