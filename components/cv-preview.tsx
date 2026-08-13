"use client"

import {
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import type { CvContent, Education, Experience } from "@/lib/cv-schema"
import { cn } from "@/lib/utils"

const A4_WIDTH = 794
const A4_HEIGHT = 1123
const A4_CONTENT_HEIGHT = A4_HEIGHT - 116

function dateSortValue(value: string) {
  const normalized = value.trim().toLowerCase()

  if (["present", "current", "now"].includes(normalized)) {
    return Number.MAX_SAFE_INTEGER
  }

  const monthYear = normalized.match(/^(\d{1,2})[/-](\d{4})$/)
  if (monthYear) {
    return Number(monthYear[2]) * 12 + Number(monthYear[1])
  }

  if (/^\d{4}$/.test(normalized)) {
    return Number(normalized) * 12 + 12
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return 0

  const date = new Date(timestamp)
  return date.getUTCFullYear() * 12 + date.getUTCMonth() + 1
}

function newestFirst<T extends { startDate: string; endDate: string }>(
  entries: T[]
) {
  return [...entries].sort((a, b) => {
    const latestA = dateSortValue(a.endDate) || dateSortValue(a.startDate)
    const latestB = dateSortValue(b.endDate) || dateSortValue(b.startDate)

    return (
      latestB - latestA ||
      dateSortValue(b.startDate) - dateSortValue(a.startDate)
    )
  })
}

function DateRange({ start, end }: { start: string; end: string }) {
  if (!start && !end) return null
  return (
    <span className="cv-date">{[start, end].filter(Boolean).join(" - ")}</span>
  )
}

function ExperienceBlock({
  experience,
  showHeading,
  compact,
}: {
  experience: Experience
  showHeading: boolean
  compact: boolean
}) {
  return (
    <section
      className={cn(
        "cv-section",
        !showHeading && "cv-section-continuation",
        compact && "cv-section-compact"
      )}
      data-cv-block
    >
      {showHeading && <h2>Experience</h2>}
      <div className="cv-entry">
        <div className="cv-entry-head">
          <strong>{experience.role}</strong>
          <DateRange start={experience.startDate} end={experience.endDate} />
        </div>
        <p className="cv-subtitle">
          {experience.url ? (
            <a
              href={experience.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-current/40 underline-offset-2"
            >
              {experience.organization}
            </a>
          ) : (
            experience.organization
          )}
        </p>
        {experience.description && (
          <p className="cv-detail-line">{experience.description}</p>
        )}
        {experience.bullets.length > 0 && (
          <ul>
            {experience.bullets.map((bullet, index) => (
              <li key={`${experience.id}-${index}`}>{bullet}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function EducationBlock({
  education,
  showHeading,
  compact,
}: {
  education: Education
  showHeading: boolean
  compact: boolean
}) {
  return (
    <section
      className={cn(
        "cv-section",
        !showHeading && "cv-section-continuation",
        compact && "cv-section-compact"
      )}
      data-cv-block
    >
      {showHeading && <h2>Education</h2>}
      <div className="cv-entry">
        <div className="cv-entry-head">
          <strong>{education.degree}</strong>
          <DateRange start={education.startDate} end={education.endDate} />
        </div>
        <p className="cv-subtitle">
          {education.institution}
          {education.details ? `, ${education.details}` : ""}
        </p>
      </div>
    </section>
  )
}

function buildBlocks(content: CvContent): ReactNode[] {
  const blocks: ReactNode[] = []
  const contact = [
    content.contact.phone,
    content.contact.email,
    content.contact.website,
    content.contact.location,
  ].filter(Boolean)

  if (content.visibility?.personal ?? true) {
    blocks.push(
      <header className="cv-header" data-cv-block key="personal">
        <h1>{content.name || "Your name"}</h1>
        {contact.length > 0 && (
          <address>
            {contact.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </address>
        )}
      </header>
    )
  }

  if ((content.visibility?.summary ?? true) && content.summary) {
    blocks.push(
      <section className="cv-section" data-cv-block key="summary">
        <h2>Summary</h2>
        <p className="cv-summary">{content.summary}</p>
      </section>
    )
  }

  if (
    (content.visibility?.experience ?? true) &&
    content.experiences.length > 0
  ) {
    const experiences = newestFirst(content.experiences)
    experiences.forEach((experience, index) => {
      blocks.push(
        <ExperienceBlock
          key={experience.id}
          experience={experience}
          showHeading={index === 0}
          compact={index < experiences.length - 1}
        />
      )
    })
  }

  if ((content.visibility?.education ?? true) && content.education.length > 0) {
    const education = newestFirst(content.education)
    education.forEach((item, index) => {
      blocks.push(
        <EducationBlock
          key={item.id}
          education={item}
          showHeading={index === 0}
          compact={index < education.length - 1}
        />
      )
    })
  }

  if ((content.visibility?.skills ?? true) && content.skills.length > 0) {
    blocks.push(
      <section className="cv-section" data-cv-block key="skills">
        <h2>Skills</h2>
        <ul className="cv-skills">
          {content.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </section>
    )
  }

  if ((content.visibility?.languages ?? true) && content.languages.length > 0) {
    blocks.push(
      <section className="cv-section" data-cv-block key="languages">
        <h2>Languages</h2>
        <div className="cv-languages">
          {content.languages.map((language) => (
            <div className="cv-language" key={language.id}>
              <span className="cv-language-name">{language.language}</span>
              {language.proficiency !== "Not Rated" && (
                <span>{language.proficiency}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  }

  return blocks
}

export function CvPreview({
  content,
  className,
}: {
  content: CvContent
  className?: string
}) {
  const documentRef = useRef<HTMLDivElement>(null)
  const measurementRef = useRef<HTMLDivElement>(null)
  const blocks = useMemo(() => buildBlocks(content), [content])
  const [pages, setPages] = useState<number[][]>(() => [
    blocks.map((_, index) => index),
  ])
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const document = documentRef.current
    if (!document) return

    const updateScale = () => {
      setScale(Math.min(1, document.clientWidth / A4_WIDTH))
    }
    const observer = new ResizeObserver(updateScale)
    observer.observe(document)
    updateScale()

    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const measuredBlocks =
      measurementRef.current?.querySelectorAll("[data-cv-block]")
    if (!measuredBlocks) return

    const nextPages: number[][] = [[]]
    let usedHeight = 0

    measuredBlocks.forEach((block, index) => {
      const height = block.getBoundingClientRect().height
      const currentPage = nextPages[nextPages.length - 1]

      if (currentPage.length > 0 && usedHeight + height > A4_CONTENT_HEIGHT) {
        nextPages.push([index])
        usedHeight = height
      } else {
        currentPage.push(index)
        usedHeight += height
      }
    })

    setPages(nextPages)
  }, [blocks])

  return (
    <div className="cv-document" ref={documentRef}>
      <div className="cv-measure" aria-hidden="true">
        <article className="cv-paper" ref={measurementRef}>
          {blocks}
        </article>
      </div>

      {pages.map((page, pageIndex) => (
        <div
          className="cv-page-frame"
          key={`${pageIndex}-${page.join("-")}`}
          style={{
            width: A4_WIDTH * scale,
            height: A4_HEIGHT * scale,
          }}
        >
          <article
            className={cn("cv-paper", className)}
            style={{ transform: `scale(${scale})` }}
            aria-label={`CV preview page ${pageIndex + 1} of ${pages.length}`}
          >
            {page.map((blockIndex) => blocks[blockIndex])}
          </article>
        </div>
      ))}
    </div>
  )
}
