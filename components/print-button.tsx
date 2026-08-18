"use client"

import { ExternalLink, Printer } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export function PrintButton() {
  const { t } = useLanguage()
  const [isInIframe, setIsInIframe] = useState(false)

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top)
    } catch {
      setIsInIframe(true)
    }
  }, [])

  const handlePrint = () => {
    try {
      window.focus()
      window.print()
    } catch (err) {
      console.warn("Direct iframe print blocked, opening in new tab instead", err)
      window.open(window.location.href, "_blank", "noopener,noreferrer")
    }
  }

  const handleOpenNewTab = () => {
    window.open(window.location.href, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handlePrint} title={t("Print or save PDF")}>
        <Printer data-icon="inline-start" />
        {t("Print or save PDF")}
      </Button>
      {isInIframe && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleOpenNewTab}
          title={t("Open in new tab to print")}
          aria-label={t("Open in new tab to print")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

