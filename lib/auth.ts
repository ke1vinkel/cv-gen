import "server-only"

import { createHash, randomBytes, randomUUID } from "node:crypto"
import { cookies } from "next/headers"

import { getAuthDb } from "@/lib/db"

const SESSION_COOKIE = "cv_session"
const SESSION_LENGTH_MS = 30 * 24 * 60 * 60 * 1000

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export type SessionUser = {
  id: string
  name: string
  email: string
}

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_LENGTH_MS)

  await getAuthDb().execute({
    sql: `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
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

  const result = await getAuthDb().execute({
    sql: `SELECT users.id, users.name, users.email
          FROM sessions
          JOIN users ON users.id = sessions.user_id
          WHERE sessions.token_hash = ? AND sessions.expires_at > ?
          LIMIT 1`,
    args: [hashToken(token), new Date().toISOString()],
  })

  const row = result.rows[0]

  if (!row) {
    return null
  }

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
  }
}

export async function destroyUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await getAuthDb().execute({
      sql: "DELETE FROM sessions WHERE token_hash = ?",
      args: [hashToken(token)],
    })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export function newUserId() {
  return randomUUID()
}
