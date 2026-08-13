"use client"

import { ArrowRight, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/language-provider"

export function AuthForm() {
  const router = useRouter()
  const { t } = useLanguage()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError("")

    const form = new FormData(event.currentTarget)
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    })
    const data = (await response.json().catch(() => ({}))) as { error?: string }

    if (!response.ok) {
      setError(t(data.error ?? "Something went wrong. Try again."))
      setPending(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="email">{t("Email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="student@domain.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("Password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={1}
          maxLength={72}
          placeholder={t("Enter your password")}
          required
        />
      </div>

      {error && (
        <p
          className="animate-in rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive duration-200 fade-in slide-in-from-top-1"
          role="alert"
        >
          {error}
        </p>
      )}

      <Button className="w-full" size="lg" type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <ArrowRight data-icon="inline-end" />
        )}
        {t(pending ? "Please wait" : "Sign in")}
      </Button>
    </form>
  )
}
