import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === "development"
  const allowedAncestors = [
    "'self'",
    process.env.ALLOWED_FRAME_ANCESTORS,
    "https://*.domain.com",
    isDevelopment ? "http://localhost:* http://127.0.0.1:*" : "",
    "https://*.vercel.app https://*.netlify.app https://*.github.dev https://*.github.io",
  ]
    .filter(Boolean)
    .join(" ")

  const contentSecurityPolicy = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    style-src-attr 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self'${isDevelopment ? " ws:" : ""};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors ${allowedAncestors};
    ${isDevelopment ? "" : "upgrade-insecure-requests;"}
  `
    .replace(/\s{2,}/g, " ")
    .trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set("Content-Security-Policy", contentSecurityPolicy)

  return response
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}
