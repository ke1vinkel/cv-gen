import type { CvContent } from "@/lib/cv-schema"
import { cn } from "@/lib/utils"

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

export function CvPreview({
  content,
  className,
}: {
  content: CvContent
  className?: string
}) {
  const contact = [
    content.contact.phone,
    content.contact.email,
    content.contact.website,
    content.contact.location,
  ].filter(Boolean)

  return (
    <article className={cn("cv-paper", className)} aria-label="CV preview">
      {(content.visibility?.personal ?? true) && (
        <header className="cv-header">
          <h1>{content.name || "Your name"}</h1>
          {contact.length > 0 && (
            <address>
              {contact.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </address>
          )}
        </header>
      )}

      {(content.visibility?.summary ?? true) && content.summary && (
        <section className="cv-section">
          <h2>Summary</h2>
          <p className="cv-summary">{content.summary}</p>
        </section>
      )}

      {(content.visibility?.experience ?? true) &&
        content.experiences.length > 0 && (
          <section className="cv-section">
            <h2>Experience</h2>
            {newestFirst(content.experiences).map((experience) => (
              <div className="cv-entry" key={experience.id}>
                <div className="cv-entry-head">
                  <strong>{experience.role}</strong>
                  <DateRange
                    start={experience.startDate}
                    end={experience.endDate}
                  />
                </div>
                <p className="cv-subtitle">{experience.organization}</p>
                {experience.bullets.length > 0 && (
                  <ul>
                    {experience.bullets.map((bullet, index) => (
                      <li key={`${experience.id}-${index}`}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

      {(content.visibility?.education ?? true) &&
        content.education.length > 0 && (
          <section className="cv-section">
            <h2>Education</h2>
            {newestFirst(content.education).map((education) => (
              <div className="cv-entry" key={education.id}>
                <div className="cv-entry-head">
                  <strong>{education.degree}</strong>
                  <DateRange
                    start={education.startDate}
                    end={education.endDate}
                  />
                </div>
                <p className="cv-subtitle">
                  {education.institution}
                  {education.details ? `, ${education.details}` : ""}
                </p>
              </div>
            ))}
          </section>
        )}

      {(content.visibility?.skills ?? true) && content.skills.length > 0 && (
        <section className="cv-section">
          <h2>Skills</h2>
          <ul className="cv-skills">
            {content.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
