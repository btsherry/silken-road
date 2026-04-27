// Astrolabe inset — illuminated rete (PNG) + rotating alidade (SVG) + center pin.
// The rete spins ambiently; the alidade points to the longitude of the
// currently-selected place if there is one.

window.GlobeInset = function GlobeInset({ focusPoint }) {
  // viewBox x → longitude offset. The map covers roughly -10°W to +135°E
  // across viewBox 0..2400, with the painted content centered.
  const mapX = focusPoint ? focusPoint.x : 1200;
  const lon = ((mapX / 2400) * 145) - 10;     // ≈ -10..135 E
  // Alidade angle: 0° points up (north), positive degrees clockwise.
  // We map longitude such that 50°E (Persia) sits straight up by default.
  const alidadeRot = lon - 50;

  return (
    <div className="astrolabe-stack">
      {/* MATER — fixed back plate with brass outer ring, indigo inner field,
          horizon arc, hour curves, almucantar circles, and the equator/tropic
          lines. Suggests latitude/longitude beneath the rotating rete. */}
      <svg className="astrolabe-mater" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="materField" cx="40%" cy="35%" r="65%">
            <stop offset="0%"  stopColor="oklch(0.36 0.08 265)"/>
            <stop offset="65%" stopColor="oklch(0.22 0.08 265)"/>
            <stop offset="100%" stopColor="oklch(0.14 0.05 265)"/>
          </radialGradient>
        </defs>
        {/* Brass outer rim */}
        <circle cx="100" cy="100" r="95" fill="oklch(0.62 0.14 75)"
                stroke="oklch(0.42 0.12 65)" strokeWidth="1.2"/>
        <circle cx="100" cy="100" r="92" fill="none"
                stroke="oklch(0.45 0.10 65)" strokeWidth="0.5"/>
        {/* Inner indigo field */}
        <circle cx="100" cy="100" r="86" fill="url(#materField)"/>
        {/* Tropic of Cancer/Capricorn (faint) */}
        <circle cx="100" cy="100" r="60" fill="none"
                stroke="oklch(0.65 0.10 75 / 0.30)" strokeWidth="0.5"/>
        <circle cx="100" cy="100" r="34" fill="none"
                stroke="oklch(0.65 0.10 75 / 0.30)" strokeWidth="0.5"/>
        {/* Equator */}
        <circle cx="100" cy="100" r="48" fill="none"
                stroke="oklch(0.65 0.10 75 / 0.45)" strokeWidth="0.6"/>
        {/* Horizon arc */}
        <path d="M 14 100 A 200 200 0 0 1 186 100" fill="none"
              stroke="oklch(0.78 0.13 82 / 0.7)" strokeWidth="0.8"/>
        {/* Almucantar arcs above horizon */}
        <path d="M 30 92 A 120 120 0 0 1 170 92" fill="none"
              stroke="oklch(0.65 0.10 75 / 0.4)" strokeWidth="0.4"/>
        <path d="M 50 80 A 90 90 0 0 1 150 80" fill="none"
              stroke="oklch(0.65 0.10 75 / 0.4)" strokeWidth="0.4"/>
        <path d="M 70 65 A 60 60 0 0 1 130 65" fill="none"
              stroke="oklch(0.65 0.10 75 / 0.4)" strokeWidth="0.4"/>
        {/* Hour curves */}
        <g fill="none" stroke="oklch(0.65 0.10 75 / 0.35)" strokeWidth="0.4">
          <path d="M 100 14 Q 70 100 100 186"/>
          <path d="M 100 14 Q 50 100 100 186"/>
          <path d="M 100 14 Q 30 100 100 186"/>
          <path d="M 100 14 Q 130 100 100 186"/>
          <path d="M 100 14 Q 150 100 100 186"/>
          <path d="M 100 14 Q 170 100 100 186"/>
        </g>
      </svg>
      <img
        className="astrolabe-rete"
        src="images/astrolabe/rete-illuminated.png"
        alt=""
        aria-hidden="true"
      />
      <svg className="astrolabe-alidade" viewBox="0 0 200 200"
           style={{ transform: `rotate(${alidadeRot}deg)` }}>
        <line x1="100" y1="100" x2="100" y2="14"
              stroke="oklch(0.42 0.12 65)" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="100" y1="100" x2="100" y2="14"
              stroke="oklch(0.86 0.12 88)" strokeWidth="1" strokeLinecap="round"/>
        <polygon points="100,10 96,18 104,18" fill="oklch(0.96 0.10 90)"/>
        <line x1="100" y1="100" x2="100" y2="186"
              stroke="oklch(0.42 0.12 65 / 0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <svg className="astrolabe-pin" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="4" fill="oklch(0.42 0.12 65)"
                stroke="oklch(0.86 0.12 88)" strokeWidth="0.6"/>
        <circle cx="100" cy="100" r="1.5" fill="oklch(0.96 0.10 90)"/>
      </svg>
    </div>
  );
};
