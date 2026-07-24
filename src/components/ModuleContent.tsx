import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsDown, ChevronsUp, CloudBackup } from "lucide-react";
import type { ModuleItem, Lesson } from "../../shared/types";
import { applyGlossaryHighlight, type GlossaryMatcher } from "../glossaryHighlight";
import { badgeLabel, classifySection, countTasks, escapeHtml, highlightCode, renderMarkdown, splitSections, stripLeadingH1 } from "../markdown";

type ModuleContentProps = {
  // Accept either legacy ModuleItem or v2 Lesson model
  module: ModuleItem | Lesson | null;
  checks: Record<string, boolean>;
  onCheckChange: (taskIndex: number, checked: boolean) => void;
  glossaryMatcher: GlossaryMatcher | null;
  onOpenGlossary: (slug: string) => void;
  onCreateGlossaryTerm: (selectedText: string) => void;
};

type Filter = "all" | "theory" | "practice";

function buildModuleHtml(markdown: string): string {
  const cleaned = stripLeadingH1(markdown);
  const top = splitSections(cleaned, 2);
  let html = "";

  if (top.intro) {
    html += `<div class="module-intro">${renderMarkdown(top.intro)}</div>`;
  }

  top.sections.forEach((section, index) => {
    const subsections = splitSections(section.body, 3);
    let sectionHtml = "";

    if (subsections.intro) {
      sectionHtml += `<div class="subsection" data-type="content">${renderMarkdown(subsections.intro)}</div>`;
    }

    subsections.sections.forEach((subsection) => {
      const type = classifySection(subsection.title);
      const badge = type !== "content" ? `<span class="badge badge-${type}">${badgeLabel(type)}</span>` : "";
      sectionHtml += `<div class="subsection" data-type="${type}">${badge}${renderMarkdown(`### ${subsection.title}\n${subsection.body}`)}</div>`;
    });

    html += `<div class="day ${index === 0 ? "open" : ""}">
  <div class="day-summary">
    <span class="day-toggle" role="button" tabindex="0" aria-label="Свернуть или развернуть день">▸</span>
    <span class="day-index">${String(index + 1).padStart(2, "0")}</span>
    <span class="day-title">${escapeHtml(section.title)}</span>
  </div>
  <div class="day-body">${sectionHtml}</div>
</div>`;
  });

  return html;
}

export function ModuleContent({ module, checks, onCheckChange, glossaryMatcher, onOpenGlossary, onCreateGlossaryTerm }: ModuleContentProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const html = useMemo(() => (module ? buildModuleHtml(module.content) : ""), [module]);

  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number; text: string } | null>(null);

  // подсветка терминов и кода — повторно при смене контента или при взаимодействиях
  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;
    applyGlossaryHighlight(container, glossaryMatcher);
    highlightCode(container);
  }, [html, glossaryMatcher, selectionPopup]);

  // Ensure highlighting is re-applied when DOM nodes (code blocks) are inserted/changed
  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    let debounceId: number | null = null;
    const run = () => {
      applyGlossaryHighlight(container, glossaryMatcher);
      highlightCode(container);
    };

    const mo = new MutationObserver((mutations) => {
      let relevant = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const n of Array.from(m.addedNodes)) {
            if ((n as Element).nodeType === 1) {
              const el = n as Element;
              if (el.matches && (el.matches('pre') || el.querySelector?.('pre') || el.matches('code') || el.querySelector?.('code'))) { relevant = true; break; }
            }
          }
        }
        if (m.type === 'attributes' && (m.target as Element).matches && (m.target as Element).matches('code, pre')) {
          relevant = true; break;
        }
      }
      if (relevant) {
        if (debounceId) window.clearTimeout(debounceId);
        debounceId = window.setTimeout(() => { run(); debounceId = null; }, 80);
      }
    });

    mo.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => { mo.disconnect(); if (debounceId) window.clearTimeout(debounceId); };
  }, [html, glossaryMatcher]);

  // клик по термину глоссария
  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    // track last opened glossary slug to avoid reopening same page
    const lastOpenedSlug = { value: null as string | null };
    // when dblclick adds a term, ignore the immediate following click for that slug
    const ignoreNextClickFor = { value: null as string | null };

    const handleTermClick = (event: MouseEvent) => {
      // only respond to single clicks
      if ((event.detail ?? 1) > 1) return;
      const target = (event.target as HTMLElement).closest<HTMLElement>(".glossary-term");
      const slug = target?.dataset.slug || null;
      if (!slug) return;
      if (ignoreNextClickFor.value && ignoreNextClickFor.value === slug) {
        // consume and reset
        ignoreNextClickFor.value = null;
        return;
      }
      if (lastOpenedSlug.value === slug) return; // already opened
      lastOpenedSlug.value = slug;
      onOpenGlossary(slug);
    };

    const handleTermDblClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(".glossary-term");
      if (!target) return;
      const text = (target.textContent || "").trim();
      if (!text) return;
      // prevent the single-click handler from immediately opening the same slug
      const slug = target.dataset.slug || null;
      if (slug) ignoreNextClickFor.value = slug;
      onCreateGlossaryTerm(text);
    };

    container.addEventListener("click", handleTermClick);
    container.addEventListener("dblclick", handleTermDblClick);
    return () => {
      container.removeEventListener("click", handleTermClick);
      container.removeEventListener("dblclick", handleTermDblClick);
    };
  }, [html, onOpenGlossary]);

// Разворачивание/сворачивание ЛЮБОГО <details> внутри контента (включая "день"
// и произвольные вложенные блоки-спойлеры, которые автор мог добавить прямо в
// markdown как HTML) — только через кнопку-стрелку. Клик по самому <summary>
// никогда не переключает состояние сам по себе.
useEffect(() => {
  const container = bodyRef.current;
  if (!container) return;

  const cleanups: Array<() => void> = [];
  // Normalize any native <details> from imported markdown into our non-native .day structure
  const transformTimer = window.setTimeout(() => {
    const nativeDetails = Array.from(container.querySelectorAll<HTMLDetailsElement>("details"));
    nativeDetails.forEach((d) => {
      const wrapper = document.createElement("div");
      wrapper.className = "day";
      if (d.hasAttribute("open")) wrapper.classList.add("open");

      const summaryEl = d.querySelector("summary");
      const summaryDiv = document.createElement("div");
      summaryDiv.className = "day-summary";
      if (summaryEl) {
        while (summaryEl.firstChild) summaryDiv.appendChild(summaryEl.firstChild);
      }

      const bodyDiv = document.createElement("div");
      bodyDiv.className = "day-body";
      Array.from(d.childNodes).forEach((node) => {
        if (node.nodeName !== "SUMMARY") bodyDiv.appendChild(node.cloneNode(true));
      });

      wrapper.appendChild(summaryDiv);
      wrapper.appendChild(bodyDiv);
      d.replaceWith(wrapper);
    });
  }, 0);

  const summaries = Array.from(container.querySelectorAll<HTMLElement>(".day > .day-summary"));

  summaries.forEach((summary) => {
    const details = summary.closest(".day");
    if (!details) return;

    // Если у этого summary ещё нет собственной стрелки (значит, это не "день",
    // сгенерированный нами, а произвольный <details> из текста) — добавляем её.
    let toggleHandle = summary.querySelector<HTMLElement>(":scope > .day-toggle");
    let createdToggle = false;
    if (!toggleHandle) {
      toggleHandle = document.createElement("span");
      toggleHandle.className = "day-toggle";
      toggleHandle.setAttribute("role", "button");
      toggleHandle.setAttribute("tabindex", "0");
      toggleHandle.setAttribute("aria-label", "Свернуть или развернуть");
      toggleHandle.textContent = "▸";
      summary.prepend(toggleHandle);
      createdToggle = true;
    }

    const handle = toggleHandle;
    const toggle = () => { details.classList.toggle("open"); };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    };

    handle.addEventListener("keydown", handleKeydown);
    cleanups.push(() => {
      handle.removeEventListener("keydown", handleKeydown);
      if (createdToggle) handle.remove();
    });
  });

  // Global (for this module content) capture handler: intercept clicks on any summary-like element
  const captureClick = (e: MouseEvent) => {
    const raw = (e.target as HTMLElement);
    const toggle = raw.closest?.('.day-toggle') as HTMLElement | null;
    if (!toggle) return; // only handle clicks on the explicit toggle control

    // ignore multi-clicks (let native selection/dblclicks behave)
    if (typeof e.detail === 'number' && e.detail > 1) return;

    const wrapper = toggle.closest('.day') as HTMLElement | null;
    if (!wrapper) return;

    e.preventDefault();
    e.stopPropagation();
    wrapper.classList.toggle('open');
  };

  container.addEventListener('click', captureClick, true);
  cleanups.push(() => container.removeEventListener('click', captureClick, true));

  // Observe DOM mutations inside container and normalize any native <details> nodes
  const mo = new MutationObserver(() => {
    const nativeDetails = Array.from(container.querySelectorAll('details'));
    nativeDetails.forEach((d) => {
      // skip if already processed
      if (d.dataset?.processed === '1') return;
      const wrapper = document.createElement('div'); wrapper.className = 'day';
      if (d.hasAttribute('open')) wrapper.classList.add('open');
      const summaryEl = d.querySelector('summary');
      const summaryDiv = document.createElement('div'); summaryDiv.className = 'day-summary';
      if (summaryEl) while (summaryEl.firstChild) summaryDiv.appendChild(summaryEl.firstChild);
      const bodyDiv = document.createElement('div'); bodyDiv.className = 'day-body';
      Array.from(d.childNodes).forEach(node => { if (node.nodeName !== 'SUMMARY') bodyDiv.appendChild(node.cloneNode(true)); });
      wrapper.appendChild(summaryDiv); wrapper.appendChild(bodyDiv);
      d.replaceWith(wrapper);
    });
  });
  mo.observe(container, { childList: true, subtree: true });
  cleanups.push(() => mo.disconnect());

  return () => cleanups.forEach((cleanup) => cleanup());
}, [html]);

  // чекбоксы задач
  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    const boxes = Array.from(container.querySelectorAll<HTMLInputElement>("input[type='checkbox']"));
    const cleanups: Array<() => void> = [];

    boxes.forEach((checkbox, index) => {
      const key = String(index);
      checkbox.disabled = false;
      checkbox.checked = !!checks[key];
      const listItem = checkbox.closest("li");
      listItem?.classList.toggle("done", checkbox.checked);

      const handler = () => {
        listItem?.classList.toggle("done", checkbox.checked);
        onCheckChange(index, checkbox.checked);
      };

      checkbox.addEventListener("change", handler);
      cleanups.push(() => checkbox.removeEventListener("change", handler));
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html, checks, onCheckChange]);

  // всплывающая кнопка "+ Мануал" при выделении текста

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;

    const containerEl = container;

    function handleSelectionChange() {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";

      if (!text || text.length > 120 || !selection || selection.rangeCount === 0) {
        setSelectionPopup(null);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!containerEl.contains(range.commonAncestorContainer)) {
        setSelectionPopup(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setSelectionPopup({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 8,
        text
      });
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [module?.id]);

  if (!module) {
    return (
      <div id="empty-state">
        <h2>Модулей пока нет</h2>
        <p>Импортируй markdown-файл или добавь новый модуль.</p>
      </div>
    );
  }

  const total = countTasks(module.content);
  const checked = Object.values(checks).filter(Boolean).length;
  const eyebrow = (module as any).week || (module as any).section || "";
  const title = (module as any).title || "Без названия";

  return (
    <>
      <div className="module-header">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="module-stat">{checked}/{total} задач закрыто</p>
      </div>

      <div className="filterbar">
        {(["all", "theory", "practice"] as const).map((item) => (
          <button className={`filter-btn ${filter === item ? "active" : ""}`} key={item} onClick={() => setFilter(item)}>
            {item === "all" ? "Все" : item === "theory" ? "Теория" : "Практика"}
          </button>
        ))}
        <span className="spacer" />
        <button className="btn btn-ghost compact" onClick={() => bodyRef.current?.querySelectorAll(".day").forEach((item) => item.classList.add("open"))}>
          <ChevronsDown size={15} /> Развернуть
        </button>
        <button className="btn btn-ghost compact" onClick={() => bodyRef.current?.querySelectorAll(".day").forEach((item) => item.classList.remove("open"))}>
          <ChevronsUp size={15} /> Свернуть
        </button>
      </div>

      <div id="module-body-wrap" style={{ position: "relative" }}>
        {selectionPopup && (
          <button
            className="btn btn-primary selection-add-term"
            style={{ position: "absolute", left: selectionPopup.x, top: selectionPopup.y, transform: "translate(-50%, -100%)" }}
            onClick={() => {
              onCreateGlossaryTerm(selectionPopup.text);
              setSelectionPopup(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            + Мануал для «{selectionPopup.text.length > 24 ? selectionPopup.text.slice(0, 24) + "…" : selectionPopup.text}»
          </button>
        )}
        <div id="module-body" ref={bodyRef} className={filter === "theory" ? "hide-practice" : filter === "practice" ? "hide-theory" : ""} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}