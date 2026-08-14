import type { Client } from "@libsql/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

let client: Client | undefined

beforeEach(() => {
  vi.resetModules()
  process.env.APP_DATABASE_URL = ":memory:"
  process.env.APP_DATABASE_TOKEN = "test-token"
})

afterEach(() => {
  client?.close()
  client = undefined
  delete process.env.APP_DATABASE_URL
  delete process.env.APP_DATABASE_TOKEN
})

describe("CV quality schema migration", () => {
  it("renames legacy ATS columns without losing stored data", async () => {
    const { ensureAppSchema, getAppDb } = await import("@/lib/db")
    client = getAppDb()
    await client.execute(`CREATE TABLE cvs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      ats_score INTEGER,
      ats_breakdown TEXT,
      ats_scoring_version INTEGER,
      ats_scored_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`)
    await client.execute({
      sql: `INSERT INTO cvs
            (id, user_id, title, content_json, ats_score, ats_breakdown,
             ats_scoring_version, ats_scored_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "cv-1",
        "user-1",
        "CV",
        "{}",
        72,
        "[]",
        1,
        "2026-08-14T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
      ],
    })

    await ensureAppSchema()

    const columns = await client.execute("PRAGMA table_info(cvs)")
    const columnNames = columns.rows.map((row) => String(row.name))
    expect(columnNames).toEqual(
      expect.arrayContaining([
        "cv_quality_score",
        "cv_quality_breakdown",
        "cv_quality_scoring_version",
        "cv_quality_scored_at",
      ])
    )
    expect(columnNames.some((name) => name.startsWith("ats_"))).toBe(false)

    const migrated = await client.execute(
      `SELECT cv_quality_score, cv_quality_breakdown,
              cv_quality_scoring_version, cv_quality_scored_at
       FROM cvs WHERE id = 'cv-1'`
    )
    expect(migrated.rows[0]).toMatchObject({
      cv_quality_score: 72,
      cv_quality_breakdown: "[]",
      cv_quality_scoring_version: 1,
      cv_quality_scored_at: "2026-08-14T00:00:00.000Z",
    })
  })
})
