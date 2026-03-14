import { NextResponse, type NextRequest } from "next/server";
import { inferModuleFromPathname } from "@/lib/moduleMap";
import { createProxySupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

const protectedPrefixes = [
  "/dashboard",
  "/devices",
  "/vulnerabilities",
  "/incidents",
  "/compliance",
  "/reports",
  "/risk",
  "/audit-logs",
  "/vendors",
  "/training",
  "/backups",
  "/users",
];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const requiresAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const response = NextResponse.next();
  const supabase = createProxySupabaseClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && requiresAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-middleware-prefetch") === "1";

  if (user && !isPrefetch && request.method === "GET" && pathname !== "/login") {
    await supabase.from("user_activity_logs").insert({
      user_id: user.id,
      action: "page_view",
      module: inferModuleFromPathname(pathname),
      ip_address:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip"),
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/vulnerabilities/:path*",
    "/incidents/:path*",
    "/compliance/:path*",
    "/reports/:path*",
    "/risk/:path*",
    "/audit-logs/:path*",
    "/vendors/:path*",
    "/training/:path*",
    "/backups/:path*",
    "/users/:path*",
    "/login",
    "/register",
  ],
};
