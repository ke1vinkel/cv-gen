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
        `CREATE TABLE IF NOT EXISTS cvs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        "CREATE INDEX IF NOT EXISTS cvs_user_updated_idx ON cvs(user_id, updated_at DESC)",
      ],
      "write"
    )
  })()

  return appSchemaPromise
}
