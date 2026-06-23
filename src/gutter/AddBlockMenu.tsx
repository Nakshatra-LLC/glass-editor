// src/gutter/AddBlockMenu.tsx
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { SlashMenu, reduceSlashKey } from "../slash/SlashMenu";
import type { SlashItem } from "../slash/items";
import { clampPopup } from "../positioning";

export function AddBlockMenu({
  editor, items, onClose,
}: { editor: Editor; items: SlashItem[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Always-latest ref so the keydown handler never closes over stale values.
  const latest = useRef({ editor, items, index, onClose });
  latest.current = { editor, items, index, onClose };

  const select = (item: SlashItem) => { item.run(editor); onClose(); };

  // Position the popup near the cursor (best-effort; jsdom returns zeros).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      const size = { width: el.offsetWidth, height: el.offsetHeight };
      const vp = { width: window.innerWidth, height: window.innerHeight };
      const { top, left } = clampPopup(
        { top: coords.top, bottom: coords.bottom, left: coords.left }, size, vp,
      );
      el.style.position = "fixed";
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      el.style.zIndex = "50";
    } catch { /* coords not available (e.g. jsdom) */ }
  }, [editor]);

  // Dismiss on a click outside the popup (the / suggestion menu gets this for free
  // from its plugin lifecycle; this controlled popup needs it explicitly).
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        latest.current.onClose();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Keyboard handling mirrors the suggestion popup's reducer.
  // Reads from `latest` ref so the handler always sees current values
  // without needing to be re-registered on every render.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { editor: ed, items: its, index: idx, onClose: close } = latest.current;
      const r = reduceSlashKey(e.key, { index: idx, count: its.length });
      if (r.close) { e.preventDefault(); close(); return; }
      if (r.select) { e.preventDefault(); if (its[idx]) { its[idx].run(ed); close(); } return; }
      if (r.handled) { e.preventDefault(); setIndex(r.index); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={ref} className="clean-addblock">
      <SlashMenu items={items} selectedIndex={index} onSelect={select} />
    </div>
  );
}
