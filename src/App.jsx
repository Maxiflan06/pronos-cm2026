import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

// ═══════════════════════════════════════════════════════════════
//  🔥  ÉTAPE 1 — Collez ici vos clés Firebase
//      (Projet Firebase → Paramètres → Vos applications → Config)
// ═══════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB853H3a67BKa7vpjeB9fHE2tx2FvRXYSE",
  authDomain:        "pronos-cm2026.firebaseapp.com",
  databaseURL:       "https://pronos-cm2026-default-rtdb.firebaseio.com",
  projectId:         "pronos-cm2026",
  storageBucket:     "pronos-cm2026.firebasestorage.app",
  messagingSenderId: "199978443427",
  appId:             "1:199978443427:web:d8e0e21f54acad32f39516",
};

// ═══════════════════════════════════════════════════════════════
//  ⚙️  ÉTAPE 2 — Ajoutez vos matchs ici
// ═══════════════════════════════════════════════════════════════
const MATCHES = [
  // Format : { id, group, home, away, kickoff (UTC en ISO 8601), venue }
  // Heure Paris (été, UTC+2) → UTC : 21h Paris = 19:00Z | 23h Paris = 21:00Z
  //
  // ── Groupe A ──────────────────────────────────────────────────────
  { id:"A1", group:"A", home:"🇲🇽 Mexique",         away:"🇿🇦 Afrique du Sud",  kickoff:"2026-06-11T19:00:00Z", venue:"Estadio Azteca, Mexico City" },
  { id:"A2", group:"A", home:"🇰🇷 Corée du Sud",    away:"🇨🇿 Tchéquie",        kickoff:"2026-06-12T02:00:00Z", venue:"Estadio Akron, Guadalajara" },
  // ── Groupe B ──────────────────────────────────────────────────────
  { id:"B1", group:"B", home:"🇨🇦 Canada",           away:"🇧🇦 Bosnie-Herz.",    kickoff:"2026-06-12T19:00:00Z", venue:"BMO Field, Toronto" },
  { id:"B2", group:"B", home:"🇶🇦 Qatar",            away:"🇨🇭 Suisse",          kickoff:"2026-06-13T19:00:00Z", venue:"Levi's Stadium, San Francisco" },
  // ── Groupe C ──────────────────────────────────────────────────────
  { id:"C1", group:"C", home:"🇧🇷 Brésil",          away:"🇲🇦 Maroc",           kickoff:"2026-06-12T22:00:00Z", venue:"MetLife Stadium, New York/NJ" },
  { id:"C2", group:"C", home:"🇭🇹 Haïti",           away:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse",          kickoff:"2026-06-13T01:00:00Z", venue:"Gillette Stadium, Boston" },
  // ── Groupe D ──────────────────────────────────────────────────────
  { id:"D1", group:"D", home:"🇺🇸 États-Unis",      away:"🇵🇾 Paraguay",        kickoff:"2026-06-13T01:00:00Z", venue:"SoFi Stadium, Los Angeles" },
  { id:"D2", group:"D", home:"🇦🇺 Australie",       away:"🇹🇷 Turquie",         kickoff:"2026-06-14T02:00:00Z", venue:"BC Place, Vancouver" },
  // ── Groupe E ──────────────────────────────────────────────────────
  { id:"E1", group:"E", home:"🇩🇪 Allemagne",       away:"🇨🇼 Curaçao",         kickoff:"2026-06-13T17:00:00Z", venue:"NRG Stadium, Houston" },
  { id:"E2", group:"E", home:"🇨🇮 Côte d'Ivoire",  away:"🇪🇨 Équateur",        kickoff:"2026-06-13T19:00:00Z", venue:"Lincoln Financial Field, Philadelphie" },
  // ── Groupe F ──────────────────────────────────────────────────────
  { id:"F1", group:"F", home:"🇳🇱 Pays-Bas",        away:"🇯🇵 Japon",           kickoff:"2026-06-13T20:00:00Z", venue:"AT&T Stadium, Dallas" },
  // ── Groupe I — France ─────────────────────────────────────────────
  { id:"I1", group:"I", home:"🇫🇷 France",          away:"🇸🇳 Sénégal",         kickoff:"2026-06-16T19:00:00Z", venue:"MetLife Stadium, New York" },
  { id:"I2", group:"I", home:"🇫🇷 France",          away:"🇮🇶 Irak",            kickoff:"2026-06-22T21:00:00Z", venue:"Lincoln Financial Field, Philadelphie" },
  { id:"I3", group:"I", home:"🇳🇴 Norvège",         away:"🇫🇷 France",          kickoff:"2026-06-26T19:00:00Z", venue:"Gillette Stadium, Boston" },
  // Ajoutez vos matchs ici ↑
];

// ═══════════════════════════════════════════════════════════════
//  Initialisation Firebase (ne pas modifier)
// ═══════════════════════════════════════════════════════════════
const firebaseOK = !FIREBASE_CONFIG.apiKey.startsWith("VOTRE");
const app  = firebaseOK ? initializeApp(FIREBASE_CONFIG) : null;
const db   = firebaseOK ? getDatabase(app) : null;

const APP_ID      = "wc26";
const K_ME        = `${APP_ID}_myname`;           // localStorage (personnel)
const PLAYERS_PATH = `${APP_ID}/players`;          // Firebase (partagé)
const predsPath   = (u) => `${APP_ID}/preds/${encodeURIComponent(u)}`;

// ── Utilitaires ───────────────────────────────────────────────
const shortN   = (t) => t.replace(/^\S+\s/, "");
const isLocked = (k) => Date.now() >= new Date(k).getTime();
const fmtDate  = (iso) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" }) +
    " · " +
    d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })
  );
};

// ═══════════════════════════════════════════════════════════════
//  Styles
// ═══════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Outfit',sans-serif; background:#080D1A; color:#E2E8FF; min-height:100vh; }

.app { max-width:720px; margin:0 auto; min-height:100vh; background:linear-gradient(180deg,#0B0F1E 0%,#080D18 100%); padding-bottom:72px; }

/* ─ HEADER ─ */
.header { position:sticky; top:0; z-index:50; background:linear-gradient(135deg,#0F1A35 0%,#152240 100%); border-bottom:2px solid rgba(245,200,66,.6); box-shadow:0 4px 32px rgba(0,0,0,.5); padding:16px 20px 0; }
.header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.logo { font-family:'Bebas Neue',sans-serif; font-size:26px; color:#F5C842; letter-spacing:2px; line-height:1; display:flex; align-items:center; gap:8px; }
.logo em { font-style:normal; color:#fff; opacity:.55; font-size:20px; }
.user-chip { display:flex; align-items:center; gap:6px; background:rgba(245,200,66,.1); border:1px solid rgba(245,200,66,.3); border-radius:999px; padding:6px 14px 6px 10px; cursor:pointer; transition:background .2s; font-size:13px; font-weight:600; color:#F5C842; }
.user-chip:hover { background:rgba(245,200,66,.2); }
.tabs { display:flex; gap:0; }
.tab { flex:1; background:transparent; border:none; border-bottom:3px solid transparent; color:#4E5E84; font-family:'Outfit',sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:10px 8px 11px; cursor:pointer; transition:color .2s,border-color .2s; }
.tab.active { color:#F5C842; border-bottom-color:#F5C842; }
.tab:hover:not(.active) { color:#8A9AC0; }

/* ─ CONTENT ─ */
.content { padding:20px 16px; }

/* ─ STATS ─ */
.stats-row { display:flex; gap:10px; margin-bottom:24px; }
.stat-box { flex:1; background:linear-gradient(135deg,#10182E,#141E38); border:1px solid #1B2A47; border-radius:12px; padding:14px 10px; text-align:center; }
.stat-num { font-family:'Bebas Neue',sans-serif; font-size:32px; color:#F5C842; line-height:1; letter-spacing:1px; }
.stat-lbl { font-size:10px; font-weight:700; color:#3D5070; text-transform:uppercase; letter-spacing:.8px; margin-top:4px; }

/* ─ GROUPS ─ */
.group-section { margin-bottom:32px; }
.group-title { font-family:'Bebas Neue',sans-serif; font-size:15px; letter-spacing:4px; color:#F5C842; margin-bottom:12px; display:flex; align-items:center; gap:10px; }
.group-title::after { content:''; flex:1; height:1px; background:linear-gradient(to right,rgba(245,200,66,.3),transparent); }

/* ─ CARD ─ */
.card { background:linear-gradient(135deg,#0F182C,#121B30); border:1px solid #1B2A47; border-radius:14px; padding:14px 16px; margin-bottom:10px; transition:border-color .2s; }
.card:hover:not(.locked) { border-color:#263A5E; }
.card.locked { opacity:.6; }
.card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.card-date { font-size:12px; color:#3D5070; font-weight:500; }
.badge { font-size:10px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; padding:3px 9px; border-radius:999px; }
.badge-locked { background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3); color:#F87171; }
.badge-open { background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.25); color:#4ADE80; }
.card-teams { display:flex; align-items:center; gap:8px; }
.team-block { flex:1; min-width:0; }
.team-block.right { text-align:right; }
.team-label { font-size:14px; font-weight:700; color:#D0DCFF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
.score-wrap { display:flex; align-items:center; gap:5px; flex-shrink:0; }
.score-in { width:46px; height:46px; background:#141E36; border:2px solid #1E2E4A; border-radius:10px; color:#F5C842; font-family:'Bebas Neue',sans-serif; font-size:24px; text-align:center; transition:border-color .15s,background .15s; -moz-appearance:textfield; appearance:textfield; }
.score-in::-webkit-outer-spin-button,.score-in::-webkit-inner-spin-button { -webkit-appearance:none; }
.score-in::placeholder { color:#2C3E5A; }
.score-in:focus { outline:none; border-color:#F5C842; background:#1A2640; }
.score-in.has-val { border-color:rgba(34,197,94,.45); background:rgba(34,197,94,.07); }
.score-in:disabled { color:#2C3E5A; cursor:not-allowed; border-color:#141E36; background:#0F172A; }
.score-sep { font-family:'Bebas Neue',sans-serif; font-size:20px; color:#2C3E5A; user-select:none; }
.card-venue { font-size:11px; color:#2C3E5A; margin-top:10px; text-align:center; }

/* ─ WELCOME ─ */
.welcome { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 24px; text-align:center; background:radial-gradient(ellipse at 50% 30%,#162040 0%,#080D1A 70%); }
.welcome-ball { font-size:72px; margin-bottom:24px; display:block; animation:float 3s ease-in-out infinite; }
@keyframes float { 0%,100% { transform:translateY(0) rotate(-5deg); } 50% { transform:translateY(-14px) rotate(5deg); } }
.welcome-title { font-family:'Bebas Neue',sans-serif; font-size:48px; color:#F5C842; letter-spacing:4px; line-height:1; margin-bottom:8px; }
.welcome-sub { font-size:16px; color:#4E5E84; margin-bottom:48px; }
.name-in { display:block; width:100%; max-width:300px; background:#0F182C; border:2px solid #1B2A47; border-radius:14px; color:#E2E8FF; font-family:'Outfit',sans-serif; font-size:18px; font-weight:600; padding:14px 20px; text-align:center; transition:border-color .2s; margin-bottom:14px; }
.name-in:focus { outline:none; border-color:#F5C842; }
.name-in::placeholder { color:#2C3E5A; }
.btn-go { display:block; width:100%; max-width:300px; background:linear-gradient(135deg,#F5C842,#D4A800); border:none; border-radius:14px; color:#080D18; font-family:'Outfit',sans-serif; font-size:16px; font-weight:800; padding:16px; cursor:pointer; transition:transform .1s,box-shadow .2s; letter-spacing:.3px; }
.btn-go:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(245,200,66,.35); }
.btn-go:active { transform:translateY(0); }
.btn-go:disabled { opacity:.35; cursor:not-allowed; }

/* ─ COMPARE ─ */
.players-chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px; }
.p-chip { background:rgba(245,200,66,.08); border:1px solid rgba(245,200,66,.18); color:#907840; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; }
.p-chip.me { background:rgba(245,200,66,.18); border-color:rgba(245,200,66,.5); color:#F5C842; }
.cmp-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.cmp-label { font-size:12px; color:#4E5E84; font-weight:600; text-transform:uppercase; letter-spacing:.8px; }
.scroll-wrap { overflow-x:auto; border-radius:12px; border:1px solid #1B2A47; }
.cmp-table { width:100%; border-collapse:collapse; font-size:13px; }
.cmp-table th { background:#0F182C; padding:10px 14px; text-align:center; color:#4E5E84; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #1B2A47; white-space:nowrap; }
.cmp-table th.mc { text-align:left; min-width:140px; position:sticky; left:0; background:#0F182C; }
.cmp-table td { padding:9px 14px; border-bottom:1px solid rgba(27,42,71,.5); text-align:center; white-space:nowrap; }
.cmp-table td.mc { text-align:left; color:#8A9AC0; font-weight:600; font-size:12px; position:sticky; left:0; background:#0D1425; }
.cmp-table tr:last-child td { border-bottom:none; }
.cmp-table tr:nth-child(even) td { background:rgba(255,255,255,.015); }
.cmp-table tr:nth-child(even) td.mc { background:#0E1629; }
.pred-val { font-family:'Bebas Neue',sans-serif; font-size:17px; letter-spacing:1px; color:#F5C842; }
.no-pred { color:#2C3E5A; font-size:16px; }
.match-open-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#4ADE80; margin-left:4px; vertical-align:middle; }

/* ─ UTILS ─ */
.refresh-btn { background:transparent; border:1px solid #1B2A47; border-radius:8px; color:#4E5E84; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; padding:6px 12px; cursor:pointer; transition:all .2s; }
.refresh-btn:hover { color:#8A9AC0; border-color:#2C3E5A; }
.live-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#4ADE80; animation:pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.7); } }

.toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:#22C55E; color:#000; font-weight:700; font-size:14px; padding:10px 24px; border-radius:999px; z-index:999; animation:toast-in .3s cubic-bezier(.34,1.56,.64,1); pointer-events:none; }
@keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

.loading-screen { min-height:100vh; display:flex; align-items:center; justify-content:center; gap:14px; font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:3px; color:#F5C842; }
.spin { width:28px; height:28px; border:3px solid rgba(245,200,66,.2); border-top-color:#F5C842; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.empty { text-align:center; padding:60px 24px; color:#2C3E5A; }
.empty-icon { font-size:48px; margin-bottom:12px; }
.empty-txt { font-size:15px; font-weight:500; line-height:1.6; }

/* ─ CONFIG WARNING ─ */
.config-warn { margin:24px 16px; background:rgba(251,191,36,.07); border:1px solid rgba(251,191,36,.3); border-radius:14px; padding:20px; }
.config-warn h3 { color:#FCD34D; font-size:15px; margin-bottom:8px; }
.config-warn p { color:#92815A; font-size:13px; line-height:1.6; }
.config-warn code { background:rgba(251,191,36,.1); color:#FCD34D; border-radius:4px; padding:1px 6px; font-size:12px; }
`;

// ═══════════════════════════════════════════════════════════════
//  MatchCard
// ═══════════════════════════════════════════════════════════════
function MatchCard({ match, pred, onSave }) {
  const locked = isLocked(match.kickoff);
  const [h, setH] = useState(pred?.home !== undefined ? String(pred.home) : "");
  const [a, setA] = useState(pred?.away !== undefined ? String(pred.away) : "");

  useEffect(() => {
    setH(pred?.home !== undefined ? String(pred.home) : "");
    setA(pred?.away !== undefined ? String(pred.away) : "");
  }, [pred?.home, pred?.away]);

  const trySave = (latestH, latestA) => {
    if (latestH !== "" && latestA !== "" && !locked) {
      onSave(match.id, Number(latestH), Number(latestA));
    }
  };

  return (
    <div className={`card${locked ? " locked" : ""}`}>
      <div className="card-top">
        <span className="card-date">{fmtDate(match.kickoff)}</span>
        {locked
          ? <span className="badge badge-locked">🔒 Verrouillé</span>
          : <span className="badge badge-open">● Ouvert</span>
        }
      </div>
      <div className="card-teams">
        <div className="team-block">
          <span className="team-label">{match.home}</span>
        </div>
        <div className="score-wrap">
          <input type="number" min="0" max="30" placeholder="–"
            className={`score-in${h !== "" ? " has-val" : ""}`}
            value={h} disabled={locked}
            onChange={e => setH(e.target.value)}
            onBlur={e => trySave(e.target.value, a)}
          />
          <span className="score-sep">–</span>
          <input type="number" min="0" max="30" placeholder="–"
            className={`score-in${a !== "" ? " has-val" : ""}`}
            value={a} disabled={locked}
            onChange={e => setA(e.target.value)}
            onBlur={e => trySave(h, e.target.value)}
          />
        </div>
        <div className="team-block right">
          <span className="team-label">{match.away}</span>
        </div>
      </div>
      <div className="card-venue">📍 {match.venue}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CompareTab
// ═══════════════════════════════════════════════════════════════
function CompareTab({ players, allPreds, matches, username }) {
  if (players.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">👥</div>
        <div className="empty-txt">
          Personne d'autre n'a encore rejoint.<br />
          Partagez le lien de l'appli avec vos amis !
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cmp-top">
        <span className="cmp-label">{players.length} participant{players.length > 1 ? "s" : ""}</span>
        <span style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"#4ADE80" }}>
          <span className="live-dot" /> Temps réel
        </span>
      </div>
      <div className="players-chips">
        {players.map(p => (
          <span key={p} className={`p-chip${p === username ? " me" : ""}`}>
            {p === username ? "👤 " : ""}{p}
          </span>
        ))}
      </div>
      <div className="scroll-wrap">
        <table className="cmp-table">
          <thead>
            <tr>
              <th className="mc">Match</th>
              {players.map(p => <th key={p}>{p === username ? "👤 " : ""}{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {matches.map(match => {
              const open = !isLocked(match.kickoff);
              return (
                <tr key={match.id}>
                  <td className="mc">
                    {shortN(match.home)} – {shortN(match.away)}
                    {open && <span className="match-open-dot" title="Ouvert" />}
                  </td>
                  {players.map(p => {
                    const pred = allPreds[p]?.[match.id];
                    return (
                      <td key={p}>
                        {pred !== undefined
                          ? <span className="pred-val">{pred.home} – {pred.away}</span>
                          : <span className="no-pred">—</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  App principale
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [loading,   setLoading]   = useState(true);
  const [username,  setUsername]  = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [myPreds,   setMyPreds]   = useState({});
  const [players,   setPlayers]   = useState([]);
  const [allPreds,  setAllPreds]  = useState({});
  const [activeTab, setActiveTab] = useState("pronos");
  const [toast,     setToast]     = useState(null);

  // ── Chargement initial ───────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(K_ME);
    if (saved && firebaseOK) {
      setUsername(saved);
      loadMyPreds(saved);
      registerPlayer(saved);
    }
    setLoading(false);
  }, []);

  // ── Listener temps réel (onglet Comparer) ────────────────────
  useEffect(() => {
    if (activeTab !== "compare" || !username || !firebaseOK) return;

    const playersRef = ref(db, PLAYERS_PATH);
    const unsub = onValue(playersRef, async (snap) => {
      if (!snap.exists()) return;
      const list = Object.keys(snap.val());
      setPlayers(list);
      const map = {};
      for (const p of list) {
        try {
          const pr = await get(ref(db, predsPath(p)));
          if (pr.exists()) map[p] = pr.val();
        } catch (_) {}
      }
      setAllPreds(map);
    });

    return () => unsub();
  }, [activeTab, username]);

  // ── Fonctions Firebase ───────────────────────────────────────
  async function loadMyPreds(name) {
    try {
      const snap = await get(ref(db, predsPath(name)));
      if (snap.exists()) setMyPreds(snap.val());
    } catch (_) {}
  }

  async function registerPlayer(name) {
    try {
      await set(ref(db, `${PLAYERS_PATH}/${encodeURIComponent(name)}`), true);
    } catch (_) {}
  }

  async function handleJoin() {
    const name = nameInput.trim().slice(0, 24);
    if (!name || !firebaseOK) return;
    setLoading(true);
    localStorage.setItem(K_ME, name);
    setUsername(name);
    await registerPlayer(name);
    await loadMyPreds(name);
    setLoading(false);
  }

  async function savePred(matchId, home, away) {
    if (!firebaseOK) return;
    const updated = { ...myPreds, [matchId]: { home, away } };
    setMyPreds(updated);
    try {
      await set(ref(db, predsPath(username)), updated);
      showToast("✓ Prono enregistré");
    } catch (_) {
      showToast("⚠️ Erreur Firebase");
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // ── Rendu ────────────────────────────────────────────────────
  if (loading) return (
    <><style>{CSS}</style><div className="loading-screen"><div className="spin" />Chargement…</div></>
  );

  // Avertissement si Firebase non configuré
  if (!firebaseOK) return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <div className="header-row">
            <div className="logo">⚽ Pronos <em>CM 2026</em></div>
          </div>
        </div>
        <div className="config-warn">
          <h3>⚙️ Configuration Firebase manquante</h3>
          <p>
            Ouvrez le fichier <code>App.jsx</code> et remplacez les valeurs dans
            <code>FIREBASE_CONFIG</code> par vos clés Firebase.<br /><br />
            Consultez le fichier <code>GUIDE.md</code> pour les instructions pas-à-pas.
          </p>
        </div>
      </div>
    </>
  );

  if (!username) return (
    <>
      <style>{CSS}</style>
      <div className="welcome">
        <span className="welcome-ball">⚽</span>
        <h1 className="welcome-title">Pronos<br />CM 2026</h1>
        <p className="welcome-sub">Entrez votre prénom pour rejoindre le groupe</p>
        <input className="name-in" placeholder="Votre prénom / pseudo"
          value={nameInput} onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleJoin()}
          maxLength={24} autoFocus
        />
        <button className="btn-go" onClick={handleJoin} disabled={!nameInput.trim()}>
          Rejoindre 🚀
        </button>
      </div>
    </>
  );

  const grouped = MATCHES.reduce((acc, m) => {
    (acc[m.group] = acc[m.group] || []).push(m);
    return acc;
  }, {});

  const totalPreds  = Object.keys(myPreds).length;
  const openMatches = MATCHES.filter(m => !isLocked(m.kickoff)).length;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        <div className="header">
          <div className="header-row">
            <div className="logo">⚽ Pronos <em>CM 2026</em></div>
            <div className="user-chip"
              onClick={() => {
                if (window.confirm(`Changer de pseudo ?\n(Vos pronos restent liés à "${username}")`)) {
                  localStorage.removeItem(K_ME);
                  setUsername(null);
                  setNameInput("");
                  setMyPreds({});
                }
              }}
              title="Cliquez pour changer de pseudo"
            >
              👤 {username}
            </div>
          </div>
          <div className="tabs">
            {[
              { key:"pronos",  label:"Mes pronos" },
              { key:"compare", label:"Comparer"   },
            ].map(t => (
              <button key={t.key}
                className={`tab${activeTab === t.key ? " active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="content">
          {activeTab === "pronos" && (
            <>
              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-num">{totalPreds}</div>
                  <div className="stat-lbl">Pronos saisis</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{openMatches}</div>
                  <div className="stat-lbl">Matchs ouverts</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{players.length}</div>
                  <div className="stat-lbl">Participants</div>
                </div>
              </div>
              {Object.entries(grouped)
                .sort(([a],[b]) => a.localeCompare(b))
                .map(([group, matches]) => (
                  <div key={group} className="group-section">
                    <div className="group-title">Groupe {group}</div>
                    {matches.map(match => (
                      <MatchCard key={match.id} match={match}
                        pred={myPreds[match.id]} onSave={savePred}
                      />
                    ))}
                  </div>
                ))}
            </>
          )}

          {activeTab === "compare" && (
            <CompareTab
              players={players} allPreds={allPreds}
              matches={MATCHES} username={username}
            />
          )}
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
