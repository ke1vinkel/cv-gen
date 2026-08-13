"use client"

import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  List,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"

import { CvPreview } from "@/components/cv-preview"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  CvContent,
  CvRecord,
  Education,
  Experience,
} from "@/lib/cv-schema"
import { cn } from "@/lib/utils"

type SaveState = "idle" | "saving" | "saved" | "error"
type SectionKey = "personal" | "summary" | "experience" | "education" | "skills"

function FormField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  const id = useId()
  const control = isValidElement<{ id?: string }>(children)
    ? cloneElement(children, { id })
    : children

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {control}
    </div>
  )
}

function EditorSection({
  section,
  title,
  icon,
  children,
  activeSection,
  visible,
  orderClass,
  onOpen,
  onBack,
  onToggleVisibility,
}: {
  section: SectionKey
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  activeSection: SectionKey | null
  visible: boolean
  orderClass: string
  onOpen: () => void
  onBack: () => void
  onToggleVisibility: () => void
}) {
  if (activeSection && activeSection !== section) return null

  if (!activeSection) {
    return (
      <section className={cn("border-b last:border-b-0", orderClass)}>
        <div className="flex min-h-19 items-center gap-3 py-4">
          <button
            type="button"
            onClick={onOpen}
            className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span className="flex size-9 shrink-0 items-center justify-center text-foreground">
              {icon}
            </span>
            <span className="min-w-0 flex-1 text-lg font-medium tracking-tight">
              {title}
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`${visible ? "Hide" : "Show"} ${title} in CV`}
            aria-pressed={!visible}
          >
            {visible ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`Edit ${title}`}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-1 py-5 sm:px-5 sm:py-7">
      <header className="mb-8 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Back to sections"
        >
          <ArrowLeft />
        </Button>
        <h2 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleVisibility}
          aria-label={`${visible ? "Hide" : "Show"} ${title} in CV`}
          aria-pressed={!visible}
        >
          {visible ? <Eye /> : <EyeOff />}
        </Button>
      </header>
      <div className="pb-6">{children}</div>
    </section>
  )
}

function EndDateField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>End date</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          placeholder="MM/YYYY"
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant={value === "Present" ? "secondary" : "outline"}
          onClick={() => onChange("Present")}
        >
          Present
        </Button>
      </div>
    </div>
  )
}

function blankExperience(): Experience {
  return {
    id: crypto.randomUUID(),
    role: "New role",
    organization: "Organization",
    startDate: "",
    endDate: "",
    bullets: [],
  }
}

function blankEducation(): Education {
  return {
    id: crypto.randomUUID(),
    degree: "Degree or programme",
    institution: "Institution",
    startDate: "",
    endDate: "",
    details: "",
  }
}

export function CvEditor({ initialCv }: { initialCv: CvRecord }) {
  const [title, setTitle] = useState(initialCv.title)
  const [content, setContent] = useState<CvContent>(initialCv.content)
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null)
  const [skillsText, setSkillsText] = useState(
    initialCv.content.skills.join("\n")
  )
  const [highlightsText, setHighlightsText] = useState<Record<string, string>>(
    Object.fromEntries(
      initialCv.content.experiences.map((experience) => [
        experience.id,
        experience.bullets.join("\n"),
      ])
    )
  )
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [isDirty, setIsDirty] = useState(false)
  const [message, setMessage] = useState("")
  const editRevision = useRef(0)
  const isDirtyRef = useRef(false)
  const hasHistoryGuard = useRef(false)

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return

      event.preventDefault()
      event.returnValue = true
    }

    function blockBackNavigation() {
      if (!isDirtyRef.current || !hasHistoryGuard.current) return

      window.history.forward()
      setMessage("Save your changes before leaving.")
    }

    window.addEventListener("beforeunload", warnBeforeUnload)
    window.addEventListener("popstate", blockBackNavigation)

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload)
      window.removeEventListener("popstate", blockBackNavigation)
    }
  }, [])

  function markDirty() {
    editRevision.current += 1
    isDirtyRef.current = true
    setIsDirty(true)
    setSaveState("idle")
    setMessage("")

    if (!hasHistoryGuard.current) {
      window.history.pushState(
        { ...window.history.state, cvEditorUnsavedGuard: true },
        "",
        window.location.href
      )
      hasHistoryGuard.current = true
    }
  }

  function updateContent(patch: Partial<CvContent>) {
    setContent((current) => ({ ...current, ...patch }))
    markDirty()
  }

  function sectionIsVisible(section: SectionKey) {
    return content.visibility?.[section] ?? true
  }

  function toggleSectionVisibility(section: SectionKey) {
    updateContent({
      visibility: {
        personal: content.visibility?.personal ?? true,
        summary: content.visibility?.summary ?? true,
        experience: content.visibility?.experience ?? true,
        education: content.visibility?.education ?? true,
        skills: content.visibility?.skills ?? true,
        [section]: !sectionIsVisible(section),
      },
    })
  }

  function updateExperience(id: string, patch: Partial<Experience>) {
    updateContent({
      experiences: content.experiences.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    })
  }

  function updateEducation(id: string, patch: Partial<Education>) {
    updateContent({
      education: content.education.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    })
  }

  async function save() {
    const savedRevision = editRevision.current
    setSaveState("saving")
    setMessage("")

    try {
      const response = await fetch(`/api/cvs/${initialCv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
      }

      if (!response.ok) {
        setSaveState("error")
        setMessage(data.error ?? "Could not save your changes.")
        return
      }

      if (savedRevision === editRevision.current) {
        isDirtyRef.current = false
        setIsDirty(false)
        setSaveState("saved")

        if (
          hasHistoryGuard.current &&
          window.history.state?.cvEditorUnsavedGuard
        ) {
          hasHistoryGuard.current = false
          window.history.back()
        }
      } else {
        setSaveState("idle")
      }
    } catch {
      setSaveState("error")
      setMessage("Could not connect to the server. Try saving again.")
    }
  }

  return (
    <div className="min-h-[100dvh] bg-muted/40">
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
        <div className="flex min-h-16 w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                markDirty()
              }}
              aria-label="CV title"
              maxLength={100}
              className="max-w-md bg-transparent text-base font-semibold"
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden text-xs sm:inline",
                saveState === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
              role="status"
            >
              {saveState === "saved"
                ? "Saved"
                : saveState === "error"
                  ? message
                  : isDirty
                    ? message || "Unsaved changes"
                    : "Changes are saved manually"}
            </span>
            <Link
              href={`/cvs/${initialCv.id}/preview`}
              aria-disabled={isDirty}
              onNavigate={(event) => {
                if (!isDirty) return

                event.preventDefault()
                setMessage("Save your changes before leaving.")
              }}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                isDirty && "cursor-not-allowed opacity-60"
              )}
            >
              <Eye data-icon="inline-start" />
              Preview
            </Link>
            <Button size="sm" onClick={save} disabled={saveState === "saving"}>
              {saveState === "saving" ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : saveState === "saved" ? (
                <Check data-icon="inline-start" />
              ) : (
                <Save data-icon="inline-start" />
              )}
              {saveState === "saving" ? "Saving" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <main className="grid w-full gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(360px,36%)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col self-start overflow-hidden rounded-2xl border bg-background px-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:px-7">
          <EditorSection
            section="personal"
            title="Personal details"
            icon={<UserRound className="size-5" />}
            activeSection={activeSection}
            visible={sectionIsVisible("personal")}
            orderClass="order-1"
            onOpen={() => setActiveSection("personal")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("personal")}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" className="sm:col-span-2">
                <Input
                  value={content.name}
                  onChange={(event) =>
                    updateContent({ name: event.target.value })
                  }
                  maxLength={200}
                />
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={content.contact.email}
                  onChange={(event) =>
                    updateContent({
                      contact: {
                        ...content.contact,
                        email: event.target.value,
                      },
                    })
                  }
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  value={content.contact.phone}
                  onChange={(event) =>
                    updateContent({
                      contact: {
                        ...content.contact,
                        phone: event.target.value,
                      },
                    })
                  }
                />
              </FormField>
              <FormField label="Website">
                <Input
                  value={content.contact.website}
                  placeholder="github.com/username"
                  onChange={(event) =>
                    updateContent({
                      contact: {
                        ...content.contact,
                        website: event.target.value,
                      },
                    })
                  }
                />
              </FormField>
              <FormField label="Location">
                <Input
                  autoComplete="off"
                  value={content.contact.location}
                  placeholder="Jakarta, Indonesia"
                  onChange={(event) =>
                    updateContent({
                      contact: {
                        ...content.contact,
                        location: event.target.value,
                      },
                    })
                  }
                />
              </FormField>
            </div>
          </EditorSection>

          <EditorSection
            section="summary"
            title="Summary"
            icon={<List className="size-5" />}
            activeSection={activeSection}
            visible={sectionIsVisible("summary")}
            orderClass="order-5"
            onOpen={() => setActiveSection("summary")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("summary")}
          >
            <div>
              <Textarea
                aria-label="Summary"
                value={content.summary}
                onChange={(event) =>
                  updateContent({ summary: event.target.value })
                }
                placeholder="Write a concise profile focused on the role you want."
                rows={5}
                maxLength={2000}
              />
            </div>
          </EditorSection>

          <EditorSection
            section="experience"
            title="Experience"
            icon={<BriefcaseBusiness className="size-5" />}
            activeSection={activeSection}
            visible={sectionIsVisible("experience")}
            orderClass="order-2"
            onOpen={() => setActiveSection("experience")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("experience")}
          >
            <div className="mb-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateContent({
                    experiences: [...content.experiences, blankExperience()],
                  })
                }
              >
                <Plus data-icon="inline-start" /> Add role
              </Button>
            </div>
            <div className="space-y-4">
              {content.experiences.length === 0 && (
                <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  Add internships, employment, freelance work, or substantial
                  projects.
                </p>
              )}
              {content.experiences.map((experience) => (
                <div
                  key={experience.id}
                  className="space-y-4 rounded-xl border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate text-sm">
                      {experience.role}
                    </strong>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${experience.role}`}
                      onClick={() =>
                        updateContent({
                          experiences: content.experiences.filter(
                            (item) => item.id !== experience.id
                          ),
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Role">
                      <Input
                        value={experience.role}
                        onChange={(event) =>
                          updateExperience(experience.id, {
                            role: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Organization">
                      <Input
                        value={experience.organization}
                        onChange={(event) =>
                          updateExperience(experience.id, {
                            organization: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Start date">
                      <Input
                        value={experience.startDate}
                        placeholder="01/2025"
                        onChange={(event) =>
                          updateExperience(experience.id, {
                            startDate: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <EndDateField
                      value={experience.endDate}
                      onChange={(endDate) =>
                        updateExperience(experience.id, { endDate })
                      }
                    />
                    <FormField label="Highlights" className="sm:col-span-2">
                      <Textarea
                        value={
                          highlightsText[experience.id] ??
                          experience.bullets.join("\n")
                        }
                        placeholder="One achievement per line"
                        rows={4}
                        onChange={(event) => {
                          setHighlightsText((current) => ({
                            ...current,
                            [experience.id]: event.target.value,
                          }))
                          updateExperience(experience.id, {
                            bullets: event.target.value
                              .split("\n")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          })
                        }}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </EditorSection>

          <EditorSection
            section="education"
            title="Education"
            icon={<GraduationCap className="size-5" />}
            activeSection={activeSection}
            visible={sectionIsVisible("education")}
            orderClass="order-3"
            onOpen={() => setActiveSection("education")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("education")}
          >
            <div className="mb-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateContent({
                    education: [...content.education, blankEducation()],
                  })
                }
              >
                <Plus data-icon="inline-start" /> Add education
              </Button>
            </div>
            <div className="space-y-4">
              {content.education.length === 0 && (
                <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  Add your university, school, certification, or other relevant
                  study.
                </p>
              )}
              {content.education.map((education) => (
                <div
                  key={education.id}
                  className="space-y-4 rounded-xl border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate text-sm">
                      {education.degree}
                    </strong>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${education.degree}`}
                      onClick={() =>
                        updateContent({
                          education: content.education.filter(
                            (item) => item.id !== education.id
                          ),
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Degree or programme">
                      <Input
                        value={education.degree}
                        onChange={(event) =>
                          updateEducation(education.id, {
                            degree: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Institution">
                      <Input
                        value={education.institution}
                        onChange={(event) =>
                          updateEducation(education.id, {
                            institution: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Start date">
                      <Input
                        value={education.startDate}
                        placeholder="09/2022"
                        onChange={(event) =>
                          updateEducation(education.id, {
                            startDate: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <EndDateField
                      value={education.endDate}
                      onChange={(endDate) =>
                        updateEducation(education.id, { endDate })
                      }
                    />
                    <FormField label="Details" className="sm:col-span-2">
                      <Input
                        value={education.details}
                        placeholder="Bachelor's Degree (GPA: 3.72/4.00)"
                        onChange={(event) =>
                          updateEducation(education.id, {
                            details: event.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </EditorSection>

          <EditorSection
            section="skills"
            title="Skills"
            icon={<Sparkles className="size-5" />}
            activeSection={activeSection}
            visible={sectionIsVisible("skills")}
            orderClass="order-4"
            onOpen={() => setActiveSection("skills")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("skills")}
          >
            <div>
              <Textarea
                aria-label="Skills"
                value={skillsText}
                placeholder="One skill per line"
                rows={6}
                onChange={(event) => {
                  setSkillsText(event.target.value)
                  updateContent({
                    skills: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }}
              />
            </div>
          </EditorSection>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-22 lg:self-start">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Live preview
          </p>
          <div className="flex min-h-[calc(100dvh-9.75rem)] justify-center overflow-auto rounded-2xl border bg-slate-200 p-4 shadow-sm sm:p-6 dark:bg-slate-900">
            <CvPreview content={content} />
          </div>
        </aside>
      </main>
    </div>
  )
}
