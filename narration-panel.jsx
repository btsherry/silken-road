// Narration playback panel: papyrus scroll overlay with transport controls,
// draggable scrubber, and prev/next navigation across origins + episodes.
// Uses the same scroll-paper aesthetic as ScrollPanel for continuity.

const { useState, useEffect, useRef } = React;

const SKIP_SEC = 15;

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function NarrationPanel({ entity, allNarrations, onClose, onNavigate }) {
  const { item } = entity;
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 0);
  const [loading, setLoading] = useState(true);

  const idx = allNarrations.findIndex(n => n.id === item.id);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < allNarrations.length - 1;

  // Reset state on entity swap; pause and load new source.
  useEffect(() => {
    setCurrentTime(0);
    setDuration(item.duration || 0);
    setLoading(true);
    setPlaying(false);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = item.audio;
      a.load();
    }
  }, [item.id]);

  // Wire up audio events.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => { setDuration(a.duration); setLoading(false); };
    const onEnded = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // Pause on unmount (close).
  useEffect(() => () => {
    const a = audioRef.current;
    if (a) a.pause();
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const seekBy = (delta) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min((duration || 0), a.currentTime + delta));
  };

  const onScrub = (e) => {
    const a = audioRef.current;
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (a) a.currentTime = t;
  };

  const goPrev = () => { if (hasPrev) onNavigate(allNarrations[idx - 1].id); };
  const goNext = () => { if (hasNext) onNavigate(allNarrations[idx + 1].id); };

  // Keyboard shortcuts while panel is open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); seekBy(-SKIP_SEC); }
      else if (e.code === "ArrowRight") { e.preventDefault(); seekBy(SKIP_SEC); }
      else if (e.code === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duration, hasPrev, hasNext]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="scroll-backdrop visible" onClick={onClose}>
      <div className="scroll-wrap" onClick={e => e.stopPropagation()}>
        <button className="scroll-close" onClick={onClose} title="Re-roll">×</button>
        <div className="scroll-roll scroll-roll-left"/>
        <div className="scroll-roll scroll-roll-right"/>

        <div className="scroll-paper">
          <div className="wax-seal">♪</div>
          <div className="scroll-eyebrow">— Narration —</div>
          <h2 className="scroll-title">{item.name}</h2>
          {item.role && <div className="scroll-subtitle">{item.role}</div>}

          <div className="scroll-divider">
            <div className="scroll-divider-line"/>
            <span className="scroll-divider-glyph">❧ ♪ ❧</span>
            <div className="scroll-divider-line"/>
          </div>

          {item.image && (
            <div className="scroll-image has-image">
              <img src={item.image} alt={item.name} className="scroll-image-img"/>
            </div>
          )}

          <div className="scroll-body">
            <p className="drop-cap">{item.blurb}</p>
          </div>

          <div className="narration-transport">
            <audio ref={audioRef} src={item.audio} preload="metadata"/>

            <div className="narration-scrubber-row">
              <span className="narration-time narration-time-cur">{fmtTime(currentTime)}</span>
              <input
                type="range"
                className="narration-scrubber"
                min={0}
                max={duration || item.duration || 1}
                step={0.1}
                value={currentTime}
                onChange={onScrub}
                onInput={onScrub}
                style={{
                  background: `linear-gradient(to right,
                    oklch(0.52 0.20 27) 0%,
                    oklch(0.52 0.20 27) ${pct}%,
                    oklch(0.6 0.04 85 / 0.3) ${pct}%,
                    oklch(0.6 0.04 85 / 0.3) 100%)`
                }}
              />
              <span className="narration-time narration-time-tot">{fmtTime(duration || item.duration || 0)}</span>
            </div>

            <div className="narration-buttons">
              <button
                className="narration-btn narration-btn-nav"
                onClick={goPrev}
                disabled={!hasPrev}
                title="Previous narration"
              >⏮</button>
              <button
                className="narration-btn narration-btn-skip"
                onClick={() => seekBy(-SKIP_SEC)}
                title={`Back ${SKIP_SEC}s`}
              >⏪ {SKIP_SEC}</button>
              <button
                className="narration-btn narration-btn-play"
                onClick={toggle}
                title={playing ? "Pause" : "Play"}
              >{playing ? "❚❚" : "▶"}</button>
              <button
                className="narration-btn narration-btn-skip"
                onClick={() => seekBy(SKIP_SEC)}
                title={`Forward ${SKIP_SEC}s`}
              >{SKIP_SEC} ⏩</button>
              <button
                className="narration-btn narration-btn-nav"
                onClick={goNext}
                disabled={!hasNext}
                title="Next narration"
              >⏭</button>
            </div>

            <div className="narration-hint">
              {loading ? "buffering…" : "space ▸ play/pause   ←/→ ▸ skip 15s   esc ▸ close"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.NarrationPanel = NarrationPanel;
