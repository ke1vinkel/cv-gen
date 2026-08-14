"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

export function LogoutButton() {
  const router = useRouter()
  const { t } = useLanguage()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={logout}
    >
      <LogOut data-icon="inline-start" />
      {t(pending ? "Signing out" : "Sign out")}
    </Button>
  )
}
