import { NextRequest, NextResponse } from "next/server";

const privateRoutes = [
  "/dashboard",
  "/debts",
  "/expenses",
  "/goals",
  "/fgts",
  "/plan",
  "/diagnostics",
  "/settings"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = privateRoutes.some((route) => pathname.startsWith(route));

  if (!isPrivate) {
    return NextResponse.next();
  }

  const session = request.cookies.get("finctrl_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/debts/:path*", "/expenses/:path*", "/goals/:path*", "/fgts/:path*", "/plan/:path*", "/diagnostics/:path*", "/settings/:path*"]
};
