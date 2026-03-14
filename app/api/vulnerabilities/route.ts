import { NextRequest, NextResponse } from "next/server";
import { createVulnerability } from "@/lib/mutations";
import { getApiContext, apiError } from "@/lib/api";

export async function GET(request: NextRequest) {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const severity = request.nextUrl.searchParams.get("severity");
  let query = context.supabase.from("vulnerabilities").select("*").order("created_at", {
    ascending: false,
  });

  if (severity) {
    query = query.eq("severity", severity);
  }

  const { data, error } = await query;

  if (error) {
    return apiError(error, 500);
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = await createVulnerability(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
