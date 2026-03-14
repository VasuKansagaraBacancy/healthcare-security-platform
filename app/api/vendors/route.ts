import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, getApiContext } from "@/lib/api";
import { createVendor, deleteVendor, updateVendor } from "@/lib/mutations";
import { createVendorSchema, updateVendorSchema } from "@/lib/validation";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  const { data, error } = await context.supabase
    .from("vendors")
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
    const payload = createVendorSchema.parse(await request.json());
    const data = await createVendor(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = z.object({ id: z.uuid() }).and(updateVendorSchema).parse(await request.json());
    const { id, ...changes } = payload;
    const data = await updateVendor(id, changes);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = z.object({ id: z.uuid() }).parse(await request.json());
    await deleteVendor(payload.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
