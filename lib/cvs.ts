import "server-only"

import { randomUUID } from "node:crypto"

import {
  createEmptyCv,
  cvContentSchema,
  type CvContent,
  type CvRecord,
} from "@/lib/cv-schema"
import { ensureAppSchema, getAppDb } from "@/lib/db"

function parseCvRow(row: Record<string, unknown>): CvRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    content: cvContentSchema.parse(JSON.parse(String(row.content_json))),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export async function listCvs(userId: string): Promise<CvRecord[]> {
  await ensureAppSchema()

  const result = await getAppDb().execute({
    sql: `SELECT id, title, content_json, created_at, updated_at
          FROM cvs WHERE user_id = ? ORDER BY updated_at DESC`,
    args: [userId],
  })

  return result.rows.map((row) => parseCvRow(row as Record<string, unknown>))
}

export async function getCv(userId: string, id: string) {
  await ensureAppSchema()

  const result = await getAppDb().execute({
    sql: `SELECT id, title, content_json, created_at, updated_at
          FROM cvs WHERE id = ? AND user_id = ? LIMIT 1`,
    args: [id, userId],
  })

  return result.rows[0]
    ? parseCvRow(result.rows[0] as Record<string, unknown>)
    : null
}

export async function createCv(userId: string, email: string, title: string) {
  await ensureAppSchema()

  const id = randomUUID()
  const timestamp = new Date().toISOString()
  const content = createEmptyCv(email)

  await getAppDb().execute({
    sql: `INSERT INTO cvs
          (id, user_id, title, content_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, title, JSON.stringify(content), timestamp, timestamp],
  })

  return getCv(userId, id)
}

export async function duplicateCv(userId: string, id: string) {
  const source = await getCv(userId, id)
  if (!source) return null

  const duplicateId = randomUUID()
  const timestamp = new Date().toISOString()

  await getAppDb().execute({
    sql: `INSERT INTO cvs
          (id, user_id, title, content_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      duplicateId,
      userId,
      `${source.title} (Copy)`,
      JSON.stringify(source.content),
      timestamp,
      timestamp,
    ],
  })

  return getCv(userId, duplicateId)
}

export async function updateCv(
  userId: string,
  id: string,
  title: string,
  content: CvContent
) {
  await ensureAppSchema()

  const updatedAt = new Date().toISOString()
  const result = await getAppDb().execute({
    sql: `UPDATE cvs SET title = ?, content_json = ?, updated_at = ?
          WHERE id = ? AND user_id = ?`,
    args: [title, JSON.stringify(content), updatedAt, id, userId],
  })

  return result.rowsAffected > 0 ? getCv(userId, id) : null
}

export async function deleteCv(userId: string, id: string) {
  await ensureAppSchema()

  const result = await getAppDb().execute({
    sql: "DELETE FROM cvs WHERE id = ? AND user_id = ?",
    args: [id, userId],
  })

  return result.rowsAffected > 0
}
