import { useState, useEffect, useRef } from "react";
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

export type CleanEditorProps = {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  /** AI adapter; enables Continue Writing / Ask AI. Pass a stable reference. */
  ai?: AiAdapter;
  extensions?: Extension[];
  slashItems?: SlashItem[];
  bubbleItems?: BubbleItem[];
  placeholder?: string;
  className?: string;
  editable?: boolean;
  theme?: "light" | "dark";
};

export function CleanEditor({
  value, onChange, ai, extensions, slashItems, bubbleItems, placeholder, className, editable = true, theme,
}: CleanEditorProps) {
  const [aiMode, setAiMode] = useState<null | "ask" | "continue">(null);
  const [gutterTop, setGutterTop] = useState<number | null>(null);
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

  const editor = useEditor({
    editable,
    extensions: extensions ?? defaultExtensions({
      placeholder,
      slash: { items: () => itemsRef.current, render: slashRenderer },
    }),
    content: value as Content,
    onUpdate: ({ editor }) => onChangeRef.current(editor.getJSON()),
    editorProps: { attributes: { class: "clean-editor__content" } },
  });

  useEffect(() => {
    if (editor && JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(value as Content, false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const root = rootRef.current;
      if (!root) return;
      try {
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        const rootRect = root.getBoundingClientRect();
        const next = coords.top - rootRect.top;
        setGutterTop(prev => prev === next ? prev : next);
      } catch { /* position not available yet */ }
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const bubble = [...defaultBubbleItems, ...(bubbleItems ?? [])];

  return (
    <div ref={rootRef} className={`clean-editor${className ? ` ${className}` : ""}`} {...(theme !== undefined ? { "data-theme": theme } : {})}>
      {editor && <Gutter editor={editor} top={gutterTop} />}
      {editor && <CleanBubbleMenu editor={editor} items={bubble} />}
      <EditorContent editor={editor} />
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
