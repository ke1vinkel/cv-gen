"use client"

import React, { useSyncExternalStore } from "react"
import { ShieldAlert, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface IframeGuardProps {
  children: React.ReactNode
}

function checkIsFramed(): boolean {
  try {
    return window.self !== window.top
  } catch {
    // Cross-origin iframe security exception means it is framed
    return true
  }
}

export function IframeGuard({ children }: IframeGuardProps) {
  const isFramed = useSyncExternalStore<boolean | null>(
    () => () => undefined,
    checkIsFramed,
    () => null
  )
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:3000"

  // Avoid hydration mismatch/flashing during initial load
  if (isFramed === null) {
    return null
  }

  // If accessed directly in a standalone browser window, block and prompt to open via Portal
  if (!isFramed) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Portal Access Required
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This application is designed to be accessed exclusively through the main{" "}
              <strong className="text-foreground font-semibold">Portal App</strong>. Direct standalone access is restricted.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground text-left space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <span>●</span> Integrated Portal Service
            </div>
            <div>
              Please launch this module from the Portal App dashboard to ensure secure session synchronization.
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => {
                window.location.href = portalUrl
              }}
              size="lg"
              className="w-full gap-2 text-xs font-semibold shadow-md"
            >
              <span>Open in Portal App</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
