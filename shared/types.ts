// Legacy (current) module model kept for backward compatibility
export type ModuleItem = {
  id: string;
  title: string;
  week: string;
  weekOrder: number;
  order: number;
  content: string;
  builtin: boolean;
};

export type CheckMap = Record<string, Record<string, boolean>>;

export type AppStateDto = {
  modules: ModuleItem[]; // legacy
  checks: CheckMap;
};

export type CreateModuleInput = {
  title?: string;
  week?: string;
  content: string;
  sectionType?: SectionType;
};

export type GlossaryTerm = {
  slug: string;
  term: string;
  aliases: string[];
  content: string;
  updatedAt: string;
};

export type GlossaryTermSummary = {
  slug: string;
  term: string;
  aliases: string[];
};

export type UpsertGlossaryInput = {
  term: string;
  aliases?: string[];
  content: string;
};

/* ------------------- NEW TYPE DEFINITIONS (v2) ------------------- */

export type SectionType = "algorithms" | "projects" | "reference" | "misc";

export type Lesson = {
  id: string;
  title: string;
  content: string; // markdown
  order: number;
  builtin?: boolean;
  // optional metadata
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
};

export type Topic = {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
};

export type Section = {
  id: string;
  type: SectionType;
  title: string;
  description?: string;
  order: number;
  topics: Topic[];
};

export type Term = {
  id: string;
  language: "js" | "python" | "go" | "any";
  category?: string;
  term: string;
  aliases?: string[];
  content: string; // markdown
  updatedAt?: string;
};

// New application state (v2) — used after migration
export type AppStateV2 = {
  sections: Section[];
  terms: Term[];
  checks: Record<string, Record<string, boolean>>; // keyed by lesson id
  meta?: {
    migratedFrom?: string;
    migratedAt?: string;
  };
};

export type CreateSectionInput = {
  type: SectionType;
  title: string;
  description?: string;
};

export type CreateTopicInput = {
  sectionId: string;
  title: string;
  description?: string;
};

export type CreateLessonInput = {
  topicId: string;
  title: string;
  content: string;
};
