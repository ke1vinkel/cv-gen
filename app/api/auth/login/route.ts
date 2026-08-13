import { z } from "zod"

import { createUserSession } from "@/lib/auth"
import { getAuthDb } from "@/lib/db"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  nim: z.string().trim().min(1).max(20),
})

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json())

  if (!parsed.success) {
    return Response.json({ error: "Invalid email or NIM." }, { status: 401 })
  }

  const result = await getAuthDb().execute({
    sql: "SELECT id, nim FROM users WHERE email = ? COLLATE NOCASE LIMIT 1",
    args: [parsed.data.email],
  })
  const user = result.rows[0]

  if (!user || parsed.data.nim !== String(user.nim)) {
    return Response.json({ error: "Invalid email or NIM." }, { status: 401 })
  }

  await createUserSession(String(user.id))

  return Response.json({ ok: true })
}
