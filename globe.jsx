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
