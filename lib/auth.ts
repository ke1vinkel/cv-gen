import "server-only"

import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto"
import { compare, hash } from "bcryptjs"
import { cookies } from "next/headers"

import { ensureAppSchema, getAppDb, getAuthDb } from "@/lib/db"

const SESSION_COOKIE = "cv_session"
const SESSION_LENGTH_MS = 8 * 60 * 60 * 1000
const LOGIN_ATTEMPT_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const PASSWORD_HASH_ROUNDS = 12

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function hashLoginIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex")
}

export function safeLegacyPasswordCompare(password: string, legacy: string) {
  const passwordDigest = createHash("sha256").update(password).digest()
  const legacyDigest = createHash("sha256").update(legacy).digest()

  return timingSafeEqual(passwordDigest, legacyDigest)
}

export async function getPasswordHash(userId: string) {
  await ensureAppSchema()

  const result = await getAppDb().execute({
    sql: "SELECT password_hash FROM app_credentials WHERE user_id = ? LIMIT 1",
    args: [userId],
  })

  return result.rows[0] ? String(result.rows[0].password_hash) : null
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash)
}

export async function savePasswordHash(userId: string, password: string) {
  await ensureAppSchema()

  const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS)
  const timestamp = new Date().toISOString()

  await getAppDb().execute({
    sql: `INSERT INTO app_credentials
          (user_id, password_hash, created_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO NOTHING`,
    args: [userId, passwordHash, timestamp, timestamp],
  })
}

export async function getLoginLock(identifier: string) {
  await ensureAppSchema()

  const identifierHash = hashLoginIdentifier(identifier)
  const result = await getAppDb().execute({
    sql: `SELECT locked_until FROM login_attempts
          WHERE identifier_hash = ? LIMIT 1`,
    args: [identifierHash],
  })
  const lockedUntil = result.rows[0]?.locked_until

  if (!lockedUntil) return null

  const lockExpiresAt = new Date(String(lockedUntil))
  if (lockExpiresAt.getTime() > Date.now()) return lockExpiresAt

  await getAppDb().execute({
    sql: "DELETE FROM login_attempts WHERE identifier_hash = ?",
    args: [identifierHash],
  })

  return null
}

export async function recordFailedLogin(identifier: string) {
  await ensureAppSchema()

  const identifierHash = hashLoginIdentifier(identifier)
  const transaction = await getAppDb().transaction("write")

  try {
    const result = await transaction.execute({
      sql: `SELECT failed_attempts, window_started_at, locked_until
            FROM login_attempts WHERE identifier_hash = ? LIMIT 1`,
      args: [identifierHash],
    })
    const row = result.rows[0]
    const now = new Date()
    const previousLock = row?.locked_until
      ? new Date(String(row.locked_until))
      : null
    const windowStartedAt = row?.window_started_at
      ? new Date(String(row.window_started_at))
      : null
    const startsNewWindow =
      !windowStartedAt ||
      now.getTime() - windowStartedAt.getTime() >= LOGIN_WINDOW_MS ||
      (previousLock !== null && previousLock.getTime() <= now.getTime())
    const failedAttempts = startsNewWindow
      ? 1
      : Number(row?.failed_attempts ?? 0) + 1
    const nextWindowStartedAt = startsNewWindow ? now : windowStartedAt
    const lockedUntil =
      failedAttempts >= LOGIN_ATTEMPT_LIMIT
        ? new Date(now.getTime() + LOGIN_WINDOW_MS)
        : null

    await transaction.execute({
      sql: `INSERT INTO login_attempts
            (identifier_hash, failed_attempts, window_started_at, locked_until, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(identifier_hash) DO UPDATE SET
              failed_attempts = excluded.failed_attempts,
              window_started_at = excluded.window_started_at,
              locked_until = excluded.locked_until,
              updated_at = excluded.updated_at`,
      args: [
        identifierHash,
        failedAttempts,
        nextWindowStartedAt.toISOString(),
        lockedUntil?.toISOString() ?? null,
        now.toISOString(),
      ],
    })
    await transaction.commit()

    return lockedUntil
  } finally {
    transaction.close()
  }
}

export async function clearLoginAttempts(identifier: string) {
  await ensureAppSchema()

  await getAppDb().execute({
    sql: "DELETE FROM login_attempts WHERE identifier_hash = ?",
    args: [hashLoginIdentifier(identifier)],
  })
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
