"use client"

import {
  AlertCircle,
  Check,
  ChevronDown,
  CircleAlert,
  Info,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ATS_SCORING_VERSION,
  detailedBreakdown,
  type AtsCategoryResult,
  type AtsDetailedBreakdown,
  type AtsSeverity,
} from "@/lib/ats-scoring"
import type { CvContent } from "@/lib/cv-schema"
import { cn } from "@/lib/utils"

type InteractiveProps = {
  mode: "interactive"
  content: CvContent
  onRecheck: () => Promise<boolean>
  className?: string
}

type ReadOnlyProps = {
  mode: "readonly"
  score: number
  breakdown: AtsCategoryResult[]
  scoredAt: string
  scoringVersion: number
  className?: string
}

type Props = InteractiveProps | ReadOnlyProps

const categoryLabels: Record<string, string> = {
  completeness: "Completeness",
  bulletQuality: "Bullet Quality",
  summaryQuality: "Summary Quality",
  contactValidation: "Contact Validation",
}

function scoreLabel(score: number) {
  if (score < 40) return "Needs work"
  if (score < 70) return "Developing"
  return "Strong"
}

function scoreTone(score: number) {
  if (score < 40) return "text-[oklch(0.55_0.07_50)]"
  if (score < 70) return "text-[var(--chart-1)]"
  return "text-[oklch(0.58_0.1_155)]"
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative size-36" aria-label={`${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={cn("ats-score-ring", scoreTone(score))}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold tabular-nums">
        {score}
      </span>
    </div>
  )
}

function SeverityIcon({ severity }: { severity: AtsSeverity }) {
  if (severity === "critical") return <AlertCircle className="size-3.5" />
  if (severity === "warning") return <CircleAlert className="size-3.5" />
  return <Info className="size-3.5" />
}

function ScoreHeader({ score }: { score: number }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <ScoreRing score={score} />
      <p className={cn("mt-2 text-base font-semibold", scoreTone(score))}>
        {t(scoreLabel(score))}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("CV Quality Score")}
      </p>
    </div>
  )
}

function CategoryBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="ats-category-bar h-full rounded-full bg-primary/70"
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

function InteractivePanel({ content, onRecheck, className }: InteractiveProps) {
  const { t } = useLanguage()
  const [result, setResult] = useState(() => detailedBreakdown(content))
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousContentRef = useRef(content)

  useEffect(() => {
    if (previousContentRef.current === content) return
    previousContentRef.current = content
    updatingTimerRef.current = setTimeout(() => setIsUpdating(true), 0)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setResult(detailedBreakdown(content))
      setIsUpdating(false)
      timerRef.current = null
    }, 2500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (updatingTimerRef.current) clearTimeout(updatingTimerRef.current)
    }
  }, [content])

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    },
    []
  )

  async function recheck() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (updatingTimerRef.current) {
      clearTimeout(updatingTimerRef.current)
      updatingTimerRef.current = null
    }
    setResult(detailedBreakdown(content))
    setIsUpdating(false)
    setIsSaving(true)
    setSaveMessage("")
    const saved = await onRecheck()
    setIsSaving(false)
    setSaveMessage(saved ? "Saved" : "Could not save. Score shown locally.")
    if (saved) {
      savedTimerRef.current = setTimeout(() => setSaveMessage(""), 2000)
    }
  }

  return (
    <section
      className={cn(
        "w-full rounded-2xl border bg-background p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <span
          className={cn(
            "text-xs text-muted-foreground transition-opacity",
            isUpdating ? "opacity-100" : "opacity-0"
          )}
          role="status"
        >
          {t("Updating…")}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={recheck}
          disabled={isSaving}
        >
          {isSaving ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <RefreshCw data-icon="inline-start" />
          )}
          {t(isSaving ? "Rechecking…" : "Recheck")}
        </Button>
      </div>
      {saveMessage && (
        <p
          className={cn(
            "mt-2 text-right text-xs",
            saveMessage === "Saved"
              ? "text-muted-foreground"
              : "text-destructive"
          )}
          role="status"
        >
          {saveMessage === "Saved" && "✓ "}
          {t(saveMessage)}
        </p>
      )}

      <div className={cn("mt-2", isUpdating && "ats-panel-stale")}>
        <ScoreHeader score={result.overall} />
        <div className="mt-5 space-y-3">
          {result.categories.map((item) => (
            <InteractiveCategory key={item.category} category={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function InteractiveCategory({
  category,
}: {
  category: AtsDetailedBreakdown["categories"][number]
}) {
  const { t } = useLanguage()
  return (
    <Card size="sm" className="gap-3 shadow-none ring-border">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">
            {t(categoryLabels[category.category] ?? category.category)}
          </CardTitle>
          <span className="text-sm font-semibold tabular-nums">
            {category.score}
          </span>
        </div>
        <CategoryBar score={category.score} />
      </CardHeader>
      <CardContent>
        <details className="group">
          <summary className="flex list-none items-center justify-between text-xs font-medium text-muted-foreground">
            {t("View checks")}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-3 space-y-2 border-t pt-3">
            {category.checks.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-2 text-xs leading-relaxed",
                  item.severity === "info" && "text-muted-foreground"
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {item.severity === "info" ? (
                    <SeverityIcon severity="info" />
                  ) : item.passed ? (
                    <Check className="size-3.5" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </span>
                <span className={cn(item.passed && "line-through opacity-55")}>
                  {t(item.messageKey)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  )
}

function ReadOnlyPanel({
  score,
  breakdown,
  scoredAt,
  scoringVersion,
  className,
}: ReadOnlyProps) {
  const { locale, t } = useLanguage()
  const date = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(scoredAt))

  return (
    <section
      className={cn(
        "rounded-2xl border bg-background p-5 shadow-sm sm:p-6",
        className
      )}
    >
      <ScoreHeader score={score} />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t("Scored on {{date}}", { date })}
      </p>
      {scoringVersion < ATS_SCORING_VERSION && (
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {t(
            "Scored with an older version. The student's next save will update this score."
          )}
        </p>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {breakdown.map((item) => (
          <Card
            key={item.category}
            size="sm"
            className="gap-3 shadow-none ring-border"
          >
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">
                  {t(categoryLabels[item.category] ?? item.category)}
                </CardTitle>
                <span className="text-sm font-semibold tabular-nums">
                  {item.score}
                </span>
              </div>
              <CategoryBar score={item.score} />
            </CardHeader>
            {item.criticalIssues.length > 0 && (
              <CardContent>
                <ul className="space-y-2 border-t pt-3">
                  {item.criticalIssues.map((issue) => (
                    <li
                      key={issue.id}
                      className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-0.5 shrink-0">
                        <SeverityIcon severity={issue.severity} />
                      </span>
                      {t(issue.messageKey)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </section>
  )
}

export function AtsScorePanel(props: Props) {
  return props.mode === "interactive" ? (
    <InteractivePanel {...props} />
  ) : (
    <ReadOnlyPanel {...props} />
  )
}
