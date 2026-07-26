import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { UpsertGlossaryInput } from "../../shared/types";

type GlossaryAdminModalProps = {
  open: boolean;
  initialTerm: string;
  onClose: () => void;
  onSubmit: (input: UpsertGlossaryInput, adminToken: string) => Promise<void>;
};

const TOKEN_KEY = "glossaryAdminToken";

export function GlossaryAdminModal({ open, initialTerm, onClose, onSubmit }: GlossaryAdminModalProps) {
  const [term, setTerm] = useState(initialTerm);
  const [aliases, setAliases] = useState("");
  const [content, setContent] = useState("");
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTerm(initialTerm);
      setAliases("");
      setContent("");
      setError(null);
    }
  }, [open, initialTerm]);

  if (!open) return null;

  function resetAndClose() {
    setSubmitting(false);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setContent(await file.text());
  }

  async function handleSubmit() {
    if (!term.trim() || !content.trim() || !adminToken.trim()) return;
    setSubmitting(true);
    setError(null);
    localStorage.setItem(TOKEN_KEY, adminToken.trim());

    try {
      await onSubmit(
        {
          term: term.trim(),
          aliases: aliases.split(",").map((item) => item.trim()).filter(Boolean),
          content
        },
        adminToken.trim()
      );
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить мануал");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && resetAndClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="glossary-title">
        <button className="btn btn-ghost modal-close" onClick={resetAndClose} aria-label="Закрыть">
          <X size={16} />
        </button>
        <h2 id="glossary-title">Мануал по термину</h2>
        <p className="sub">Слово или код станет кликабельным везде в модулях и откроет эту статью в новой вкладке.</p>

        <div className="row2">
          <div className="field">
            <label htmlFor="glossary-term">Термин / код</label>
            <input id="glossary-term" type="text" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Например: useState" />
          </div>
          <div className="field">
            <label htmlFor="glossary-aliases">Синонимы (через запятую)</label>
            <input id="glossary-aliases" type="text" value={aliases} onChange={(event) => setAliases(event.target.value)} placeholder="хук useState, use state" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="glossary-file">Загрузить .md файл</label>
          <input id="glossary-file" ref={fileRef} type="file" accept=".md,.markdown,.txt" onChange={(event) => handleFile(event.target.files?.[0])} />
        </div>

        <div className="field">
          <label htmlFor="glossary-content">Или вставь markdown</label>
          <textarea id="glossary-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder={"# useState\n\nОписание, примеры кода, ссылки..."} />
        </div>

        <div className="field">
          <label htmlFor="glossary-token">Admin-токен</label>
          <input id="glossary-token" type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Токен из ADMIN_TOKEN на сервере" />
        </div>

        {error && <p className="error-state" style={{ margin: "0 0 12px" }}>{error}</p>}

        <div className="modal-actions">
          <button className="btn" onClick={resetAndClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !term.trim() || !content.trim() || !adminToken.trim()}>
            {submitting ? "Сохраняем..." : "Сохранить мануал"}
          </button>
        </div>
      </div>
    </div>
  );
}