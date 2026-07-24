import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { GlossaryTerm } from "../../shared/types";
import { api } from "../api";
import { highlightCode, renderMarkdown, stripLeadingH1 } from "../markdown";

type GlossaryPageProps = { slug: string; onClose: () => void };

export function GlossaryPage({ slug, onClose }: GlossaryPageProps) {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setTerm(null);
    setError(null);
    api.getGlossaryTerm(slug)
      .then((data) => { if (active) setTerm(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Не удалось загрузить статью"); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => highlightCode(bodyRef.current));
    return () => cancelAnimationFrame(frame);
  }, [term]);

  if (!term && !error) {
    return <div id="empty-state"><h2>Загружаем статью</h2><p>Читаем мануал по термину.</p></div>;
  }

  if (error) {
    return (
      <div id="empty-state" className="error-state">
        <h2>Не удалось открыть мануал</h2>
        <p>{error}</p>
        <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: 12 }}>
          <ArrowLeft size={16} /> Назад к модулю
        </button>
      </div>
    );
  }

  const html = renderMarkdown(stripLeadingH1(term!.content));

  return (
    <>
      <div className="filterbar">
        <button className="btn btn-ghost compact" onClick={onClose}>
          <ArrowLeft size={15} /> Назад к модулю
        </button>
      </div>

      <div className="module-header">
        <div className="eyebrow">Термин</div>
        <h1>{term!.term}</h1>
        {term!.aliases.length > 0 && (
          <p className="module-stat">Синонимы: {term!.aliases.join(", ")}</p>
        )}
      </div>

      <div id="module-body" ref={bodyRef}>
        <div className="subsection" data-type="content" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}