import "server-only"

import { randomUUID } from "node:crypto"
import { z } from "zod"

import { scoreCv, type AtsCategoryResult } from "@/lib/ats-scoring"
import {
  createEmptyCv,
  cvContentSchema,
  type CvContent,
  type CvRecord,
} from "@/lib/cv-schema"
import { ensureAppSchema, getAppDb, getAuthDb } from "@/lib/db"

export type StudentCvRecord = CvRecord & {
  student: {
    id: string
    name: string
    email: string
  }
}

const storedBreakdownSchema = z.array(
  z.object({
    category: z.string(),
    score: z.number(),
    maxScore: z.number(),
    criticalIssues: z.array(
      z.object({
        id: z.string(),
        severity: z.enum(["critical", "warning", "info"]),
        messageKey: z.string(),
      })
    ),
  })
)

function parseAtsBreakdown(raw: unknown): AtsCategoryResult[] | null {
  if (raw == null) return null
  try {
    const result = storedBreakdownSchema.safeParse(JSON.parse(String(raw)))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function parseCvRow(row: Record<string, unknown>): CvRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    content: cvContentSchema.parse(JSON.parse(String(row.content_json))),
    atsScore:
      row.cv_quality_score != null ? Number(row.cv_quality_score) : null,
    atsBreakdown: parseAtsBreakdown(row.cv_quality_breakdown),
    atsScoringVersion:
      row.cv_quality_scoring_version != null
        ? Number(row.cv_quality_scoring_version)
        : null,
    atsScoredAt: row.cv_quality_scored_at
      ? String(row.cv_quality_scored_at)
      : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export async function listCvs(userId: string): Promise<CvRecord[]> {
  await ensureAppSchema()

  const result = await getAppDb().execute({
    sql: `SELECT id, title, content_json, cv_quality_score,
                 cv_quality_breakdown, cv_quality_scoring_version,
                 cv_quality_scored_at, created_at, updated_at
          FROM cvs WHERE user_id = ? ORDER BY updated_at DESC`,
    args: [userId],
  })

  return result.rows.map((row) => parseCvRow(row as Record<string, unknown>))
}

export async function listStudentCvs(): Promise<StudentCvRecord[]> {
  await ensureAppSchema()

  const studentsResult = await getAuthDb().execute({
    sql: `SELECT DISTINCT users.id, users.name, users.email
          FROM users
          JOIN user_roles ON user_roles.user_id = users.id
          JOIN roles ON roles.id = user_roles.role_id
          WHERE roles.name = 'student'`,
    args: [],
  })

  if (studentsResult.rows.length === 0) return []

  const students = new Map(
    studentsResult.rows.map((row) => [
      String(row.id),
      {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
      },
    ])
  )
  const studentIds = [...students.keys()]
  const placeholders = studentIds.map(() => "?").join(", ")
  const result = await getAppDb().execute({
    sql: `SELECT id, user_id, title, content_json, cv_quality_score,
                 cv_quality_breakdown, cv_quality_scoring_version,
                 cv_quality_scored_at, created_at, updated_at
          FROM cvs
          WHERE user_id IN (${placeholders})
          ORDER BY updated_at DESC`,
    args: studentIds,
  })

  return result.rows.map((row) => ({
    ...parseCvRow(row as Record<string, unknown>),
    student: students.get(String(row.user_id))!,
  }))
}

export async function getStudentCv(
  id: string
): Promise<StudentCvRecord | null> {
  await ensureAppSchema()

  const result = await getAppDb().execute({
    sql: `SELECT id, user_id, title, content_json, cv_quality_score,
                 cv_quality_breakdown, cv_quality_scoring_version,
                 cv_quality_scored_at, created_at, updated_at
          FROM cvs WHERE id = ? LIMIT 1`,
    args: [id],
  })
  const row = result.rows[0]
  if (!row) return null

  const studentResult = await getAuthDb().execute({
    sql: `SELECT users.id, users.name, users.email
          FROM users
          JOIN user_roles ON user_roles.user_id = users.id
          JOIN roles ON roles.id = user_roles.role_id
          WHERE users.id = ? AND roles.name = 'student'
          LIMIT 1`,
    args: [String(row.user_id)],
  })
  const student = studentResult.rows[0]
  if (!student) return null

  return {
    ...parseCvRow(row as Record<string, unknown>),
    student: {
      id: String(student.id),
      name: String(student.name),
      email: String(student.email),
    },
  }
}

export async function getCv(userId: string, id: string) {
  await ensureAppSchema()

  const result = await getAppDb().execute({
    sql: `SELECT id, title, content_json, cv_quality_score,
                 cv_quality_breakdown, cv_quality_scoring_version,
                 cv_quality_scored_at, created_at, updated_at
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
  const atsResult = scoreCv(content)

  await getAppDb().execute({
    sql: `INSERT INTO cvs
          (id, user_id, title, content_json, cv_quality_score,
           cv_quality_breakdown, cv_quality_scoring_version,
           cv_quality_scored_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      userId,
      title,
      JSON.stringify(content),
      atsResult.overall,
      JSON.stringify(atsResult.categories),
      atsResult.version,
      timestamp,
      timestamp,
      timestamp,
    ],
  })

  return getCv(userId, id)
}

export async function duplicateCv(userId: string, id: string) {
  const source = await getCv(userId, id)
  if (!source) return null

  const duplicateId = randomUUID()
  const timestamp = new Date().toISOString()
  const atsResult = scoreCv(source.content)

  await getAppDb().execute({
    sql: `INSERT INTO cvs
          (id, user_id, title, content_json, cv_quality_score,
           cv_quality_breakdown, cv_quality_scoring_version,
           cv_quality_scored_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      duplicateId,
      userId,
      `${source.title} (Copy)`,
      JSON.stringify(source.content),
      atsResult.overall,
      JSON.stringify(atsResult.categories),
      atsResult.version,
      timestamp,
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

  const atsResult = scoreCv(content)
  const updatedAt = new Date().toISOString()
  const result = await getAppDb().execute({
    sql: `UPDATE cvs
          SET title = ?, content_json = ?, updated_at = ?,
              cv_quality_score = ?, cv_quality_breakdown = ?,
              cv_quality_scoring_version = ?, cv_quality_scored_at = ?
          WHERE id = ? AND user_id = ?`,
    args: [
      title,
      JSON.stringify(content),
      updatedAt,
      atsResult.overall,
      JSON.stringify(atsResult.categories),
      atsResult.version,
      updatedAt,
      id,
      userId,
    ],
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

export async function restoreCv(
  userId: string,
  cv: Pick<CvRecord, "id" | "title" | "content" | "createdAt" | "updatedAt">
) {
  await ensureAppSchema()
  const atsResult = scoreCv(cv.content)
  const timestamp = new Date().toISOString()

  await getAppDb().execute({
    sql: `INSERT INTO cvs
          (id, user_id, title, content_json, cv_quality_score,
           cv_quality_breakdown, cv_quality_scoring_version,
           cv_quality_scored_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      cv.id,
      userId,
      cv.title,
      JSON.stringify(cv.content),
      atsResult.overall,
      JSON.stringify(atsResult.categories),
      atsResult.version,
      timestamp,
      cv.createdAt,
      timestamp,
    ],
  })

  return getCv(userId, cv.id)
}
