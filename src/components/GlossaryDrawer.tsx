import { useEffect, useRef, useState } from "react";
import { X, GripVertical } from "lucide-react";
import type { GlossaryTerm } from "../../shared/types";
import { api } from "../api";
import { highlightCode, renderMarkdown, stripLeadingH1 } from "../markdown";

type GlossaryDrawerProps = { slug: string; onClose: () => void };

export function GlossaryDrawer({ slug, onClose }: GlossaryDrawerProps) {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(420);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const resizeRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX;
      const newWidth = Math.max(280, Math.min(800, startWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    if (isResizing.current) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [width]);

  return (
    <div 
      className="glossary-drawer-overlay" 
      role="dialog" 
      aria-modal="true" 
      onClick={(e) => {
        // Only close if clicking directly on overlay, not on drawer content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <aside 
        className="glossary-drawer" 
        ref={drawerRef} 
        style={{ width: `${width}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="glossary-drawer-resize-handle" 
          ref={resizeRef} 
          title="Перетащи для изменения размера"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            startX.current = e.clientX;
            startWidth.current = width;
          }}
        />
        
        <div className="glossary-drawer-header">
          <div className="glossary-drawer-title-bar">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-dim)' }}>Справка</span>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className="glossary-drawer-body" ref={bodyRef}>
          {!term && !error && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-dim)' }}><h3>Загружаем мануал</h3></div>}
          {error && (
            <div style={{ padding: '20px', color: 'var(--danger)' }}>
              <h3>Ошибка</h3>
              <p>{error}</p>
            </div>
          )}

          {term && (
            <>
              <div className="module-header" style={{ paddingBottom: 12 }}>
                <div className="eyebrow">Термин</div>
                <h2 style={{ marginTop: 6, marginBottom: 4 }}>{term.term}</h2>
                {term.aliases?.length > 0 && <p className="module-stat" style={{ marginBottom: 0 }}>Синонимы: {term.aliases.join(", ")}</p>}
              </div>
              <div className="subsection" dangerouslySetInnerHTML={{ __html: renderMarkdown(stripLeadingH1(term.content)) }} />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
