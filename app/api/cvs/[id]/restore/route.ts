import { z } from "zod"

import { getSessionUser } from "@/lib/auth"
import { cvMutationSchema } from "@/lib/cv-schema"
import { restoreCv } from "@/lib/cvs"

const restoreSchema = cvMutationSchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "student") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = restoreSchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ error: "Could not restore the CV." }, { status: 400 })
  }

  const { id } = await context.params
  const cv = await restoreCv(user.id, { id, ...parsed.data })
  return Response.json({ cv }, { status: 201 })
}
