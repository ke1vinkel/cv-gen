"use client"

import Link from "next/link"

import { useLanguage } from "@/components/language-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {t("Page not found")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("The page you are looking for does not exist or may have moved.")}
        </p>
        <Link href="/dashboard" className={cn(buttonVariants(), "mt-6")}>
          {t("Return to dashboard")}
        </Link>
      </div>
    </main>
  )
}
