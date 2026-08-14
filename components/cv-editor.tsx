"use client"

import {
  ArrowLeft,
  AlignLeft,
  Bold,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
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
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Underline,
  UserRound,
  LayoutGrid,
} from "lucide-react"
import Link from "next/link"
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"

import { CvPreview } from "@/components/cv-preview"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
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
  CustomSection,
  CustomSectionItem,
  Education,
  Experience,
  Language,
} from "@/lib/cv-schema"
import { defaultSectionOrder } from "@/lib/cv-schema"
import type { Translator } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type SaveState = "idle" | "saving" | "saved" | "error"
type SectionKey =
  "personal" | "summary" | "experience" | "education" | "skills" | "languages"
type MobileView = "edit" | "preview"

const languageProficiencies: Language["proficiency"][] = [
  "Not Rated",
  "Beginner",
  "Basic",
  "Intermediate",
  "Upper-intermediate",
  "Advanced",
  "Fluent",
  "Native",
]

const BUILT_IN_SECTIONS = new Set([
  "personal",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
])

// ─── Resizable Split ──────────────────────────────────────────────

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const handleRef = useRef<HTMLDivElement>(null)

  function handlePointerDown(event: React.PointerEvent) {
    event.preventDefault()
    const startX = event.clientX
    const pointerId = event.pointerId
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture(pointerId)

    function onPointerMove(moveEvent: PointerEvent) {
      onResize(moveEvent.clientX - startX)
    }

    function onPointerUp() {
      target.releasePointerCapture(pointerId)
      target.removeEventListener("pointermove", onPointerMove)
      target.removeEventListener("pointerup", onPointerUp)
    }

    target.addEventListener("pointermove", onPointerMove)
    target.addEventListener("pointerup", onPointerUp)
  }

  return (
    <div
      ref={handleRef}
      onPointerDown={handlePointerDown}
      className="hidden w-2 cursor-col-resize touch-none items-center justify-center transition-colors select-none hover:bg-primary/10 active:bg-primary/20 lg:flex"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panels"
    >
      <div className="h-8 w-0.5 rounded-full bg-border" />
    </div>
  )
}

// ─── Rich-text editor ──────────────────────────────────────────────

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function inlineMarkdownToHtml(value: string) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<u>$1</u>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
}

function markdownToEditorHtml(value: string) {
  const lines = value.split("\n")
  const html: string[] = []
  let bullets: string[] = []

  function flushBullets() {
    if (!bullets.length) return
    html.push(
      `<ul>${bullets.map((line) => `<li>${inlineMarkdownToHtml(line)}</li>`).join("")}</ul>`
    )
    bullets = []
  }

  for (const line of lines) {
    if (line.startsWith("• ")) {
      bullets.push(line.slice(2))
    } else {
      flushBullets()
      html.push(
        line ? `<div>${inlineMarkdownToHtml(line)}</div>` : "<div><br></div>"
      )
    }
  }
  flushBullets()
  return html.join("")
}

function editorNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
  if (!(node instanceof HTMLElement)) return ""

  const content = Array.from(node.childNodes).map(editorNodeToMarkdown).join("")
  switch (node.tagName) {
    case "STRONG":
    case "B":
      return `**${content}**`
    case "EM":
    case "I":
      return `*${content}*`
    case "U":
      return `__${content}__`
    case "A": {
      const href = node.getAttribute("href")
      return href ? `[${content}](${href})` : content
    }
    case "LI":
      return `• ${content}\n`
    case "DIV":
    case "P":
      return `${content}\n`
    case "BR":
      return "\n"
    default:
      return content
  }
}

function editorToMarkdown(editor: HTMLElement) {
  return Array.from(editor.childNodes)
    .map(editorNodeToMarkdown)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n$/, "")
}

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
  const ref = useRef<HTMLDivElement>(null)
  const [initialHtml] = useState(() => markdownToEditorHtml(value))
  const lastValueRef = useRef(value)
  const selectionRef = useRef<Range | null>(null)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  })
  const { t } = useLanguage()

  const setEditorRef = useCallback(
    (editor: HTMLDivElement | null) => {
      ref.current = editor
      if (editor) editor.innerHTML = initialHtml
    },
    [initialHtml]
  )

  useEffect(() => {
    const editor = ref.current
    if (!editor || value === lastValueRef.current) return
    editor.innerHTML = markdownToEditorHtml(value)
    lastValueRef.current = value
  }, [value])

  function updateActiveFormats() {
    const editor = ref.current
    const selection = window.getSelection()
    if (
      !editor ||
      !selection?.anchorNode ||
      !editor.contains(selection.anchorNode)
    )
      return
    if (selection.rangeCount)
      selectionRef.current = selection.getRangeAt(0).cloneRange()
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      list: document.queryCommandState("insertUnorderedList"),
    })
  }

  function emitChange() {
    const editor = ref.current
    if (!editor) return
    const next = editorToMarkdown(editor)
    lastValueRef.current = next
    onChange(next)
    updateActiveFormats()
  }

  function runCommand(command: string, commandValue?: string) {
    const editor = ref.current
    if (!editor) return
    const selection = window.getSelection()
    const selectionIsInEditor = Boolean(
      selection?.anchorNode && editor.contains(selection.anchorNode)
    )

    if (!selectionIsInEditor) {
      editor.focus()
    }
    if (!selectionIsInEditor && selectionRef.current) {
      selection?.removeAllRanges()
      selection?.addRange(selectionRef.current)
    }
    document.execCommand(command, false, commandValue)
    emitChange()
  }

  function addLink() {
    const url = window.prompt(t("Enter link URL"), "https://")
    if (url && /^https?:\/\//i.test(url)) runCommand("createLink", url)
  }

  const toolClass =
    "size-9 rounded-lg data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"

  return (
    <div className="overflow-hidden rounded-xl bg-input/50 focus-within:ring-3 focus-within:ring-ring/30">
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          data-active={activeFormats.bold}
          aria-pressed={activeFormats.bold}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("bold")}
          aria-label={t("Bold")}
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          data-active={activeFormats.italic}
          aria-pressed={activeFormats.italic}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("italic")}
          aria-label={t("Italic")}
        >
          <Italic />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          data-active={activeFormats.underline}
          aria-pressed={activeFormats.underline}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("underline")}
          aria-label={t("Underline")}
        >
          <Underline />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={addLink}
          aria-label={t("Add link")}
        >
          <Link2 />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          data-active={activeFormats.list}
          aria-pressed={activeFormats.list}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("insertUnorderedList")}
          aria-label={t("Toggle bullet list")}
        >
          <ListIcon />
        </Button>
        <span className="mx-1 h-6 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolClass}
          aria-label={t("Align left")}
          disabled
        >
          <AlignLeft />
        </Button>
      </div>
      <div
        ref={setEditorRef}
        className="min-h-36 resize-y overflow-auto bg-transparent px-4 py-4 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        style={{ minHeight: `${Math.max(rows, 6) * 1.5}rem` }}
        onInput={emitChange}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onFocus={updateActiveFormats}
      />
    </div>
  )
}

// ─── Form helpers ──────────────────────────────────────────────────

function FormField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  const { t } = useLanguage()
  const id = useId()
  const control = isValidElement<{ id?: string }>(children)
    ? cloneElement(children, { id })
    : children

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{t(label)}</Label>
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
  completion,
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
  completion: number
  orderClass: string
  onOpen: () => void
  onBack: () => void
  onToggleVisibility: () => void
}) {
  const { t } = useLanguage()
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
              {t(title)}
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground tabular-nums">
              {completion}%
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={t(
              visible ? "Hide {{section}} in CV" : "Show {{section}} in CV",
              { section: t(title) }
            )}
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
            aria-label={t("Edit {{title}}", { title: t(title) })}
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
          aria-label={t("Back to sections")}
        >
          <ArrowLeft />
        </Button>
        <h2 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">
          {t(title)}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleVisibility}
          aria-label={t(
            visible ? "Hide {{section}} in CV" : "Show {{section}} in CV",
            { section: t(title) }
          )}
          aria-pressed={!visible}
        >
          {visible ? <Eye /> : <EyeOff />}
        </Button>
      </header>
      <div className="pb-6">{children}</div>
    </section>
  )
}

// ─── Custom Section Editor ─────────────────────────────────────────

function CustomSectionEditor({
  section,
  onUpdate,
  onDelete,
}: {
  section: CustomSection
  onUpdate: (patch: Partial<CustomSection>) => void
  onDelete: () => void
}) {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)

  function updateItem(itemId: string, patch: Partial<CustomSectionItem>) {
    onUpdate({
      items: section.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      ),
    })
  }

  function addItem() {
    onUpdate({
      items: [
        ...section.items,
        {
          id: crypto.randomUUID(),
          title: t("New item"),
          subtitle: "",
          description: "",
          bullets: [],
        },
      ],
    })
  }

  function removeItem(itemId: string) {
    onUpdate({
      items: section.items.filter((item) => item.id !== itemId),
    })
  }

  if (!isExpanded) {
    return (
      <section className="border-b last:border-b-0">
        <div className="flex min-h-19 items-center gap-3 py-4">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span className="flex size-9 shrink-0 items-center justify-center text-foreground">
              <LayoutGrid className="size-5" />
            </span>
            <span className="min-w-0 flex-1 text-lg font-medium tracking-tight">
              {section.title}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({section.items.length})
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={t("Remove {{section}}", {
              section: section.title,
            })}
          >
            <Trash2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={t("Edit {{title}}", { title: section.title })}
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
          onClick={() => setIsExpanded(false)}
          aria-label={t("Back to sections")}
        >
          <ArrowLeft />
        </Button>
        <Input
          value={section.title}
          onChange={(event) => {
            onUpdate({ title: event.target.value })
          }}
          className="min-w-0 flex-1 border-none bg-transparent text-2xl font-semibold tracking-tight"
          aria-label={t("Section title")}
          maxLength={100}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label={t("Remove section")}
        >
          <Trash2 />
        </Button>
      </header>

      <div className="mb-5">
        <Button
          variant="outline"
          className="h-12 w-full rounded-xl border-dashed bg-transparent text-base"
          onClick={addItem}
        >
          <Plus data-icon="inline-start" /> {t("Add item")}
        </Button>
      </div>

      <div className="space-y-8">
        {section.items.map((item) => (
          <div
            key={item.id}
            className="space-y-5 border-b pb-8 last:border-b-0 last:pb-0"
          >
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label={t("Remove {{item}}", { item: item.title })}
                onClick={() => removeItem(item.id)}
              >
                {t("Delete")} <Trash2 data-icon="inline-end" />
              </Button>
            </div>
            <div className="space-y-4">
              <FormField label="Title">
                <Input
                  className="h-12 rounded-xl px-4"
                  value={item.title}
                  onChange={(event) =>
                    updateItem(item.id, { title: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Subtitle">
                <Input
                  className="h-12 rounded-xl px-4"
                  value={item.subtitle ?? ""}
                  placeholder={t("Subtitle")}
                  onChange={(event) =>
                    updateItem(item.id, { subtitle: event.target.value })
                  }
                />
              </FormField>
              <FormField label="URL">
                <Input
                  className="h-12 rounded-xl px-4"
                  type="url"
                  value={item.url ?? ""}
                  placeholder="https://..."
                  onChange={(event) =>
                    updateItem(item.id, { url: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Description">
                <FormattingTextarea
                  value={item.description ?? ""}
                  placeholder={t("Description")}
                  rows={4}
                  onChange={(description) =>
                    updateItem(item.id, { description })
                  }
                />
              </FormField>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Date helpers ──────────────────────────────────────────────────

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
  const { t } = useLanguage()
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
      <Label htmlFor={id}>{t(label)}</Label>
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
          aria-label={`${t(label)}, MM/YYYY`}
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
            {t("Present")}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Blank templates ───────────────────────────────────────────────

function blankExperience(t: Translator): Experience {
  return {
    id: crypto.randomUUID(),
    role: t("New role"),
    organization: t("Organization"),
    url: "",
    startDate: "",
    endDate: "",
    description: "",
    bullets: [],
  }
}

function blankEducation(t: Translator): Education {
  return {
    id: crypto.randomUUID(),
    degree: t("Degree or programme"),
    institution: t("Institution"),
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

// ─── Auto-Save Hook ────────────────────────────────────────────────

const AUTO_SAVE_DELAY = 1500

function useAutoSave(
  initialCvId: string,
  getPayload: () => { title: string; content: CvContent },
  onSaveStateChange: (state: SaveState, message?: string) => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revisionRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const scheduleAutoSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    revisionRef.current += 1
    const capturedRevision = revisionRef.current

    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return
      onSaveStateChange("saving")

      try {
        const payload = getPayload()
        const response = await fetch(`/api/cvs/${initialCvId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = (await response.json().catch(() => ({}))) as {
          error?: string
        }

        if (!isMountedRef.current) return

        if (!response.ok) {
          onSaveStateChange(
            "error",
            data.error ?? "Could not save your changes."
          )
          return
        }

        if (capturedRevision === revisionRef.current) {
          onSaveStateChange("saved")
        } else {
          onSaveStateChange("idle")
        }
      } catch {
        if (!isMountedRef.current) return
        onSaveStateChange(
          "error",
          "Could not connect to the server. Try saving again."
        )
      }
    }, AUTO_SAVE_DELAY)
  }, [initialCvId, getPayload, onSaveStateChange])

  const flushNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    onSaveStateChange("saving")
    try {
      const payload = getPayload()
      const response = await fetch(`/api/cvs/${initialCvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
      }

      if (!response.ok) {
        onSaveStateChange("error", data.error ?? "Could not save your changes.")
        return false
      }
      onSaveStateChange("saved")
      return true
    } catch {
      onSaveStateChange(
        "error",
        "Could not connect to the server. Try saving again."
      )
      return false
    }
  }, [initialCvId, getPayload, onSaveStateChange])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { scheduleAutoSave, flushNow, cancel }
}

// ─── Section Icon Map ──────────────────────────────────────────────

const sectionIcons: Record<string, React.ReactNode> = {
  personal: <UserRound className="size-5" />,
  summary: <List className="size-5" />,
  experience: <BriefcaseBusiness className="size-5" />,
  education: <GraduationCap className="size-5" />,
  skills: <Sparkles className="size-5" />,
  languages: <Languages className="size-5" />,
}

function percentage(values: boolean[]) {
  if (values.length === 0) return 0
  return Math.round((values.filter(Boolean).length / values.length) * 100)
}

function sectionCompletion(content: CvContent, section: SectionKey) {
  switch (section) {
    case "personal":
      return percentage([
        Boolean(content.name.trim()),
        Boolean(content.contact.email.trim()),
        Boolean(content.contact.phone.trim()),
      ])
    case "summary":
      return content.summary.trim() ? 100 : 0
    case "experience":
      return percentage(
        content.experiences.flatMap((experience) => [
          Boolean(experience.role.trim()),
          Boolean(experience.organization.trim()),
          Boolean(experience.startDate.trim()),
          Boolean(experience.endDate.trim()),
        ])
      )
    case "education":
      return percentage(
        content.education.flatMap((education) => [
          Boolean(education.degree.trim()),
          Boolean(education.institution.trim()),
          Boolean(education.startDate.trim()),
          Boolean(education.endDate.trim()),
        ])
      )
    case "skills":
      return content.skills.some((skill) => skill.trim()) ? 100 : 0
    case "languages":
      return percentage(
        content.languages.flatMap((language) => [
          Boolean(language.language.trim()),
          language.proficiency !== "Not Rated",
        ])
      )
  }
}

// ─── Main Editor ──────────────────────────────────────────────────

export function CvEditor({ initialCv }: { initialCv: CvRecord }) {
  const { t } = useLanguage()
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
  const [mobileView, setMobileView] = useState<MobileView>("edit")
  const [fitMobilePreview, setFitMobilePreview] = useState(false)
  const [splitPercent, setSplitPercent] = useState(36)
  const containerRef = useRef<HTMLDivElement>(null)

  // Content & title refs for auto-save closure
  const contentRef = useRef(content)
  const titleRef = useRef(title)

  useEffect(() => {
    contentRef.current = content
  }, [content])

  useEffect(() => {
    titleRef.current = title
  }, [title])

  const getPayload = useCallback(
    () => ({
      title: titleRef.current,
      content: contentRef.current,
    }),
    []
  )

  const handleSaveStateChange = useCallback(
    (state: SaveState, msg?: string) => {
      setSaveState(state)
      if (msg) setMessage(t(msg))
      if (state === "saved") {
        isDirtyRef.current = false
        setIsDirty(false)
        setMessage("")
        if (
          hasHistoryGuard.current &&
          window.history.state?.cvEditorUnsavedGuard
        ) {
          hasHistoryGuard.current = false
          window.history.back()
        }
      }
    },
    [t]
  )

  const {
    scheduleAutoSave,
    flushNow,
    cancel: cancelAutoSave,
  } = useAutoSave(initialCv.id, getPayload, handleSaveStateChange)

  // Ensure sectionOrder exists (backward compatibility)
  const sectionOrder = content.sectionOrder ?? [...defaultSectionOrder]

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return

      event.preventDefault()
      event.returnValue = true
    }

    function blockBackNavigation() {
      if (!isDirtyRef.current || !hasHistoryGuard.current) return

      window.history.forward()
      setMessage(t("Save your changes before leaving."))
    }

    window.addEventListener("beforeunload", warnBeforeUnload)
    window.addEventListener("popstate", blockBackNavigation)

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload)
      window.removeEventListener("popstate", blockBackNavigation)
      cancelAutoSave()
    }
  }, [t, cancelAutoSave])

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

    // Trigger auto-save
    scheduleAutoSave()
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

  function updateCustomSection(
    sectionId: string,
    patch: Partial<CustomSection>
  ) {
    updateContent({
      customSections: (content.customSections ?? []).map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    })
  }

  function removeCustomSection(sectionId: string) {
    updateContent({
      customSections: (content.customSections ?? []).filter(
        (section) => section.id !== sectionId
      ),
      sectionOrder: sectionOrder.filter((id) => id !== sectionId),
    })
  }

  async function save() {
    const saved = await flushNow()
    if (saved) {
      isDirtyRef.current = false
      setIsDirty(false)
    }
  }

  // Build ordered section list for rendering
  function renderSections() {
    return sectionOrder.map((sectionId, orderIndex) => {
      if (BUILT_IN_SECTIONS.has(sectionId)) {
        const key = sectionId as SectionKey

        switch (key) {
          case "personal":
            return (
              <EditorSection
                key={key}
                section="personal"
                title="Personal details"
                icon={sectionIcons.personal}
                activeSection={activeSection}
                visible={sectionIsVisible("personal")}
                completion={sectionCompletion(content, "personal")}
                orderClass={`order-[${orderIndex}]`}
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
            )
          case "summary":
            return (
              <EditorSection
                key={key}
                section="summary"
                title="Summary"
                icon={sectionIcons.summary}
                activeSection={activeSection}
                visible={sectionIsVisible("summary")}
                completion={sectionCompletion(content, "summary")}
                orderClass={`order-[${orderIndex}]`}
                onOpen={() => setActiveSection("summary")}
                onBack={() => setActiveSection(null)}
                onToggleVisibility={() => toggleSectionVisibility("summary")}
              >
                <div>
                  <Textarea
                    aria-label={t("Summary")}
                    value={content.summary}
                    onChange={(event) =>
                      updateContent({ summary: event.target.value })
                    }
                    placeholder={t(
                      "Write a concise profile focused on the role you want."
                    )}
                    rows={5}
                    maxLength={2000}
                  />
                </div>
              </EditorSection>
            )
          case "experience":
            return (
              <EditorSection
                key={key}
                section="experience"
                title="Experience"
                icon={sectionIcons.experience}
                activeSection={activeSection}
                visible={sectionIsVisible("experience")}
                completion={sectionCompletion(content, "experience")}
                orderClass={`order-[${orderIndex}]`}
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
                        experiences: [
                          ...content.experiences,
                          blankExperience(t),
                        ],
                      })
                    }
                  >
                    <Plus data-icon="inline-start" /> {t("Add Experience")}
                  </Button>
                </div>
                <div className="space-y-8">
                  {content.experiences.length === 0 && (
                    <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                      {t(
                        "Add internships, employment, freelance work, or substantial projects."
                      )}
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
                          aria-label={t("Remove {{item}}", {
                            item: experience.role,
                          })}
                          onClick={() =>
                            updateContent({
                              experiences: content.experiences.filter(
                                (item) => item.id !== experience.id
                              ),
                            })
                          }
                        >
                          {t("Delete")} <Trash2 data-icon="inline-end" />
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
                            placeholder={t("Describe your accomplishments")}
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
            )
          case "education":
            return (
              <EditorSection
                key={key}
                section="education"
                title="Education"
                icon={sectionIcons.education}
                activeSection={activeSection}
                visible={sectionIsVisible("education")}
                completion={sectionCompletion(content, "education")}
                orderClass={`order-[${orderIndex}]`}
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
                        education: [...content.education, blankEducation(t)],
                      })
                    }
                  >
                    <Plus data-icon="inline-start" /> {t("Add education")}
                  </Button>
                </div>
                <div className="space-y-4">
                  {content.education.length === 0 && (
                    <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                      {t(
                        "Add your university, school, certification, or other relevant study."
                      )}
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
                          aria-label={t("Remove {{item}}", {
                            item: education.degree,
                          })}
                          onClick={() =>
                            updateContent({
                              education: content.education.filter(
                                (item) => item.id !== education.id
                              ),
                            })
                          }
                        >
                          {t("Delete")} <Trash2 data-icon="inline-end" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <label className="block">
                          <span className="sr-only">
                            {t("University/School")}
                          </span>
                          <Input
                            className="h-12 rounded-xl px-4"
                            value={education.institution}
                            placeholder={t("University/School")}
                            onChange={(event) =>
                              updateEducation(education.id, {
                                institution: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="sr-only">{t("Degree")}</span>
                          <Input
                            className="h-12 rounded-xl px-4"
                            value={education.degree}
                            placeholder={t(
                              "Degree (e.g. Bachelor's degree, High school diploma)"
                            )}
                            onChange={(event) =>
                              updateEducation(education.id, {
                                degree: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="sr-only">{t("Field of Study")}</span>
                          <Input
                            className="h-12 rounded-xl px-4"
                            value={education.fieldOfStudy ?? ""}
                            placeholder={t("Field of Study")}
                            onChange={(event) =>
                              updateEducation(education.id, {
                                fieldOfStudy: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="sr-only">
                            {t("Relevant URL (Optional)")}
                          </span>
                          <Input
                            className="h-12 rounded-xl px-4"
                            type="url"
                            value={education.url ?? ""}
                            placeholder={t("Relevant URL (Optional)")}
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
                          <span className="sr-only">{t("Achievements")}</span>
                          <FormattingTextarea
                            value={education.details}
                            placeholder={t("Achievements")}
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
            )
          case "skills":
            return (
              <EditorSection
                key={key}
                section="skills"
                title="Skills"
                icon={sectionIcons.skills}
                activeSection={activeSection}
                visible={sectionIsVisible("skills")}
                completion={sectionCompletion(content, "skills")}
                orderClass={`order-[${orderIndex}]`}
                onOpen={() => setActiveSection("skills")}
                onBack={() => setActiveSection(null)}
                onToggleVisibility={() => toggleSectionVisibility("skills")}
              >
                <div>
                  <FormattingTextarea
                    value={skillsText}
                    placeholder={t(
                      "Add skills, then use the list button for bullets"
                    )}
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
            )
          case "languages":
            return (
              <EditorSection
                key={key}
                section="languages"
                title="Languages"
                icon={sectionIcons.languages}
                activeSection={activeSection}
                visible={sectionIsVisible("languages")}
                completion={sectionCompletion(content, "languages")}
                orderClass={`order-[${orderIndex}]`}
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
                    <Plus data-icon="inline-start" /> {t("Add")}
                  </Button>
                </div>

                <div className="space-y-4">
                  {content.languages.length === 0 && (
                    <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                      {t(
                        "Add the languages you can use and your proficiency level."
                      )}
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
                          placeholder={t("Language")}
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
                          {t("Proficiency")}
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            id={`language-proficiency-${language.id}`}
                            className="group flex h-10 w-full items-center justify-between rounded-xl border border-border/70 bg-background px-3.5 text-sm font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,background-color,box-shadow] outline-none hover:border-foreground/20 hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:border-ring/70 data-popup-open:bg-muted/50 data-popup-open:ring-3 data-popup-open:ring-ring/20"
                          >
                            <span className="truncate">
                              {t(language.proficiency)}
                            </span>
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
                                  closeOnClick
                                  className="min-h-10 rounded-xl px-3.5 py-2.5 font-normal transition-colors focus:bg-muted focus:text-foreground focus:**:text-foreground data-checked:bg-primary/10 data-checked:font-medium data-checked:text-primary"
                                >
                                  {t(proficiency)}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("Remove {{language}}", {
                          language: language.language || t("language"),
                        })}
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
            )
          default:
            return null
        }
      }

      // Custom sections
      const customSection = (content.customSections ?? []).find(
        (s) => s.id === sectionId
      )
      if (!customSection) return null

      // Don't render custom sections when a built-in section is active
      if (activeSection) return null

      return (
        <CustomSectionEditor
          key={customSection.id}
          section={customSection}
          onUpdate={(patch) => updateCustomSection(customSection.id, patch)}
          onDelete={() => removeCustomSection(customSection.id)}
        />
      )
    })
  }

  const saveStatusText =
    saveState === "saved"
      ? t("All changes saved")
      : saveState === "saving"
        ? t("Auto-saving")
        : saveState === "error"
          ? message || t("Save failed")
          : isDirty
            ? message || t("Unsaved changes")
            : t("All changes saved")

  return (
    <div className="min-h-[100dvh] bg-muted/40">
      {/* ─── Top Header Bar ─── */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
        <div className="flex min-h-16 w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              href="/dashboard"
              aria-label={t("Back to dashboard")}
              aria-disabled={isDirty}
              onNavigate={(event) => {
                if (!isDirty) return

                event.preventDefault()
                setMessage(t("Save your changes before leaving."))
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
              aria-label={t("CV title")}
              maxLength={100}
              className="max-w-md min-w-0 bg-transparent text-base font-semibold"
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden text-xs sm:inline",
                saveState === "error"
                  ? "text-destructive"
                  : saveState === "saving"
                    ? "animate-pulse text-muted-foreground"
                    : "text-muted-foreground"
              )}
              role="status"
            >
              {saveStatusText}
            </span>
            <LanguageToggle />
            <Link
              href={`/cvs/${initialCv.id}/preview`}
              aria-disabled={isDirty}
              onNavigate={(event) => {
                if (!isDirty) return

                event.preventDefault()
                setMessage(t("Save your changes before leaving."))
              }}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden lg:inline-flex",
                isDirty && "cursor-not-allowed opacity-60"
              )}
            >
              <Eye data-icon="inline-start" />
              {t("Preview")}
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
              {t(saveState === "saving" ? "Saving" : "Save")}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <main
        ref={containerRef}
        className="grid w-full gap-4 p-4 sm:gap-6 sm:p-6 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[var(--editor-width)_auto_minmax(0,1fr)] lg:items-stretch lg:overflow-hidden"
        style={
          {
            "--editor-width": `${splitPercent}%`,
          } as React.CSSProperties
        }
      >
        {/* ─── Editor Pane ─── */}
        <div
          className={cn(
            "editor-scroll flex flex-col self-start overflow-hidden rounded-2xl border bg-background px-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:px-7 lg:h-full lg:self-stretch lg:overflow-y-auto",
            mobileView !== "edit" && "hidden lg:flex"
          )}
        >
          {renderSections()}
        </div>

        {/* ─── Mobile Preview Pane ─── */}
        <div className="lg:hidden">
          {mobileView === "preview" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("Live preview")}
                </p>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/cvs/${initialCv.id}/preview`}
                    aria-disabled={isDirty}
                    onNavigate={(event) => {
                      if (!isDirty) return
                      event.preventDefault()
                      setMessage(t("Save your changes before leaving."))
                    }}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      isDirty && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <Download data-icon="inline-start" />
                    {t("Download")}
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFitMobilePreview((current) => !current)}
                    aria-pressed={fitMobilePreview}
                  >
                    {fitMobilePreview ? (
                      <Maximize2 data-icon="inline-start" />
                    ) : (
                      <Minimize2 data-icon="inline-start" />
                    )}
                    {t(fitMobilePreview ? "Readable size" : "Fit page")}
                  </Button>
                </div>
              </div>
              <div
                className={cn(
                  "preview-scroll flex min-h-[calc(100dvh-9.75rem)] overflow-auto rounded-2xl border bg-slate-200 p-4 shadow-sm sm:p-6 dark:bg-slate-900",
                  fitMobilePreview && "justify-center"
                )}
              >
                <div
                  className={cn("w-full", !fitMobilePreview && "min-w-[40rem]")}
                >
                  <CvPreview content={content} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Resize Handle (Desktop only) ─── */}
        <ResizeHandle
          onResize={(delta) => {
            if (!containerRef.current) return
            const containerWidth = containerRef.current.offsetWidth
            const newPercent = splitPercent + (delta / containerWidth) * 100
            setSplitPercent(Math.max(25, Math.min(60, newPercent)))
          }}
        />

        {/* ─── Desktop Preview Pane ─── */}
        <aside className="hidden min-w-0 lg:flex lg:h-full lg:flex-col lg:overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {t("Live preview")}
            </p>
          </div>
          <div className="preview-scroll flex min-h-0 flex-1 justify-center overflow-auto rounded-2xl border bg-slate-200 p-4 shadow-sm sm:p-6 dark:bg-slate-900">
            <CvPreview content={content} />
          </div>
        </aside>
      </main>

      {/* ─── Mobile Toggle Bar ─── */}
      <div className="fixed right-0 bottom-0 left-0 z-30 flex border-t bg-background/95 backdrop-blur lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setMobileView("edit")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors",
            mobileView === "edit"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Pencil className="size-4" />
          {t("Edit form")}
        </button>
        <div className="my-2.5 w-px bg-border" />
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors",
            mobileView === "preview"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye className="size-4" />
          {t("Preview")}
        </button>
      </div>
    </div>
  )
}
