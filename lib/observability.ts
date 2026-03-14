import "server-only";

import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

export async function resolveIpAddress(requestHeaders?: Headers) {
  const headerStore = requestHeaders ?? (await headers());
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return realIp ?? null;
}

export async function logUserActivity(args: {
  userId: string;
  action: string;
  module: string;
  ipAddress?: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  const ipAddress = args.ipAddress ?? (await resolveIpAddress());

  await supabase.from("user_activity_logs").insert({
    user_id: args.userId,
    action: args.action,
    module: args.module,
    ip_address: ipAddress,
  });
}
