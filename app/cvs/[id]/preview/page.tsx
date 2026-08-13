import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { CvPreview } from "@/components/cv-preview"
import { PrintButton } from "@/components/print-button"
import { buttonVariants } from "@/components/ui/button"
import { getSessionUser } from "@/lib/auth"
import { getCv, getStudentCv } from "@/lib/cvs"

export default async function PreviewCvPage(
  props: PageProps<"/cvs/[id]/preview">
) {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const { id } = await props.params
  const cv =
    user.role === "lecturer" ? await getStudentCv(id) : await getCv(user.id, id)
  if (!cv) notFound()

  return (
    <main className="min-h-[100dvh] bg-slate-200 px-4 py-6 dark:bg-slate-950 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-[794px] items-center justify-between gap-3 print:hidden">
        <Link
          href={user.role === "lecturer" ? "/dashboard" : `/cvs/${cv.id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {user.role === "lecturer" ? "Back to dashboard" : "Back to editor"}
        </Link>
        <PrintButton />
      </div>
      <CvPreview content={cv.content} className="mx-auto" />
    </main>
  )
}
