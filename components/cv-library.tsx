"use client"

import { Copy, Download, FileText, Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { CvPreview } from "@/components/cv-preview"
import { useLanguage } from "@/components/language-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CvRecord } from "@/lib/cv-schema"
import { cn } from "@/lib/utils"

const CV_WIDTH = 794
const CV_HEIGHT = 1123

export function CvThumbnail({ cv }: { cv: CvRecord }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.31)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      setScale(Math.min(width / CV_WIDTH, height / CV_HEIGHT))
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative aspect-[210/297] overflow-hidden rounded-xl border bg-slate-100 shadow-[0_8px_30px_rgba(30,41,59,0.08)]"
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: CV_WIDTH,
          height: CV_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <CvPreview content={cv.content} className="max-w-none shadow-none" />
      </div>
    </div>
  )
}

function formatUpdated(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function CvLibrary({ initialCvs }: { initialCvs: CvRecord[] }) {
  const router = useRouter()
  const { locale, t } = useLanguage()
  const [cvs, setCvs] = useState(initialCvs)
  const [pending, setPending] = useState(false)
  const [pendingAction, setPendingAction] = useState("")
  const [error, setError] = useState("")

  async function create() {
    setPending(true)
    setError("")

    const response = await fetch("/api/cvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t("Untitled CV") }),
    })
    const data = (await response.json()) as { cv?: CvRecord; error?: string }

    if (!response.ok || !data.cv) {
      setError(t(data.error ?? "Could not create the CV."))
      setPending(false)
      return
    }

    router.push(`/cvs/${data.cv.id}/edit`)
  }

  async function remove(id: string) {
    setPendingAction(`delete-${id}`)
    setError("")
    const response = await fetch(`/api/cvs/${id}`, { method: "DELETE" })
    if (response.ok) {
      setCvs((items) => items.filter((item) => item.id !== id))
    } else {
      setError(t("Could not delete the CV."))
    }
    setPendingAction("")
  }

  async function duplicate(id: string) {
    setPendingAction(`duplicate-${id}`)
    setError("")

    const response = await fetch(`/api/cvs/${id}/duplicate`, {
      method: "POST",
    })
    const data = (await response.json()) as { cv?: CvRecord; error?: string }

    if (!response.ok || !data.cv) {
      setError(t(data.error ?? "Could not duplicate the CV."))
      setPendingAction("")
      return
    }

    setCvs((items) => [data.cv!, ...items])
    setPendingAction("")
  }

  return (
    <div>
      <section aria-labelledby="library-title">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 id="library-title" className="text-xl font-semibold">
              {t("Recent CVs")}
            </h2>
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {t(cvs.length === 1 ? "{{count}} document" : "{{count}} documents", {
                count: cvs.length,
              })}
            </span>
            <Button
              size="icon-lg"
              onClick={create}
              disabled={pending}
              aria-label={t(pending ? "Creating CV" : "Create a new CV")}
              title={t("Create a new CV")}
              className="shadow-[0_6px_18px_rgba(15,92,145,0.2)]"
            >
              <Plus className="size-5" />
            </Button>
          </div>
        </div>

        {cvs.length === 0 ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">
              {t("Your CV library is empty")}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t(
                "Use the plus button to create your first CV. You can keep separate versions for different roles."
              )}
            </p>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),23rem))] gap-5 xl:gap-6">
              {cvs.map((cv) => (
                <Card
                  key={cv.id}
                  className="ui-stagger-item shadow-none transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
                >
                  <CardHeader>
                    <CardTitle className="truncate pr-8">{cv.title}</CardTitle>
                    <CardAction>
                      <Link
                        href={`/cvs/${cv.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" })
                        )}
                        aria-label={t("Edit {{title}}", { title: cv.title })}
                      >
                        <Pencil />
                      </Link>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <CvThumbnail cv={cv} />
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {t("Updated {{date}}", {
                          date: formatUpdated(cv.updatedAt, locale),
                        })}
                      </span>
                    </div>
                    <div className="grid gap-1 border-t pt-3">
                      <Link
                        href={`/cvs/${cv.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "justify-start"
                        )}
                      >
                        <Pencil data-icon="inline-start" />
                        {t("Edit")}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => duplicate(cv.id)}
                        disabled={pendingAction === `duplicate-${cv.id}`}
                      >
                        <Copy data-icon="inline-start" />
                        {pendingAction === `duplicate-${cv.id}`
                          ? t("Duplicating...")
                          : t("Duplicate")}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              disabled={pendingAction === `delete-${cv.id}`}
                            />
                          }
                        >
                          <Trash2 data-icon="inline-start" />
                          {t("Delete")}
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("Delete this CV?")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                "This permanently removes {{title}}. This action cannot be undone.",
                                { title: cv.title }
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => remove(cv.id)}
                            >
                              {t("Delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Link
                        href={`/cvs/${cv.id}/preview`}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "justify-start text-primary hover:text-primary"
                        )}
                      >
                        <Download data-icon="inline-start" />
                        {t("Download")}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
