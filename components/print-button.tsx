"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export function PrintButton() {
  const { t } = useLanguage()

  return (
    <Button onClick={() => window.print()}>
      <Printer data-icon="inline-start" />
      {t("Print or save PDF")}
    </Button>
  )
}
