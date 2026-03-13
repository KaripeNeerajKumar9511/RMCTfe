import { NextResponse, type NextRequest } from "next/server"

// CRITICAL: Do NOT import api.ts or any Node/axios in proxy (Edge runtime).
// Auth is enforced by the Django API (401); the client redirects to /login on 401.
// Session cookie (sessionid) is set by the API subdomain and is NOT sent to the
// app origin, so we do NOT redirect on missing sessionid here.

const LOGIN_PATH = "/login"
const SIGNUP_PATH = "/signup"

/** Set Cache-Control to prevent CDN/auth bugs. */
function setNoStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "no-store")
  return res
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/api")) return setNoStore(NextResponse.next())
  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`))
    return setNoStore(NextResponse.next())
  if (pathname === SIGNUP_PATH || pathname.startsWith(`${SIGNUP_PATH}/`))
    return setNoStore(NextResponse.next())

  const res = NextResponse.next()
  return setNoStore(res)
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path((?!api).*)"],
}
