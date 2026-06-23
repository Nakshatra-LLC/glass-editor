import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent, ReactRenderer, type Content, type Extension, type JSONContent } from "@tiptap/react";
import { defaultExtensions } from "./extensions";
import { defaultSlashItems, type SlashItem } from "./slash/items";
import { aiSlashItems, type AiAdapter } from "./ai/aiSlashItems";
import { SlashMenu, reduceSlashKey } from "./slash/SlashMenu";
import { clampPopup } from "./positioning";
import { CleanBubbleMenu } from "./bubble/BubbleMenu";
import { defaultBubbleItems, type BubbleItem } from "./bubble/items";
import { AskAiInput } from "./ai/AskAiInput";
import { Gutter } from "./gutter/Gutter";
import { AddBlockMenu } from "./gutter/AddBlockMenu";
import { addBlockAfter } from "./gutter/addBlock";

export type CleanEditorProps = {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  /** AI adapter; enables Continue Writing / Ask AI. Pass a stable reference. */
  ai?: AiAdapter;
  /**
   * Customize the editor's extensions.
   * - Pass an **array** to fully replace the built-in defaults (escape hatch).
   * - Pass a **function** `(defaults) => Extension[]` to extend/override them; it
   *   receives the fully-wired defaults (including the working slash command), so
   *   you can append (`[...defaults, X]`), remove (`defaults.filter(...)`), or
   *   reorder without silently disabling the `/` menu.
   */
  extensions?: Extension[] | ((defaults: Extension[]) => Extension[]);
  slashItems?: SlashItem[];
  bubbleItems?: BubbleItem[];
  placeholder?: string;
  className?: string;
  editable?: boolean;
  theme?: "light" | "dark";
  /** Render a built-in read-only JSON inspector of the current document below the editor. Default false. */
  liveDoc?: boolean;
};

export function CleanEditor({
  value, onChange, ai, extensions, slashItems, bubbleItems, placeholder, className, editable = true, theme, liveDoc = false,
}: CleanEditorProps) {
  const [aiMode, setAiMode] = useState<null | "ask" | "continue">(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Latest item set, read lazily by the suggestion plugin so it always reflects current props.
  const itemsRef = useRef<SlashItem[]>([]);
  itemsRef.current = [
    ...(ai ? aiSlashItems(ai, {
      onAsk: () => setAiMode("ask"),
      onContinue: () => setAiMode("continue"),
    }) : []),
    ...defaultSlashItems,
    ...(slashItems ?? []),
  ];

  // Build the fully-wired defaults (slash command included). The array form of
  // `extensions` replaces these; the function form receives them so consumers can
  // extend/override without losing the / menu. Computed each render but only
  // consumed by useEditor on init.
  const buildDefaultExtensions = () =>
    defaultExtensions({
      placeholder,
      slash: { items: () => itemsRef.current, render: slashRenderer },
    });
  const resolvedExtensions =
    typeof extensions === "function"
      ? extensions(buildDefaultExtensions())
      : extensions ?? buildDefaultExtensions();

  const editor = useEditor({
    editable,
    extensions: resolvedExtensions,
    content: value as Content,
    onUpdate: ({ editor }) => onChangeRef.current(editor.getJSON()),
    editorProps: { attributes: { class: "clean-editor__content" } },
  });

  useEffect(() => {
    if (editor && JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(value as Content, false);
      // The add-block menu anchors to the old selection; an external content
      // replacement makes that position stale, so close it.
      setAddMenuOpen(false);
    }
  }, [editor, value]);

  const handleAdd = (pos: number) => {
    if (!editor) return;
    addBlockAfter(editor, pos);
    setAddMenuOpen(true);
  };

  const bubble = [...defaultBubbleItems, ...(bubbleItems ?? [])];

  return (
    <div ref={rootRef} className={`clean-editor${className ? ` ${className}` : ""}`} {...(theme !== undefined ? { "data-theme": theme } : {})}>
      {editor && <Gutter editor={editor} onAdd={handleAdd} />}
      {/* Portal into the .clean-editor root (not a reconciled sibling): the DragHandle/tippy
          reparents DOM nodes out of this subtree, so rendering AddBlockMenu inline would make
          React's insertBefore reference a moved node and crash the tree. Portaling keeps it out
          of that sibling list while still inheriting the editor's CSS theme variables. */}
      {editor && addMenuOpen && rootRef.current && createPortal(
        <AddBlockMenu
          editor={editor}
          items={itemsRef.current}
          onClose={() => setAddMenuOpen(false)}
        />,
        rootRef.current,
      )}
      {editor && <CleanBubbleMenu editor={editor} items={bubble} />}
      <EditorContent editor={editor} />
      {liveDoc && (
        <pre className="clean-livedoc" aria-label="Document JSON">{JSON.stringify(value, null, 2)}</pre>
      )}
      {editor && aiMode && ai && (
        <div className="clean-askai-layer">
          <AskAiInput
            editor={editor}
            placeholder={aiMode === "ask" ? "Ask AI what you want…" : "Continue writing… (Enter to generate)"}
            onSubmit={aiMode === "ask"
              ? (instruction) => ai.ask(editor.getText(), instruction)
              : () => ai.continue(editor.getText())}
            onClose={() => setAiMode(null)}
          />
        </div>
      )}
    </div>
  );
}

// Suggestion render(): mounts SlashMenu in a portal-like layer, positioned via clampPopup,
// driven by reduceSlashKey. Kept in this module so it shares the component imports.
function slashRenderer() {
  let component: ReactRenderer | null = null;
  let container: HTMLDivElement | null = null;
  let index = 0;
  let current: SlashItem[] = [];
  let activeProps: any = null;

  const place = () => {
    if (!container || !activeProps?.clientRect) return;
    const rect = activeProps.clientRect();
    if (!rect) return;
    const size = { width: container.offsetWidth, height: container.offsetHeight };
    const vp = { width: window.innerWidth, height: window.innerHeight };
    const { top, left } = clampPopup(
      { top: rect.top, bottom: rect.bottom, left: rect.left }, size, vp,
    );
    container.style.position = "fixed";
    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    container.style.zIndex = "50";
  };

  const renderList = (props: any) => {
    current = props.items as SlashItem[];
    component?.updateProps({
      items: current,
      selectedIndex: index,
      onSelect: (item: SlashItem) => props.command(item),
    });
    place();
  };

  return {
    onStart: (props: any) => {
      activeProps = props;
      index = 0;
      container = document.createElement("div");
      const root = (props.editor.view.dom as HTMLElement).closest(".clean-editor") ?? document.body;
      root.appendChild(container);
      component = new ReactRenderer(SlashMenu, {
        editor: props.editor,
        props: { items: props.items, selectedIndex: 0, onSelect: (item: SlashItem) => props.command(item) },
      });
      container.appendChild(component.element);
      renderList(props);
      requestAnimationFrame(() => place());
    },
    onUpdate: (props: any) => { activeProps = props; index = Math.min(index, Math.max(0, props.items.length - 1)); renderList(props); },
    onKeyDown: (props: any) => {
      const r = reduceSlashKey(props.event.key, { index, count: current.length });
      if (r.close) { props.event.preventDefault?.(); return false; }
      if (r.select) { if (current[index]) activeProps.command(current[index]); return true; }
      if (r.handled) { index = r.index; renderList(activeProps); return true; }
      return false;
    },
    onExit: () => { component?.destroy(); container?.remove(); component = null; container = null; },
  };
}
