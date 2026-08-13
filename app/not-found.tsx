import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The page may have been removed, or you may not have access to it.
        </p>
        <Link href="/dashboard" className={cn(buttonVariants(), "mt-6")}>
          Return to library
        </Link>
      </div>
    </main>
  )
}
