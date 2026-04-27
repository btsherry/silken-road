// Main app: sidebar, map stage, scroll detail panel, tweaks.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const SECTION_DEFS = [
  { id: "places",     label: "Places & Regions",  icon: "⌘", key: "places",     pointable: true },
  { id: "characters", label: "Characters",        icon: "☥", key: "characters", pointable: false },
  { id: "npcs",       label: "Notables",          icon: "✦", key: "npcs",       pointable: false },
  { id: "villains",   label: "Villains & Factions", icon: "☠", key: "villains", pointable: false },
  { id: "items",      label: "Items & Artifacts", icon: "❖", key: "items",      pointable: false },
  { id: "lore",       label: "Lore & History",    icon: "§", key: "lore",       pointable: false },
  { id: "journal",    label: "Campaign Journal",  icon: "✎", key: "journal",    pointable: false },
];

function App() {
  const data = window.SILKROAD_DATA;

  // Layer toggles (persisted via tweak keys)
  const T = window.TWEAKS || {};
  const [showRoutes, setShowRoutes] = useState(T.showRoutes ?? true);
  const [showBorders, setShowBorders] = useState(T.showBorders ?? true);
  const [showCharacters, setShowCharacters] = useState(T.showCharacters ?? true);
  const [showJourney, setShowJourney] = useState(T.showJourney ?? false);

  const [journeyProgress, setJourneyProgress] = useState(T.showJourney ? 1 : 0);
  const [playingJourney, setPlayingJourney] = useState(false);

  // Map pan/zoom
  const [zoom, setZoom] = useState(0.42);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const viewportRef = useRef(null);

  // Selection + hover
  const [selected, setSelected] = useState(null); // {section, id}
  const [hovered, setHovered] = useState(null);   // place for tooltip
  const [unfurled, setUnfurled] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Nav accordion — which section is expanded. Default: first section open.
  const [openSection, setOpenSection] = useState(null);

  // Edit mode
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Restore zoom/pan from localStorage
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("silkroad:view") || "null");
      if (s) { setZoom(s.zoom); setPan(s.pan); }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("silkroad:view", JSON.stringify({ zoom, pan })); } catch {}
  }, [zoom, pan]);

  // Persist toggles via edit-mode protocol
  const persistTweak = (edits) => {
    try {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
    } catch {}
  };

  // Edit mode protocol — register listener, then announce availability
  useEffect(() => {
    const handler = (ev) => {
      const t = ev.data && ev.data.type;
      if (t === "__activate_edit_mode") setTweaksOpen(true);
      else if (t === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", handler);
    try {
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    } catch {}
    return () => window.removeEventListener("message", handler);
  }, []);

  // Trigger unfurl whenever selected changes
  useEffect(() => {
    if (!selected) { setUnfurled(false); return; }
    setUnfurled(false);
    const t = setTimeout(() => setUnfurled(true), 120);
    return () => clearTimeout(t);
  }, [selected && selected.section, selected && selected.id]);

  // Journey animation
  useEffect(() => {
    if (!playingJourney) return;
    setJourneyProgress(0);
    setShowJourney(true);
    const start = performance.now();
    const dur = 5500;
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setJourneyProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else setPlayingJourney(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playingJourney]);

  // Pan handlers
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom(z => Math.max(0.3, Math.min(2.5, z * (1 + delta))));
  };

  // Handle selecting an entry
  const open = (section, id) => {
    // set selected with unfurled=false state combined
    setSelected({ section, id });
    // Ensure the section containing this item is expanded
    const secDef = SECTION_DEFS.find(s => s.key === section);
    if (secDef) setOpenSection(secDef.id);
    // If it's a place, center it on the map
    if (section === "places") {
      const p = data.places.find(pp => pp.id === id);
      if (p && viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        const canvasW = 2880, canvasH = 1440;
        setPan({
          x: rect.width / 2 - (p.x / 2400 * canvasW) * zoom + (canvasW * zoom - rect.width) / 2,
          y: rect.height / 2 - (p.y / 1200 * canvasH) * zoom + (canvasH * zoom - rect.height) / 2,
        });
      }
    }
    // unfurl handled by effect below
  };

  const closeScroll = () => {
    setUnfurled(false);
    setTimeout(() => setSelected(null), 400);
  };

  const onPointClick = (p) => open("places", p.id);

  const onPointHover = (p, evt) => {
    setHovered(p);
  };

  // For tooltip tracking on viewport
  const onViewportMouseMove = (e) => {
    onMouseMove(e);
    if (hovered) {
      const rect = viewportRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  // Selected entity lookup
  const selectedEntity = useMemo(() => {
    if (!selected) return null;
    const coll = data[selected.section];
    if (!coll) return null;
    return { section: selected.section, item: coll.find(x => x.id === selected.id) };
  }, [selected, data]);

  // Focus point for globe (selected place or null)
  const focusPoint = selected && selected.section === "places"
    ? data.places.find(p => p.id === selected.id)
    : null;

  // Polity hover state — drives the region cartouche in the top bar.
  const [hoveredPolity, setHoveredPolity] = useState(null);

  // Cartouche text precedence: hovered polity > selected place's region > default.
  const currentRegion = hoveredPolity
    ? hoveredPolity.name
    : focusPoint ? focusPoint.region : "Dar al-Islam";

  const toggleLayer = (key, setter, current) => {
    setter(!current);
    persistTweak({ [key]: !current });
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="title-eyebrow">A Chronicle of</div>
          <h1 className="title-main">Seal <em>Unbroken</em>, Seal <em>Unmade</em></h1>
          <div className="title-sub">— being an Atlas of the Known World, 900 A.D. —</div>
        </div>

        {SECTION_DEFS.map(sec => {
          const items = data[sec.key] || [];
          const isOpen = openSection === sec.id;
          return (
            <div className={`nav-section ${isOpen ? "open" : "closed"}`} key={sec.id}>
              <button
                type="button"
                className="nav-heading"
                aria-expanded={isOpen}
                onClick={() => setOpenSection(isOpen ? null : sec.id)}
              >
                <span className="nav-heading-icon">{sec.icon}</span>
                <span className="nav-heading-label">{sec.label}</span>
                <span className="nav-heading-count">{items.length}</span>
                <span className="nav-heading-chevron" aria-hidden="true">
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>
              {isOpen && (
                <ul className="nav-list">
                  {items.map(it => (
                    <li
                      key={it.id}
                      className={`nav-item ${selected && selected.section === sec.key && selected.id === it.id ? "active" : ""}`}
                      onClick={() => open(sec.key, it.id)}
                    >
                      {it.name}
                      {(it.role || it.region || it.kind || it.faction || it.era || it.date) && (
                        <span className="nav-item-role">
                          {it.role || it.region || it.kind || it.faction || it.era || it.date}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <div style={{padding: "18px 22px 30px", fontFamily: "'Homemade Apple', cursive",
                    fontSize: 11, color: "oklch(0.6 0.04 85 / 0.55)", lineHeight: 1.5}}>
          Drawn from the logs of our party and<br/>the chronicles of Al-Mas'udi, inshallah.
        </div>
      </aside>

      <div className="stage">
        {/* Top bar */}
        <div className="top-bar">
          <div className="cartouche">
            <span className="cartouche-label">Region</span>
            <span className="cartouche-value">{currentRegion}</span>
          </div>

          <div className="layer-toggles">
            <button className={`layer-toggle ${showRoutes ? "on" : ""}`}
                    onClick={() => toggleLayer("showRoutes", setShowRoutes, showRoutes)}>
              <span className="layer-toggle-swatch" style={{background: "oklch(0.52 0.20 27)"}}/>
              Trade Routes
            </button>
            <button className={`layer-toggle ${showBorders ? "on" : ""}`}
                    onClick={() => toggleLayer("showBorders", setShowBorders, showBorders)}>
              Borders
            </button>
            <button className={`layer-toggle ${showCharacters ? "on" : ""}`}
                    onClick={() => toggleLayer("showCharacters", setShowCharacters, showCharacters)}>
              Monsters
            </button>
          </div>
        </div>

        {/* Map viewport */}
        <div
          ref={viewportRef}
          className={`map-viewport ${dragging ? "dragging" : ""}`}
          onMouseDown={onMouseDown}
          onMouseMove={onViewportMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <div
            className="map-svg-wrap"
            style={{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})` }}
          >
            {/* Painted base map rendered as HTML <img> behind the SVG overlay.
                SVG <image> fails to render this PNG reliably in Chromium (known issue
                with certain PNG encodings in SVG image contexts). HTML <img> is
                bulletproof, and positioning it absolutely inside the same wrap means
                the SVG overlay (routes, pins, labels) still aligns perfectly. */}
            <img
              className="base-map-img"
              src="images/base-map-v2.png"
              alt=""
              aria-hidden="true"
              draggable="false"
              decoding="async"
              fetchPriority="high"
            />
            <window.SilkRoadMap
              showRoutes={showRoutes}
              showBorders={showBorders}
              showJourney={showJourney}
              journeyProgress={journeyProgress}
              onPointClick={onPointClick}
              onPointHover={(p) => setHovered(p)}
              onPointLeave={() => setHovered(null)}
              onPolityHover={(p) => setHoveredPolity(p)}
              onPolityLeave={() => setHoveredPolity(null)}
              hoveredId={hovered && hovered.id}
              hoveredPolityId={hoveredPolity && hoveredPolity.id}
              activeId={selected && selected.section === "places" ? selected.id : null}
            />
          </div>

          {hovered && (
            <div
              className="map-tooltip visible"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              <span className="map-tooltip-name">{hovered.name}</span>
              <span className="map-tooltip-region">{hovered.region}</span>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="bottom-bar">
          <div style={{position: "relative"}}>
            <div className="globe-inset">
              <window.GlobeInset focusPoint={focusPoint}/>
            </div>
            <div className="globe-label">Astrolabium</div>
          </div>

          <div style={{display: "flex", gap: 10, alignItems: "flex-end"}}>
            <button
              className={`journey-control ${showJourney ? "on" : ""}`}
              onClick={() => {
                if (playingJourney) return;
                if (showJourney && journeyProgress >= 1) {
                  setShowJourney(false);
                  setJourneyProgress(0);
                  persistTweak({ showJourney: false });
                } else {
                  setPlayingJourney(true);
                  persistTweak({ showJourney: true });
                }
              }}
            >
              <span className="journey-icon">
                {playingJourney ? "❚❚" : showJourney ? "↻" : "▶"}
              </span>
              {playingJourney ? "Riding…" : showJourney ? "Hide Our Journey" : "Ride Our Journey"}
            </button>
          </div>

          <div className="zoom-controls">
            <button className="zoom-btn" onClick={() => setZoom(z => Math.min(2.5, z * 1.2))}>+</button>
            <div className="zoom-readout">{Math.round(zoom * 100)}%</div>
            <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}>−</button>
            <button className="zoom-btn" title="Reset view" onClick={() => { setZoom(0.42); setPan({x:0, y:0}); }}
                    style={{fontSize: 13}}>⊙</button>
          </div>
        </div>

        {/* Scroll detail panel — or the richer CharacterPanel for characters */}
        {selectedEntity && selectedEntity.item && (
          selectedEntity.section === "characters" && window.CharacterPanel
            ? <window.CharacterPanel
                key={selectedEntity.section + ':' + selectedEntity.item.id}
                entity={selectedEntity}
                onClose={closeScroll}
              />
            : <ScrollPanel
                key={selectedEntity.section + ':' + selectedEntity.item.id}
                entity={selectedEntity}
                onClose={closeScroll}
              />
        )}

        {/* Tweaks */}
        <div className={`tweaks-panel ${tweaksOpen ? "visible" : ""}`}>
          <div className="tweaks-title">Tweaks — Map Layers</div>
          {[
            { key: "showRoutes", label: "Trade Routes", on: showRoutes, set: setShowRoutes, sw: "var(--crimson)" },
            { key: "showBorders", label: "Political Borders", on: showBorders, set: setShowBorders, sw: "oklch(0.35 0.05 55)" },
            { key: "showCharacters", label: "Monsters & Edges", on: showCharacters, set: setShowCharacters, sw: "var(--gold)" },
            { key: "showJourney", label: "Our Journey", on: showJourney, set: setShowJourney, sw: "var(--crimson)" },
          ].map(row => (
            <div className="tweak-row" key={row.key}>
              <label onClick={() => { row.set(!row.on); persistTweak({ [row.key]: !row.on }); }}>
                <span className="swatch" style={{background: row.sw}}/>{row.label}
              </label>
              <div className={`switch ${row.on ? "on" : ""}`}
                   onClick={() => { row.set(!row.on); persistTweak({ [row.key]: !row.on }); }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ——— Scroll Panel ———

function ScrollPanel({ entity, onClose }) {
  const { section, item } = entity;

  const sectionMeta = SECTION_DEFS.find(s => s.key === section);
  const eyebrow = sectionMeta ? sectionMeta.label : "Entry";

  // Get seal glyph
  const seal = item.seal ||
    (section === "characters" ? "☥" :
     section === "npcs" ? "✦" :
     section === "villains" ? "☠" :
     section === "items" ? "❖" :
     section === "lore" ? "§" :
     section === "journal" ? "✎" : "✢");

  // Meta fields
  const meta = [];
  if (item.region) meta.push(["Region", item.region]);
  if (item.role) meta.push(["Role", item.role]);
  if (item.faction) meta.push(["Faction", item.faction]);
  if (item.kind && section !== "places") meta.push(["Kind", item.kind]);
  if (item.era) meta.push(["Era", item.era]);
  if (item.date) meta.push(["Logged", item.date]);

  // Image placeholder label
  const imageLabel =
    section === "places" ? "city-view · miniature"
    : section === "characters" ? "portrait · illumination"
    : section === "npcs" ? "figure · pen & wash"
    : section === "villains" ? "sigil · illumination"
    : section === "items" ? "artifact · ink drawing"
    : section === "lore" ? "historical plate"
    : "marginal sketch";

  return (
    <div className="scroll-backdrop visible" onClick={onClose}>
      <div className="scroll-wrap" onClick={e => e.stopPropagation()}>
        <button className="scroll-close" onClick={onClose} title="Re-roll">×</button>

        <div className="scroll-roll scroll-roll-left"/>
        <div className="scroll-roll scroll-roll-right"/>

        <div className="scroll-paper">
          <div className="wax-seal">{seal}</div>

          <div className="scroll-eyebrow">— {eyebrow} —</div>
          <h2 className="scroll-title">{item.name}</h2>
          {(item.role || item.region || item.kind || item.faction || item.era || item.date) && (
            <div className="scroll-subtitle">
              {item.role || item.region || item.kind || item.faction || item.era || item.date}
            </div>
          )}

          <div className="scroll-divider">
            <div className="scroll-divider-line"/>
            <span className="scroll-divider-glyph">❧ {seal} ❧</span>
            <div className="scroll-divider-line"/>
          </div>

          {section !== "journal" && (
            <div className={`scroll-image ${item.image ? "has-image" : ""}`}>
              {item.image
                ? <img src={item.image} alt={item.name} className="scroll-image-img"/>
                : imageLabel}
            </div>
          )}

          <div className="scroll-body">
            <p className="drop-cap">{item.blurb}</p>
            {item.beats && item.beats.length > 0 && (
              <>
                <h3 className="scroll-subhead">Key beats</h3>
                <ul className="scroll-beats">
                  {item.beats.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </>
            )}
            {item.quotes && item.quotes.length > 0 && (
              <>
                <h3 className="scroll-subhead">Quoted</h3>
                {item.quotes.map((q, i) => (
                  <blockquote key={i} className="scroll-quote">{q}</blockquote>
                ))}
              </>
            )}
          </div>

          {meta.length > 0 && (
            <div className="scroll-meta">
              {meta.map(([k, v]) => (
                <div key={k}><strong>{k}</strong>{v}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Expose for main.jsx
window.App = App;
