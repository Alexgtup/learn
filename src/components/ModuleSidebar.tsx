import { useEffect, useState } from "react";
import { Plus, Trash2, BookOpen, GitBranch, Code, Layers } from "lucide-react";
import type { CheckMap, ModuleItem, Section } from "../../shared/types";
import { countTasks } from "../markdown";
import { getV2State } from "../api";

type Props = {
  modules: ModuleItem[];
  checks: CheckMap;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenImport: () => void;
};

const sectionIcons: Record<string, typeof BookOpen> = {
  algorithms: BookOpen, projects: GitBranch, reference: Code, misc: Layers,
};

export function ModuleSidebar({ modules, checks, activeId, onSelect, onDelete, onOpenImport }: Props) {
  const [v2, setV2] = useState<Section[] | null>(null);

  useEffect(() => {
    let ok = true;
    getV2State().then((s) => { if (ok && s?.sections?.length) setV2(s.sections); }).catch(() => {});
    return () => { ok = false; };
  }, []);

  if (v2) {
    return (
      <nav id="sidebar">
        <div id="sidebar-groups">
          {v2.map((section) => {
            const Icon = sectionIcons[section.type] || Layers;
            return (
              <div className="sb-section" key={section.id}>
                <div className="sb-section-label">
                  <Icon size={13} />
                  <span>{section.title}</span>
                </div>
                {section.topics?.map((topic) => (
                  <div key={topic.id} className="sb-topic">
                    <div className="sb-topic-label">{topic.title}</div>
                    {topic.lessons?.map((lesson) => {
                      const total = countTasks(lesson.content || "");
                      const done = Object.values(checks[lesson.id] || {}).filter(Boolean).length;
                      const pct = total ? Math.round((done / total) * 100) : 0;
                      return (
                        <div className={`sb-row${lesson.id === activeId ? " active" : ""}`}
                          key={lesson.id} onClick={() => onSelect(lesson.id)}>
                          <div className="sb-idx">{lesson.order?.toString().padStart(2, "0") || "•"}</div>
                          <div className="sb-main">
                            <div className="sb-title">{lesson.title}</div>
                            {total > 0 && (
                              <div className="sb-prog">
                                <div className="sb-bar"><div className="sb-bar-fill" style={{ width: `${pct}%` }} /></div>
                                <span className="sb-frac">{done}/{total}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div id="sidebar-footer">
          <button className="btn btn-primary sidebar-action" onClick={onOpenImport}>
            <Plus size={15} /> Модуль
          </button>
        </div>
      </nav>
    );
  }

  /* legacy fallback */
  const groups = modules.reduce<Record<string, { order: number; items: ModuleItem[] }>>((a, m) => {
    const k = m.week || "Модули";
    a[k] ||= { order: m.weekOrder ?? 50, items: [] };
    a[k].items.push(m);
    return a;
  }, {});
  let counter = 0;

  return (
    <nav id="sidebar">
      <div id="sidebar-groups">
        {Object.entries(groups).sort(([, a], [, b]) => a.order - b.order).map(([week, g]) => (
          <div className="sb-section" key={week}>
            <div className="sb-section-label"><Layers size={13} /><span>{week}</span></div>
            {g.items.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((m) => {
              counter++;
              const total = countTasks(m.content);
              const done = Object.values(checks[m.id] || {}).filter(Boolean).length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div className={`sb-row${m.id === activeId ? " active" : ""}`} key={m.id}
                  onClick={() => onSelect(m.id)}>
                  <div className="sb-idx">{String(counter).padStart(2, "0")}</div>
                  <div className="sb-main">
                    <div className="sb-title">{m.title}</div>
                    {total > 0 && (
                      <div className="sb-prog">
                        <div className="sb-bar"><div className="sb-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="sb-frac">{done}/{total}</span>
                      </div>
                    )}
                  </div>
                  <button className="sb-del" onClick={(e) => { e.stopPropagation(); onDelete(m.id); }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div id="sidebar-footer">
        <button className="btn btn-primary sidebar-action" onClick={onOpenImport}>
          <Plus size={15} /> Модуль
        </button>
      </div>
    </nav>
  );
}