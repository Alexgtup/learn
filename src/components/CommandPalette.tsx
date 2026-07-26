import { useEffect, useMemo, useRef, useState } from "react";
import { Search, BookOpen, GitBranch, Code, Layers, Plus, Download, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AppStateV2, GlossaryTermSummary } from "../../shared/types";

type Props = {
  open: boolean;
  onClose: () => void;
  v2State: AppStateV2 | null;
  glossaryTerms: GlossaryTermSummary[];
  onOpenImport: () => void;
  onExport: () => void;
  onMockInterview: () => void;
};

type Item = {
  id: string;
  label: string;
  sub: string;
  icon: typeof BookOpen;
  action: () => void;
};

export function CommandPalette({ open, onClose, v2State, glossaryTerms, onOpenImport, onExport, onMockInterview }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    const sectionIcons: Record<string, typeof BookOpen> = {
      algorithms: BookOpen, projects: GitBranch, reference: Code, misc: Layers,
    };
    if (v2State) {
      for (const s of v2State.sections || []) {
        for (const t of s.topics || []) {
          for (const l of t.lessons || []) {
            list.push({
              id: l.id, label: l.title, sub: `${s.title} → ${t.title}`,
              icon: sectionIcons[s.type] || Layers,
              action: () => { navigate(`/${s.type}`); onClose(); },
            });
          }
        }
      }
    }
    for (const g of glossaryTerms) {
      list.push({
        id: `g-${g.slug}`, label: g.term, sub: `Глоссарий${g.aliases.length ? ` · ${g.aliases.join(", ")}` : ""}`,
        icon: BookOpen,
        action: () => { window.location.hash = `#/glossary/${g.slug}`; onClose(); },
      });
    }
    list.push(
      { id: "act-import", label: "Добавить модуль", sub: "Импорт markdown", icon: Plus, action: () => { onOpenImport(); onClose(); } },
      { id: "act-export", label: "Экспорт прогресса", sub: "Скачать JSON", icon: Download, action: () => { onExport(); onClose(); } },
      { id: "act-mock", label: "Mock Interview", sub: "Случайная задача + таймер", icon: Timer, action: () => { onMockInterview(); onClose(); } },
    );
    return list;
  }, [v2State, glossaryTerms, navigate, onClose, onOpenImport, onExport, onMockInterview]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 12);
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)).slice(0, 12);
  }, [items, query]);

  useEffect(() => { setSelected(0); }, [query]);

  if (!open) return null;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && filtered[selected]) { filtered[selected].action(); }
    else if (e.key === "Escape") { onClose(); }
  };

  return (
    <div className="cmd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-dialog" onKeyDown={handleKey}>
        <div className="cmd-input-wrap">
          <Search size={16} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск уроков, терминов, действий…" />
          <kbd>Esc</kbd>
        </div>
        <div className="cmd-list">
          {filtered.length === 0 && <div className="cmd-empty">Ничего не найдено</div>}
          {filtered.map((item, i) => (
            <button key={item.id} className={`cmd-item${i === selected ? " selected" : ""}`}
              onClick={item.action} onMouseEnter={() => setSelected(i)}>
              <item.icon size={15} />
              <div className="cmd-item-text">
                <span className="cmd-label">{item.label}</span>
                <span className="cmd-sub">{item.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}