import "server-only"

import { cookies } from "next/headers"

import { isLocale, type Locale } from "@/lib/i18n"

export const LOCALE_COOKIE = "cv_locale"

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : "en"
}
