import { getSessionUser } from "@/lib/auth"
import { cvMutationSchema } from "@/lib/cv-schema"
import { deleteCv, getCv, updateCv } from "@/lib/cvs"

export async function GET(
  _request: Request,
  context: RouteContext<"/api/cvs/[id]">
) {
  const user = await getSessionUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "student") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params
  const cv = await getCv(user.id, id)

  if (!cv) {
    return Response.json({ error: "CV not found." }, { status: 404 })
  }

  return Response.json({ cv })
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/cvs/[id]">
) {
  const user = await getSessionUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "student") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = cvMutationSchema.safeParse(await request.json())

  if (!parsed.success) {
    return Response.json(
      { error: "Some CV fields are incomplete or too long." },
      { status: 400 }
    )
  }

  const { id } = await context.params
  const cv = await updateCv(user.id, id, parsed.data.title, parsed.data.content)

  if (!cv) {
    return Response.json({ error: "CV not found." }, { status: 404 })
  }

  return Response.json({ cv })
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/cvs/[id]">
) {
  const user = await getSessionUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (user.role !== "student") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params
  const deleted = await deleteCv(user.id, id)

  if (!deleted) {
    return Response.json({ error: "CV not found." }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
