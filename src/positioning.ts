const GAP = 4;
const MARGIN = 8;

export function clampPopup(
  anchor: { top: number; bottom: number; left: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): { top: number; left: number } {
  const below = anchor.bottom + GAP;
  const fitsBelow = below + size.height <= viewport.height;
  const top = fitsBelow ? below : anchor.top - size.height - GAP;
  const maxLeft = viewport.width - size.width - MARGIN;
  const left = Math.max(MARGIN, Math.min(anchor.left, maxLeft));
  return { top, left };
}
