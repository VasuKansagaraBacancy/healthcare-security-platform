import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getApiContext } from "@/lib/api";
import { createTrainingRecord, updateTrainingRecord } from "@/lib/mutations";
import { createTrainingRecordSchema, updateTrainingRecordSchema } from "@/lib/validation";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const { data: users } = await context.supabase
    .from("users")
    .select("id")
    .eq("organization_id", context.profile.organization_id);
  const userIds = (users ?? []).map((item) => item.id);

  const { data, error } = await context.supabase
    .from("training_records")
    .select("*")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error, 500);
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const payload = createTrainingRecordSchema.parse(await request.json());
    const data = await createTrainingRecord(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = z
      .object({ id: z.uuid() })
      .and(updateTrainingRecordSchema)
      .parse(await request.json());
    const { id, ...changes } = payload;
    const data = await updateTrainingRecord(id, changes);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
