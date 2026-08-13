import { cookies } from "next/headers"

import { isLocale } from "@/lib/i18n"
import { LOCALE_COOKIE } from "@/lib/locale"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { locale?: string }

  if (!isLocale(body.locale)) {
    return Response.json({ error: "Invalid locale." }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, body.locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return Response.json({ locale: body.locale })
}
