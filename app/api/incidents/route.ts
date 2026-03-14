import { NextResponse } from "next/server";
import { createIncident } from "@/lib/mutations";
import { getApiContext, apiError } from "@/lib/api";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const { data, error } = await context.supabase
    .from("incidents")
    .select("*")
    .eq("organization_id", context.profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error, 500);
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = await createIncident(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
