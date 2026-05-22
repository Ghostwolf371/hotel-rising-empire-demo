import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  MANAGEMENT_AUTH_COOKIE,
  isManagementSessionCookie,
} from "@/lib/management-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/management")) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname === "/management" || pathname === "/management/";
  const cookieValue = request.cookies.get(MANAGEMENT_AUTH_COOKIE)?.value;
  const authenticated = await isManagementSessionCookie(cookieValue);

  if (isLoginRoute) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/management/rooms", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const login = new URL("/management", request.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/management", "/management/:path*"],
};
