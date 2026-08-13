import { z } from "zod"

import {
  clearLoginAttempts,
  createUserSession,
  getLoginLock,
  getPasswordHash,
  recordFailedLogin,
  safeLegacyPasswordCompare,
  savePasswordHash,
  verifyPassword,
} from "@/lib/auth"
import { getAuthDb } from "@/lib/db"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Password is too long."
    ),
})

function rateLimitResponse(lockedUntil: Date) {
  const retryAfter = Math.max(
    1,
    Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)
  )

  return Response.json(
    { error: "Too many sign-in attempts. Try again in 15 minutes." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  )
}

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid email or password." },
      { status: 401 }
    )
  }

  const { email, password } = parsed.data
  const existingLock = await getLoginLock(email)
  if (existingLock) return rateLimitResponse(existingLock)

  const result = await getAuthDb().execute({
    sql: `SELECT users.id
          FROM users
          WHERE users.email = ? COLLATE NOCASE
            AND EXISTS (
              SELECT 1 FROM user_roles
              JOIN roles ON roles.id = user_roles.role_id
              WHERE user_roles.user_id = users.id
                AND roles.name IN ('student', 'lecturer')
            )
          LIMIT 1`,
    args: [email],
  })
  const user = result.rows[0]
  let passwordMatches = false

  if (user) {
    const userId = String(user.id)
    const passwordHash = await getPasswordHash(userId)

    if (passwordHash) {
      passwordMatches = await verifyPassword(password, passwordHash)
    } else {
      const legacyResult = await getAuthDb().execute({
        sql: "SELECT nim FROM users WHERE id = ? LIMIT 1",
        args: [userId],
      })
      const legacyPassword = legacyResult.rows[0]?.nim

      passwordMatches =
        legacyPassword !== null &&
        legacyPassword !== undefined &&
        safeLegacyPasswordCompare(password, String(legacyPassword))

      if (passwordMatches) {
        await savePasswordHash(userId, password)
      }
    }
  }

  if (!user || !passwordMatches) {
    const lockedUntil = await recordFailedLogin(email)
    if (lockedUntil) return rateLimitResponse(lockedUntil)

    return Response.json(
      { error: "Invalid email or password." },
      { status: 401 }
    )
  }

  await clearLoginAttempts(email)
  await createUserSession(String(user.id))

  return Response.json({ ok: true })
}
