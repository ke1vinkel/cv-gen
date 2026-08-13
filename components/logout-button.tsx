"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={logout}>
      <LogOut data-icon="inline-start" />
      {pending ? "Signing out" : "Sign out"}
    </Button>
  )
}
