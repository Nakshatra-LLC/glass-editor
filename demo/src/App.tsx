import { useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { GlassEditor, type AiAdapter } from "@nakshatra/glass-editor";
import "@nakshatra/glass-editor/styles.css";

const mockAi: AiAdapter = {
  continue: (_ctx) =>
    new Promise((res) =>
      setTimeout(() => res(" …and then the story continued."), 600)
    ),
  ask: (_ctx, instruction) =>
    new Promise((res) =>
      setTimeout(
        () => res(`[AI: ${instruction}] Here is a thoughtful response.`),
        800
      )
    ),
};

const initialDoc: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Welcome to glass-editor" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is a controlled demo. Type below, press / for the slash menu, or use the AI commands.",
        },
      ],
    },
  ],
};

export default function App() {
  const [doc, setDoc] = useState<JSONContent>(initialDoc);

  return (
    <div className="demo-layout">
      <header className="demo-header">
        <h1>@nakshatra/glass-editor</h1>
        <p>Runnable demo — Vite + React. Press <kbd>/</kbd> for blocks, AI adapter included.</p>
      </header>

      <main className="demo-main">
        <div className="editor-wrapper">
          <GlassEditor
            value={doc}
            onChange={setDoc}
            ai={mockAi}
            placeholder="Write something, or press / for blocks…"
          />
        </div>

        <section className="json-preview">
          <h2>Live doc (JSONContent)</h2>
          <pre>{JSON.stringify(doc, null, 2)}</pre>
        </section>
      </main>
    </div>
  );
}
