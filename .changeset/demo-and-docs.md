---
"@nakshatra.io/clean-editor": patch
---

Add an opt-in `liveDoc` prop to `CleanEditor` — renders a built-in, read-only JSON inspector of the current document (default `false`).

Also: fix the demo's light/dark page chrome (the toggle now themes the whole page) and the header logo (solid app icon, base-path aware so it renders on the Pages subpath and on light backgrounds); the demo dogfoods `liveDoc` via a "Show JSON" toggle; add demo screenshots + a live-demo link to the README.
