import { Eye, FileText } from "lucide-react"
import Link from "next/link"

import { CvThumbnail } from "@/components/cv-library"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { StudentCvRecord } from "@/lib/cvs"
import { cn } from "@/lib/utils"

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function LecturerCvLibrary({ cvs }: { cvs: StudentCvRecord[] }) {
  const students = new Map<string, StudentCvRecord[]>()

  for (const cv of cvs) {
    const studentCvs = students.get(cv.student.id) ?? []
    studentCvs.push(cv)
    students.set(cv.student.id, studentCvs)
  }

  if (cvs.length === 0) {
    return (
      <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
          <FileText className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">No student CVs yet</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Student CVs will appear here after they create their first document.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-10">
      {[...students.values()].map((studentCvs) => {
        const student = studentCvs[0].student

        return (
          <section
            key={student.id}
            className="ui-stagger-item"
            aria-labelledby={`student-${student.id}`}
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-4">
              <div>
                <h2
                  id={`student-${student.id}`}
                  className="text-lg font-semibold tracking-tight"
                >
                  {student.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {student.email}
                </p>
              </div>
              <Badge variant="secondary">
                {studentCvs.length} {studentCvs.length === 1 ? "CV" : "CVs"}
              </Badge>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),22rem))] gap-5 xl:gap-6">
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
                      Updated {formatUpdated(cv.updatedAt)}
                    </span>
                    <Link
                      href={`/cvs/${cv.id}/preview`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      <Eye data-icon="inline-start" />
                      View CV
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
