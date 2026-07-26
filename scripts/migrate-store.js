#!/usr/bin/env node
/**
 * Simple migration script: server/data/store.json -> server/data/store.v2.json
 * - Groups legacy modules by `week` into Sections
 * - Each legacy module becomes a Topic with one Lesson
 * - Remaps checks from moduleId -> lessonId
 * - Writes a backup server/data/store.json.bak and the new file server/data/store.v2.json
 *
 * Usage: node scripts/migrate-store.js
 */

import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../server/data');
const storePath = path.join(dataDir, 'store.json');
const bakPath = path.join(dataDir, `store.json.bak`);
const outPath = path.join(dataDir, 'store.v2.json');

async function safeReadStore() {
  const raw = await readFile(storePath, 'utf8');
  return JSON.parse(raw);
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  console.log('Reading legacy store:', storePath);
  const legacy = await safeReadStore();

  const modules = Array.isArray(legacy.modules) ? legacy.modules : [];
  const checks = legacy.checks || {};

  // Group modules by week
  const sectionsMap = new Map();

  for (const mod of modules) {
    const sectionName = (mod.week || 'Мои модули').trim();
    const sectionKey = slugify(sectionName) || 'misc';
    if (!sectionsMap.has(sectionKey)) {
      sectionsMap.set(sectionKey, {
        id: `section-${sectionKey}`,
        type: 'misc',
        title: sectionName,
        order: 99,
        topics: []
      });
    }

    const topicId = `topic-${mod.id}`;
    const lessonId = `lesson-${mod.id}-1`;

    const topic = {
      id: topicId,
      title: mod.title || 'Без названия',
      description: undefined,
      order: mod.order || 0,
      lessons: [
        {
          id: lessonId,
          title: mod.title || 'Урок',
          content: mod.content || '',
          order: 1,
          builtin: !!mod.builtin
        }
      ]
    };

    sectionsMap.get(sectionKey).topics.push(topic);
  }

  const sections = Array.from(sectionsMap.values());

  // Remap checks: moduleId -> lessonId mapping (lesson per module)
  const newChecks = {};
  for (const mod of modules) {
    const lessonId = `lesson-${mod.id}-1`;
    if (checks[mod.id]) {
      newChecks[lessonId] = checks[mod.id];
    }
  }

  const v2 = {
    sections,
    terms: [],
    checks: newChecks,
    meta: {
      migratedFrom: 'legacy-store.json',
      migratedAt: new Date().toISOString(),
      legacyModuleCount: modules.length
    }
  };

  console.log('Creating backup of legacy store ->', bakPath);
  await mkdir(dataDir, { recursive: true });
  await copyFile(storePath, bakPath);

  console.log('Writing migrated file ->', outPath);
  await writeFile(outPath, JSON.stringify(v2, null, 2), 'utf8');

  console.log(`Migration complete. modules -> ${modules.length}, sections -> ${sections.length}`);
  console.log('Please review server/data/store.v2.json before switching runtime to v2 format.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
