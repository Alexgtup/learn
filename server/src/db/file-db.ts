import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const flashcardsDbPath = path.join(dataDir, "flashcards.json");

interface FlashcardDb {
  flashcards: any[];
  learningSessions: any[];
}

const initialDb: FlashcardDb = {
  flashcards: [],
  learningSessions: []
};

export async function ensureDb(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(flashcardsDbPath, "utf8");
  } catch {
    await writeDb(initialDb);
  }
}

async function writeDb(db: FlashcardDb): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(flashcardsDbPath, JSON.stringify(db, null, 2), "utf8");
}

export async function getDb(): Promise<FlashcardDb> {
  await ensureDb();
  const raw = await readFile(flashcardsDbPath, "utf8");
  return JSON.parse(raw) as FlashcardDb;
}

export async function saveDb(db: FlashcardDb): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(flashcardsDbPath, JSON.stringify(db, null, 2), "utf8");
}
