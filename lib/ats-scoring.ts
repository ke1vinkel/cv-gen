import { actionVerbsEn, actionVerbsId } from "@/lib/action-verbs"
import type { CvContent } from "@/lib/cv-schema"

export const ATS_SCORING_VERSION = 1

export type AtsSeverity = "critical" | "warning" | "info"

export type AtsCriticalIssue = {
  id: string
  severity: AtsSeverity
  messageKey: string
}

export type AtsCategoryResult = {
  category: string
  score: number
  maxScore: number
  criticalIssues: AtsCriticalIssue[]
}

export type AtsScoreResult = {
  overall: number
  version: number
  categories: AtsCategoryResult[]
}

export type AtsCheckDetail = {
  id: string
  passed: boolean
  severity: AtsSeverity
  messageKey: string
}

export type AtsDetailedBreakdown = {
  overall: number
  version: number
  categories: Array<AtsCategoryResult & { checks: AtsCheckDetail[] }>
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  completeness: 0.35,
  bulletQuality: 0.35,
  summaryQuality: 0.2,
  contactValidation: 0.1,
}

const actionVerbs = new Set([...actionVerbsEn, ...actionVerbsId])
const fillerPhrases = [
  "hardworking",
  "team player",
  "responsible",
  "pekerja keras",
  "pemain tim",
  "bertanggung jawab",
]

function check(
  id: string,
  passed: boolean,
  severity: AtsSeverity,
  messageKey: string
): AtsCheckDetail {
  return { id, passed, severity, messageKey }
}

function scoreChecks(checks: AtsCheckDetail[]) {
  const scored = checks.filter((item) => item.severity !== "info")
  if (scored.length === 0) return 0
  return Math.round(
    (scored.filter((item) => item.passed).length / scored.length) * 100
  )
}

function category(category: string, checks: AtsCheckDetail[]) {
  return {
    category,
    score: scoreChecks(checks),
    maxScore: 100,
    criticalIssues: checks
      .filter((item) => !item.passed && item.severity !== "info")
      .map(({ id, severity, messageKey }) => ({ id, severity, messageKey })),
    checks,
  }
}

function normalizedContent(content: CvContent) {
  const value = content as CvContent & Record<string, unknown>
  return {
    name: typeof value.name === "string" ? value.name.trim() : "",
    contact:
      value.contact && typeof value.contact === "object"
        ? (value.contact as CvContent["contact"])
        : { phone: "", email: "", website: "", location: "" },
    summary: typeof value.summary === "string" ? value.summary.trim() : "",
    experiences: Array.isArray(value.experiences) ? value.experiences : [],
    education: Array.isArray(value.education) ? value.education : [],
    skills: Array.isArray(value.skills) ? value.skills : [],
    customSections: Array.isArray(value.customSections)
      ? value.customSections
      : [],
  }
}

function firstWord(value: string) {
  return (
    value
      .trim()
      .split(/\s+/, 1)[0]
      ?.toLocaleLowerCase()
      .replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "") ?? ""
  )
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/u).length : 0
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidWebsite(value: string) {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function detailedBreakdown(content: CvContent): AtsDetailedBreakdown {
  const cv = normalizedContent(content)
  const phone = String(cv.contact.phone ?? "").trim()
  const email = String(cv.contact.email ?? "").trim()
  const website = String(cv.contact.website ?? "").trim()
  const phoneDigits = phone.replace(/\D/g, "")
  const entryCount =
    cv.experiences.length + cv.education.length + cv.skills.length

  const completenessChecks = [
    check("completeness.name", Boolean(cv.name), "critical", "Name is missing"),
    check(
      "completeness.email",
      Boolean(email),
      "critical",
      "Email address is missing"
    ),
    check(
      "completeness.phone",
      Boolean(phone),
      "critical",
      "Phone number is missing"
    ),
    check(
      "completeness.summary",
      Boolean(cv.summary),
      "critical",
      "Summary is missing"
    ),
    check(
      "completeness.experience",
      cv.experiences.length > 0,
      "critical",
      "No work experience added"
    ),
    check(
      "completeness.education",
      cv.education.length > 0,
      "critical",
      "No education entry added"
    ),
    check(
      "info.sparseContent",
      entryCount >= 3,
      "info",
      "CV has very few entries — consider adding more experience or skills"
    ),
    check(
      "info.pageLength",
      cv.experiences.length + cv.education.length + cv.customSections.length <=
        10,
      "info",
      "Estimated content may exceed two pages"
    ),
  ]

  const bullets = [
    ...cv.experiences.flatMap((experience) => experience.bullets ?? []),
    ...cv.customSections.flatMap((section) =>
      (section.items ?? []).flatMap((item) => item.bullets ?? [])
    ),
  ]
  const bulletChecks = bullets.flatMap((bullet, index) => [
    check(
      `bulletQuality.${index}.actionVerb`,
      actionVerbs.has(firstWord(bullet)),
      "warning",
      "Bullet does not start with an action verb"
    ),
    check(
      `bulletQuality.${index}.length`,
      wordCount(bullet) >= 8,
      "warning",
      "Bullet is too short (less than 8 words)"
    ),
    check(
      `bulletQuality.${index}.metrics`,
      /\d/.test(bullet),
      "info",
      "Consider adding metrics to this bullet"
    ),
  ])

  const summaryWords = wordCount(cv.summary)
  const normalizedSummary = cv.summary.toLocaleLowerCase()
  const summaryChecks = [
    check(
      "summaryQuality.minimumLength",
      summaryWords >= 30,
      "warning",
      "Summary is too short (minimum 30 words)"
    ),
    check(
      "summaryQuality.maximumLength",
      summaryWords > 0 && summaryWords <= 200,
      "warning",
      "Summary is too long (maximum 200 words)"
    ),
    check(
      "summaryQuality.filler",
      Boolean(cv.summary) &&
        !fillerPhrases.some((phrase) => normalizedSummary.includes(phrase)),
      "warning",
      "Summary contains generic filler phrases"
    ),
  ]

  const contactChecks = [
    check(
      "contactValidation.email",
      isValidEmail(email),
      "warning",
      "Email address is not valid"
    ),
    check(
      "contactValidation.phone",
      phone.startsWith("+") || phoneDigits.length >= 10,
      "warning",
      "Phone number may be missing country code"
    ),
    check(
      "contactValidation.website",
      isValidWebsite(website),
      "warning",
      "Website URL is not valid"
    ),
  ]

  const categories = [
    category("completeness", completenessChecks),
    category("bulletQuality", bulletChecks),
    category("summaryQuality", summaryChecks),
    category("contactValidation", contactChecks),
  ]
  const overall = Math.round(
    categories.reduce(
      (total, item) => total + item.score * CATEGORY_WEIGHTS[item.category],
      0
    )
  )

  return { overall, version: ATS_SCORING_VERSION, categories }
}

export function scoreCv(content: CvContent): AtsScoreResult {
  const result = detailedBreakdown(content)
  return {
    overall: result.overall,
    version: result.version,
    categories: result.categories.map(
      ({ category, score, maxScore, criticalIssues }) => ({
        category,
        score,
        maxScore,
        criticalIssues,
      })
    ),
  }
}
