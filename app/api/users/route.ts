import { NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  if (context.profile.role !== "admin") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { data, error } = await context.supabase
    .from("users")
    .select("*")
    .eq("organization_id", context.profile.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    return apiError(error, 500);
  }

  return NextResponse.json(data);
}
