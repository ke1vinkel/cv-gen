import { createClient, type Client } from "@libsql/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { scoreCv } from "@/lib/ats-scoring"
import { createEmptyCv, type CvContent } from "@/lib/cv-schema"

type CvsModule = typeof import("@/lib/cvs")

let client: Client
let cvs: CvsModule

async function initializeSchema() {
  await client.execute(`CREATE TABLE cvs (
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
  )`)
}

function updatedContent(): CvContent {
  return {
    ...createEmptyCv("student@example.com"),
    name: "Student Name",
    contact: {
      phone: "08123456789",
      email: "student@example.com",
      website: "https://example.com",
      location: "Jakarta",
    },
    summary: Array.from({ length: 30 }, (_, index) => `word${index}`).join(" "),
    experiences: [
      {
        id: "experience-1",
        role: "Engineer",
        organization: "Company",
        startDate: "01/2025",
        endDate: "Present",
        bullets: ["Built 3 reliable systems for customers ahead of schedule"],
      },
    ],
    education: [
      {
        id: "education-1",
        degree: "Bachelor",
        institution: "University",
        fieldOfStudy: "Computing",
        startDate: "01/2021",
        endDate: "01/2025",
        details: "",
      },
    ],
    skills: ["TypeScript"],
  }
}

beforeEach(async () => {
  vi.resetModules()
  client = createClient({ url: ":memory:" })
  await initializeSchema()
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

describe("ATS persistence", () => {
  it("creates a CV with a non-null stored score", async () => {
    const created = await cvs.createCv("user-1", "student@example.com", "CV")
    expect(created?.atsScore).not.toBeNull()
    expect(created?.atsBreakdown).not.toBeNull()
    expect(created?.atsScoredAt).not.toBeNull()
  })

  it("atomically stores content and matching score on each update", async () => {
    const created = await cvs.createCv("user-1", "student@example.com", "CV")
    const contentA = updatedContent()
    const first = await cvs.updateCv("user-1", created!.id, "Updated", contentA)
    expect(first?.atsScore).toBe(scoreCv(contentA).overall)
    expect(first?.atsBreakdown).toEqual(scoreCv(contentA).categories)

    const contentB = structuredClone(contentA)
    contentB.summary = "Short summary"
    const second = await cvs.updateCv(
      "user-1",
      created!.id,
      "Updated again",
      contentB
    )
    expect(second?.atsScore).toBe(scoreCv(contentB).overall)
    expect(second?.content).toEqual(contentB)
  })

  it("recomputes scores when duplicating and restoring", async () => {
    const created = await cvs.createCv("user-1", "student@example.com", "CV")
    const content = updatedContent()
    await cvs.updateCv("user-1", created!.id, "Updated", content)
    await client.execute({
      sql: "UPDATE cvs SET cv_quality_score = 1 WHERE id = ?",
      args: [created!.id],
    })

    const duplicate = await cvs.duplicateCv("user-1", created!.id)
    expect(duplicate?.atsScore).toBe(scoreCv(content).overall)

    const restored = await cvs.restoreCv("user-1", {
      id: "restored-1",
      title: "Restored",
      content,
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    })
    expect(restored?.atsScore).toBe(scoreCv(content).overall)
  })

  it("returns null ATS fields for legacy rows and malformed breakdowns", async () => {
    const content = createEmptyCv()
    await client.execute({
      sql: `INSERT INTO cvs
            (id, user_id, title, content_json, cv_quality_breakdown,
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "legacy-1",
        "user-1",
        "Legacy",
        JSON.stringify(content),
        "{not-json",
        new Date(0).toISOString(),
        new Date(0).toISOString(),
      ],
    })

    const record = await cvs.getCv("user-1", "legacy-1")
    expect(record).toMatchObject({
      atsScore: null,
      atsBreakdown: null,
      atsScoringVersion: null,
      atsScoredAt: null,
    })
  })
})
