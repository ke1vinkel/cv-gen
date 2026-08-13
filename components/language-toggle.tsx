"use client"

import { useRouter } from "next/navigation"
import { startTransition } from "react"

import { useLanguage } from "@/components/language-provider"
import type { Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const options: { locale: Locale; label: string; name: string }[] = [
  { locale: "en", label: "EN", name: "English" },
  { locale: "id", label: "ID", name: "Indonesian" },
]

export function LanguageToggle() {
  const router = useRouter()
  const { locale, setLocale, t } = useLanguage()

  function select(nextLocale: Locale) {
    if (nextLocale === locale) return

    setLocale(nextLocale)
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      })
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label={t("Change language")}
      className="inline-flex h-8 items-center rounded-lg border bg-background p-0.5 text-[11px] font-semibold tracking-wide shadow-xs"
    >
      {options.map((option, index) => (
        <div className="flex items-center" key={option.locale}>
          {index > 0 && <span className="text-border">|</span>}
          <button
            type="button"
            aria-label={t(option.name)}
            aria-pressed={locale === option.locale}
            onClick={() => select(option.locale)}
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              locale === option.locale && "bg-muted text-foreground"
            )}
          >
            {option.label}
          </button>
        </div>
      ))}
    </div>
  )
}
