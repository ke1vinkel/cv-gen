import "server-only"

import { createHash, randomBytes, randomUUID } from "node:crypto"
import { cookies } from "next/headers"

import { ensureAppSchema, getAppDb, getAuthDb } from "@/lib/db"

const SESSION_COOKIE = "cv_session"
const SESSION_LENGTH_MS = 8 * 60 * 60 * 1000

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: "student" | "lecturer"
}

export async function createUserSession(userId: string) {
  await ensureAppSchema()

  const token = randomBytes(32).toString("base64url")
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_LENGTH_MS)

  await getAppDb().execute({
    sql: `INSERT INTO app_sessions (token_hash, user_id, expires_at, created_at)
          VALUES (?, ?, ?, ?)`,
    args: [
      hashToken(token),
      userId,
      expiresAt.toISOString(),
      now.toISOString(),
    ],
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    priority: "high",
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  await ensureAppSchema()

  const sessionResult = await getAppDb().execute({
    sql: `SELECT user_id
          FROM app_sessions
          WHERE token_hash = ? AND expires_at > ?
          LIMIT 1`,
    args: [hashToken(token), new Date().toISOString()],
  })
  const session = sessionResult.rows[0]

  if (!session) {
    return null
  }

  const userResult = await getAuthDb().execute({
    sql: `SELECT users.id, users.name, users.email, roles.name AS role
          FROM users
          JOIN user_roles ON user_roles.user_id = users.id
          JOIN roles ON roles.id = user_roles.role_id
          WHERE users.id = ? AND roles.name IN ('student', 'lecturer')
          ORDER BY CASE roles.name WHEN 'lecturer' THEN 0 ELSE 1 END
          LIMIT 1`,
    args: [String(session.user_id)],
  })

  const row = userResult.rows[0]

  if (!row) {
    return null
  }

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as SessionUser["role"],
  }
}

export async function destroyUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await ensureAppSchema()
    await getAppDb().execute({
      sql: "DELETE FROM app_sessions WHERE token_hash = ?",
      args: [hashToken(token)],
    })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export function newUserId() {
  return randomUUID()
}
