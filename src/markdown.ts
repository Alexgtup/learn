import DOMPurify from "dompurify";
import hljs from "highlight.js";
import { marked } from "marked";

// Disable security warning for sanitized content
hljs.configure({ ignoreUnescapedHTML: true });

marked.setOptions({
  gfm: true,
  breaks: false
});

export type ParsedSection = {
  title: string;
  body: string;
};

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMarkdown(markdown: string): string {
  return DOMPurify.sanitize(marked.parse(markdown, { async: false }) as string);
}

export function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^\s*#\s+.+\n/, "");
}

export function splitSections(markdown: string, headingLevel: 2 | 3): { intro: string; sections: ParsedSection[] } {
  const re = new RegExp(`^${"#".repeat(headingLevel)} (.+)$`, "gm");
  const marks: Array<{ index: number; title: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = re.exec(markdown))) {
    marks.push({ index: match.index, title: match[1].trim() });
  }

  const introEnd = marks.length ? marks[0].index : markdown.length;
  const intro = markdown.slice(0, introEnd).trim();
  const sections: ParsedSection[] = [];

  for (let index = 0; index < marks.length; index += 1) {
    const start = marks[index].index;
    const end = index + 1 < marks.length ? marks[index + 1].index : markdown.length;
    const chunk = markdown.slice(start, end);
    const newlineIndex = chunk.indexOf("\n");
    const body = newlineIndex === -1 ? "" : chunk.slice(newlineIndex + 1);
    sections.push({ title: marks[index].title, body: body.trim() });
  }

  return { intro, sections };
}

export function classifySection(title: string): "theory" | "practice" | "check" | "content" {
  if (/теор/i.test(title)) return "theory";
  if (/практик|задач/i.test(title)) return "practice";
  if (/самопровер|чек-лист|итог|проверка/i.test(title)) return "check";
  return "content";
}

export function badgeLabel(type: string): string {
  return { theory: "Теория", practice: "Практика", check: "Проверка" }[type] || "";
}

export function countTasks(markdown: string): number {
  const matches = markdown.match(/^[ \t]*[-*] \[[ xX]\]/gm);
  return matches ? matches.length : 0;
}

export function highlightCode(container: HTMLElement | null): void {
  if (!container) return;
  container.querySelectorAll("pre code").forEach((element) => {
    try {
      const el = element as HTMLElement;
      // Clear the previously highlighted marker before re-highlighting
      if (el.dataset.highlighted) {
        delete el.dataset.highlighted;
      }
      hljs.highlightElement(el);
    } catch {
      // highlight.js should never block the core learning flow.
    }
  });
}
