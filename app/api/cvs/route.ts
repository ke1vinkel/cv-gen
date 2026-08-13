import { z } from "zod"

import { getSessionUser } from "@/lib/auth"
import { createCv, listCvs } from "@/lib/cvs"

const createSchema = z.object({
  title: z.string().trim().min(1).max(100).default("Untitled CV"),
})

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "student") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  return Response.json({ cvs: await listCvs(user.id) })
}

export async function POST(request: Request) {
  const user = await getSessionUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "student") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = createSchema.safeParse(await request.json())

  if (!parsed.success) {
    return Response.json({ error: "Enter a CV title." }, { status: 400 })
  }

  const cv = await createCv(user.id, user.email, parsed.data.title)
  return Response.json({ cv }, { status: 201 })
}
