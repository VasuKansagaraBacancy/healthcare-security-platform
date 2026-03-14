import { NextResponse } from "next/server";
import { deleteIncident, updateIncident } from "@/lib/mutations";
import { getApiContext, apiError } from "@/lib/api";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const apiContext = await getApiContext();
  if (!apiContext.ok) {
    return apiContext.response;
  }

  const { id } = await context.params;
  const { data, error } = await apiContext.supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return apiError(error, 404);
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const payload = await request.json();
    const { id } = await context.params;
    const data = await updateIncident(id, payload);
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteIncident(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
