"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage()

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">
          {t("We could not load this page")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(
            "Check your connection and try again. Your saved CV data has not been changed."
          )}
        </p>
        <Button className="mt-6" onClick={reset}>
          {t("Try again")}
        </Button>
      </div>
    </main>
  )
}
