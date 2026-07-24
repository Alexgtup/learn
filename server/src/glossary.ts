import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GlossaryTerm, GlossaryTermSummary, UpsertGlossaryInput } from "../../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const glossaryDir = path.resolve(__dirname, "../data/glossary");

function slugify(term: string): string {
  return term.trim().toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function serialize(entry: UpsertGlossaryInput): string {
  const aliases = (entry.aliases || []).join(", ");
  return `---\nterm: ${entry.term}\naliases: ${aliases}\n---\n${entry.content.trim()}\n`;
}

function parse(raw: string, slug: string, updatedAt: string): GlossaryTerm {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { slug, term: slug, aliases: [], content: raw.trim(), updatedAt };

  const [, front, body] = match;
  const term = front.match(/^term:\s*(.+)$/m)?.[1]?.trim() || slug;
  const aliases = (front.match(/^aliases:\s*(.*)$/m)?.[1] || "")
    .split(",").map((item) => item.trim()).filter(Boolean);

  return { slug, term, aliases, content: body.trim(), updatedAt };
}

async function ensureDir(): Promise<void> {
  await mkdir(glossaryDir, { recursive: true });
}

export async function listGlossary(): Promise<GlossaryTermSummary[]> {
  await ensureDir();
  const files = (await readdir(glossaryDir)).filter((file) => file.endsWith(".md"));
  return Promise.all(files.map(async (file) => {
    const raw = await readFile(path.join(glossaryDir, file), "utf8");
    const parsed = parse(raw, file.replace(/\.md$/, ""), "");
    return { slug: parsed.slug, term: parsed.term, aliases: parsed.aliases };
  }));
}

export async function getGlossaryTerm(slug: string): Promise<GlossaryTerm | null> {
  await ensureDir();
  const filePath = path.join(glossaryDir, `${slug}.md`);
  try {
    const [raw, stats] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
    return parse(raw, slug, stats.mtime.toISOString());
  } catch {
    return null;
  }
}

export async function upsertGlossaryTerm(input: UpsertGlossaryInput, existingSlug?: string): Promise<GlossaryTerm> {
  await ensureDir();
  const slug = existingSlug || slugify(input.term);
  await writeFile(path.join(glossaryDir, `${slug}.md`), serialize(input), "utf8");
  const term = await getGlossaryTerm(slug);
  if (!term) throw new Error("GLOSSARY_WRITE_FAILED");
  return term;
}

export async function deleteGlossaryTerm(slug: string): Promise<boolean> {
  await ensureDir();
  try {
    await unlink(path.join(glossaryDir, `${slug}.md`));
    return true;
  } catch {
    return false;
  }
}