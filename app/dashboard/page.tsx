import { redirect } from "next/navigation"

import { AppHeader } from "@/components/app-header"
import { CvLibrary } from "@/components/cv-library"
import { LecturerCvLibrary } from "@/components/lecturer-cv-library"
import { getSessionUser } from "@/lib/auth"
import { listCvs, listStudentCvs } from "@/lib/cvs"
import { translate } from "@/lib/i18n"
import { getLocale } from "@/lib/locale"

export const metadata = { title: "My CVs" }

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  const locale = await getLocale()
  const t = (message: string) => translate(locale, message)

  if (user.role === "lecturer") {
    const cvs = await listStudentCvs()
    const studentCount = new Set(cvs.map((cv) => cv.student.id)).size

    return (
      <div className="min-h-[100dvh] bg-muted/20">
        <AppHeader
          name={user.name}
          role={user.role}
          navigationLabel="Student CVs"
        />
        <main className="ui-page-enter w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14 2xl:px-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b pb-8 sm:mb-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {t("Student CVs")}
              </h1>
              <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
                {t("Review the latest CV versions created by students.")}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-8 text-right">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("Students")}
                </dt>
                <dd className="mt-1 text-2xl font-semibold">{studentCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t("CVs")}</dt>
                <dd className="mt-1 text-2xl font-semibold">{cvs.length}</dd>
              </div>
            </dl>
          </div>
          <LecturerCvLibrary cvs={cvs} />
        </main>
      </div>
    )
  }

  const cvs = await listCvs(user.id)

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      <AppHeader name={user.name} role={user.role} />
      <main className="ui-page-enter w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14 2xl:px-16">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("Your CV library")}
          </h1>
          <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
            {t(
              "Keep a focused version for each role and update it as your experience grows."
            )}
          </p>
        </div>
        <CvLibrary initialCvs={cvs} />
      </main>
    </div>
  )
}
