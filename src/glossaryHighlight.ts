import type { GlossaryTermSummary } from "../shared/types";

type Matcher = { regex: RegExp; slugByLower: Map<string, string> };

export type GlossaryMatcher = Matcher | null;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildGlossaryMatcher(terms: GlossaryTermSummary[]): Matcher | null {
  if (!terms.length) return null;

  const slugByLower = new Map<string, string>();
  const phrases: string[] = [];

  terms.forEach((entry) => {
    [entry.term, ...entry.aliases].forEach((variant) => {
      const trimmed = variant.trim();
      if (!trimmed) return;
      slugByLower.set(trimmed.toLowerCase(), entry.slug);
      phrases.push(trimmed);
    });
  });

  phrases.sort((a, b) => b.length - a.length);
  const pattern = phrases.map(escapeRegExp).join("|");
  const regex = new RegExp(`(?<![\\p{L}\\p{N}_])(${pattern})(?![\\p{L}\\p{N}_])`, "giu");

  return { regex, slugByLower };
}

function wrapTextNode(node: Text, matcher: Matcher): void {
  const text = node.nodeValue || "";
  const matches = Array.from(text.matchAll(matcher.regex));
  if (!matches.length) return;

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  matches.forEach((match) => {
    const start = match.index ?? 0;
    const matched = match[0];
    if (start > cursor) fragment.appendChild(document.createTextNode(text.slice(cursor, start)));

    const slug = matcher.slugByLower.get(matched.toLowerCase());
    if (slug) {
      const span = document.createElement("span");
      span.className = "glossary-term";
      span.dataset.slug = slug;
      span.textContent = matched;
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(matched));
    }

    cursor = start + matched.length;
  });

  if (cursor < text.length) fragment.appendChild(document.createTextNode(text.slice(cursor)));
  node.replaceWith(fragment);
}

export function applyGlossaryHighlight(root: HTMLElement, matcher: Matcher | null): void {
  if (!matcher) return;

  const skipTags = new Set(["SCRIPT", "STYLE", "A"]);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(".glossary-term")) return NodeFilter.FILTER_REJECT;
      if (parent.closest("pre")) return NodeFilter.FILTER_REJECT; // блочный код не трогаем
      if (skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) { nodes.push(current as Text); current = walker.nextNode(); }
  nodes.forEach((node) => wrapTextNode(node, matcher));
}