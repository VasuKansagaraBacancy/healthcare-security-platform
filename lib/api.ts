import { NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { UserProfile } from "@/types/database";

type ApiContext =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
      profile: {
        id: string;
        organization_id: string;
        role: "admin" | "analyst" | "auditor";
      };
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function getApiContext(): Promise<ApiContext> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Supabase environment variables are not configured." },
        { status: 500 },
      ),
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
    };
  }

  const profileResult = await supabase.from("users").select("*").eq("id", user.id).single();
  const profile = (profileResult.data ?? null) as UserProfile | null;

  if (!profile?.organization_id) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "The current user is not assigned to an organization." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    supabase,
    profile: {
      id: profile.id,
      organization_id: profile.organization_id,
      role: profile.role,
    },
  };
}

export function apiError(error: unknown, status = 400) {
  return NextResponse.json(
    {
      message: error instanceof Error ? error.message : "Unexpected error.",
    },
    { status },
  );
}
