import { getSessionUser } from "@/lib/auth"
import { duplicateCv } from "@/lib/cvs"

export async function POST(
  _request: Request,
  context: RouteContext<"/api/cvs/[id]/duplicate">
) {
  const user = await getSessionUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const cv = await duplicateCv(user.id, id)

  if (!cv) {
    return Response.json({ error: "CV not found." }, { status: 404 })
  }

  return Response.json({ cv }, { status: 201 })
}
