"use client"

import { Eye, FileText, Search, X } from "lucide-react"
import Link from "next/link"
import { type CSSProperties, useState } from "react"

import { CvThumbnail } from "@/components/cv-library"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { StudentCvRecord } from "@/lib/cvs"
import { cn } from "@/lib/utils"

function formatUpdated(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function LecturerCvLibrary({ cvs }: { cvs: StudentCvRecord[] }) {
  const { locale, t } = useLanguage()
  const [query, setQuery] = useState("")
  const students = new Map<string, StudentCvRecord[]>()

  for (const cv of cvs) {
    const studentCvs = students.get(cv.student.id) ?? []
    studentCvs.push(cv)
    students.set(cv.student.id, studentCvs)
  }

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleStudents = [...students.values()].filter((studentCvs) =>
    studentCvs[0].student.name.toLocaleLowerCase().includes(normalizedQuery)
  )

  if (cvs.length === 0) {
    return (
      <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
          <FileText className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">{t("No student CVs yet")}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t(
            "Student CVs will appear here after they create their first document."
          )}
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-10">
      <section aria-label={t("Search students")} className="max-w-xl">
        <label htmlFor="student-search" className="sr-only">
          {t("Search students by name")}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="student-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search student name")}
            className="h-12 rounded-2xl border-border bg-background pr-12 pl-11 shadow-sm"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setQuery("")}
              aria-label={t("Clear student search")}
              className="absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X />
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          {normalizedQuery
            ? t(
                visibleStudents.length === 1
                  ? "{{count}} student found"
                  : "{{count}} students found",
                { count: visibleStudents.length }
              )
            : t(
                students.size === 1
                  ? "Search across {{count}} student"
                  : "Search across {{count}} students",
                { count: students.size }
              )}
        </p>
      </section>

      {visibleStudents.length === 0 ? (
        <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
            <Search className="size-5 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">{t("No matching students")}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("Try another name or clear the search to view every student.")}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => setQuery("")}
          >
            {t("Clear search")}
          </Button>
        </section>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),23rem))] items-start gap-6">
          {visibleStudents.map((studentCvs) => {
            const student = studentCvs[0].student
            const columnSpan = Math.min(studentCvs.length, 3)

            return (
              <section
                key={student.id}
                className="lecturer-student-group ui-stagger-item min-w-0"
                style={{ "--student-cv-span": columnSpan } as CSSProperties}
                data-student-card
                aria-labelledby={`student-${student.id}`}
              >
                <div className="mb-4 flex min-h-16 items-start justify-between gap-3 border-b pb-4">
                  <div className="min-w-0">
                    <h2
                      id={`student-${student.id}`}
                      className="truncate text-base font-semibold tracking-tight"
                    >
                      {student.name}
                    </h2>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {t(
                      studentCvs.length === 1
                        ? "{{count}} CV"
                        : "{{count}} CVs",
                      {
                        count: studentCvs.length,
                      }
                    )}
                  </Badge>
                </div>

                <div className="lecturer-student-cvs gap-5">
                  {studentCvs.map((cv) => (
                    <Card
                      key={cv.id}
                      className="ui-stagger-item gap-4 shadow-none transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
                    >
                      <CardHeader>
                        <CardTitle className="truncate">{cv.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CvThumbnail cv={cv} />
                      </CardContent>
                      <CardFooter className="flex items-center justify-between gap-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {t("Updated {{date}}", {
                            date: formatUpdated(cv.updatedAt, locale),
                          })}
                        </span>
                        <Link
                          href={`/cvs/${cv.id}/preview`}
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          <Eye data-icon="inline-start" />
                          {t("View CV")}
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
