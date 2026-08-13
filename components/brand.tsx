"use client"

import { FileText } from "lucide-react"
import Link from "next/link"

import { useLanguage } from "@/components/language-provider"

export function Brand() {
  const { t } = useLanguage()

  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
      aria-label={t("CV Gen home")}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <FileText className="size-4" strokeWidth={2} />
      </span>
      CV Gen
    </Link>
  )
}
