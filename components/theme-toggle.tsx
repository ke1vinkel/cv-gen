"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Button size="icon-sm" variant="ghost" aria-label="Toggle theme" disabled>
        <Sun />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
