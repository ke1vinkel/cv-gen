"use client"

import {
  ArrowLeft,
  AlignLeft,
  Bold,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  House,
  Italic,
  Languages,
  Link2,
  List,
  ListIcon,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Underline,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  CvContent,
  CvRecord,
  Education,
  Experience,
  Language,
} from "@/lib/cv-schema"
import { cn } from "@/lib/utils"

type SaveState = "idle" | "saving" | "saved" | "error"
type SectionKey =
  "personal" | "summary" | "experience" | "education" | "skills" | "languages"

const languageProficiencies: Language["proficiency"][] = [
  "Not Rated",
  "Elementary",
  "Limited Working",
  "Professional Working",
  "Full Professional",
  "Native or Bilingual",
]

function FormattingTextarea({
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function replaceSelection(prefix: string, suffix = prefix) {
    const textarea = ref.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end) || "text"
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      )
    })
  }

  function toggleList() {
    const textarea = ref.current
    if (!textarea) return

    const start = value.lastIndexOf("\n", textarea.selectionStart - 1) + 1
    const nextBreak = value.indexOf("\n", textarea.selectionEnd)
    const end = nextBreak === -1 ? value.length : nextBreak
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const lines = value.slice(start, end).split("\n")
    const remove = lines.every((line) => line.startsWith("• "))
    const replacement = lines
      .map((line) => (remove ? line.slice(2) : `• ${line}`))
      .join("\n")
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`)
    const nextSelectionStart = remove
      ? Math.max(start, selectionStart - 2)
      : selectionStart + 2
    const nextSelectionEnd = remove
      ? Math.max(start, selectionEnd - 2 * lines.length)
      : selectionEnd + 2 * lines.length
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd)
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget
    const lineStart = value.lastIndexOf("\n", textarea.selectionStart - 1) + 1
    const beforeCaret = value.slice(lineStart, textarea.selectionStart)

    if (event.key === "Enter" && beforeCaret.startsWith("• ")) {
      event.preventDefault()

      if (beforeCaret === "• ") {
        const next = `${value.slice(0, lineStart)}${value.slice(textarea.selectionEnd)}`
        onChange(next)
        requestAnimationFrame(() => {
          textarea.focus()
          textarea.setSelectionRange(lineStart, lineStart)
        })
        return
      }

      const insertion = "\n• "
      const nextCaret = textarea.selectionStart + insertion.length
      onChange(
        `${value.slice(0, textarea.selectionStart)}${insertion}${value.slice(textarea.selectionEnd)}`
      )
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(nextCaret, nextCaret)
      })
    }

    if (
      event.key === "Backspace" &&
      textarea.selectionStart === textarea.selectionEnd &&
      beforeCaret === "• "
    ) {
      event.preventDefault()
      const next = `${value.slice(0, lineStart)}${value.slice(textarea.selectionStart)}`
      onChange(next)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(lineStart, lineStart)
      })
    }
  }

  const toolClass = "size-9 rounded-lg"

  return (
    <div className="overflow-hidden rounded-xl bg-input/50 focus-within:ring-3 focus-within:ring-ring/30">
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          onClick={() => replaceSelection("**")}
          aria-label="Bold"
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          onClick={() => replaceSelection("*")}
          aria-label="Italic"
        >
          <Italic />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          onClick={() => replaceSelection("__")}
          aria-label="Underline"
        >
          <Underline />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          onClick={() => replaceSelection("[", "](https://)")}
          aria-label="Add link"
        >
          <Link2 />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          onClick={toggleList}
          aria-label="Toggle bullet list"
        >
          <ListIcon />
        </Button>
        <span className="mx-1 h-6 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          aria-label="Align left"
          disabled
        >
          <AlignLeft />
        </Button>
      </div>
      <Textarea
        ref={ref}
        className="min-h-36 resize-y rounded-none bg-transparent px-4 py-4 focus-visible:border-transparent focus-visible:ring-0"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onKeyDown={handleKeyDown}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

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
    <section className="ui-section-enter mx-auto w-full max-w-2xl px-1 py-5 sm:px-5 sm:py-7">
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

function formatMonthYear(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6)
  if (!digits) return ""

  const normalized = /^[2-9]$/.test(digits) ? `0${digits}` : digits
  return normalized.length > 2
    ? `${normalized.slice(0, 2)}/${normalized.slice(2)}`
    : normalized
}

function DateField({
  label,
  value,
  allowPresent = false,
  onChange,
}: {
  label: string
  value: string
  allowPresent?: boolean
  onChange: (value: string) => void
}) {
  const id = useId()
  const isPresent = value === "Present"

  function updateValue(nextValue: string) {
    const formatted = formatMonthYear(nextValue)
    if (
      formatted === "" ||
      formatted === "0" ||
      formatted === "1" ||
      /^(0[1-9]|1[0-2])(?:\/\d{0,4})?$/.test(formatted)
    ) {
      onChange(formatted)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          className="h-12 rounded-xl px-4"
          value={isPresent ? "" : value}
          placeholder="MM/YYYY"
          inputMode="numeric"
          maxLength={7}
          pattern="(0[1-9]|1[0-2])/\d{4}"
          disabled={isPresent}
          aria-label={`${label}, MM/YYYY`}
          onChange={(event) => updateValue(event.target.value)}
        />
        {allowPresent && (
          <Button
            type="button"
            className="h-12 rounded-xl px-4"
            variant={isPresent ? "secondary" : "outline"}
            aria-pressed={isPresent}
            onClick={() => onChange(isPresent ? "" : "Present")}
          >
            Present
          </Button>
        )}
      </div>
    </div>
  )
}

function blankExperience(): Experience {
  return {
    id: crypto.randomUUID(),
    role: "New role",
    organization: "Organization",
    url: "",
    startDate: "",
    endDate: "",
    description: "",
    bullets: [],
  }
}

function blankEducation(): Education {
  return {
    id: crypto.randomUUID(),
    degree: "Degree or programme",
    institution: "Institution",
    fieldOfStudy: "",
    url: "",
    startDate: "",
    endDate: "",
    details: "",
  }
}

function blankLanguage(language = ""): Language {
  return {
    id: crypto.randomUUID(),
    language,
    proficiency: "Not Rated",
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
        [
          experience.description,
          ...experience.bullets.map((bullet) => `• ${bullet}`),
        ]
          .filter(Boolean)
          .join("\n"),
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
        languages: content.visibility?.languages ?? true,
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

  function updateLanguage(id: string, patch: Partial<Language>) {
    updateContent({
      languages: content.languages.map((item) =>
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
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              aria-disabled={isDirty}
              onNavigate={(event) => {
                if (!isDirty) return

                event.preventDefault()
                setMessage("Save your changes before leaving.")
              }}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "shrink-0",
                isDirty && "cursor-not-allowed opacity-60"
              )}
            >
              <House />
            </Link>
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                markDirty()
              }}
              aria-label="CV title"
              maxLength={100}
              className="min-w-0 max-w-md bg-transparent text-base font-semibold"
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

      <main className="grid w-full gap-4 p-4 sm:gap-6 sm:p-6 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(360px,36%)_minmax(0,1fr)] lg:items-stretch lg:overflow-hidden">
        <div className="editor-scroll flex flex-col self-start overflow-hidden rounded-2xl border bg-background px-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:px-7 lg:h-full lg:self-stretch lg:overflow-y-auto">
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
            orderClass="order-2"
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
            orderClass="order-3"
            onOpen={() => setActiveSection("experience")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("experience")}
          >
            <div className="mb-7">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-dashed bg-transparent text-base hover:border-foreground/30"
                onClick={() =>
                  updateContent({
                    experiences: [...content.experiences, blankExperience()],
                  })
                }
              >
                <Plus data-icon="inline-start" /> Add Experience
              </Button>
            </div>
            <div className="space-y-8">
              {content.experiences.length === 0 && (
                <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  Add internships, employment, freelance work, or substantial
                  projects.
                </p>
              )}
              {content.experiences.map((experience) => (
                <div
                  key={experience.id}
                  className="space-y-5 border-b pb-8 last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${experience.role}`}
                      onClick={() =>
                        updateContent({
                          experiences: content.experiences.filter(
                            (item) => item.id !== experience.id
                          ),
                        })
                      }
                    >
                      Delete <Trash2 data-icon="inline-end" />
                    </Button>
                  </div>
                  <div className="space-y-5">
                    <FormField label="Job title">
                      <Input
                        className="h-12 rounded-xl px-4"
                        value={experience.role}
                        onChange={(event) =>
                          updateExperience(experience.id, {
                            role: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Company or project name">
                      <Input
                        className="h-12 rounded-xl px-4"
                        value={experience.organization}
                        onChange={(event) =>
                          updateExperience(experience.id, {
                            organization: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <FormField label="Company or project link">
                      <Input
                        className="h-12 rounded-xl px-4"
                        type="url"
                        value={experience.url ?? ""}
                        placeholder="https://company.com"
                        onChange={(event) =>
                          updateExperience(experience.id, {
                            url: event.target.value,
                          })
                        }
                      />
                    </FormField>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <DateField
                        label="Start date"
                        value={experience.startDate}
                        onChange={(startDate) =>
                          updateExperience(experience.id, { startDate })
                        }
                      />
                      <DateField
                        label="End date"
                        value={experience.endDate}
                        allowPresent
                        onChange={(endDate) =>
                          updateExperience(experience.id, { endDate })
                        }
                      />
                    </div>
                    <FormField label="Accomplishments">
                      <FormattingTextarea
                        value={
                          highlightsText[experience.id] ??
                          [
                            experience.description,
                            ...experience.bullets.map(
                              (bullet) => `• ${bullet}`
                            ),
                          ]
                            .filter(Boolean)
                            .join("\n")
                        }
                        placeholder="Describe your accomplishments"
                        rows={4}
                        onChange={(value) => {
                          setHighlightsText((current) => ({
                            ...current,
                            [experience.id]: value,
                          }))
                          const lines = value.split("\n")
                          updateExperience(experience.id, {
                            description: lines
                              .filter((line) => !line.startsWith("• "))
                              .join("\n")
                              .trim(),
                            bullets: lines
                              .filter((line) => line.startsWith("• "))
                              .map((line) => line.slice(2).trim())
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
            orderClass="order-4"
            onOpen={() => setActiveSection("education")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("education")}
          >
            <div className="mb-5">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-dashed bg-transparent text-base font-medium"
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
                  className="space-y-5 border-b pb-8 last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${education.degree}`}
                      onClick={() =>
                        updateContent({
                          education: content.education.filter(
                            (item) => item.id !== education.id
                          ),
                        })
                      }
                    >
                      Delete <Trash2 data-icon="inline-end" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="sr-only">University/School</span>
                      <Input
                        className="h-12 rounded-xl px-4"
                        value={education.institution}
                        placeholder="University/School"
                        onChange={(event) =>
                          updateEducation(education.id, {
                            institution: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Degree</span>
                      <Input
                        className="h-12 rounded-xl px-4"
                        value={education.degree}
                        placeholder="Degree (e.g. Bachelor's degree, High school diploma)"
                        onChange={(event) =>
                          updateEducation(education.id, {
                            degree: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Field of Study</span>
                      <Input
                        className="h-12 rounded-xl px-4"
                        value={education.fieldOfStudy ?? ""}
                        placeholder="Field of Study"
                        onChange={(event) =>
                          updateEducation(education.id, {
                            fieldOfStudy: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Relevant URL (Optional)</span>
                      <Input
                        className="h-12 rounded-xl px-4"
                        type="url"
                        value={education.url ?? ""}
                        placeholder="Relevant URL (Optional)"
                        onChange={(event) =>
                          updateEducation(education.id, {
                            url: event.target.value,
                          })
                        }
                      />
                    </label>
                    <div className="grid gap-4 pt-1 sm:grid-cols-2">
                      <DateField
                        label="Start date"
                        value={education.startDate}
                        onChange={(startDate) =>
                          updateEducation(education.id, { startDate })
                        }
                      />
                      <DateField
                        label="End date"
                        value={education.endDate}
                        allowPresent
                        onChange={(endDate) =>
                          updateEducation(education.id, { endDate })
                        }
                      />
                    </div>
                    <label className="block">
                      <span className="sr-only">Achievements</span>
                      <FormattingTextarea
                        value={education.details}
                        placeholder="Achievements"
                        rows={6}
                        onChange={(details) =>
                          updateEducation(education.id, {
                            details,
                          })
                        }
                      />
                    </label>
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
            orderClass="order-5"
            onOpen={() => setActiveSection("skills")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("skills")}
          >
            <div>
              <FormattingTextarea
                value={skillsText}
                placeholder="Add skills, then use the list button for bullets"
                rows={6}
                onChange={(value) => {
                  setSkillsText(value)
                  updateContent({
                    skills: value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }}
              />
            </div>
          </EditorSection>

          <EditorSection
            section="languages"
            title="Languages"
            icon={<Languages className="size-5" />}
            activeSection={activeSection}
            visible={sectionIsVisible("languages")}
            orderClass="order-6"
            onOpen={() => setActiveSection("languages")}
            onBack={() => setActiveSection(null)}
            onToggleVisibility={() => toggleSectionVisibility("languages")}
          >
            <div className="mb-7">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-dashed bg-transparent text-base"
                onClick={() =>
                  updateContent({
                    languages: [...content.languages, blankLanguage()],
                  })
                }
              >
                <Plus data-icon="inline-start" /> Add
              </Button>
            </div>

            <div className="space-y-4">
              {content.languages.length === 0 && (
                <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                  Add the languages you can use and your proficiency level.
                </p>
              )}
              {content.languages.map((language) => (
                <div
                  key={language.id}
                  className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                >
                  <FormField label="Language">
                    <Input
                      value={language.language}
                      placeholder="Language"
                      maxLength={200}
                      onChange={(event) =>
                        updateLanguage(language.id, {
                          language: event.target.value,
                        })
                      }
                    />
                  </FormField>
                  <div className="space-y-2">
                    <Label htmlFor={`language-proficiency-${language.id}`}>
                      Proficiency
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        id={`language-proficiency-${language.id}`}
                        className="group flex h-10 w-full items-center justify-between rounded-xl border border-border/70 bg-background px-3.5 text-sm font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,background-color,box-shadow] outline-none hover:border-foreground/20 hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:border-ring/70 data-popup-open:bg-muted/50 data-popup-open:ring-3 data-popup-open:ring-ring/20"
                      >
                        <span className="truncate">{language.proficiency}</span>
                        <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-popup-open:rotate-180" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        sideOffset={8}
                        className="min-w-(--anchor-width) rounded-2xl border border-border/60 bg-popover/98 p-2 shadow-[0_16px_45px_rgba(15,23,42,0.14)] ring-0 backdrop-blur-xl"
                      >
                        <DropdownMenuRadioGroup
                          value={language.proficiency}
                          onValueChange={(proficiency) =>
                            updateLanguage(language.id, {
                              proficiency:
                                proficiency as Language["proficiency"],
                            })
                          }
                        >
                          {languageProficiencies.map((proficiency) => (
                            <DropdownMenuRadioItem
                              key={proficiency}
                              value={proficiency}
                              className="min-h-10 rounded-xl px-3.5 py-2.5 font-normal transition-colors focus:bg-muted focus:text-foreground focus:**:text-foreground data-checked:bg-primary/10 data-checked:font-medium data-checked:text-primary"
                            >
                              {proficiency}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${language.language || "language"}`}
                    onClick={() =>
                      updateContent({
                        languages: content.languages.filter(
                          (item) => item.id !== language.id
                        ),
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </EditorSection>
        </div>

        <aside className="min-w-0 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Live preview
          </p>
          <div className="preview-scroll flex min-h-[calc(100dvh-9.75rem)] justify-center overflow-auto rounded-2xl border bg-slate-200 p-4 shadow-sm sm:p-6 lg:min-h-0 lg:flex-1 dark:bg-slate-900">
            <CvPreview content={content} />
          </div>
        </aside>
      </main>
    </div>
  )
}
