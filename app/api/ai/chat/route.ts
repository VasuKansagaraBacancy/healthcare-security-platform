import { NextResponse } from "next/server";
import { apiError, getApiContext } from "@/lib/api";
import { generateAiReply, resolveAiIpAddress } from "@/lib/ai";
import { logUserActivity } from "@/lib/observability";
import { aiChatRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const context = await getApiContext();
  if (!context.ok) {
    return context.response;
  }

  try {
    const payload = aiChatRequestSchema.parse(await request.json());
    const result = await generateAiReply(context, payload);

    await logUserActivity({
      userId: context.profile.id,
      action: "ai_chat_used",
      module: "dashboard",
      ipAddress: await resolveAiIpAddress(),
    }).catch(() => undefined);

    return NextResponse.json({
      reply: result.reply,
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
