import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth-form"
import { Brand } from "@/components/brand"
import { CvPreview } from "@/components/cv-preview"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSessionUser } from "@/lib/auth"
import type { CvContent } from "@/lib/cv-schema"

export const metadata = { title: "Sign in" }

const sampleCv: CvContent = {
  name: "Jordan Lee",
  contact: {
    phone: "+62 800 0000 0000",
    email: "student@domain.com",
    website: "jordanlee.dev",
    location: "Indonesia",
  },
  summary:
    "Product designer focused on turning complex workflows into clear, accessible digital experiences.",
  experiences: [
    {
      id: "sample-experience",
      role: "Product Design Intern",
      organization: "Northstar Studio",
      startDate: "06/2024",
      endDate: "12/2024",
      bullets: [
        "Designed and tested onboarding improvements for a multi-platform product.",
        "Created reusable interface patterns with engineering and research teams.",
      ],
    },
  ],
  education: [
    {
      id: "sample-education",
      degree: "Computer Science",
      institution: "BINUS University",
      startDate: "09/2022",
      endDate: "Present",
      details: "Bachelor's Degree",
    },
  ],
  skills: ["Product Design", "User Research", "Prototyping", "Figma"],
}

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard")

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[0.78fr_1.22fr]">
      <section className="ui-page-enter flex min-h-[100dvh] flex-col px-5 py-5 sm:px-10 sm:py-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <p className="mb-4 text-sm font-medium text-primary">
            Internal access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Sign in to CV Gen
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Student and lecturer accounts can continue with their assigned
            university email and password.
          </p>
          <div className="mt-8">
            <AuthForm />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Accounts are managed internally.
        </p>
      </section>

      <aside className="ui-page-enter ui-page-enter-delayed relative hidden max-h-[100dvh] min-h-[100dvh] overflow-hidden border-l bg-slate-200 lg:block dark:bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_44%)]" />
        <div className="absolute top-1/2 left-1/2 w-[794px] -translate-x-1/2 -translate-y-1/2 scale-[0.55] rotate-[1.2deg] rounded-2xl border border-slate-300 bg-slate-300 p-5 shadow-[0_36px_90px_rgba(15,23,42,0.2)] xl:scale-[0.66] 2xl:scale-[0.78] dark:border-slate-800 dark:bg-slate-900">
          <CvPreview content={sampleCv} />
        </div>
      </aside>
    </main>
  )
}
