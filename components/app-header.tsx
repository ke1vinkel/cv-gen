import Link from "next/link"

import { Brand } from "@/components/brand"
import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppHeader({ name }: { name: string }) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-16">
        <div className="flex items-center gap-6">
          <Brand />
          <Link
            href="/dashboard"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            My CVs
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden max-w-48 truncate px-2 text-xs text-muted-foreground md:block">
            {name}
          </span>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
