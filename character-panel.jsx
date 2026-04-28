// Character detail panel: hook, stats, backstory, abilities, signature items,
// plus a clickable portrait strip. Clicking a portrait opens a lightbox with
// thumbnail navigation underneath and "back to details" / "close" controls.
//
// Uses the same scroll-paper aesthetic as ScrollPanel for continuity.

const { useState, useEffect } = React;

function CharacterPanel({ entity, onClose }) {
  const item = entity.item;

  // Mode: 'details' (default) | 'portrait' (lightbox takes over frame)
  const [mode, setMode] = useState('details');
  const [portraitIdx, setPortraitIdx] = useState(0);
  const portraits = item.portraits || [];

  // Keyboard: ESC closes. In portrait mode, ←/→ navigate; Backspace/ESC returns to details.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (mode === 'portrait') setMode('details');
        else onClose();
      } else if (mode === 'portrait') {
        if (e.key === 'ArrowLeft' && portraits.length > 1) {
          setPortraitIdx(i => (i - 1 + portraits.length) % portraits.length);
        } else if (e.key === 'ArrowRight' && portraits.length > 1) {
          setPortraitIdx(i => (i + 1) % portraits.length);
        } else if (e.key === 'Backspace') {
          setMode('details');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, portraits.length, onClose]);

  const openPortrait = (idx) => {
    setPortraitIdx(idx);
    setMode('portrait');
  };

  if (mode === 'portrait') {
    return (
      <CharacterLightbox
        item={item}
        portraits={portraits}
        idx={portraitIdx}
        onIdx={setPortraitIdx}
        onBack={() => setMode('details')}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="scroll-backdrop visible" onClick={onClose}>
      <div className="char-wrap" onClick={e => e.stopPropagation()}>
        <button className="scroll-close char-close" onClick={onClose} title="Close (esc)">×</button>

        <div className="char-paper">
          {/* Left column: narrative */}
          <div className="char-main">
            <div className="char-eyebrow">— Dramatis Persona —</div>
            <h2 className="char-title">{item.name}</h2>
            {item.role && <div className="char-subtitle">{item.role}</div>}

            {item.hook && (
              <blockquote className="char-hook">
                {item.hook}
              </blockquote>
            )}

            <CharSection title="Appearance" body={item.appearance}/>
            <CharSection title="Origin" body={item.background}/>
            <CharSection title="In the Company" body={item.partyRole}/>
            <CharSection title="Theme" body={item.theme}/>

            {item.quote && (
              <div className="char-quote">
                <div className="char-quote-text">&ldquo;{item.quote.text}&rdquo;</div>
                {item.quote.source && <div className="char-quote-source">— {item.quote.source}</div>}
              </div>
            )}
          </div>

          {/* Right column: stats + portraits + quick facts */}
          <aside className="char-aside">
            {portraits.length > 0 && (
              <div className="char-portraits">
                <div className="char-aside-heading">Portraits</div>
                <div className="char-portrait-grid">
                  {/* Show only first 2 as thumbnails; clicking either opens
                      the lightbox where prev/next cycles the full gallery. */}
                  {portraits.slice(0, 2).map((p, i) => (
                    <button
                      key={i}
                      className="char-portrait-thumb"
                      onClick={() => openPortrait(i)}
                      title={p.caption || `Portrait ${i + 1}`}
                    >
                      <img src={p.src} alt={p.caption || ''} loading="lazy"/>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {item.origin && <CharFact label="Origin" value={item.origin}/>}

            {item.arcCareers && item.arcCareers.length > 0 && (
              <CharFact label="Careers" value={item.arcCareers.join(' → ')}/>
            )}

            {item.languages && item.languages.length > 0 && (
              <CharFact label="Tongues" value={item.languages.join(', ')}/>
            )}

            {item.family && <CharFact label="Family" value={item.family}/>}

            {item.companions && item.companions.length > 0 && (
              <CharFact label="Companions" value={item.companions.join(', ')}/>
            )}

            {item.followers && item.followers.length > 0 && (
              <div className="char-list-block">
                <div className="char-aside-heading">Followers</div>
                <ul className="char-list">
                  {item.followers.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {item.signatureItems && item.signatureItems.length > 0 && (
              <div className="char-list-block">
                <div className="char-aside-heading">Signature Items</div>
                <ul className="char-list">
                  {item.signatureItems.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </div>
            )}

            {item.abilities && item.abilities.length > 0 && (
              <div className="char-list-block">
                <div className="char-aside-heading">Abilities</div>
                <div className="char-chips">
                  {item.abilities.map((a, i) => <span key={i} className="char-chip">{a}</span>)}
                </div>
              </div>
            )}

            {item.flaws && item.flaws.length > 0 && (
              <div className="char-list-block">
                <div className="char-aside-heading">Flaws</div>
                <ul className="char-list char-list-flaws">
                  {item.flaws.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {item.stats && <CharStatsBlock stats={item.stats}/>}
          </aside>
        </div>
      </div>
    </div>
  );
}

function CharSection({ title, body }) {
  if (!body) return null;
  return (
    <div className="char-section">
      <div className="char-section-head">{title}</div>
      <p className="char-section-body">{body}</p>
    </div>
  );
}

function CharFact({ label, value }) {
  return (
    <div className="char-fact">
      <div className="char-fact-label">{label}</div>
      <div className="char-fact-value">{value}</div>
    </div>
  );
}

function CharStatsBlock({ stats }) {
  // Grouped: attributes | combat | vitals
  const attrRows = [
    ["STR", stats.str], ["AGI", stats.agi], ["MIND", stats.mind], ["APPEAL", stats.appeal],
  ].filter(([, v]) => v !== undefined);
  const combatRows = [
    ["Melee", stats.melee], ["Ranged", stats.ranged], ["Defense", stats.defense], ["Init.", stats.initiative],
  ].filter(([, v]) => v !== undefined);
  const vitalRows = [
    ["Lifeblood", stats.lifeblood], ["Hero Pts.", stats.hero], ["Arcane Pts.", stats.arcane], ["Fate Pts.", stats.fate],
  ].filter(([, v]) => v !== undefined);

  return (
    <div className="char-stats">
      <div className="char-aside-heading">Stats (Barbarians of Lemuria)</div>
      {[["Attributes", attrRows], ["Combat", combatRows], ["Vitals", vitalRows]].map(([label, rows]) =>
        rows.length > 0 && (
          <div className="char-stats-group" key={label}>
            <div className="char-stats-label">{label}</div>
            <div className="char-stats-grid">
              {rows.map(([k, v]) => (
                <div key={k} className="char-stat-cell">
                  <div className="char-stat-k">{k}</div>
                  <div className="char-stat-v">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function CharacterLightbox({ item, portraits, idx, onIdx, onBack, onClose }) {
  const p = portraits[idx];
  return (
    <div className="char-lightbox visible" onClick={onClose}>
      <div className="char-lightbox-inner" onClick={e => e.stopPropagation()}>
        <div className="char-lightbox-header">
          <button className="char-lightbox-btn" onClick={onBack} title="Back to details (esc)">
            ← Back to details
          </button>
          <div className="char-lightbox-title">
            <span className="char-lightbox-name">{item.name}</span>
            {p.caption && <span className="char-lightbox-caption">{p.caption}</span>}
          </div>
          <button className="char-lightbox-btn" onClick={onClose} title="Close (esc)">
            Close ×
          </button>
        </div>

        <div className="char-lightbox-stage">
          {portraits.length > 1 && (
            <button
              className="char-lightbox-nav prev"
              onClick={() => onIdx((idx - 1 + portraits.length) % portraits.length)}
              aria-label="Previous"
            >‹</button>
          )}
          <img
            key={p.src}
            className="char-lightbox-img"
            src={p.src}
            alt={p.caption || ''}
          />
          {portraits.length > 1 && (
            <button
              className="char-lightbox-nav next"
              onClick={() => onIdx((idx + 1) % portraits.length)}
              aria-label="Next"
            >›</button>
          )}
        </div>

        {portraits.length > 1 && (
          <div className="char-lightbox-strip">
            {portraits.map((pp, i) => (
              <button
                key={i}
                className={`char-lightbox-thumb ${i === idx ? 'active' : ''}`}
                onClick={() => onIdx(i)}
                title={pp.caption || ''}
              >
                <img src={pp.src} alt=""/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.CharacterPanel = CharacterPanel;
