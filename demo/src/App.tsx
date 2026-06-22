import { useState, useEffect } from "react";
import type { JSONContent } from "@tiptap/react";
import { CleanEditor, type AiAdapter } from "@nakshatra.io/clean-editor";
import "@nakshatra.io/clean-editor/styles.css";

type Theme = "light" | "dark";

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
      content: [{ type: "text", text: "Welcome to clean-editor" }],
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
  const [theme, setTheme] = useState<Theme>(
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-demo-theme", theme);
  }, [theme]);

  return (
    <div className="demo-layout" data-demo-theme={theme}>
      <header className="demo-header">
        <img src={`${import.meta.env.BASE_URL}appicon.svg`} alt="" width={36} height={36} className="demo-logo" />
        <div>
          <h1>@nakshatra.io/clean-editor</h1>
          <p>Runnable demo — Vite + React. Press <kbd>/</kbd> for blocks, AI adapter included.</p>
        </div>
        <button
          className="demo-theme-btn"
          onClick={() => setShowJson(v => !v)}
        >
          {showJson ? "Hide JSON" : "Show JSON"}
        </button>
        <button
          className="demo-theme-btn"
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      <main className="demo-main">
        <div className={`demo-split${showJson ? " demo-split--open" : ""}`}>
          <div className="editor-wrapper">
            <CleanEditor
              value={doc}
              onChange={setDoc}
              ai={mockAi}
              theme={theme}
              placeholder="Write something, or press / for blocks…"
            />
          </div>
          {showJson && (
            <div className="demo-json">
              <pre>{JSON.stringify(doc, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
