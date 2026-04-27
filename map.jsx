// Silk Road atlas — OCHRE LAND masses drawn on a PALE PARCHMENT sea background,
// with blue major water bodies (Med, Black, Caspian, Red, Persian, Arabian, China).
// ViewBox 0..2400 W × 0..1200 H. This is a stylized medieval cartography — NOT a real
// projection. Shapes are hand-built to evoke the reference image's feel.

window.SilkRoadMap = function SilkRoadMap({
  showRoutes = true,
  showBorders = true,
  showJourney = false,
  journeyProgress = 1,
  onPointClick,
  onPointHover,
  onPointLeave,
  onPolityHover,
  onPolityLeave,
  onPolityClick,
  hoveredId,
  activeId,
  hoveredPolityId,
}) {
  const data = window.SILKROAD_DATA || {};
  data.regions = data.regions || [];
  data.polities = data.polities || [];
  data.seas = data.seas || [];
  data.deserts = data.deserts || [];
  data.mountains = data.mountains || [];
  data.rivers = data.rivers || [];
  data.routes = data.routes || [];
  data.places = data.places || [];
  data.journey = data.journey || [];

  const placesById = Object.fromEntries(data.places.map(p => [p.id, p]));
  const pt = (id) => placesById[id];

  const routePath = (ids) => {
    const pts = ids.map(pt).filter(Boolean);
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i-1], cur = pts[i];
      const mx = (prev.x + cur.x) / 2;
      const my = (prev.y + cur.y) / 2;
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const offs = Math.min(22, len * 0.06);
      const sign = i % 2 === 0 ? 1 : -1;
      const cx = mx + (-dy / len) * offs * sign;
      const cy = my + (dx / len) * offs * sign;
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${cur.x} ${cur.y}`;
    }
    return d;
  };

  const journeyPath = () => {
    const ids = data.journey;
    const pts = ids.map(pt).filter(Boolean);
    if (pts.length < 2) return { full: "", markerPos: pts[0] || {x:0,y:0} };
    const segLens = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
      segLens.push(l); total += l;
    }
    const target = total * journeyProgress;
    let acc = 0;
    let markerPos = pts[0];
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const segLen = segLens[i-1];
      if (acc + segLen <= target) {
        d += ` L ${pts[i].x} ${pts[i].y}`;
        markerPos = pts[i];
      } else {
        const remain = target - acc;
        const t = segLen > 0 ? remain / segLen : 0;
        const mx = pts[i-1].x + (pts[i].x - pts[i-1].x) * t;
        const my = pts[i-1].y + (pts[i].y - pts[i-1].y) * t;
        d += ` L ${mx} ${my}`;
        markerPos = { x: mx, y: my };
        break;
      }
      acc += segLen;
    }
    return { full: d, markerPos };
  };

  const journey = journeyPath();
  const principal = data.routes.find(r => r.id === "silk-principal");

  return (
    <svg className="map-svg" viewBox="0 0 2400 1200" width="2880" height="1440"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Ochre parchment LAND */}
        <radialGradient id="landFill" cx="45%" cy="45%" r="70%">
          <stop offset="0%"  stopColor="oklch(0.84 0.09 75)"/>
          <stop offset="60%" stopColor="oklch(0.76 0.10 68)"/>
          <stop offset="100%" stopColor="oklch(0.64 0.11 58)"/>
        </radialGradient>

        {/* Deeper warm wash for edges */}
        <radialGradient id="landEdgeFill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="oklch(0.74 0.10 65)" stopOpacity="0"/>
          <stop offset="100%" stopColor="oklch(0.52 0.10 45)" stopOpacity="0.35"/>
        </radialGradient>

        {/* Deep blue SEA */}
        <linearGradient id="seaFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.5 0.14 240)"/>
          <stop offset="100%" stopColor="oklch(0.38 0.15 245)"/>
        </linearGradient>

        {/* desert stippling */}
        <pattern id="desertPattern" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="5" r="0.7" fill="oklch(0.5 0.1 45 / 0.55)"/>
          <circle cx="12" cy="14" r="0.6" fill="oklch(0.5 0.1 45 / 0.45)"/>
          <circle cx="18" cy="3" r="0.5" fill="oklch(0.5 0.1 45 / 0.5)"/>
          <circle cx="9" cy="18" r="0.55" fill="oklch(0.5 0.1 45 / 0.45)"/>
        </pattern>

        {/* Mountain chevrons */}
        <pattern id="mountainPattern" x="0" y="0" width="28" height="16" patternUnits="userSpaceOnUse">
          <path d="M 3 14 L 9 4 L 15 14 M 13 14 L 19 6 L 24 14"
                fill="oklch(0.42 0.07 45 / 0.35)"
                stroke="oklch(0.32 0.06 40 / 0.75)" strokeWidth="0.9" strokeLinejoin="round"/>
        </pattern>

        {/* Sea texture — subtle wavy stipple */}
        <pattern id="seaTex" x="0" y="0" width="36" height="10" patternUnits="userSpaceOnUse">
          <path d="M 2 5 Q 8 2 14 5 T 26 5 T 38 5" fill="none"
                stroke="oklch(0.72 0.12 240 / 0.38)" strokeWidth="0.4"/>
        </pattern>

        {/* Coastline wobble */}
        <filter id="wobble" x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" seed="4"/>
          <feDisplacementMap in="SourceGraphic" scale="4"/>
        </filter>

        {/* Unknown lands dotted pattern */}
        <pattern id="terraIncognita" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="0.55" fill="oklch(0.48 0.06 50 / 0.45)"/>
        </pattern>

        {/* Tinted region fills for territories (very soft) */}
        <pattern id="tintRus"   x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="oklch(0.65 0.10 160 / 0.12)"/>
        </pattern>
      </defs>

      {/* === BASE MAP: rendered as HTML <img> in app.jsx, positioned behind this SVG.
           Letterbox bands top & bottom are now transparent so the indigo stage
           shows through the cleaned-up PNG's torn-edge transparencies. === */}
      {/* Hide the old hand-drawn land that follows until we delete it */}
      <g style={{display:'none'}}>

      {/* === LANDMASS: one giant Afro-Eurasia shape with bays cut in ===
           We draw it as a single continuous path so that coastlines
           for the Mediterranean, Black Sea, Caspian, Red Sea, Persian Gulf,
           Arabian Sea, Bay of Bengal, and South China Sea are all carved out
           using evenodd fill rule. */}
      <g filter="url(#wobble)">
        <path
          fillRule="evenodd"
          fill="url(#landFill)"
          stroke="oklch(0.34 0.07 40)"
          strokeWidth="2"
          strokeLinejoin="round"
          d="
            M 0 80
            L 2400 80
            L 2400 420
            Q 2380 420 2370 440
            Q 2355 500 2360 600
            Q 2370 700 2380 820
            Q 2390 900 2400 1000
            L 2400 1200
            L 0 1200
            L 0 80
            Z

            M 0 720
            Q 60 700 140 730
            Q 220 760 320 730
            Q 420 720 520 760
            Q 540 810 500 880
            Q 440 950 380 990
            Q 300 1040 220 1040
            Q 140 1050 60 1020
            Q 20 980 10 900
            Q 0 820 0 720 Z

            M 570 530
            Q 650 530 720 520
            Q 790 530 870 520
            Q 950 530 1020 540
            Q 1080 550 1140 545
            Q 1180 555 1200 600
            Q 1220 620 1140 640
            Q 1060 650 980 640
            Q 900 650 820 640
            Q 750 640 690 620
            Q 620 610 580 590
            Q 555 565 570 530 Z

            M 1080 430
            Q 1150 420 1220 435
            Q 1260 450 1245 475
            Q 1180 490 1110 475
            Q 1060 455 1080 430 Z

            M 1300 430
            Q 1355 415 1380 460
            Q 1390 540 1370 600
            Q 1345 620 1310 605
            Q 1285 545 1290 490
            Q 1285 445 1300 430 Z

            M 1100 650
            Q 1130 660 1155 720
            Q 1185 790 1195 870
            Q 1175 905 1155 880
            Q 1130 810 1105 740
            Q 1085 690 1100 650 Z

            M 1260 650
            Q 1305 660 1340 700
            Q 1360 740 1345 770
            Q 1310 770 1285 735
            Q 1260 700 1260 650 Z

            M 1220 870
            L 1740 870
            Q 1820 880 1860 950
            Q 1880 1040 1860 1120
            Q 1840 1180 1740 1180
            L 1220 1180
            Q 1180 1120 1180 1040
            Q 1180 950 1220 870 Z

            M 1800 840
            Q 1880 860 1920 920
            Q 1940 990 1920 1060
            Q 1900 1110 1850 1120
            Q 1830 1060 1810 990
            Q 1790 910 1800 840 Z

            M 2160 830
            Q 2240 840 2300 880
            Q 2360 950 2360 1060
            Q 2340 1150 2260 1170
            L 2180 1170
            Q 2150 1090 2150 1000
            Q 2150 910 2160 830 Z
          "
        />
      </g>

      {/* === Ireland & Britain === */}
      <g filter="url(#wobble)">
        <path d="M 605 360 Q 655 350 680 400 Q 690 460 665 490 Q 630 490 615 450 Q 600 400 605 360 Z"
              fill="url(#landFill)" stroke="oklch(0.34 0.07 40)" strokeWidth="1.6"/>
        <path d="M 545 380 Q 580 380 585 420 Q 580 445 560 445 Q 540 430 545 380 Z"
              fill="url(#landFill)" stroke="oklch(0.34 0.07 40)" strokeWidth="1.6"/>
      </g>

      {/* === Iceland === */}
      <g filter="url(#wobble)">
        <path d="M 470 180 Q 510 180 520 210 Q 505 235 470 230 Q 450 210 470 180 Z"
              fill="url(#landFill)" stroke="oklch(0.34 0.07 40)" strokeWidth="1.2"/>
      </g>

      {/* === Japan & Korea === */}
      <g filter="url(#wobble)">
        <path d="M 2310 550 Q 2330 540 2340 570 Q 2330 600 2310 600 Q 2295 580 2310 550 Z"
              fill="url(#landFill)" stroke="oklch(0.34 0.07 40)" strokeWidth="1.4"/>
        <path d="M 2360 440 Q 2390 440 2400 490 L 2400 560 Q 2380 575 2360 540 Q 2350 480 2360 440 Z"
              fill="url(#landFill)" stroke="oklch(0.34 0.07 40)" strokeWidth="1.4"/>
      </g>

      {/* Ceylon */}
      <ellipse cx="1780" cy="990" rx="28" ry="38" fill="url(#landFill)"
               stroke="oklch(0.34 0.07 40)" strokeWidth="1.4"/>

      {/* East-African horn */}
      <g filter="url(#wobble)">
        <path d="M 1060 900 Q 1120 920 1160 980 Q 1180 1070 1160 1140 Q 1120 1180 1060 1170 Q 1020 1120 1020 1050 Q 1030 960 1060 900 Z"
              fill="url(#landFill)" stroke="oklch(0.34 0.07 40)" strokeWidth="1.6"/>
      </g>

      {/* === Soft region-territory color washes === */}
      <g opacity="0.5" style={{mixBlendMode: 'multiply'}}>
        {/* Rus */}
        <path d="M 850 120 Q 1100 130 1280 180 Q 1260 280 1120 330 Q 960 300 870 250 Q 820 200 850 120 Z"
              fill="oklch(0.68 0.10 150 / 0.35)"/>
        {/* Pechenegs / Khazars steppe */}
        <path d="M 1120 330 Q 1320 320 1500 340 Q 1540 430 1440 460 Q 1300 450 1180 440 Q 1100 390 1120 330 Z"
              fill="oklch(0.75 0.10 95 / 0.35)"/>
        {/* Byzantium */}
        <path d="M 920 430 Q 1060 420 1140 440 Q 1150 510 1060 525 Q 990 525 930 490 Q 900 460 920 430 Z"
              fill="oklch(0.65 0.10 30 / 0.35)"/>
        {/* Abbasid */}
        <path d="M 1110 480 Q 1300 470 1450 490 Q 1500 640 1400 760 Q 1250 790 1130 720 Q 1060 620 1100 530 Q 1100 500 1110 480 Z"
              fill="oklch(0.70 0.12 75 / 0.38)"/>
        {/* Transoxiana / Ghuzz */}
        <path d="M 1400 420 Q 1600 420 1720 460 Q 1720 540 1600 570 Q 1480 570 1400 540 Q 1380 480 1400 420 Z"
              fill="oklch(0.7 0.10 125 / 0.32)"/>
        {/* Tang */}
        <path d="M 2020 500 Q 2200 490 2340 540 Q 2360 700 2280 820 Q 2160 830 2080 780 Q 2020 680 2020 500 Z"
              fill="oklch(0.62 0.12 20 / 0.35)"/>
        {/* Uyghur */}
        <path d="M 1780 380 Q 1960 370 2090 400 Q 2080 500 2000 530 Q 1870 520 1780 500 Q 1760 450 1780 380 Z"
              fill="oklch(0.7 0.10 55 / 0.3)"/>
        {/* Tibet */}
        <path d="M 1760 640 Q 1900 640 2000 680 Q 1990 750 1880 760 Q 1780 740 1760 700 Q 1750 670 1760 640 Z"
              fill="oklch(0.68 0.10 105 / 0.3)"/>
        {/* Pratīhāras / Pālas / Rashtra (India) */}
        <path d="M 1560 760 Q 1720 760 1860 790 Q 1880 870 1780 900 Q 1660 910 1590 880 Q 1550 830 1560 760 Z"
              fill="oklch(0.68 0.10 340 / 0.3)"/>
        {/* Al-Andalus */}
        <path d="M 430 540 Q 560 540 620 580 Q 600 640 500 640 Q 430 620 420 570 Z"
              fill="oklch(0.7 0.11 75 / 0.3)"/>
        {/* Fatimid Ifriqiya */}
        <path d="M 780 600 Q 920 600 1000 640 Q 990 700 880 720 Q 780 720 760 680 Q 760 630 780 600 Z"
              fill="oklch(0.68 0.10 60 / 0.28)"/>
      </g>

      {/* === Deserts === */}
      <g opacity="0.9">
        {data.deserts.map(d => (
          <g key={d.id}>
            <ellipse cx={d.x} cy={d.y} rx={d.w} ry={d.h}
                     fill="oklch(0.87 0.08 78 / 0.55)"
                     stroke="oklch(0.56 0.09 50 / 0.3)" strokeWidth="0.6"/>
            <ellipse cx={d.x} cy={d.y} rx={d.w} ry={d.h} fill="url(#desertPattern)"/>
          </g>
        ))}
      </g>

      {/* === Mountains === */}
      <g opacity="0.95">
        {data.mountains.map(m => (
          <path key={m.id} d={m.path}
                fill="none"
                stroke="url(#mountainPattern)"
                strokeWidth="20"
                strokeLinecap="round"/>
        ))}
      </g>

      {/* === Rivers === */}
      <g fill="none" stroke="oklch(0.46 0.14 240)" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
        {data.rivers.map(r => <path key={r.id} d={r.path}/>)}
      </g>

      {/* === Dotted political borders === */}
      {showBorders && (
        <g fill="none" stroke="oklch(0.4 0.09 30 / 0.6)" strokeWidth="1.3" strokeDasharray="2 5">
          <path d="M 1020 470 Q 1080 490 1120 540 Q 1140 590 1160 640"/>
          <path d="M 1280 490 Q 1340 470 1420 480 Q 1500 490 1580 500"/>
          <path d="M 2020 560 Q 2000 620 2000 700 Q 2010 780 2020 840"/>
          <path d="M 1860 620 Q 1930 640 2000 680"/>
          <path d="M 1680 750 Q 1760 750 1820 750"/>
          <path d="M 1860 470 Q 1960 470 2060 500 Q 2120 520 2180 540"/>
          <path d="M 1660 860 Q 1720 870 1780 870 Q 1820 870 1860 860"/>
          <path d="M 600 480 Q 660 500 720 490"/>
          <path d="M 1120 350 Q 1200 370 1280 390"/>
          <path d="M 1780 440 Q 1840 440 1900 440"/>
          <path d="M 860 380 Q 930 400 1000 400"/>
          <path d="M 1540 620 Q 1600 640 1660 660"/>
        </g>
      )}

      {/* === Terra Incognita (unknown lands) === */}
      <g>
        {/* Arctic top strip — dotted beyond 60°N */}
        <path d="M 0 80 L 2400 80 L 2400 160 Q 1800 180 1200 160 Q 600 180 0 160 Z"
              fill="url(#terraIncognita)" opacity="0.7"/>
        {/* Deep African interior */}
        <path d="M 760 940 Q 960 960 1140 940 Q 1150 1080 1050 1170 L 760 1180 Z"
              fill="url(#terraIncognita)" opacity="0.55"/>
        {/* Siberia */}
        <path d="M 1700 160 L 2400 160 L 2400 340 Q 2100 335 1900 320 Q 1750 310 1700 300 Z"
              fill="url(#terraIncognita)" opacity="0.5"/>
      </g>
      {/* end hidden old geometry */}
      </g>

      {/* === Region labels (large) === */}
      <g>
        {data.regions.map(r => (
          <g key={r.id}>
            <text x={r.x} y={r.y} textAnchor="middle"
                  className="map-label-region"
                  style={{fontSize: r.size}}>
              {r.label}
            </text>
            {r.sub && (
              <text x={r.x} y={r.y + r.size * 0.7} textAnchor="middle"
                    className="map-label-region-sub">
                {r.sub}
              </text>
            )}
          </g>
        ))}
      </g>

      {/* Sea labels */}
      <g>
        {data.seas.map(s => (
          <text key={s.id} x={s.x} y={s.y} textAnchor="middle"
                className="map-label-sea"
                style={{fontSize: s.size}}>
            {s.label}
          </text>
        ))}
      </g>

      {/* Desert labels */}
      <g>
        {data.deserts.map(d => (
          <text key={`dl-${d.id}`} x={d.x} y={d.y + 3} textAnchor="middle"
                className="map-label-desert">
            {d.label}
          </text>
        ))}
      </g>

      {/* Mountain labels */}
      <g>
        {data.mountains.map(m => {
          const match = m.path.match(/Q\s*([\d.]+)\s+([\d.]+)/);
          if (!match) return null;
          const cx = parseFloat(match[1]);
          const cy = parseFloat(match[2]) - 6;
          return (
            <text key={`ml-${m.id}`} x={cx} y={cy} textAnchor="middle"
                  className="map-label-mountain">
              {m.label}
            </text>
          );
        })}
      </g>

      {/* River labels */}
      <g>
        {data.rivers.map(r => (
          <text key={`rl-${r.id}`} x={r.lx} y={r.ly} textAnchor="start"
                className="map-label-river">
            {r.label}
          </text>
        ))}
      </g>

      {/* Trade routes */}
      {showRoutes && (
        <g>
          {data.routes.filter(r => !r.bold).map(r => (
            <path key={r.id} className={`route-line route-${r.id}`} d={routePath(r.points)}/>
          ))}
        </g>
      )}

      {/* Principal Silk Road — bold red */}
      {showRoutes && principal && (
        <g>
          <path d={routePath(principal.points)} className="route-principal-halo"/>
          <path d={routePath(principal.points)} className="route-principal"/>
        </g>
      )}

      {/* Journey trail */}
      {showJourney && (
        <g>
          <path d={journey.full} className="journey-trail"/>
          {journey.markerPos && (
            <g transform={`translate(${journey.markerPos.x}, ${journey.markerPos.y})`}>
              <circle r="8" className="journey-marker"/>
              <circle r="14" fill="none" stroke="var(--crimson)" strokeWidth="1.4" opacity="0.6">
                <animate attributeName="r" values="8;22;8" dur="2.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.9;0;0.9" dur="2.2s" repeatCount="indefinite"/>
              </circle>
            </g>
          )}
        </g>
      )}

      {/* Ruler portrait illuminations. Positions hand-tuned via the
          (now-retired) ?edit=stamps drag editor on 2026-04-27. */}
      <RulerPortrait x={1139} y={732} label="CALIPH"   src="images/ruler-caliph.png"/>
      <RulerPortrait x={2045} y={303} label="EMPEROR"  src="images/ruler-emperor.png"/>
      <RulerPortrait x={523}  y={383} label="BASILEUS" src="images/ruler-basileus.png" small/>
      <RulerPortrait x={1573} y={196} label="QAGHAN"   src="images/ruler-qaghan.png"  small/>

      {/* Sea monsters / naturalist insets. Same hand-tune session. */}
      <SeaMonster x={1245} y={970}  w={90}  src="images/sea-monster-drake.png"      rotate={-8}/>
      <SeaMonster x={2244} y={756}  w={100} src="images/sea-monster-whale.png"      rotate={5}/>
      <SeaMonster x={174}  y={173}  w={85}  src="images/sea-monster-hyperborean.png" rotate={-3}/>

      {/* Polity boundary polygons — toggleable via showBorders. Rendered
          before pins so pins remain clickable on top, but after the other
          decorative elements so the dashed boundaries draw above them. */}
      {showBorders && data.polities.length > 0 && (
        <g className="polity-layer">
          {data.polities.map(p => {
            const isHovered = hoveredPolityId === p.id;
            return (
              <path
                key={p.id}
                d={p.path}
                className={`polity-region ${isHovered ? "hovered" : ""}`}
                onMouseEnter={() => onPolityHover && onPolityHover(p)}
                onMouseLeave={() => onPolityLeave && onPolityLeave(p)}
                onClick={(e) => { e.stopPropagation(); onPolityClick && onPolityClick(p); }}
              />
            );
          })}
        </g>
      )}

      {/* City points */}
      <g>
        {data.places.map(p => {
          const isGreat = p.kind === "great-city";
          const isMonster = p.kind === "monster" || p.kind === "dragon";
          const dotClass = isGreat ? "map-point-dot-great"
            : p.kind === "ruin" ? "map-point-dot-ruin"
            : isMonster ? "map-point-dot-monster"
            : "map-point-dot";
          const r = isGreat ? 7 : isMonster ? 6 : 4.5;
          const isActive = activeId === p.id;
          const isHovered = hoveredId === p.id;

          return (
            <g
              key={p.id}
              className="map-point"
              transform={`translate(${p.x}, ${p.y})`}
              onClick={(e) => { e.stopPropagation(); onPointClick && onPointClick(p); }}
              onMouseEnter={() => onPointHover && onPointHover(p)}
              onMouseLeave={() => onPointLeave && onPointLeave(p)}
            >
              {(isHovered || isActive) && (
                <circle r={r + 9} fill="none" stroke="var(--gold-bright)" strokeWidth="1.6" opacity="0.9"/>
              )}
              <circle r={r} className={dotClass}/>
              {isGreat && <circle r={r - 3} fill="var(--gold-bright)"/>}

              {isGreat ? (
                <text x={p.x > 1500 ? -14 : 14} y="5"
                      textAnchor={p.x > 1500 ? "end" : "start"}
                      className="map-label map-label-great">{p.name}</text>
              ) : isMonster ? (
                <text x="0" y="24" textAnchor="middle" className="map-label-monster">{p.name}</text>
              ) : (
                <text x="0" y="-9" textAnchor="middle" className="map-label map-label-city">{p.name}</text>
              )}
            </g>
          );
        })}
      </g>

      {/* Top title cartouche */}
      <g transform="translate(1200, 100)">
        <rect x="-340" y="-40" width="680" height="72" fill="oklch(0.88 0.06 70 / 0.95)"
              stroke="oklch(0.38 0.08 35)" strokeWidth="1.4"/>
        <text x="0" y="-6" textAnchor="middle" fill="var(--crimson)"
              fontFamily="Cormorant Garamond" fontSize="32" fontWeight="600"
              style={{letterSpacing: '0.02em'}}>
          The Silk Road at its Height, c. 900 A.D.
        </text>
        <text x="0" y="22" textAnchor="middle" fill="oklch(0.3 0.05 35)"
              fontFamily="Cormorant Garamond" fontStyle="italic" fontSize="14">
          ⁂ a Chronicle of the Known World and its peopled wayes ⁂
        </text>
      </g>

      {/* Frame */}
      <rect x="18" y="18" width="2364" height="1164" fill="none"
            stroke="oklch(0.45 0.09 40)" strokeWidth="3"/>
      <rect x="28" y="28" width="2344" height="1144" fill="none"
            stroke="oklch(0.45 0.09 40 / 0.5)" strokeWidth="0.8"/>
    </svg>
  );
};

function RulerPortrait({ x, y, label, src, small = false }) {
  const w = small ? 75 : 100;
  const h = w; // square
  return (
    <g transform={`translate(${x - w/2}, ${y - h/2})`}
       opacity="0.9"
       style={{mixBlendMode: 'multiply'}}>
      {/* Portrait frame — borderless; just a cream parchment backing */}
      <rect x="0" y="0" width={w} height={h + 26} fill="oklch(0.88 0.06 72)"/>
      <image href={src} x="4" y="4" width={w - 8} height={h - 8}
             preserveAspectRatio="xMidYMid slice"/>
      <text x={w / 2} y={h + 18} textAnchor="middle"
            fill="oklch(0.28 0.07 35)"
            fontFamily="Cormorant Garamond"
            fontSize={small ? 13 : 16}
            fontWeight="700"
            letterSpacing="0.18em">{label}</text>
    </g>
  );
}

function SeaMonster({ x, y, w, src, rotate = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`} opacity="0.9"
       style={{mixBlendMode: 'multiply'}}>
      <image href={src} x={-w/2} y={-w/2} width={w} height={w}
             preserveAspectRatio="xMidYMid meet"/>
    </g>
  );
}
