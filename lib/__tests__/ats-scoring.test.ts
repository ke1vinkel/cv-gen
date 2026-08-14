import { describe, expect, it } from "vitest"

import {
  ATS_SCORING_VERSION,
  detailedBreakdown,
  scoreCv,
} from "@/lib/ats-scoring"
import { createEmptyCv, type CvContent } from "@/lib/cv-schema"

function completeCv(): CvContent {
  return {
    ...createEmptyCv("student@example.com"),
    name: "Ayu Pratama",
    contact: {
      phone: "08123456789",
      email: "student@example.com",
      website: "https://example.com",
      location: "Jakarta",
    },
    summary: Array.from(
      { length: 30 },
      (_, index) => `professional${index}`
    ).join(" "),
    experiences: [
      {
        id: "experience-1",
        role: "Engineer",
        organization: "Example",
        startDate: "01/2025",
        endDate: "Present",
        bullets: ["Led a team of 5 engineers to deliver products early"],
      },
    ],
    education: [
      {
        id: "education-1",
        degree: "Bachelor",
        institution: "University",
        fieldOfStudy: "Computer Science",
        startDate: "01/2021",
        endDate: "01/2025",
        details: "",
      },
    ],
    skills: ["TypeScript"],
  }
}

function categoryScore(content: CvContent, category: string) {
  return scoreCv(content).categories.find((item) => item.category === category)
    ?.score
}

describe("ATS scoring", () => {
  it("scores empty and complete CVs at the expected boundaries", () => {
    expect(scoreCv(createEmptyCv()).overall).toBeLessThan(15)
    expect(scoreCv(completeCv()).overall).toBe(100)
  })

  it("applies the configured category weights", () => {
    const result = scoreCv(completeCv())
    expect(result.categories.map((item) => item.score)).toEqual([
      100, 100, 100, 100,
    ])
    expect(result.overall).toBe(35 + 35 + 20 + 10)
  })

  it.each([
    ["Led a team of engineers to ship reliable software", 100],
    ["Led, a team of engineers to ship reliable software", 100],
    ["MEMIMPIN tim beranggotakan lima orang untuk menyelesaikan proyek", 100],
    ["The team was led by an experienced software engineer", 50],
    ["Tim dipimpin oleh seorang insinyur perangkat lunak berpengalaman", 50],
    ["Led", 50],
  ])("evaluates action verbs and bullet length: %s", (bullet, expected) => {
    const cv = completeCv()
    cv.experiences[0].bullets = [bullet]
    expect(categoryScore(cv, "bulletQuality")).toBe(expected)
  })

  it("does not penalize bullets without metrics", () => {
    const withoutMetric = completeCv()
    withoutMetric.experiences[0].bullets = [
      "Led several engineers to deliver reliable products ahead of schedule",
    ]
    const withMetric = completeCv()
    expect(categoryScore(withoutMetric, "bulletQuality")).toBe(
      categoryScore(withMetric, "bulletQuality")
    )
    expect(
      detailedBreakdown(withoutMetric)
        .categories.find((item) => item.category === "bulletQuality")
        ?.checks.find((item) => item.id.endsWith("metrics"))
    ).toMatchObject({ passed: false, severity: "info" })
  })

  it.each([
    [29, 67],
    [30, 100],
    [200, 100],
    [201, 67],
  ])("enforces summary word boundaries at %i words", (count, expected) => {
    const cv = completeCv()
    cv.summary = Array.from(
      { length: count },
      (_, index) => `word${index}`
    ).join(" ")
    expect(categoryScore(cv, "summaryQuality")).toBe(expected)
  })

  it.each(["hardworking", "team player", "pekerja keras"])(
    "detects the filler phrase %s",
    (phrase) => {
      const cv = completeCv()
      cv.summary = `${cv.summary} ${phrase}`
      expect(categoryScore(cv, "summaryQuality")).toBe(67)
    }
  )

  it("validates contact formats", () => {
    const cv = completeCv()
    cv.contact.email = "bad-email"
    cv.contact.phone = "123"
    cv.contact.website = "not-a-url"
    expect(categoryScore(cv, "contactValidation")).toBe(0)
  })

  it("accepts either a country code or at least ten phone digits", () => {
    const local = completeCv()
    local.contact.phone = "0812345678"
    expect(categoryScore(local, "contactValidation")).toBe(100)

    const international = completeCv()
    international.contact.phone = "+62 123"
    expect(categoryScore(international, "contactValidation")).toBe(100)
  })

  it("handles legacy-shaped content without optional arrays", () => {
    const legacy = {
      name: "Legacy User",
      contact: { email: "legacy@example.com", phone: "08123456789" },
      summary: "",
      experiences: [],
      education: [],
      skills: [],
    } as unknown as CvContent

    expect(() => scoreCv(legacy)).not.toThrow()
  })

  it("reports sparse and length tips without changing numeric scores", () => {
    const sparse = createEmptyCv()
    const sparseResult = detailedBreakdown(sparse)
    expect(
      sparseResult.categories
        .flatMap((item) => item.checks)
        .find((item) => item.id === "info.sparseContent")
    ).toMatchObject({ passed: false, severity: "info" })

    const long = completeCv()
    long.customSections = Array.from({ length: 10 }, (_, index) => ({
      id: `section-${index}`,
      title: `Section ${index}`,
      items: [],
    }))
    expect(scoreCv(long).overall).toBe(scoreCv(completeCv()).overall)
  })

  it("is deterministic and includes the current scoring version", () => {
    const first = scoreCv(completeCv())
    const second = scoreCv(completeCv())
    expect(first).toEqual(second)
    expect(first.version).toBe(ATS_SCORING_VERSION)
    expect(Number.isInteger(first.overall)).toBe(true)
  })

  it("isolates a summary-quality change to its category", () => {
    const short = completeCv()
    short.summary = "A concise professional summary"
    const fixed = structuredClone(short)
    fixed.summary = completeCv().summary
    const before = scoreCv(short).categories
    const after = scoreCv(fixed).categories

    expect(before.filter((item) => item.category !== "summaryQuality")).toEqual(
      after.filter((item) => item.category !== "summaryQuality")
    )
    expect(categoryScore(fixed, "summaryQuality")).toBeGreaterThan(
      categoryScore(short, "summaryQuality") ?? 0
    )
  })
})
