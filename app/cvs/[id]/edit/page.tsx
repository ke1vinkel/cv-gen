import { notFound, redirect } from "next/navigation"

import { CvEditor } from "@/components/cv-editor"
import { getSessionUser } from "@/lib/auth"
import { getCv } from "@/lib/cvs"

export default async function EditCvPage(props: PageProps<"/cvs/[id]/edit">) {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (user.role !== "student") redirect("/dashboard")

  const { id } = await props.params
  const cv = await getCv(user.id, id)
  if (!cv) notFound()

  return <CvEditor initialCv={cv} />
}
