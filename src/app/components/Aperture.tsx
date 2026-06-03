interface ApertureProps {
  size?: number;
  draw?: boolean;
  spin?: boolean;
  className?: string;
}

/**
 * Camera-obscura aperture mark: 6 chords tangent to an inner circle, inside an
 * outer ring — the iris. Self-draws (pathLength=1) and can slowly rotate.
 */
export function Aperture({ size = 132, draw = false, spin = false, className = "" }: ApertureProps) {
  const c = 50;
  const R = 46; // outer ring radius
  const r = 15; // inner tangent radius
  const blades = 6;
  const L = Math.sqrt(R * R - r * r); // half-chord length inside the ring

  const lines = Array.from({ length: blades }, (_, i) => {
    const phi = (i * Math.PI * 2) / blades;
    const tx = c + r * Math.cos(phi);
    const ty = c + r * Math.sin(phi);
    const dx = -Math.sin(phi);
    const dy = Math.cos(phi);
    return {
      x1: tx + L * dx,
      y1: ty + L * dy,
      x2: tx - L * dx,
      y2: ty - L * dy,
    };
  });

  const classes = ["aperture", draw ? "draw" : "", spin ? "spin" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Obscura Agent"
    >
      <circle className="ap-ring" cx={c} cy={c} r={R} pathLength={1} />
      {lines.map((ln, i) => (
        <line
          key={i}
          className="ap-blade"
          x1={ln.x1}
          y1={ln.y1}
          x2={ln.x2}
          y2={ln.y2}
          pathLength={1}
        />
      ))}
      <circle className="ap-core" cx={c} cy={c} r={r} pathLength={1} />
    </svg>
  );
}
