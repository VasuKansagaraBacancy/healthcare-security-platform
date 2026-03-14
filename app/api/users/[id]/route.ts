import { NextResponse } from "next/server";
import { updateUserRole } from "@/lib/mutations";
import { apiError, getApiContext } from "@/lib/api";
import { roleSchema } from "@/lib/validation";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const apiContext = await getApiContext();
  if (!apiContext.ok) {
    return apiContext.response;
  }

  if (apiContext.profile.role !== "admin") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const { id } = await context.params;
    const data = await updateUserRole(id, roleSchema.parse(payload.role));
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
