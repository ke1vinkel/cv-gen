import "server-only"

import { createClient, type Client } from "@libsql/client"

let authClient: Client | undefined
let appClient: Client | undefined
let appSchemaPromise: Promise<void> | undefined

function requiredEnvironment(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getAppDb() {
  appClient ??= createClient({
    url: requiredEnvironment("APP_DATABASE_URL"),
    authToken: requiredEnvironment("APP_DATABASE_TOKEN"),
  })

  return appClient
}

export function getAuthDb() {
  authClient ??= createClient({
    url: requiredEnvironment("AUTH_DATABASE_URL"),
    authToken: requiredEnvironment("AUTH_DATABASE_TOKEN"),
  })

  return authClient
}

export function ensureAppSchema() {
  appSchemaPromise ??= (async () => {
    const db = getAppDb()

    await db.batch(
      [
        `CREATE TABLE IF NOT EXISTS app_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        "CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app_sessions(user_id)",
        `CREATE TABLE IF NOT EXISTS app_credentials (
          user_id TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS login_attempts (
          identifier_hash TEXT PRIMARY KEY,
          failed_attempts INTEGER NOT NULL,
          window_started_at TEXT NOT NULL,
          locked_until TEXT,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS cvs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content_json TEXT NOT NULL,
          cv_quality_score INTEGER,
          cv_quality_breakdown TEXT,
          cv_quality_scoring_version INTEGER,
          cv_quality_scored_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        "CREATE INDEX IF NOT EXISTS cvs_user_updated_idx ON cvs(user_id, updated_at DESC)",
      ],
      "write"
    )

    const qualityColumns = [
      ["ats_score", "cv_quality_score", "INTEGER"],
      ["ats_breakdown", "cv_quality_breakdown", "TEXT"],
      ["ats_scoring_version", "cv_quality_scoring_version", "INTEGER"],
      ["ats_scored_at", "cv_quality_scored_at", "TEXT"],
    ]
    const columnsResult = await db.execute("PRAGMA table_info(cvs)")
    const existingColumns = new Set(
      columnsResult.rows.map((row) => String(row.name))
    )

    for (const [legacyName, qualityName, type] of qualityColumns) {
      if (existingColumns.has(legacyName) && !existingColumns.has(qualityName)) {
        await db.execute(
          `ALTER TABLE cvs RENAME COLUMN ${legacyName} TO ${qualityName}`
        )
        existingColumns.delete(legacyName)
        existingColumns.add(qualityName)
      } else if (!existingColumns.has(qualityName)) {
        await db.execute(`ALTER TABLE cvs ADD COLUMN ${qualityName} ${type}`)
        existingColumns.add(qualityName)
      }
    }
  })()

  return appSchemaPromise
}
