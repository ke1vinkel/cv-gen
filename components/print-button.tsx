"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export function PrintButton() {
  const { t } = useLanguage()

  const handlePrint = () => {
    try {
      window.focus()
      window.print()
    } catch (err) {
      console.warn("Print error:", err)
      window.open(window.location.href, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <Button onClick={handlePrint}>
      <Printer data-icon="inline-start" />
      {t("Print or save PDF")}
    </Button>
  )
}

