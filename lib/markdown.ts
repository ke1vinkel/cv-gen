import { createElement, type ReactNode } from "react"

/**
 * Lightweight inline markdown parser for CV preview rendering.
 *
 * Supported syntax:
 *   **bold**
 *   *italic*
 *   __underline__
 *   [text](url)
 *   • bullet prefix (converted to <li>)
 *
 * All URLs are sanitized to only allow http(s) protocols.
 */

function sanitizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol === "http:" || url.protocol === "https:") return raw
  } catch {
    // invalid URL
  }
  return null
}

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; children: InlineToken[] }
  | { type: "italic"; children: InlineToken[] }
  | { type: "underline"; children: InlineToken[] }
  | { type: "link"; href: string; children: InlineToken[] }

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let i = 0

  while (i < text.length) {
    // Bold **...**
    if (text[i] === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2)
      if (end !== -1) {
        tokens.push({
          type: "bold",
          children: parseInlineTokens(text.slice(i + 2, end)),
        })
        i = end + 2
        continue
      }
    }

    // Italic *...*
    if (text[i] === "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1)
      if (end !== -1 && text[end + 1] !== "*") {
        tokens.push({
          type: "italic",
          children: parseInlineTokens(text.slice(i + 1, end)),
        })
        i = end + 1
        continue
      }
    }

    // Underline __...__
    if (text[i] === "_" && text[i + 1] === "_") {
      const end = text.indexOf("__", i + 2)
      if (end !== -1) {
        tokens.push({
          type: "underline",
          children: parseInlineTokens(text.slice(i + 2, end)),
        })
        i = end + 2
        continue
      }
    }

    // Link [text](url)
    if (text[i] === "[") {
      const closeBracket = text.indexOf("]", i + 1)
      if (
        closeBracket !== -1 &&
        text[closeBracket + 1] === "("
      ) {
        const closeParen = text.indexOf(")", closeBracket + 2)
        if (closeParen !== -1) {
          const linkText = text.slice(i + 1, closeBracket)
          const rawUrl = text.slice(closeBracket + 2, closeParen)
          const safeUrl = sanitizeUrl(rawUrl)
          if (safeUrl) {
            tokens.push({
              type: "link",
              href: safeUrl,
              children: parseInlineTokens(linkText),
            })
            i = closeParen + 1
            continue
          }
        }
      }
    }

    // Plain text — accumulate until next special char
    const nextSpecial = text.slice(i + 1).search(/[*_[]/)
    const end = nextSpecial === -1 ? text.length : i + 1 + nextSpecial
    tokens.push({ type: "text", value: text.slice(i, end) })
    i = end
  }

  return tokens
}

let keyCounter = 0

function tokensToReact(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((token) => {
    const key = `md-${keyCounter++}`
    switch (token.type) {
      case "text":
        return token.value
      case "bold":
        return createElement("strong", { key }, ...tokensToReact(token.children))
      case "italic":
        return createElement("em", { key }, ...tokensToReact(token.children))
      case "underline":
        return createElement(
          "span",
          { key, style: { textDecoration: "underline" } },
          ...tokensToReact(token.children)
        )
      case "link":
        return createElement(
          "a",
          {
            key,
            href: token.href,
            target: "_blank",
            rel: "noreferrer",
            className: "underline decoration-current/40 underline-offset-2",
          },
          ...tokensToReact(token.children)
        )
    }
  })
}

/**
 * Render inline markdown text to React nodes.
 * Supports **bold**, *italic*, __underline__, and [links](url).
 */
export function renderInlineMarkdown(text: string): ReactNode[] {
  keyCounter = 0
  const tokens = parseInlineTokens(text)
  return tokensToReact(tokens)
}

/**
 * Parse a multiline string with • bullet prefixes into paragraphs and lists.
 * Returns an array of React elements suitable for CV preview blocks.
 */
export function renderMarkdownBlock(text: string): ReactNode[] {
  if (!text) return []

  const lines = text.split("\n")
  const elements: ReactNode[] = []
  let bulletBuffer: string[] = []

  function flushBullets() {
    if (bulletBuffer.length === 0) return
    elements.push(
      createElement(
        "ul",
        { key: `md-ul-${elements.length}` },
        ...bulletBuffer.map((bullet, index) =>
          createElement(
            "li",
            { key: `md-li-${elements.length}-${index}` },
            ...renderInlineMarkdown(bullet)
          )
        )
      )
    )
    bulletBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("• ")) {
      bulletBuffer.push(trimmed.slice(2))
    } else {
      flushBullets()
      if (trimmed) {
        elements.push(
          createElement(
            "p",
            { key: `md-p-${elements.length}`, className: "cv-detail-line" },
            ...renderInlineMarkdown(trimmed)
          )
        )
      }
    }
  }

  flushBullets()
  return elements
}
