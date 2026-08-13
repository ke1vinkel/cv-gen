import { createClient } from "@libsql/client"

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const app = createClient({
  url: required("APP_DATABASE_URL"),
  authToken: required("APP_DATABASE_TOKEN"),
})

await app.batch(
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    "CREATE INDEX IF NOT EXISTS cvs_user_updated_idx ON cvs(user_id, updated_at DESC)",
  ],
  "write"
)

console.log("schema is ready.")
