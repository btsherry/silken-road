// Globe inset — orthographic projection of Afro-Eurasia, highlighting current region.

window.GlobeInset = function GlobeInset({ focusPoint }) {
  // Globe is purely decorative. We rotate a simplified landmass silhouette so the
  // highlighted region sits roughly center. focusPoint has { x, y } in map coords 0-2000 / 0-1100.
  // Convert map x -> longitude offset. Map x 1000 ~ 50° E (center of Persia).
  const mapX = focusPoint ? focusPoint.x : 1000;
  const lon = ((mapX / 2000) * 140) - 15;  // rough: -15 to +125 E
  const rot = -lon + 50; // so center of map (roughly 50E) is front

  return (
    <svg className="globe-svg" viewBox="0 0 160 160">
      <defs>
        <radialGradient id="globeOcean" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="oklch(0.48 0.1 265)"/>
          <stop offset="70%" stopColor="oklch(0.28 0.09 265)"/>
          <stop offset="100%" stopColor="oklch(0.18 0.07 265)"/>
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx="80" cy="80" r="70"/>
        </clipPath>
      </defs>

      <circle cx="80" cy="80" r="70" fill="url(#globeOcean)"/>

      <g clipPath="url(#globeClip)">
        {/* Latitude/longitude lines */}
        <g fill="none" stroke="oklch(0.7 0.12 82 / 0.3)" strokeWidth="0.4">
          {[-60, -30, 0, 30, 60].map(l => (
            <ellipse key={l} cx="80" cy={80 + l * 0.7} rx={70 * Math.cos(l * Math.PI / 180)} ry="3"/>
          ))}
          {[0, 30, 60, 90, 120, 150].map(l => (
            <ellipse key={l} cx="80" cy="80" rx={Math.abs(Math.sin((l + rot) * Math.PI / 180)) * 70} ry="70"/>
          ))}
        </g>

        <g transform={`translate(80, 80)`}>
          <g transform={`rotate(${-rot * 0.5})`}>
            {/* Eurasia silhouette, stylized */}
            <path
              d="M -50 -30 Q -40 -35 -20 -30 Q 0 -32 20 -28 Q 40 -28 55 -20
                 Q 55 -5 45 5 Q 30 8 20 2 Q 0 5 -10 -5 Q -25 -3 -40 -10 Q -50 -20 -50 -30 Z"
              fill="oklch(0.78 0.1 75)"
              stroke="oklch(0.5 0.08 65)"
              strokeWidth="0.6"
              opacity="0.85"
            />
            {/* Africa */}
            <path
              d="M -15 5 Q -5 8 0 20 Q 2 38 -5 48 Q -15 50 -20 40 Q -25 25 -20 10 Q -18 5 -15 5 Z"
              fill="oklch(0.74 0.09 70)" stroke="oklch(0.5 0.08 65)" strokeWidth="0.6" opacity="0.85"
            />
            {/* Arabia */}
            <path
              d="M 5 -5 Q 14 0 16 12 Q 14 22 6 22 Q -2 15 0 0 Q 2 -4 5 -5 Z"
              fill="oklch(0.76 0.09 72)" stroke="oklch(0.5 0.08 65)" strokeWidth="0.6" opacity="0.85"
            />
            {/* India */}
            <path
              d="M 28 3 Q 35 5 38 18 Q 36 28 28 30 Q 22 22 24 10 Q 26 4 28 3 Z"
              fill="oklch(0.76 0.09 72)" stroke="oklch(0.5 0.08 65)" strokeWidth="0.6" opacity="0.85"
            />
          </g>
        </g>

        {/* Focus point dot */}
        {focusPoint && (
          <g transform={`translate(80, 80)`}>
            <circle r="4" fill="var(--crimson, #9c3d2a)" stroke="var(--gold-bright, #e5c45a)" strokeWidth="1"/>
            <circle r="9" fill="none" stroke="var(--crimson, #9c3d2a)" strokeWidth="0.8" opacity="0.5">
              <animate attributeName="r" values="4;12;4" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite"/>
            </circle>
          </g>
        )}
      </g>

      {/* Highlight / sphere shading */}
      <circle cx="80" cy="80" r="70" fill="none"
              stroke="oklch(0.78 0.1 82 / 0.45)" strokeWidth="1"/>
      <ellipse cx="62" cy="58" rx="22" ry="14" fill="oklch(0.85 0.04 82 / 0.1)"/>
    </svg>
  );
};
