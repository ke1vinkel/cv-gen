import { z } from "zod"

const requiredText = z.string().trim().min(1).max(200)
const optionalText = z.string().trim().max(500)

export const experienceSchema = z.object({
  id: z.string().min(1),
  role: requiredText,
  organization: requiredText,
  startDate: optionalText,
  endDate: optionalText,
  bullets: z.array(z.string().trim().min(1).max(500)).max(12),
})

export const educationSchema = z.object({
  id: z.string().min(1),
  degree: requiredText,
  institution: requiredText,
  startDate: optionalText,
  endDate: optionalText,
  details: optionalText,
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
  visibility: z
    .object({
      personal: z.boolean(),
      summary: z.boolean(),
      experience: z.boolean(),
      education: z.boolean(),
      skills: z.boolean(),
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
    visibility: {
      personal: true,
      summary: true,
      experience: true,
      education: true,
      skills: true,
    },
  }
}
