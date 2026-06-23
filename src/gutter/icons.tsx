const base = {
  width: 16, height: 16, viewBox: "0 0 16 16",
  fill: "none", stroke: "currentColor", strokeWidth: 1.5,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconPlus() {
  return (
    <svg {...base}><path d="M8 3.5v9M3.5 8h9" /></svg>
  );
}

export function IconGrip() {
  // 2 columns x 3 rows of dots — the universal drag affordance.
  const cx = [6, 10];
  const cy = [4, 8, 12];
  return (
    <svg {...base} fill="currentColor" stroke="none" aria-hidden={true}>
      {cy.flatMap((y) => cx.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} />))}
    </svg>
  );
}
