import { redirect } from "next/navigation"

import { AppHeader } from "@/components/app-header"
import { CvLibrary } from "@/components/cv-library"
import { getSessionUser } from "@/lib/auth"
import { listCvs } from "@/lib/cvs"

export const metadata = { title: "My CVs" }

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const cvs = await listCvs(user.id)

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      <AppHeader name={user.name} />
      <main className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14 2xl:px-16">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Your CV library
          </h1>
          <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
            Keep a focused version for each role and update it as your
            experience grows.
          </p>
        </div>
        <CvLibrary initialCvs={cvs} />
      </main>
    </div>
  )
}
