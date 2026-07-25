import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const flashcardsDbPath = path.join(dataDir, "flashcards.json");
const initialDb = {
    flashcards: [],
    learningSessions: []
};
export async function ensureDb() {
    await mkdir(dataDir, { recursive: true });
    try {
        await readFile(flashcardsDbPath, "utf8");
    }
    catch {
        await writeDb(initialDb);
    }
}
async function writeDb(db) {
    await mkdir(dataDir, { recursive: true });
    await writeFile(flashcardsDbPath, JSON.stringify(db, null, 2), "utf8");
}
export async function getDb() {
    await ensureDb();
    const raw = await readFile(flashcardsDbPath, "utf8");
    return JSON.parse(raw);
}
export async function saveDb(db) {
    await mkdir(dataDir, { recursive: true });
    await writeFile(flashcardsDbPath, JSON.stringify(db, null, 2), "utf8");
}
