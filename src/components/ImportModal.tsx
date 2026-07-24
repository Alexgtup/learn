import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { CreateModuleInput, SectionType } from "../../shared/types";

type ImportModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateModuleInput & { sectionType: SectionType }) => Promise<void>;
};

export function ImportModal({ open, onClose, onSubmit }: ImportModalProps) {
  const [title, setTitle] = useState("");
  const [sectionType, setSectionType] = useState<SectionType>("algorithms");
  const [topicName, setTopicName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  function resetAndClose() {
    setTitle("");
    setSectionType("algorithms");
    setTopicName("");
    setContent("");
    setSubmitting(false);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setContent(await file.text());
    if (!title) {
      setTitle(file.name.replace(/\.(md|markdown|txt)$/i, "").replace(/[_-]/g, " "));
    }
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);
    await onSubmit({ 
      title: title || "Без названия",
      content,
      sectionType,
      week: topicName || "Общие"
    });
    resetAndClose();
  }

  const sectionLabels: Record<SectionType, string> = {
    algorithms: "Алгоритмы",
    projects: "Проекты",
    reference: "Справочник",
    misc: "Разное"
  };

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && resetAndClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <button className="btn btn-ghost modal-close" onClick={resetAndClose} aria-label="Закрыть">
          <X size={16} />
        </button>
        <h2 id="import-title">Добавить материал</h2>
        <p className="sub">Выбери раздел, загрузи файл или вставь текст.</p>

        <div className="field">
          <label htmlFor="section-type">Раздел</label>
          <select 
            id="section-type" 
            value={sectionType} 
            onChange={(e) => setSectionType(e.target.value as SectionType)}
            style={{ width: '100%', padding: '9px 11px', background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 13.5, borderRadius: 3, fontFamily: 'inherit' }}
          >
            <option value="algorithms">Алгоритмы</option>
            <option value="projects">Проекты</option>
            <option value="reference">Справочник</option>
            <option value="misc">Разное</option>
          </select>
        </div>

        <div className="row2">
          <div className="field">
            <label htmlFor="module-title">Название урока/задачи</label>
            <input id="module-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например: Two Pointers" />
          </div>
          <div className="field">
            <label htmlFor="topic-name">Тема/Группа</label>
            <input id="topic-name" type="text" value={topicName} onChange={(event) => setTopicName(event.target.value)} placeholder="Например: Easy Level" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="module-file">Загрузить файл</label>
          <input id="module-file" ref={fileRef} type="file" accept=".md,.markdown,.txt" onChange={(event) => handleFile(event.target.files?.[0])} />
        </div>

        <div className="field">
          <label htmlFor="module-content">Или вставь текст</label>
          <textarea id="module-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder={"# Заголовок\n\n## Теория\nОписание паттерна...\n\n## Практика\n- [ ] Задача 1"} />
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={resetAndClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !content.trim()}>
            {submitting ? "Добавляем..." : `Добавить в ${sectionLabels[sectionType]}`}
          </button>
        </div>
      </div>
    </div>
  );
}
