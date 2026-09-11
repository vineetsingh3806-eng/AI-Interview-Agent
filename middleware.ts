import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "aria_auth";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/skill-selection" ||
    pathname === "/level-selection" ||
    pathname === "/candidates" ||
    pathname.startsWith("/candidates/") ||
    pathname === "/interview" ||
    pathname.startsWith("/interview/") ||
    pathname === "/report" ||
    pathname.startsWith("/report/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (isProtectedPath(pathname) && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
