import type { SlashItem } from "./items";

export function reduceSlashKey(
  key: string,
  state: { index: number; count: number },
): { index: number; handled: boolean; select: boolean; close: boolean } {
  const { index, count } = state;
  const base = { index, handled: false, select: false, close: false };
  if (count === 0) {
    if (key === "Escape") return { ...base, close: true, handled: true };
    return base;
  }
  switch (key) {
    case "ArrowDown": return { ...base, index: (index + 1) % count, handled: true };
    case "ArrowUp": return { ...base, index: (index - 1 + count) % count, handled: true };
    case "Enter":
    case "Tab": return { ...base, select: true, handled: true };
    case "Escape": return { ...base, close: true, handled: true };
    default: return base;
  }
}

export function SlashMenu({
  items, selectedIndex, onSelect,
}: { items: SlashItem[]; selectedIndex: number; onSelect: (item: SlashItem) => void }) {
  if (items.length === 0) {
    return <div className="clean-slash" role="menu"><div className="clean-slash__empty">No results</div></div>;
  }
  const groups = Array.from(new Set(items.map((i) => i.group ?? "Blocks")));
  return (
    <div className="clean-slash" role="menu">
      {groups.map((g) => (
        <div key={g} className="clean-slash__group">
          <div className="clean-slash__label">{g}</div>
          {items.filter((i) => (i.group ?? "Blocks") === g).map((i) => {
            const flatIndex = items.indexOf(i);
            const active = flatIndex === selectedIndex;
            return (
              <button
                key={i.id}
                type="button"
                role="menuitem"
                className={`clean-slash__item${active ? " is-active" : ""}`}
                aria-selected={active}
                onMouseDown={(e) => { e.preventDefault(); onSelect(i); }}
              >
                {i.icon && <span className="clean-slash__icon">{i.icon}</span>}
                <span className="clean-slash__text">{i.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
