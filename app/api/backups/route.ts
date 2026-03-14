import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getApiContext } from "@/lib/api";
import { createBackupJob, updateBackupJob } from "@/lib/mutations";
import { createBackupJobSchema, updateBackupJobSchema } from "@/lib/validation";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const { data, error } = await context.supabase
    .from("backup_jobs")
    .select("*")
    .eq("organization_id", context.profile.organization_id)
    .order("last_backup_time", { ascending: false });

  if (error) {
    return apiError(error, 500);
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const payload = createBackupJobSchema.parse(await request.json());
    const data = await createBackupJob(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = z.object({ id: z.uuid() }).and(updateBackupJobSchema).parse(await request.json());
    const { id, ...changes } = payload;
    const data = await updateBackupJob(id, changes);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
