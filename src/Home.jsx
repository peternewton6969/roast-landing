import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isConfigured } from './supabaseClient.js';
import { getVerdict, verdictColor } from './lib/verdict.js';
import { likeRoast, dislikeRoast, sortRoasts } from './lib/roasts.js';
import { isRejected } from './lib/moderation.js';

/** Fisher–Yates shuffle (used to randomize the feed on page load). */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Sort sub-tabs (within a category).
const TABS = [
  { key: 'fresh', label: 'Fresh' },
  { key: 'fire', label: 'Fire' },
];

// Situational categories (the Insult Jar library).
const CATEGORY_META = {
  tee_box: { emoji: '🏌️', label: 'Tee Box' },
  mid_round: { emoji: '🚶', label: 'Mid-Round' },
  pre_putt: { emoji: '⛳', label: 'Pre-Putt' },
  post_round: { emoji: '🍺', label: 'Post-Round' },
  swing_thought: { emoji: '🧠', label: 'The Plant' },
  general: { emoji: '🎯', label: 'General' },
};

// Category browser tabs (All + the situational ones; general shows under All).
const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'tee_box', label: '🏌️ Tee Box' },
  { key: 'mid_round', label: '🚶 Mid-Round' },
  { key: 'pre_putt', label: '⛳ Pre-Putt' },
  { key: 'post_round', label: '🍺 Post-Round' },
  { key: 'swing_thought', label: '🧠 The Plant' },
];

// Short description shown under the active category tab.
const CATEGORY_DESC = {
  tee_box: 'Before the swing. Plant a thought, watch it grow.',
  mid_round: 'After the bad shot, on the long walk to trouble.',
  pre_putt: 'Right before they draw it back. Maximum damage.',
  post_round: '19th hole, over a beer. The long-form burn.',
  swing_thought: 'Said before the shot. Sounds helpful. Is not.',
};

// Extra coaching shown on each card while browsing The Plant.
const DELIVERY_TIP = 'Delivery tip: Say it calmly. Sound concerned. Walk away immediately.';

// Submission dropdown options ("Not sure" stores as general).
const SUBMIT_CATEGORIES = [
  { value: 'tee_box', label: 'Tee Box' },
  { value: 'mid_round', label: 'Mid-Round' },
  { value: 'pre_putt', label: 'Pre-Putt' },
  { value: 'post_round', label: 'Post-Round' },
  { value: 'swing_thought', label: 'The Plant' },
  { value: 'general', label: 'Not sure' },
];

// Insert a roast; if a column doesn't exist yet (schema not migrated), drop it and
// retry so submissions never hard-fail.
async function insertRoast(row) {
  let payload = row;
  let res = await supabase.from('roasts').insert(payload);
  for (const col of ['situation', 'category']) {
    if (res.error && new RegExp(col, 'i').test(res.error.message || '') && col in payload) {
      const { [col]: _drop, ...rest } = payload;
      payload = rest;
      res = await supabase.from('roasts').insert(payload);
    }
  }
  return res.error;
}

function RoastCard({ roast, fresh, onLike, onDislike, tip }) {
  const cat = CATEGORY_META[roast.category] || CATEGORY_META.general;
  return (
    <div className={`roast-card${fresh ? ' fresh' : ''}`}>
      <span className="cat-pill">
        {cat.emoji} {cat.label}
      </span>
      {roast.situation ? (
        <div className="two-part">
          <div className="tp-block">
            <span className="tp-label sit-label">Situation</span>
            <span className="sit-text">{roast.situation}</span>
          </div>
          <div className="tp-block">
            <span className="tp-label roast-label">Roast</span>
            <span className="roast-text">{roast.content}</span>
          </div>
        </div>
      ) : (
        <div className="roast-text">{roast.content}</div>
      )}
      <div className="engage">
        <div className="engage-actions">
          <button
            type="button"
            className="fire-btn"
            onClick={() => onLike(roast.id)}
            aria-label="Fire — like this roast"
          >
            🔥 <span className="count">{roast.likes ?? 0}</span>
          </button>
          <button
            type="button"
            className="dislike-btn"
            onClick={() => onDislike(roast.id)}
            aria-label="Thumbs down"
          >
            👎 <span className="count">{roast.dislikes ?? 0}</span>
          </button>
        </div>
        <span className="badge" style={{ color: verdictColor(roast.verdict) }}>
          {roast.verdict}
        </span>
      </div>
      {tip && <p className="delivery-tip">{tip}</p>}
    </div>
  );
}

export default function Home() {
  const [roast, setRoast] = useState('');
  const [situationInput, setSituationInput] = useState('');
  const [submitCategory, setSubmitCategory] = useState('general'); // "Not sure" default
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const [mode, setMode] = useState('browse'); // 'browse' (feed) | 'add' (submission form)
  const [roasts, setRoasts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [tab, setTab] = useState(null); // null = randomized default (see load below)
  const freshId = useRef(null);

  // Waitlist
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlDone, setWlDone] = useState(false);
  const [wlError, setWlError] = useState('');

  // Filter by category, then sort (tab === null keeps the randomized load order).
  const displayed = useMemo(() => {
    const inCat =
      activeCategory === 'all'
        ? roasts
        : roasts.filter((r) => (r.category || 'general') === activeCategory);
    return tab ? sortRoasts(inCat, tab) : inCat;
  }, [roasts, activeCategory, tab]);

  // --- Load feed + subscribe to realtime INSERT (new roasts) and UPDATE (counts) ---
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase
      .from('roasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(400)
      .then(({ data }) => {
        // Randomize the order on load so the feed feels different each visit.
        if (active && Array.isArray(data)) setRoasts(shuffle(data));
      });

    const upsert = (row) =>
      setRoasts((prev) => {
        const i = prev.findIndex((r) => r.id === row.id);
        if (i === -1) return [row, ...prev];
        const next = prev.slice();
        next[i] = { ...next[i], ...row };
        return next;
      });

    const channel = supabase
      .channel('roasts-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'roasts' }, (p) => {
        freshId.current = p.new.id;
        upsert(p.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'roasts' }, (p) => {
        upsert(p.new);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Voice input (Web Speech API) ---
  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!SpeechRecognition) {
      setError('Voice input is not supported on this browser — type it instead.');
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      setRoast((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setError('');
    setListening(true);
    rec.start();
  }

  // --- Submit a roast ---
  async function handleRake() {
    const content = roast.trim();
    if (!content || submitting) return;
    // Content filter: reject slurs/hate. Rejected roasts get no verdict and are
    // NOT inserted into the database.
    if (isRejected(content)) {
      setVerdict(null);
      setError('Keep it on the golf, not identities. That one’s not going up.');
      return;
    }
    const situation = situationInput.trim() || null;
    setSubmitting(true);
    setError('');
    try {
      const v = await getVerdict(content);
      setVerdict(v);

      if (supabase) {
        const insErr = await insertRoast({ content, verdict: v, category: submitCategory, situation });
        if (insErr) throw insErr;
        // The realtime subscription adds it to the feed.
      } else {
        const local = {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          content,
          verdict: v,
          likes: 0,
          dislikes: 0,
          source: 'user',
          category: submitCategory,
          situation,
          created_at: new Date().toISOString(),
        };
        freshId.current = local.id;
        setRoasts((prev) => [local, ...prev]);
      }

      setRoast('');
      setSituationInput('');
      window.setTimeout(() => setVerdict(null), 3000);
    } catch {
      setVerdict(null);
      setError('Could not post that roast. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // --- Like / dislike (optimistic; realtime reconciles the authoritative count) ---
  function bump(id, field, fn) {
    setRoasts((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: (r[field] ?? 0) + 1 } : r)));
    fn(id);
  }
  const handleLike = (id) => bump(id, 'likes', likeRoast);
  const handleDislike = (id) => bump(id, 'dislikes', dislikeRoast);

  // --- Waitlist ---
  async function handleWaitlist(e) {
    e.preventDefault();
    const em = email.trim();
    if (!em || wlSubmitting) return;
    setWlSubmitting(true);
    setWlError('');
    try {
      if (supabase) {
        const { error: insErr } = await supabase
          .from('waitlist')
          .insert({ email: em, phone: phone.trim() || null });
        // 23505 = unique violation (already signed up) — treat as success.
        if (insErr && insErr.code !== '23505') throw insErr;
      }
      setWlDone(true);
    } catch {
      setWlError('Something went wrong. Try again.');
    } finally {
      setWlSubmitting(false);
    }
  }

  return (
    <div className="page">
      {verdict && (
        <div className="verdict-overlay" role="status" aria-live="assertive">
          <div className="verdict-word" style={{ color: verdictColor(verdict) }}>
            {verdict}
          </div>
          <div className="verdict-sub">Raking it into the feed…</div>
        </div>
      )}

      {/* Header: the Newter 69 shot (IMG_2646) as a darkened background behind the copy. */}
      <header className="header">
        <img className="header-bg" src="/hero-ball.jpg" alt="" aria-hidden="true" />
        <div className="header-overlay" aria-hidden="true" />
        <div className="header-content">
          <h1 className="brand">
            Roast<span className="accent">&rsquo;n</span> Rake
          </h1>
          <p className="tagline">Golf is fun. Talking shit is funner.</p>

          <div className="pitch">
            <p className="pitch-lead">It&rsquo;s a golf app that tracks scores and settles bets.</p>
            <p className="pitch-detail">
              The <strong>superpower</strong> comes at the end when it roasts your buddies with brutal
              accuracy. Think Kenny Powers doing your post-round breakdown.
            </p>
          </div>
        </div>
      </header>

      {/* Insult Jar mode tabs — Browse the feed vs Add an insult. Immediately below
          the header, above the category tabs. */}
      <div className="mode-tabs" role="tablist" aria-label="Insult Jar">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'browse'}
          className={`mode-tab${mode === 'browse' ? ' active' : ''}`}
          onClick={() => setMode('browse')}
        >
          Browse
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'add'}
          className={`mode-tab${mode === 'add' ? ' active' : ''}`}
          onClick={() => setMode('add')}
        >
          Add Insult
        </button>
      </div>

      {mode === 'browse' && (
        <>
      <div className="insult-jar-copy">
        <h2 className="ij-heading">The Insult Jar</h2>
        <p className="ij-body">
          Trash talk is a skill. Browse by moment, find your line, deliver it perfectly. Tee box,
          pre-putt, post-round &mdash; we wrote the curriculum.
        </p>
      </div>

      {/* Category browser — the situational library. Horizontally scrollable on mobile,
          with a right-edge fade to hint at more tabs off screen. */}
      <div className="cat-tabs-wrap">
        <div className="cat-tabs" role="tablist" aria-label="Browse by moment">
          {CATEGORY_TABS.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={activeCategory === c.key}
              className={`cat-tab${activeCategory === c.key ? ' active' : ''}`}
              onClick={() => setActiveCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {CATEGORY_DESC[activeCategory] && (
        <p className="cat-desc">{CATEGORY_DESC[activeCategory]}</p>
      )}

      <div className="feed-head">
        <h2 className="section-title">Live Roasts</h2>
        <div className="tabs" role="tablist" aria-label="Sort roasts">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="feed">
        {displayed.length === 0 ? (
          <p className="empty">
            {activeCategory === 'all'
              ? 'No roasts yet. Be the first to rake someone.'
              : 'No lines for this moment yet. Add one below.'}
          </p>
        ) : (
          displayed.map((r) => (
            <RoastCard
              key={r.id}
              roast={r}
              fresh={r.id === freshId.current}
              onLike={handleLike}
              onDislike={handleDislike}
              tip={activeCategory === 'swing_thought' ? DELIVERY_TIP : null}
            />
          ))
        )}
      </div>
        </>
      )}

      {mode === 'add' && (
        <section className="input-card">
          <div className="field-group">
            <label className="tp-label sit-label" htmlFor="situation-input">
              Situation <span className="opt">(optional)</span>
            </label>
            <input
              id="situation-input"
              className="field"
              type="text"
              value={situationInput}
              placeholder={'When does this line land? e.g. "Partner is about to putt"'}
              onChange={(e) => setSituationInput(e.target.value)}
              aria-label="Situation (optional)"
            />
          </div>
          <div className="field-group">
            <label className="tp-label roast-label" htmlFor="roast-input">
              Roast
            </label>
            <div className="roast-row">
              <textarea
                id="roast-input"
                className="roast-input"
                rows={2}
                value={roast}
                placeholder="Type your best roast..."
                onChange={(e) => setRoast(e.target.value)}
                aria-label="Your roast"
              />
              <button
                type="button"
                className={`mic${listening ? ' listening' : ''}`}
                onClick={toggleMic}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                title="Speak your roast"
              >
                🎤
              </button>
            </div>
          </div>
          <label className="cat-select-label">
            When does this land best?
            <select
              className="cat-select"
              value={submitCategory}
              onChange={(e) => setSubmitCategory(e.target.value)}
              aria-label="When does this land best?"
              required
            >
              {SUBMIT_CATEGORIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rake-btn"
            disabled={roast.trim() === '' || submitting}
            onClick={handleRake}
          >
            {submitting ? 'Raking…' : 'Rake Em'}
          </button>
          {error !== '' && <p className="err">{error}</p>}
          {!isConfigured && (
            <p className="hint">Preview mode — submissions aren&rsquo;t saved yet (backend not connected).</p>
          )}
        </section>
      )}

      <section className="waitlist">
        <h2>Want the full app?</h2>
        <p className="sub">Get early access when we launch.</p>
        {wlDone ? (
          <div className="waitlist-done">You&rsquo;re on the list. We&rsquo;ll be in touch.</div>
        ) : (
          <form onSubmit={handleWaitlist} style={{ display: 'grid', gap: 10 }}>
            <input
              className="field"
              type="email"
              required
              value={email}
              placeholder="you@email.com"
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
            <input
              className="field"
              type="tel"
              value={phone}
              placeholder="Phone (optional)"
              onChange={(e) => setPhone(e.target.value)}
              aria-label="Phone (optional)"
            />
            <p className="field-help">We&rsquo;ll text you when we launch. No spam. Ever.</p>
            {wlError !== '' && <p className="err">{wlError}</p>}
            <button type="submit" className="waitlist-btn" disabled={email.trim() === '' || wlSubmitting}>
              {wlSubmitting ? 'Submitting…' : 'Get Early Access'}
            </button>
          </form>
        )}
      </section>

      <footer className="footer">Roast&rsquo;n Rake &middot; play fair, pay up, repeat.</footer>
    </div>
  );
}
