import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../.env") });
import cors from "cors";
import express from "express";
import { z } from "zod";
import { deleteGlossaryTerm, getGlossaryTerm, listGlossary, upsertGlossaryTerm } from "./glossary.js";
import { createModule, deleteModule, getState, updateCheck, getNote, updateNote, getReview, updateReview, recordActivity, exportState, importState } from "./store.js";
import { flashcardsRouter } from "./routes/flashcards.js";
const app = express();
const port = Number(process.env.PORT || 5175);
app.use(cors());
app.use(express.json({ limit: "2mb" }));
// Подключение роутов для флешкарт
app.use("/api/flashcards", flashcardsRouter);
app.use("/api/sessions", flashcardsRouter);
const createModuleSchema = z.object({
    title: z.string().optional(),
    week: z.string().optional(),
    content: z.string().min(1, "content is required"),
    sectionType: z.enum(["algorithms", "projects", "reference", "misc"]).optional() // ← ДОБАВИТЬ
});
const updateCheckSchema = z.object({
    taskIndex: z.number().int().nonnegative(),
    checked: z.boolean()
});
// простая защита write-эндпоинтов токеном из .env (ADMIN_TOKEN=что-то-длинное)
function requireAdmin(req, res, next) {
    const token = req.header("x-admin-token");
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    next();
}
const upsertGlossarySchema = z.object({
    term: z.string().min(1),
    aliases: z.array(z.string()).optional(),
    content: z.string().min(1)
});
app.get("/api/glossary", async (_req, res, next) => {
    try {
        res.json(await listGlossary());
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/glossary/:slug", async (req, res, next) => {
    try {
        const term = await getGlossaryTerm(req.params.slug);
        if (!term) {
            res.status(404).json({ message: "Not found" });
            return;
        }
        res.json(term);
    }
    catch (error) {
        next(error);
    }
});
app.post("/api/glossary", requireAdmin, async (req, res, next) => {
    try {
        const input = upsertGlossarySchema.parse(req.body);
        res.status(201).json(await upsertGlossaryTerm(input));
    }
    catch (error) {
        next(error);
    }
});
app.put("/api/glossary/:slug", requireAdmin, async (req, res, next) => {
    try {
        const input = upsertGlossarySchema.parse(req.body);
        res.json(await upsertGlossaryTerm(input, req.params.slug));
    }
    catch (error) {
        next(error);
    }
});
app.delete("/api/glossary/:slug", requireAdmin, async (req, res, next) => {
    try {
        const deleted = await deleteGlossaryTerm(req.params.slug);
        if (!deleted) {
            res.status(404).json({ message: "Not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "fullstack-prep-journal-api" });
});
app.get("/api/state", async (_req, res, next) => {
    try {
        res.json(await getState());
    }
    catch (error) {
        next(error);
    }
});
// V2: expose migrated v2 store if present (read-only endpoint for migration/testing)
app.get("/api/v2/state", async (_req, res) => {
    try {
        const v2Path = path.join(__dirname, "../data/store.v2.json");
        const raw = await readFile(v2Path, "utf8");
        res.json(JSON.parse(raw));
    }
    catch (err) {
        res.status(404).json({ message: "v2 store not found" });
    }
});
app.post("/api/modules", async (req, res, next) => {
    try {
        const input = createModuleSchema.parse(req.body);
        const module = await createModule(input);
        res.status(201).json(module);
    }
    catch (error) {
        next(error);
    }
});
app.delete("/api/modules/:id", async (req, res, next) => {
    try {
        const deleted = await deleteModule(req.params.id);
        if (!deleted) {
            res.status(404).json({ message: "Module not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
app.patch("/api/checks/:moduleId", async (req, res, next) => {
    try {
        const input = updateCheckSchema.parse(req.body);
        const checks = await updateCheck(req.params.moduleId, input.taskIndex, input.checked);
        if (input.checked)
            await recordActivity(); // ← добавить
        res.json(checks);
    }
    catch (error) {
        next(error);
    }
});
app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation failed", issues: error.issues });
        return;
    }
    if (error instanceof Error && error.message === "MODULE_NOT_FOUND") {
        res.status(404).json({ message: "Module not found" });
        return;
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
});
/* ═══ Notes ═══ */
app.get("/api/notes/:lessonId", async (req, res, next) => {
    try {
        res.json({ content: await getNote(req.params.lessonId) });
    }
    catch (e) {
        next(e);
    }
});
app.patch("/api/notes/:lessonId", async (req, res, next) => {
    try {
        await updateNote(req.params.lessonId, req.body.content || "");
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
/* ═══ Spaced Repetition ═══ */
app.get("/api/review/:lessonId", async (req, res, next) => {
    try {
        res.json(await getReview(req.params.lessonId));
    }
    catch (e) {
        next(e);
    }
});
app.patch("/api/review/:lessonId", async (req, res, next) => {
    try {
        const entry = await updateReview(req.params.lessonId, req.body.rating);
        res.json(entry);
    }
    catch (e) {
        next(e);
    }
});
/* ═══ Export / Import ═══ */
app.get("/api/export", async (_req, res, next) => {
    try {
        res.json(await exportState());
    }
    catch (e) {
        next(e);
    }
});
app.post("/api/import", async (req, res, next) => {
    try {
        await importState(req.body);
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
});
