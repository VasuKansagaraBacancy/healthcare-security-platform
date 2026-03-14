import { NextRequest, NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";

export async function GET(request: NextRequest) {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const user = request.nextUrl.searchParams.get("user");
  const action = request.nextUrl.searchParams.get("action");
  const { data: users } = await context.supabase
    .from("users")
    .select("id")
    .eq("organization_id", context.profile.organization_id);
  const userIds = (users ?? []).map((item) => item.id);

  let query = context.supabase
    .from("user_activity_logs")
    .select("*")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(150);

  if (user) {
    query = query.eq("user_id", user);
  }

  if (action) {
    query = query.ilike("action", `%${action}%`);
  }

  const { data, error } = await query;

  if (error) {
    return apiError(error, 500);
  }

  return NextResponse.json(data);
}
