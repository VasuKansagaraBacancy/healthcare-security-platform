import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { AuthContext, Organization, UserProfile } from "@/types/database";

export const getCurrentUser = cache(async (): Promise<AuthContext | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profileResult = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileResult.data ?? null) as UserProfile | null;

  if (!profile) {
    return null;
  }

  const organizationResult = profile.organization_id
    ? await supabase.from("organizations").select("*").eq("id", profile.organization_id).maybeSingle()
    : { data: null };
  const organization = (organizationResult.data ?? null) as Organization | null;

  return {
    authUserId: user.id,
    email: user.email ?? profile.email,
    profile,
    organization,
  };
});

export async function requireUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return currentUser;
}

export async function requireAdmin() {
  const currentUser = await requireUser();

  if (currentUser.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return currentUser;
}
