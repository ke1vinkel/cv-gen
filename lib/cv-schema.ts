import { z } from "zod"

const requiredText = z.string().trim().min(1).max(200)
const optionalText = z.string().trim().max(500)
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      value === "" ||
      (() => {
        try {
          const url = new URL(value)
          return url.protocol === "http:" || url.protocol === "https:"
        } catch {
          return false
        }
      })(),
    "Enter a valid HTTP(S) URL."
  )
const monthYear = z
  .string()
  .trim()
  .regex(/^(?:|(?:0[1-9]|1[0-2])\/\d{4})$/, "Use MM/YYYY format.")
const endMonthYear = monthYear.or(z.literal("Present"))

export const experienceSchema = z.object({
  id: z.string().min(1),
  role: requiredText,
  organization: requiredText,
  url: optionalUrl.optional(),
  startDate: monthYear,
  endDate: endMonthYear,
  description: z.string().trim().max(2000).optional(),
  bullets: z.array(z.string().trim().min(1).max(500)).max(12),
})

export const educationSchema = z.object({
  id: z.string().min(1),
  degree: requiredText,
  institution: requiredText,
  fieldOfStudy: optionalText.optional(),
  url: optionalText.optional(),
  startDate: monthYear,
  endDate: endMonthYear,
  details: optionalText,
})

export const languageSchema = z.object({
  id: z.string().min(1),
  language: requiredText,
  proficiency: z.enum([
    "Not Rated",
    "Elementary",
    "Limited Working",
    "Professional Working",
    "Full Professional",
    "Native or Bilingual",
  ]),
})

export const cvContentSchema = z.object({
  name: requiredText,
  contact: z.object({
    phone: optionalText,
    email: z.string().trim().email().or(z.literal("")),
    website: optionalText,
    location: optionalText,
  }),
  summary: z.string().trim().max(2000),
  experiences: z.array(experienceSchema).max(12),
  education: z.array(educationSchema).max(8),
  skills: z.array(z.string().trim().min(1).max(100)).max(30),
  languages: z.array(languageSchema).max(12).default([]),
  visibility: z
    .object({
      personal: z.boolean(),
      summary: z.boolean(),
      experience: z.boolean(),
      education: z.boolean(),
      skills: z.boolean(),
      languages: z.boolean().default(true),
    })
    .optional(),
})

export const cvMutationSchema = z.object({
  title: z.string().trim().min(1).max(100),
  content: cvContentSchema,
})

export type CvContent = z.infer<typeof cvContentSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Education = z.infer<typeof educationSchema>
export type Language = z.infer<typeof languageSchema>

export type CvRecord = {
  id: string
  title: string
  content: CvContent
  createdAt: string
  updatedAt: string
}

export type CvSummary = Pick<
  CvRecord,
  "id" | "title" | "createdAt" | "updatedAt"
>

export function createEmptyCv(email = ""): CvContent {
  return {
    name: "Your name",
    contact: {
      phone: "",
      email,
      website: "",
      location: "",
    },
    summary: "",
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    visibility: {
      personal: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      languages: true,
    },
  }
}
