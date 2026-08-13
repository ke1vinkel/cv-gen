"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useLanguage()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={t("Toggle theme")}
        disabled
      >
        <Sun />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={t(`Switch to ${isDark ? "light" : "dark"} theme`)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
