import { createClient, type Client } from "@libsql/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createEmptyCv, type CvContent } from "@/lib/cv-schema"

type CvsModule = typeof import("@/lib/cvs")

let client: Client
let cvs: CvsModule

function updatedContent(): CvContent {
  return {
    ...createEmptyCv("student@example.com"),
    name: "Student Name",
    summary: "A concise professional summary",
    skills: ["TypeScript"],
  }
}

beforeEach(async () => {
  vi.resetModules()
  client = createClient({ url: ":memory:" })
  await client.execute(`CREATE TABLE cvs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`)
  vi.doMock("@/lib/db", () => ({
    ensureAppSchema: async () => undefined,
    getAppDb: () => client,
    getAuthDb: () => client,
  }))
  cvs = await import("@/lib/cvs")
})

afterEach(() => {
  client.close()
  vi.restoreAllMocks()
})

describe("CV persistence", () => {
  it("creates and updates a CV", async () => {
    const created = await cvs.createCv("user-1", "student@example.com", "CV")
    expect(created?.content.contact.email).toBe("student@example.com")

    const content = updatedContent()
    const updated = await cvs.updateCv(
      "user-1",
      created!.id,
      "Updated",
      content
    )
    expect(updated).toMatchObject({ title: "Updated", content })
  })

  it("duplicates a CV", async () => {
    const created = await cvs.createCv("user-1", "student@example.com", "CV")
    const duplicate = await cvs.duplicateCv("user-1", created!.id)

    expect(duplicate).toMatchObject({
      title: "CV (Copy)",
      content: created!.content,
    })
    expect(duplicate?.id).not.toBe(created?.id)
  })

  it("restores a CV", async () => {
    const content = updatedContent()
    const restored = await cvs.restoreCv("user-1", {
      id: "restored-1",
      title: "Restored",
      content,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    })

    expect(restored).toMatchObject({
      id: "restored-1",
      title: "Restored",
      content,
      createdAt: new Date(0).toISOString(),
    })
  })
})
