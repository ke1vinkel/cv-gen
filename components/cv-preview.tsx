"use client"

import {
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useLanguage } from "@/components/language-provider"
import type { CvContent, CustomSection, Education, Experience } from "@/lib/cv-schema"
import type { Translator } from "@/lib/i18n"
import { renderInlineMarkdown, renderMarkdownBlock } from "@/lib/markdown"
import { cn } from "@/lib/utils"

const A4_WIDTH = 794
const A4_HEIGHT = 1123
const A4_PAGE_PADDING = 96
const A4_BOTTOM_SAFETY = 14
const A4_CONTENT_HEIGHT = A4_HEIGHT - A4_PAGE_PADDING - A4_BOTTOM_SAFETY

function safeExternalUrl(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? value : null
  } catch {
    return null
  }
}

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

function DateRange({
  start,
  end,
  t,
}: {
  start: string
  end: string
  t: Translator
}) {
  if (!start && !end) return null
  const dates = [start, end]
    .filter(Boolean)
    .map((date) => (date === "Present" ? t("Present") : date))
  return (
    <span className="cv-date">{dates.join(" - ")}</span>
  )
}

function ExperienceBlock({
  experience,
  showHeading,
  compact,
  t,
}: {
  experience: Experience
  showHeading: boolean
  compact: boolean
  t: Translator
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
      {showHeading && <h2>{t("Experience")}</h2>}
      <div className="cv-entry">
        <div className="cv-entry-head">
          <strong>{experience.role}</strong>
          <DateRange
            start={experience.startDate}
            end={experience.endDate}
            t={t}
          />
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
          <>{renderMarkdownBlock(experience.description)}</>
        )}
        {experience.bullets.length > 0 && (
          <ul>
            {experience.bullets.map((bullet, index) => (
              <li key={`${experience.id}-${index}`}>
                {renderInlineMarkdown(bullet)}
              </li>
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
  t,
}: {
  education: Education
  showHeading: boolean
  compact: boolean
  t: Translator
}) {
  const educationUrl = safeExternalUrl(education.url)
  const heading = education.fieldOfStudy || education.degree
  const educationDetails = education.details?.trim()
  const detailSuffix = educationDetails
    ? educationDetails.startsWith("(")
      ? ` ${educationDetails}`
      : ` (${educationDetails})`
    : ""

  return (
    <section
      className={cn(
        "cv-section",
        !showHeading && "cv-section-continuation",
        compact && "cv-section-compact"
      )}
      data-cv-block
    >
      {showHeading && <h2>{t("Education")}</h2>}
      <div className="cv-entry">
        <div className="cv-entry-head">
          <strong>
            {educationUrl ? (
              <a
                href={educationUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-current/40 underline-offset-2"
              >
                {heading}
              </a>
            ) : (
              heading
            )}
          </strong>
          <DateRange start={education.startDate} end={education.endDate} t={t} />
        </div>
        <p className="cv-subtitle">
          {education.institution}
          {education.fieldOfStudy && education.degree
            ? ` — ${education.degree}`
            : ""}
          {detailSuffix}
        </p>
      </div>
    </section>
  )
}

function CustomSectionBlock({
  section,
  showHeading,
  compact,
  t,
}: {
  section: CustomSection
  showHeading: boolean
  compact: boolean
  t: Translator
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
      {showHeading && <h2>{section.title}</h2>}
      {section.items.map((item) => (
        <div className="cv-entry" key={item.id}>
          <div className="cv-entry-head">
            <strong>{item.title}</strong>
            {(item.startDate || item.endDate) && (
              <DateRange
                start={item.startDate ?? ""}
                end={item.endDate ?? ""}
                t={t}
              />
            )}
          </div>
          {item.subtitle && <p className="cv-subtitle">{item.subtitle}</p>}
          {item.url && (
            <p className="cv-subtitle">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-current/40 underline-offset-2"
              >
                {item.url}
              </a>
            </p>
          )}
          {item.description && (
            <>{renderMarkdownBlock(item.description)}</>
          )}
          {item.bullets && item.bullets.length > 0 && (
            <ul>
              {item.bullets.map((bullet, index) => (
                <li key={`${item.id}-${index}`}>
                  {renderInlineMarkdown(bullet)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  )
}

function buildBlocks(content: CvContent, t: Translator): ReactNode[] {
  const blocks: ReactNode[] = []
  const sectionOrder = content.sectionOrder ?? [
    "personal",
    "summary",
    "experience",
    "education",
    "skills",
    "languages",
  ]

  for (const sectionId of sectionOrder) {
    switch (sectionId) {
      case "personal": {
        if (!(content.visibility?.personal ?? true)) break
        const contact = [
          content.contact.phone,
          content.contact.email,
          content.contact.website,
          content.contact.location,
        ].filter(Boolean)

        blocks.push(
          <header className="cv-header" data-cv-block key="personal">
            <h1>{content.name || t("Your name")}</h1>
            {contact.length > 0 && (
              <address>
                {contact.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </address>
            )}
          </header>
        )
        break
      }

      case "summary": {
        if (!(content.visibility?.summary ?? true) || !content.summary) break
        blocks.push(
          <section className="cv-section" data-cv-block key="summary">
            <h2>{t("Summary")}</h2>
            <div className="cv-summary">
              {renderMarkdownBlock(content.summary)}
            </div>
          </section>
        )
        break
      }

      case "experience": {
        if (
          !(content.visibility?.experience ?? true) ||
          content.experiences.length === 0
        )
          break
        const experiences = newestFirst(content.experiences)
        experiences.forEach((experience, index) => {
          blocks.push(
            <ExperienceBlock
              key={experience.id}
              experience={experience}
              showHeading={index === 0}
              compact={index < experiences.length - 1}
              t={t}
            />
          )
        })
        break
      }

      case "education": {
        if (
          !(content.visibility?.education ?? true) ||
          content.education.length === 0
        )
          break
        const education = newestFirst(content.education)
        education.forEach((item, index) => {
          blocks.push(
            <EducationBlock
              key={item.id}
              education={item}
              showHeading={index === 0}
              compact={index < education.length - 1}
              t={t}
            />
          )
        })
        break
      }

      case "skills": {
        if (
          !(content.visibility?.skills ?? true) ||
          content.skills.length === 0
        )
          break
        blocks.push(
          <section className="cv-section" data-cv-block key="skills">
            <h2>{t("Skills")}</h2>
            <ul className="cv-skills">
              {content.skills.map((skill, index) => (
                <li key={`${skill}-${index}`}>{renderInlineMarkdown(skill)}</li>
              ))}
            </ul>
          </section>
        )
        break
      }

      case "languages": {
        if (
          !(content.visibility?.languages ?? true) ||
          content.languages.length === 0
        )
          break
        blocks.push(
          <section className="cv-section" data-cv-block key="languages">
            <h2>{t("Languages")}</h2>
            <div className="cv-languages">
              {content.languages.map((language) => (
                <div className="cv-language" key={language.id}>
                  <span className="cv-language-name">{language.language}</span>
                  {language.proficiency !== "Not Rated" && (
                    <span>{t(language.proficiency)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
        break
      }

      default: {
        // Custom section
        const customSection = (content.customSections ?? []).find(
          (s) => s.id === sectionId
        )
        if (!customSection || customSection.items.length === 0) break
        blocks.push(
          <CustomSectionBlock
            key={customSection.id}
            section={customSection}
            showHeading={true}
            compact={false}
            t={t}
          />
        )
        break
      }
    }
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
  const { t } = useLanguage()
  const documentRef = useRef<HTMLDivElement>(null)
  const measurementRef = useRef<HTMLDivElement>(null)
  const blocks = useMemo(() => buildBlocks(content, t), [content, t])
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
    const measurement = measurementRef.current
    if (!measurement) return

    const paginate = () => {
      const measuredBlocks = measurement.querySelectorAll("[data-cv-block]")
      const nextPages: number[][] = [[]]
      let usedHeight = 0

      measuredBlocks.forEach((block, index) => {
        const height = block.getBoundingClientRect().height
        const currentPage = nextPages[nextPages.length - 1]

        if (
          currentPage.length > 0 &&
          usedHeight + height > A4_CONTENT_HEIGHT
        ) {
          nextPages.push([index])
          usedHeight = height
        } else {
          currentPage.push(index)
          usedHeight += height
        }
      })

      setPages(nextPages)
    }

    const observer = new ResizeObserver(paginate)
    observer.observe(measurement)
    paginate()

    return () => observer.disconnect()
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
            aria-label={t("CV preview page {{page}} of {{total}}", {
              page: pageIndex + 1,
              total: pages.length,
            })}
          >
            {page.map((blockIndex) => blocks[blockIndex])}
          </article>

          {/* Page counter badge */}
          {pages.length > 1 && (
            <div
              className="cv-page-badge"
              aria-hidden="true"
              style={{ transform: `scale(${scale})` }}
            >
              {t("Page {{page}} of {{total}}", {
                page: pageIndex + 1,
                total: pages.length,
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
