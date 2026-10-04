import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate only (no DB): real checks happen in requireAdmin() on every admin page and action.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const hasSession = request.cookies.has("__Host-ms_session") || request.cookies.has("ms_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
