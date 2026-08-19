import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth-form"
import { Brand } from "@/components/brand"
import { CvPreview } from "@/components/cv-preview"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSessionUser } from "@/lib/auth"
import type { CvContent } from "@/lib/cv-schema"
import { defaultSectionOrder } from "@/lib/cv-schema"
import { translate } from "@/lib/i18n"
import { getLocale } from "@/lib/locale"

export const metadata = { title: "Sign in" }

const sampleCv: CvContent = {
  name: "Jordan Lee",
  contact: {
    phone: "+1 617 555 0148",
    email: "jordan.lee@example.com",
    website: "jordanlee.dev",
    location: "Cambridge, MA",
  },
  summary:
    "Product designer and computer science student who turns complex workflows into clear, accessible digital experiences. Experienced in user research, rapid prototyping, and collaborating with engineers to ship measurable product improvements.",
  experiences: [
    {
      id: "sample-experience",
      role: "Product Design Intern",
      organization: "Northstar Studio",
      startDate: "06/2024",
      endDate: "12/2024",
      bullets: [
        "Redesigned the mobile onboarding flow after 18 user interviews, increasing successful account setup by 23%.",
        "Built and documented 24 reusable interface patterns adopted across three product teams.",
        "Partnered with engineers and researchers to test weekly prototypes and reduce usability issues before release.",
      ],
    },
    {
      id: "sample-experience-2",
      role: "UX Research Assistant",
      organization: "Harvard Digital Lab",
      startDate: "09/2023",
      endDate: "05/2024",
      bullets: [
        "Planned and moderated 12 usability studies for tools used by more than 2,400 students.",
        "Synthesized interview findings into prioritized recommendations that cut task completion time by 17%.",
      ],
    },
  ],
  education: [
    {
      id: "sample-education",
      degree: "Bachelor of Arts",
      institution: "Harvard University",
      fieldOfStudy: "Computer Science",
      url: "https://www.harvard.edu",
      startDate: "09/2022",
      endDate: "Present",
      details: "GPA: 3.8/4.0 · Dean's List",
    },
  ],
  skills: [
    "Product Strategy",
    "User Research",
    "Interaction Design",
    "Prototyping",
    "Figma",
    "Design Systems",
    "Accessibility",
    "HTML & CSS",
  ],
  languages: [
    {
      id: "sample-language-1",
      language: "English",
      proficiency: "Native",
    },
    {
      id: "sample-language-2",
      language: "Mandarin",
      proficiency: "Upper-intermediate",
    },
  ],
  customSections: [
    {
      id: "sample-projects",
      title: "Selected Project",
      items: [
        {
          id: "sample-project-1",
          title: "Campus Access Navigator",
          subtitle: "Product designer and front-end developer",
          startDate: "01/2024",
          endDate: "05/2024",
          bullets: [
            "Designed and built a route-planning prototype that helps students identify accessible campus entrances.",
            "Won the audience award from 46 projects at the 2024 student design showcase.",
          ],
        },
      ],
    },
  ],
  sectionOrder: [
    ...defaultSectionOrder.slice(0, 4),
    "sample-projects",
    ...defaultSectionOrder.slice(4),
  ],
}

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/dashboard")
  const locale = await getLocale()
  const t = (message: string) => translate(locale, message)

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[0.78fr_1.22fr]">
      <section className="ui-page-enter flex min-h-[100dvh] flex-col px-5 py-5 sm:px-10 sm:py-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <p className="mb-4 text-sm font-medium text-primary">
            {t("Internal access")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("Sign in to CV App")}
          </h1>
          <div className="mt-8">
            <AuthForm />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {t("Accounts are managed internally.")}
        </p>
      </section>

      <aside className="ui-page-enter ui-page-enter-delayed relative hidden max-h-[100dvh] min-h-[100dvh] overflow-hidden border-l bg-slate-100 lg:block dark:bg-slate-950">
        <div className="absolute inset-x-8 top-7 z-10 flex items-center justify-between border-b border-slate-300/80 pb-4 dark:border-slate-700/80">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase dark:text-slate-400">
              {t("CV preview")}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
              {t("Professional template")}
            </p>
          </div>
          <span className="rounded-md border border-slate-300 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            A4 · {t("One page")}
          </span>
        </div>

        <div className="absolute top-[54%] left-1/2 h-[76%] w-[68%] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] rounded-2xl border border-slate-300/70 bg-slate-200/70 dark:border-slate-800 dark:bg-slate-900/70" />
        <div className="absolute top-[53%] left-1/2 h-[78%] w-[70%] -translate-x-1/2 -translate-y-1/2 rotate-[2.5deg] rounded-2xl border border-slate-300/80 bg-slate-50/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/90" />

        <div className="login-cv-preview-hitbox absolute top-[55%] left-1/2 w-[794px] -translate-x-1/2 -translate-y-1/2 scale-[0.54] xl:scale-[0.64] 2xl:scale-[0.75]">
          <div className="login-cv-preview rounded-xl border border-slate-300 bg-white p-3 shadow-[0_32px_80px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900">
            <CvPreview content={sampleCv} className="rounded-lg" />
          </div>
        </div>

        <p className="absolute right-8 bottom-6 left-8 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          {t("Build a focused CV with clear structure and measurable impact.")}
        </p>
      </aside>
    </main>
  )
}
