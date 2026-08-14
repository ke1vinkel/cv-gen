import { getSessionUser } from "@/lib/auth"
import { cvMutationSchema } from "@/lib/cv-schema"
import { deleteCv, getCv, updateCv } from "@/lib/cvs"

const fieldLabels: Record<string, string> = {
  title: "CV title",
  name: "Name",
  phone: "Phone",
  email: "Email",
  website: "Website",
  location: "Location",
  summary: "Summary",
  role: "Role",
  organization: "Organization",
  url: "URL",
  startDate: "Start date",
  endDate: "End date",
  description: "Description",
  degree: "Degree",
  institution: "University or school",
  fieldOfStudy: "Field of study",
  details: "Education details",
  language: "Language",
  proficiency: "Language proficiency",
  skills: "Skills",
}

function validationField(path: PropertyKey[]) {
  const parts = path.map(String).filter((part) => part !== "content")
  const arrayIndex = parts.findIndex((part) => /^\d+$/.test(part))
  const field = parts.at(-1) ?? "field"
  const label = fieldLabels[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2")

  if (arrayIndex < 1) return label

  const section = parts[arrayIndex - 1]
  const itemNumber = Number(parts[arrayIndex]) + 1
  const sectionLabels: Record<string, string> = {
    experiences: "Experience",
    education: "Education",
    languages: "Language",
    customSections: "Custom section",
    items: "Item",
    bullets: "Bullet",
  }

  return `${sectionLabels[section] ?? section} ${itemNumber} ${label.toLowerCase()}`
}

function validationMessage(message: string) {
  const maximum = message.match(/<=([0-9]+) characters/)
  if (maximum) {
    return `must be ${Number(maximum[1]).toLocaleString("en-US")} characters or fewer.`
  }
  if (message.includes(">=1 characters")) return "is required."
  if (message === "Invalid email address") return "must be a valid email address."
  return `${message.replace(/\.$/, "")}.`
}

function formatValidationErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues
    .slice(0, 3)
    .map((issue) => `${validationField(issue.path)} ${validationMessage(issue.message)}`)
    .join(" ")
}

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
      { error: formatValidationErrors(parsed.error.issues) },
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
