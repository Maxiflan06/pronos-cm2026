import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update } from "firebase/database";

// ═══════════════════════════════════════════════════════════════
//  🔥  CONFIG FIREBASE — déjà remplie avec vos clés
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
//  🔐  MOT DE PASSE ADMIN — changez-le avant de déployer !
// ═══════════════════════════════════════════════════════════════
const ADMIN_PASSWORD = "admin2026";

// ═══════════════════════════════════════════════════════════════
//  ⚙️  MATCHS
// ═══════════════════════════════════════════════════════════════
const MATCHES = [
  { id:"A1", group:"A", home:"🇲🇽 Mexique",        away:"🇿🇦 Afrique du Sud",  kickoff:"2026-06-11T19:00:00Z", venue:"Estadio Azteca, Mexico City" },
  { id:"A2", group:"A", home:"🇰🇷 Corée du Sud",   away:"🇨🇿 Tchéquie",        kickoff:"2026-06-12T02:00:00Z", venue:"Estadio Akron, Guadalajara" },
  { id:"B1", group:"B", home:"🇨🇦 Canada",          away:"🇧🇦 Bosnie-Herz.",    kickoff:"2026-06-12T19:00:00Z", venue:"BMO Field, Toronto" },
  { id:"B2", group:"B", home:"🇶🇦 Qatar",           away:"🇨🇭 Suisse",          kickoff:"2026-06-13T19:00:00Z", venue:"Levi's Stadium, San Francisco" },
  { id:"C1", group:"C", home:"🇧🇷 Brésil",         away:"🇲🇦 Maroc",           kickoff:"2026-06-12T22:00:00Z", venue:"MetLife Stadium, New York/NJ" },
  { id:"C2", group:"C", home:"🇭🇹 Haïti",          away:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse",          kickoff:"2026-06-13T01:00:00Z", venue:"Gillette Stadium, Boston" },
  { id:"D1", group:"D", home:"🇺🇸 États-Unis",     away:"🇵🇾 Paraguay",        kickoff:"2026-06-13T01:00:00Z", venue:"SoFi Stadium, Los Angeles" },
  { id:"D2", group:"D", home:"🇦🇺 Australie",      away:"🇹🇷 Turquie",         kickoff:"2026-06-14T02:00:00Z", venue:"BC Place, Vancouver" },
  { id:"E1", group:"E", home:"🇩🇪 Allemagne",      away:"🇨🇼 Curaçao",         kickoff:"2026-06-13T17:00:00Z", venue:"NRG Stadium, Houston" },
  { id:"E2", group:"E", home:"🇨🇮 Côte d'Ivoire", away:"🇪🇨 Équateur",        kickoff:"2026-06-13T19:00:00Z", venue:"Lincoln Financial Field, Philadelphie" },
  { id:"F1", group:"F", home:"🇳🇱 Pays-Bas",       away:"🇯🇵 Japon",           kickoff:"2026-06-13T20:00:00Z", venue:"AT&T Stadium, Dallas" },
  { id:"I1", group:"I", home:"🇫🇷 France",         away:"🇸🇳 Sénégal",         kickoff:"2026-06-16T19:00:00Z", venue:"MetLife Stadium, New York" },
  { id:"I2", group:"I", home:"🇫🇷 France",         away:"🇮🇶 Irak",            kickoff:"2026-06-22T21:00:00Z", venue:"Lincoln Financial Field, Philadelphie" },
  { id:"I3", group:"I", home:"🇳🇴 Norvège",        away:"🇫🇷 France",          kickoff:"2026-06-26T19:00:00Z", venue:"Gillette Stadium, Boston" },
];

// ═══════════════════════════════════════════════════════════════
//  🏆  ÉQUIPES (pour la prédiction du vainqueur)
// ═══════════════════════════════════════════════════════════════
const TEAMS = [
  "🇦🇷 Argentine","🇫🇷 France","🇧🇷 Brésil","🇪🇸 Espagne","🇵🇹 Portugal",
  "🇩🇪 Allemagne","🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre","🇳🇱 Pays-Bas","🇧🇪 Belgique","🇺🇾 Uruguay",
  "🇲🇽 Mexique","🇺🇸 États-Unis","🇨🇦 Canada","🇨🇴 Colombie","🇪🇨 Équateur",
  "🇵🇾 Paraguay","🇨🇱 Chili","🇵🇪 Pérou","🇻🇪 Venezuela","🇧🇴 Bolivie",
  "🇯🇵 Japon","🇰🇷 Corée du Sud","🇦🇺 Australie","🇮🇷 Iran","🇸🇦 Arabie Saoudite",
  "🇶🇦 Qatar","🇺🇿 Ouzbékistan","🇨🇳 Chine","🇲🇦 Maroc","🇸🇳 Sénégal",
  "🇨🇮 Côte d'Ivoire","🇳🇬 Nigéria","🇬🇭 Ghana","🇨🇲 Cameroun","🇿🇦 Afrique du Sud",
  "🇩🇿 Algérie","🇹🇳 Tunisie","🇪🇬 Égypte","🇲🇱 Mali","🇲🇿 Mozambique",
  "🇨🇭 Suisse","🇨🇿 Tchéquie","🇵🇱 Pologne","🇦🇹 Autriche","🇹🇷 Turquie",
  "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse","🇷🇴 Roumanie","🇭🇺 Hongrie","🇧🇦 Bosnie-Herzégovine",
  "🇮🇶 Irak","🇳🇴 Norvège","🇭🇹 Haïti","🇨🇼 Curaçao",
];

// ═══════════════════════════════════════════════════════════════
//  Firebase + constantes internes
// ═══════════════════════════════════════════════════════════════
const firebaseOK = !FIREBASE_CONFIG.apiKey.startsWith("VOTRE");
let app, db;
if (firebaseOK) { app = initializeApp(FIREBASE_CONFIG); db = getDatabase(app); }

const APP      = "wc26";
const fKey     = s => s.replace(/[.#$[\]/]/g, "_");
const pPath    = u => `${APP}/preds/${fKey(u)}`;
const jPath    = u => `${APP}/jokers/${fKey(u)}`;
const wPath    = u => `${APP}/winnerPreds/${fKey(u)}`;

// ═══════════════════════════════════════════════════════════════
//  Utilitaires
// ═══════════════════════════════════════════════════════════════
const shortN   = t => t.replace(/^\S+\s/, "");
const isLocked = k => Date.now() >= new Date(k).getTime();
const fmtDate  = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})
    + " · " + d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
};
const norm = s => (s||"").replace(/^\S+\s*/,"").toLowerCase().trim();

function calcPoints(preds, scores, jokerMatchId, winnerPred, tournamentWinner) {
  let total = 0, exact = 0, result = 0, jokerBonus = 0;
  for (const [id, pred] of Object.entries(preds||{})) {
    const s = scores?.[id];
    if (!s || pred.home==null || pred.away==null) continue;
    let pts = 0;
    if (pred.home===s.home && pred.away===s.away) { pts=3; exact++; }
    else if (Math.sign(pred.home-pred.away)===Math.sign(s.home-s.away)) { pts=1; result++; }
    if (jokerMatchId===id) { jokerBonus = pts; pts*=2; }
    total += pts;
  }
  const winnerOK = tournamentWinner && winnerPred && norm(winnerPred)===norm(tournamentWinner);
  if (winnerOK) total += 15;
  return { total, exact, result, jokerBonus, winnerOK };
}

// ═══════════════════════════════════════════════════════════════
//  CSS
// ═══════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Outfit',sans-serif;background:#080D1A;color:#E2E8FF;min-height:100vh;}
.app{max-width:720px;margin:0 auto;min-height:100vh;background:linear-gradient(180deg,#0B0F1E,#080D18);padding-bottom:72px;}

/* HEADER */
.header{position:sticky;top:0;z-index:50;background:linear-gradient(135deg,#0F1A35,#152240);border-bottom:2px solid rgba(245,200,66,.6);box-shadow:0 4px 32px rgba(0,0,0,.5);padding:16px 20px 0;}
.header-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:8px;}
.logo{font-family:'Bebas Neue',sans-serif;font-size:26px;color:#F5C842;letter-spacing:2px;line-height:1;display:flex;align-items:center;gap:8px;flex-shrink:0;}
.logo em{font-style:normal;color:#fff;opacity:.55;font-size:20px;}
.header-btns{display:flex;gap:6px;align-items:center;}
.user-chip{display:flex;align-items:center;gap:6px;background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.3);border-radius:999px;padding:6px 12px 6px 10px;cursor:pointer;font-size:12px;font-weight:600;color:#F5C842;transition:background .2s;white-space:nowrap;}
.user-chip:hover{background:rgba(245,200,66,.2);}
.admin-btn{background:transparent;border:1px solid rgba(239,68,68,.25);border-radius:999px;color:#F87171;font-size:11px;font-weight:700;padding:5px 10px;cursor:pointer;transition:all .2s;white-space:nowrap;}
.admin-btn:hover,.admin-btn.on{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.5);}
.tabs{display:flex;}
.tab{flex:1;background:transparent;border:none;border-bottom:3px solid transparent;color:#4E5E84;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:10px 6px 11px;cursor:pointer;transition:color .2s,border-color .2s;}
.tab.active{color:#F5C842;border-bottom-color:#F5C842;}
.tab:hover:not(.active){color:#8A9AC0;}

/* CONTENT */
.content{padding:20px 16px;}
.stats-row{display:flex;gap:10px;margin-bottom:24px;}
.stat-box{flex:1;background:linear-gradient(135deg,#10182E,#141E38);border:1px solid #1B2A47;border-radius:12px;padding:14px 10px;text-align:center;}
.stat-num{font-family:'Bebas Neue',sans-serif;font-size:32px;color:#F5C842;line-height:1;letter-spacing:1px;}
.stat-lbl{font-size:10px;font-weight:700;color:#3D5070;text-transform:uppercase;letter-spacing:.8px;margin-top:4px;}
.group-section{margin-bottom:32px;}
.group-title{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:4px;color:#F5C842;margin-bottom:12px;display:flex;align-items:center;gap:10px;}
.group-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(245,200,66,.3),transparent);}

/* MATCH CARD */
.card{background:linear-gradient(135deg,#0F182C,#121B30);border:1px solid #1B2A47;border-radius:14px;padding:14px 16px;margin-bottom:10px;transition:border-color .2s;}
.card:hover:not(.locked){border-color:#263A5E;}
.card.locked{opacity:.65;}
.card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.card-date{font-size:12px;color:#3D5070;font-weight:500;}
.badge{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 9px;border-radius:999px;}
.badge-locked{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#F87171;}
.badge-open{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#4ADE80;}
.card-teams{display:flex;align-items:center;gap:8px;}
.team-block{flex:1;min-width:0;}
.team-block.right{text-align:right;}
.team-label{font-size:14px;font-weight:700;color:#D0DCFF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;}
.score-wrap{display:flex;align-items:center;gap:5px;flex-shrink:0;}
.score-in{width:46px;height:46px;background:#141E36;border:2px solid #1E2E4A;border-radius:10px;color:#F5C842;font-family:'Bebas Neue',sans-serif;font-size:24px;text-align:center;transition:border-color .15s,background .15s;-moz-appearance:textfield;appearance:textfield;}
.score-in::-webkit-outer-spin-button,.score-in::-webkit-inner-spin-button{-webkit-appearance:none;}
.score-in::placeholder{color:#2C3E5A;}
.score-in:focus{outline:none;border-color:#F5C842;background:#1A2640;}
.score-in.has-val{border-color:rgba(34,197,94,.45);background:rgba(34,197,94,.07);}
.score-in:disabled{color:#2C3E5A;cursor:not-allowed;border-color:#141E36;background:#0F172A;}
.score-sep{font-family:'Bebas Neue',sans-serif;font-size:20px;color:#2C3E5A;user-select:none;}
.card-venue{font-size:11px;color:#2C3E5A;margin-top:8px;text-align:center;}
.official-score{text-align:center;margin-top:6px;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:#4E5E84;}
.official-score span{color:#F5C842;}

/* JOKER */
.joker-row{display:flex;justify-content:center;margin-top:10px;}
.joker-btn{background:transparent;border:1px solid #2C3E5A;border-radius:8px;color:#3D5070;font-size:11px;font-weight:700;padding:4px 14px;cursor:pointer;transition:all .2s;letter-spacing:.5px;}
.joker-btn:hover:not(:disabled){border-color:#F5C842;color:#F5C842;background:rgba(245,200,66,.05);}
.joker-btn.active{border-color:#F5C842;color:#F5C842;background:rgba(245,200,66,.12);}
.joker-btn:disabled{opacity:.3;cursor:not-allowed;}

/* COMPARE */
.cmp-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.cmp-label{font-size:12px;color:#4E5E84;font-weight:600;text-transform:uppercase;letter-spacing:.8px;}
.live-row{display:flex;align-items:center;gap:5px;font-size:12px;color:#4ADE80;}
.live-dot{width:7px;height:7px;border-radius:50%;background:#4ADE80;animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.7);}}
.players-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.p-chip{background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.18);color:#907840;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;}
.p-chip.me{background:rgba(245,200,66,.18);border-color:rgba(245,200,66,.5);color:#F5C842;}
.hidden-notice{background:rgba(245,200,66,.05);border:1px solid rgba(245,200,66,.15);border-radius:10px;padding:12px 16px;font-size:13px;color:#907840;text-align:center;margin-bottom:16px;}
.scroll-wrap{overflow-x:auto;border-radius:12px;border:1px solid #1B2A47;}
.cmp-table{width:100%;border-collapse:collapse;font-size:13px;}
.cmp-table th{background:#0F182C;padding:10px 14px;text-align:center;color:#4E5E84;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #1B2A47;white-space:nowrap;}
.cmp-table th.mc{text-align:left;min-width:140px;position:sticky;left:0;background:#0F182C;}
.cmp-table td{padding:9px 14px;border-bottom:1px solid rgba(27,42,71,.5);text-align:center;white-space:nowrap;}
.cmp-table td.mc{text-align:left;color:#8A9AC0;font-weight:600;font-size:12px;position:sticky;left:0;background:#0D1425;}
.cmp-table tr:last-child td{border-bottom:none;}
.cmp-table tr:nth-child(even) td{background:rgba(255,255,255,.015);}
.cmp-table tr:nth-child(even) td.mc{background:#0E1629;}
.pred-val{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:1px;color:#F5C842;}
.pred-val.joker-pred{color:#FFD700;text-shadow:0 0 8px rgba(245,200,66,.6);}
.no-pred{color:#2C3E5A;font-size:16px;}
.open-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#4ADE80;margin-left:4px;vertical-align:middle;}

/* CLASSEMENT */
.rank-card{display:flex;align-items:center;gap:14px;padding:14px 16px;background:linear-gradient(135deg,#0F182C,#121B30);border:1px solid #1B2A47;border-radius:14px;margin-bottom:8px;}
.rank-num{font-family:'Bebas Neue',sans-serif;font-size:28px;width:32px;text-align:center;flex-shrink:0;color:#3D5070;}
.rank-num.gold{color:#F5C842;}
.rank-num.silver{color:#C0C0C0;}
.rank-num.bronze{color:#CD7F32;}
.rank-info{flex:1;min-width:0;}
.rank-name{font-size:15px;font-weight:700;color:#D0DCFF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rank-detail{font-size:11px;color:#3D5070;margin-top:3px;line-height:1.5;}
.rank-detail .ok{color:#4ADE80;}
.rank-detail .joker{color:#F5C842;}
.rank-pts-block{text-align:right;flex-shrink:0;}
.rank-pts{font-family:'Bebas Neue',sans-serif;font-size:34px;color:#F5C842;line-height:1;letter-spacing:1px;}
.rank-pts-lbl{font-size:10px;color:#3D5070;text-transform:uppercase;letter-spacing:.5px;}
.no-scores{text-align:center;padding:48px 24px;color:#2C3E5A;}
.no-scores-icon{font-size:40px;margin-bottom:10px;}
.winner-banner{background:linear-gradient(135deg,rgba(245,200,66,.12),rgba(245,200,66,.05));border:1px solid rgba(245,200,66,.3);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:13px;color:#907840;}
.winner-banner strong{color:#F5C842;}

/* WINNER MODAL */
.winner-overlay{position:fixed;inset:0;z-index:200;background:#080D1A;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;}
.winner-title{font-family:'Bebas Neue',sans-serif;font-size:38px;color:#F5C842;letter-spacing:3px;line-height:1.1;margin-bottom:8px;}
.winner-sub{font-size:14px;color:#4E5E84;line-height:1.6;margin-bottom:32px;}
.winner-in{display:block;width:100%;max-width:320px;background:#0F182C;border:2px solid #1B2A47;border-radius:14px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:16px;font-weight:600;padding:14px 16px;text-align:center;transition:border-color .2s;margin-bottom:14px;}
.winner-in:focus{outline:none;border-color:#F5C842;}
.winner-in::placeholder{color:#2C3E5A;}

/* ADMIN */
.admin-overlay{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.88);backdrop-filter:blur(6px);overflow-y:auto;}
.admin-panel{max-width:640px;margin:0 auto;padding:24px 16px 48px;}
.admin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.admin-title{font-family:'Bebas Neue',sans-serif;font-size:28px;color:#F5C842;letter-spacing:3px;}
.close-btn{background:transparent;border:1px solid #1B2A47;border-radius:8px;color:#4E5E84;font-size:18px;width:38px;height:38px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.close-btn:hover{color:#E2E8FF;border-color:#2C3E5A;}
.admin-section{background:#0F182C;border:1px solid #1B2A47;border-radius:14px;padding:16px;margin-bottom:14px;}
.admin-sec-title{font-size:11px;font-weight:700;color:#4E5E84;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:4px 0;}
.toggle-label{font-size:14px;color:#D0DCFF;font-weight:500;}
.toggle-btn{position:relative;width:48px;height:26px;border-radius:13px;border:none;cursor:pointer;transition:background .2s;flex-shrink:0;}
.toggle-btn.on{background:#22C55E;}
.toggle-btn.off{background:#1B2A47;}
.toggle-thumb{position:absolute;top:3px;width:20px;height:20px;background:#fff;border-radius:50%;transition:left .2s;}
.toggle-btn.on .toggle-thumb{left:25px;}
.toggle-btn.off .toggle-thumb{left:3px;}
.admin-text-in{width:100%;background:#141E36;border:1px solid #1B2A47;border-radius:10px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:14px;padding:10px 12px;margin-top:8px;transition:border-color .2s;}
.admin-text-in:focus{outline:none;border-color:#F5C842;}
.admin-match-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(27,42,71,.4);}
.admin-match-row:last-child{border-bottom:none;}
.admin-match-name{flex:1;font-size:12px;color:#8A9AC0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.adm-in{width:40px;height:36px;background:#141E36;border:1px solid #1B2A47;border-radius:8px;color:#F5C842;font-family:'Bebas Neue',sans-serif;font-size:20px;text-align:center;-moz-appearance:textfield;appearance:textfield;transition:border-color .2s;}
.adm-in::-webkit-outer-spin-button,.adm-in::-webkit-inner-spin-button{-webkit-appearance:none;}
.adm-in:focus{outline:none;border-color:#F5C842;}
.adm-in.has-val{border-color:rgba(245,200,66,.4);}
.adm-sep{color:#2C3E5A;font-family:'Bebas Neue',sans-serif;font-size:16px;}
.saved-dot{width:8px;height:8px;border-radius:50%;background:#22C55E;flex-shrink:0;}

/* PASSWORD MODAL */
.pw-overlay{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.8);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;}
.pw-box{background:#0F182C;border:1px solid #1B2A47;border-radius:16px;padding:28px 24px;width:100%;max-width:320px;text-align:center;}
.pw-title{font-family:'Bebas Neue',sans-serif;font-size:22px;color:#F5C842;letter-spacing:2px;margin-bottom:6px;}
.pw-sub{font-size:13px;color:#4E5E84;margin-bottom:20px;}
.pw-in{display:block;width:100%;background:#141E36;border:2px solid #1B2A47;border-radius:10px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:16px;padding:12px 14px;text-align:center;margin-bottom:10px;transition:border-color .2s;}
.pw-in:focus{outline:none;border-color:#F5C842;}
.pw-in.err{border-color:#F87171;}
.pw-err{font-size:12px;color:#F87171;margin-bottom:10px;}

/* WELCOME */
.welcome{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;background:radial-gradient(ellipse at 50% 30%,#162040,#080D1A 70%);}
.welcome-ball{font-size:72px;margin-bottom:24px;display:block;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0) rotate(-5deg);}50%{transform:translateY(-14px) rotate(5deg);}}
.welcome-title{font-family:'Bebas Neue',sans-serif;font-size:48px;color:#F5C842;letter-spacing:4px;line-height:1;margin-bottom:8px;}
.welcome-sub{font-size:16px;color:#4E5E84;margin-bottom:48px;}
.name-in{display:block;width:100%;max-width:300px;background:#0F182C;border:2px solid #1B2A47;border-radius:14px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:18px;font-weight:600;padding:14px 20px;text-align:center;transition:border-color .2s;margin-bottom:14px;}
.name-in:focus{outline:none;border-color:#F5C842;}
.name-in::placeholder{color:#2C3E5A;}
.btn-go{display:block;width:100%;max-width:300px;background:linear-gradient(135deg,#F5C842,#D4A800);border:none;border-radius:14px;color:#080D18;font-family:'Outfit',sans-serif;font-size:16px;font-weight:800;padding:16px;cursor:pointer;transition:transform .1s,box-shadow .2s;letter-spacing:.3px;}
.btn-go:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(245,200,66,.35);}
.btn-go:active{transform:translateY(0);}
.btn-go:disabled{opacity:.35;cursor:not-allowed;}

/* UTILS */
.empty{text-align:center;padding:60px 24px;color:#2C3E5A;}
.empty-icon{font-size:48px;margin-bottom:12px;}
.empty-txt{font-size:15px;font-weight:500;line-height:1.6;}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#22C55E;color:#000;font-weight:700;font-size:14px;padding:10px 24px;border-radius:999px;z-index:999;animation:tin .3s cubic-bezier(.34,1.56,.64,1);pointer-events:none;}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(16px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
.loading-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;gap:14px;font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:#F5C842;}
.spin{width:28px;height:28px;border:3px solid rgba(245,200,66,.2);border-top-color:#F5C842;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
`;

// ═══════════════════════════════════════════════════════════════
//  WinnerModal
// ═══════════════════════════════════════════════════════════════
function WinnerModal({ onSubmit }) {
  const [team, setTeam] = useState("");
  return (
    <div className="winner-overlay">
      <span style={{fontSize:64, marginBottom:24}}>🏆</span>
      <h1 className="winner-title">Qui va gagner<br/>la Coupe du Monde ?</h1>
      <p className="winner-sub">
        Cette réponse ne sera plus modifiable une fois confirmée.<br/>
        Elle rapporte <strong style={{color:"#F5C842"}}>+15 points</strong> si vous avez raison !
      </p>
      <input
        list="teams-list" className="winner-in"
        placeholder="Tapez le nom d'une équipe…"
        value={team} onChange={e => setTeam(e.target.value)}
        onKeyDown={e => e.key==="Enter" && team.trim() && onSubmit(team.trim())}
        autoFocus
      />
      <datalist id="teams-list">
        {TEAMS.map(t => <option key={t} value={t} />)}
      </datalist>
      <button className="btn-go" style={{maxWidth:320}}
        onClick={() => team.trim() && onSubmit(team.trim())}
        disabled={!team.trim()}
      >
        Confirmer 🎯
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MatchCard
// ═══════════════════════════════════════════════════════════════
function MatchCard({ match, pred, onSave, myJoker, jokerIsLocked, onJokerToggle, officialScore }) {
  const locked   = isLocked(match.kickoff);
  const [h, setH] = useState(pred?.home!=null ? String(pred.home) : "");
  const [a, setA] = useState(pred?.away!=null ? String(pred.away) : "");

  useEffect(() => {
    setH(pred?.home!=null ? String(pred.home) : "");
    setA(pred?.away!=null ? String(pred.away) : "");
  }, [pred?.home, pred?.away]);

  const trySave = (lh, la) => {
    if (lh!=="" && la!=="" && !locked) onSave(match.id, Number(lh), Number(la));
  };

  const isActiveJoker   = myJoker === match.id;
  const showJokerArea   = isActiveJoker || (!locked && !jokerIsLocked);
  const jokerBtnDisabled = isActiveJoker && locked;

  return (
    <div className={`card${locked?" locked":""}`}>
      <div className="card-top">
        <span className="card-date">{fmtDate(match.kickoff)}</span>
        {locked
          ? <span className="badge badge-locked">🔒 Verrouillé</span>
          : <span className="badge badge-open">● Ouvert</span>
        }
      </div>
      <div className="card-teams">
        <div className="team-block"><span className="team-label">{match.home}</span></div>
        <div className="score-wrap">
          <input type="number" min="0" max="30" placeholder="–"
            className={`score-in${h!==""?" has-val":""}`}
            value={h} disabled={locked}
            onChange={e => setH(e.target.value)}
            onBlur={e => trySave(e.target.value, a)}
          />
          <span className="score-sep">–</span>
          <input type="number" min="0" max="30" placeholder="–"
            className={`score-in${a!==""?" has-val":""}`}
            value={a} disabled={locked}
            onChange={e => setA(e.target.value)}
            onBlur={e => trySave(h, e.target.value)}
          />
        </div>
        <div className="team-block right"><span className="team-label">{match.away}</span></div>
      </div>

      {officialScore && (
        <div className="official-score">
          Score officiel : <span>{officialScore.home} – {officialScore.away}</span>
        </div>
      )}

      <div className="card-venue">📍 {match.venue}</div>

      {showJokerArea && (
        <div className="joker-row">
          <button
            className={`joker-btn${isActiveJoker?" active":""}`}
            disabled={jokerBtnDisabled}
            onClick={() => {
              if (isActiveJoker && !locked) onJokerToggle(null);
              else if (!locked && !jokerIsLocked) onJokerToggle(match.id);
            }}
          >
            {isActiveJoker ? "🃏 Joker actif — points doublés !" : "🃏 Utiliser mon joker ici"}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CompareTab
// ═══════════════════════════════════════════════════════════════
function CompareTab({ players, allPreds, allJokers, allWinnerPreds, officialScores, matches, username, settings }) {
  const showAll = settings.showAllPreds !== false;
  const cols    = showAll ? players : players.filter(p => p === username);

  if (players.length === 0) return (
    <div className="empty">
      <div className="empty-icon">👥</div>
      <div className="empty-txt">Personne d'autre n'a encore rejoint.<br/>Partagez le lien de l'appli avec vos amis !</div>
    </div>
  );

  return (
    <>
      <div className="cmp-top">
        <span className="cmp-label">{players.length} participant{players.length>1?"s":""}</span>
        <span className="live-row"><span className="live-dot"/>Temps réel</span>
      </div>

      <div className="players-chips">
        {players.map(p => (
          <span key={p} className={`p-chip${p===username?" me":""}`}>
            {p===username?"👤 ":""}{p}
          </span>
        ))}
      </div>

      {!showAll && (
        <div className="hidden-notice">
          🔒 L'admin a masqué les pronos des autres joueurs
        </div>
      )}

      <div className="scroll-wrap">
        <table className="cmp-table">
          <thead>
            <tr>
              <th className="mc">Match</th>
              {cols.map(p => <th key={p}>{p===username?"👤 ":""}{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {matches.map(match => {
              const open = !isLocked(match.kickoff);
              return (
                <tr key={match.id}>
                  <td className="mc">
                    {shortN(match.home)} – {shortN(match.away)}
                    {open && <span className="open-dot" title="Ouvert"/>}
                  </td>
                  {cols.map(p => {
                    const pred  = allPreds[fKey(p)]?.[match.id];
                    const joker = allJokers[fKey(p)];
                    const isJ   = joker === match.id;
                    return (
                      <td key={p}>
                        {pred!=null
                          ? <span className={`pred-val${isJ?" joker-pred":""}`}>
                              {isJ?"🃏 ":""}{pred.home}–{pred.away}
                            </span>
                          : <span className="no-pred">—</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Ligne vainqueur */}
            <tr>
              <td className="mc">🏆 Vainqueur CdM</td>
              {cols.map(p => {
                const wp = allWinnerPreds[fKey(p)];
                return (
                  <td key={p} style={{fontSize:12, color:"#907840"}}>
                    {wp ? shortN(wp) : <span className="no-pred">—</span>}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ClassementTab
// ═══════════════════════════════════════════════════════════════
function ClassementTab({ players, allPreds, allJokers, allWinnerPreds, officialScores, settings }) {
  const hasScores = Object.keys(officialScores||{}).length > 0;
  const tw        = settings.tournamentWinner || "";

  const rankings = [...players].map(p => {
    const k      = fKey(p);
    const preds  = allPreds[k] || {};
    const joker  = allJokers[k] || null;
    const wPred  = allWinnerPreds[k] || null;
    const stats  = calcPoints(preds, officialScores, joker, wPred, tw);
    const jMatch = joker ? MATCHES.find(m => m.id===joker) : null;
    return { name:p, ...stats, wPred, jMatch, joker };
  }).sort((a,b)=>b.total-a.total);

  const rankNum = (i, pts, list) => {
    const same = list.filter(x=>x.total===pts);
    const pos  = list.findIndex(x=>x.total===pts)+1;
    return pos;
  };

  if (!hasScores) return (
    <div className="no-scores">
      <div className="no-scores-icon">⏳</div>
      <p style={{fontSize:14,color:"#3D5070",lineHeight:1.6}}>
        Le classement apparaîtra dès que l'admin<br/>aura saisi les premiers scores officiels.
      </p>
    </div>
  );

  return (
    <>
      {tw && (
        <div className="winner-banner">
          🏆 Vainqueur officiel : <strong>{tw}</strong>
          <span style={{marginLeft:"auto",fontSize:12,color:"#4ADE80"}}>+15 pts si bonne réponse</span>
        </div>
      )}
      {rankings.map((r, i) => {
        const pos = rankNum(i, r.total, rankings);
        const medal = pos===1?"gold":pos===2?"silver":pos===3?"bronze":"";
        return (
          <div key={r.name} className="rank-card">
            <div className={`rank-num${medal?" "+medal:""}`}>{pos}</div>
            <div className="rank-info">
              <div className="rank-name">{r.name===rankings[0]?.name?"":"" }{r.name}</div>
              <div className="rank-detail">
                {r.exact>0 && <span>⚽ {r.exact} exact{r.exact>1?"s":""} · </span>}
                {r.result>0 && <span>✓ {r.result} résultat{r.result>1?"s":""} · </span>}
                {r.joker && r.jokerBonus>0 && <span className="joker">🃏 Joker +{r.jokerBonus}pts · </span>}
                {r.winnerOK && tw && <span className="ok">🏆 +15pts vainqueur</span>}
                {!r.exact && !r.result && !r.winnerOK && <span>Aucun point pour l'instant</span>}
              </div>
              {r.wPred && (
                <div className="rank-detail">
                  🎯 Vainqueur prédit : {r.wPred}
                </div>
              )}
            </div>
            <div className="rank-pts-block">
              <div className="rank-pts">{r.total}</div>
              <div className="rank-pts-lbl">pts</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  AdminPanel
// ═══════════════════════════════════════════════════════════════
function AdminPanel({ settings, officialScores, onClose, onToggleShowPreds, onSetTournamentWinner, onSaveScore }) {
  const [localScores, setLocalScores] = useState({});
  const [winnerVal,   setWinnerVal]   = useState(settings.tournamentWinner || "");
  const [savedIds,    setSavedIds]    = useState({});

  useEffect(() => {
    const init = {};
    MATCHES.forEach(m => {
      const s = officialScores?.[m.id];
      init[m.id] = { home: s ? String(s.home) : "", away: s ? String(s.away) : "" };
    });
    setLocalScores(init);
  }, []);

  const handleScoreBlur = async (matchId) => {
    const s = localScores[matchId];
    if (!s || s.home==="" || s.away==="") return;
    const h = parseInt(s.home), a = parseInt(s.away);
    if (isNaN(h)||isNaN(a)) return;
    await onSaveScore(matchId, h, a);
    setSavedIds(prev => ({...prev,[matchId]:true}));
    setTimeout(()=>setSavedIds(prev=>{const n={...prev};delete n[matchId];return n;}), 2000);
  };

  const grouped = MATCHES.reduce((acc,m)=>{ (acc[m.group]=acc[m.group]||[]).push(m); return acc; },{});

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <span className="admin-title">🔐 Panneau Admin</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Settings */}
        <div className="admin-section">
          <div className="admin-sec-title">Paramètres</div>
          <div className="toggle-row">
            <span className="toggle-label">Afficher les pronos de tous</span>
            <button
              className={`toggle-btn${settings.showAllPreds!==false?" on":" off"}`}
              onClick={() => onToggleShowPreds(settings.showAllPreds===false)}
            >
              <span className="toggle-thumb"/>
            </button>
          </div>
        </div>

        {/* Vainqueur officiel */}
        <div className="admin-section">
          <div className="admin-sec-title">🏆 Vainqueur de la Coupe du Monde</div>
          <p style={{fontSize:12,color:"#4E5E84",marginBottom:4}}>
            À remplir à la fin du tournoi pour attribuer les +15 pts.
          </p>
          <input
            list="teams-list-admin" className="admin-text-in"
            placeholder="Ex : 🇫🇷 France"
            value={winnerVal}
            onChange={e => setWinnerVal(e.target.value)}
            onBlur={() => onSetTournamentWinner(winnerVal.trim())}
          />
          <datalist id="teams-list-admin">
            {TEAMS.map(t=><option key={t} value={t}/>)}
          </datalist>
        </div>

        {/* Scores officiels */}
        <div className="admin-section">
          <div className="admin-sec-title">⚽ Scores officiels</div>
          <p style={{fontSize:12,color:"#4E5E84",marginBottom:12}}>
            Les points se calculent automatiquement dès qu'un score est saisi.
          </p>
          {Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([group, matches]) => (
            <div key={group} style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"#F5C842",letterSpacing:3,marginBottom:6,fontFamily:"'Bebas Neue',sans-serif"}}>
                Groupe {group}
              </div>
              {matches.map(match => {
                const s = localScores[match.id] || {home:"",away:""};
                return (
                  <div key={match.id} className="admin-match-row">
                    <span className="admin-match-name">
                      {shortN(match.home)} – {shortN(match.away)}
                    </span>
                    <input type="number" min="0" max="30" placeholder="–"
                      className={`adm-in${s.home!==""?" has-val":""}`}
                      value={s.home}
                      onChange={e => setLocalScores(p=>({...p,[match.id]:{...p[match.id],home:e.target.value}}))}
                      onBlur={() => handleScoreBlur(match.id)}
                    />
                    <span className="adm-sep">–</span>
                    <input type="number" min="0" max="30" placeholder="–"
                      className={`adm-in${s.away!==""?" has-val":""}`}
                      value={s.away}
                      onChange={e => setLocalScores(p=>({...p,[match.id]:{...p[match.id],away:e.target.value}}))}
                      onBlur={() => handleScoreBlur(match.id)}
                    />
                    {savedIds[match.id] && <span className="saved-dot" title="Sauvegardé"/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  App principale
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [loading,        setLoading]        = useState(true);
  const [username,       setUsername]       = useState(null);
  const [nameInput,      setNameInput]      = useState("");
  const [myPreds,        setMyPreds]        = useState({});
  const [myJoker,        setMyJoker]        = useState(null);
  const [myWinnerPred,   setMyWinnerPred]   = useState(null);
  const [players,        setPlayers]        = useState([]);
  const [allPreds,       setAllPreds]       = useState({});
  const [allJokers,      setAllJokers]      = useState({});
  const [allWinnerPreds, setAllWinnerPreds] = useState({});
  const [officialScores, setOfficialScores] = useState({});
  const [settings,       setSettings]       = useState({ showAllPreds: true, tournamentWinner: "" });
  const [activeTab,      setActiveTab]      = useState("pronos");
  const [isAdmin,        setIsAdmin]        = useState(() => localStorage.getItem("wc26_admin")==="true");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPwModal,    setShowPwModal]    = useState(false);
  const [pwInput,        setPwInput]        = useState("");
  const [pwError,        setPwError]        = useState(false);
  const [showWinnerModal,setShowWinnerModal]= useState(false);
  const [toast,          setToast]          = useState(null);

  // ── Chargement initial ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("wc26_me");
    if (saved && firebaseOK) {
      setUsername(saved);
    } else {
      setLoading(false);
    }
  }, []);

  // ── Listener temps réel ─────────────────────────────────────
  useEffect(() => {
    if (!username || !firebaseOK) return;
    setLoading(true);

    const unsub = onValue(ref(db, APP), snap => {
      const d = snap.val() || {};
      const k = fKey(username);

      setPlayers(Object.values(d.players || {}));
      setAllPreds(d.preds || {});
      setAllJokers(d.jokers || {});
      setAllWinnerPreds(d.winnerPreds || {});
      setOfficialScores(d.officialScores || {});
      setSettings({ showAllPreds:true, tournamentWinner:"", ...(d.settings||{}) });

      setMyPreds(d.preds?.[k] || {});
      const j = d.jokers?.[k] || null;
      setMyJoker(j);

      const wp = d.winnerPreds?.[k] || null;
      setMyWinnerPred(wp);
      if (!wp) setShowWinnerModal(true);

      setLoading(false);
    });

    return () => unsub();
  }, [username]);

  // ── Firebase helpers ────────────────────────────────────────
  async function registerPlayer(name) {
    await set(ref(db, `${APP}/players/${fKey(name)}`), name);
  }

  async function savePred(matchId, home, away) {
    await update(ref(db, pPath(username)), { [matchId]: { home, away } });
    showToast("✓ Prono enregistré");
  }

  async function saveJoker(matchId) {
    setMyJoker(matchId); // optimiste
    if (matchId === null) {
      await set(ref(db, jPath(username)), null);
    } else {
      await set(ref(db, jPath(username)), matchId);
      showToast("🃏 Joker placé !");
    }
  }

  async function saveWinnerPred(team) {
    setMyWinnerPred(team);
    setShowWinnerModal(false);
    await set(ref(db, wPath(username)), team);
    showToast("🏆 Vainqueur enregistré !");
  }

  async function saveOfficialScore(matchId, home, away) {
    await update(ref(db, `${APP}/officialScores`), { [matchId]: { home, away } });
  }

  async function saveSettings(changes) {
    await update(ref(db, `${APP}/settings`), changes);
  }

  function handleJoin() {
    const name = nameInput.trim().slice(0, 24);
    if (!name || !firebaseOK) return;
    localStorage.setItem("wc26_me", name);
    setUsername(name);
    registerPlayer(name);
  }

  function handleAdminClick() {
    if (isAdmin) { setShowAdminPanel(true); return; }
    setPwInput(""); setPwError(false); setShowPwModal(true);
  }

  function handlePwSubmit() {
    if (pwInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem("wc26_admin", "true");
      setShowPwModal(false);
      setShowAdminPanel(true);
    } else {
      setPwError(true);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // ── Dérivés ─────────────────────────────────────────────────
  const jokerIsLocked = myJoker && isLocked(MATCHES.find(m=>m.id===myJoker)?.kickoff ?? "9999-01-01");
  const openCount     = MATCHES.filter(m=>!isLocked(m.kickoff)).length;
  const totalPreds    = Object.keys(myPreds).length;
  const grouped       = MATCHES.reduce((acc,m)=>{ (acc[m.group]=acc[m.group]||[]).push(m); return acc; },{});

  // ── Rendu ────────────────────────────────────────────────────
  if (loading) return (
    <><style>{CSS}</style><div className="loading-screen"><div className="spin"/>Chargement…</div></>
  );

  if (!username) return (
    <>
      <style>{CSS}</style>
      <div className="welcome">
        <span className="welcome-ball">⚽</span>
        <h1 className="welcome-title">Pronos<br/>CM 2026</h1>
        <p className="welcome-sub">Entrez votre prénom pour rejoindre le groupe</p>
        <input className="name-in" placeholder="Votre prénom / pseudo"
          value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleJoin()}
          maxLength={24} autoFocus
        />
        <button className="btn-go" onClick={handleJoin} disabled={!nameInput.trim()}>
          Rejoindre 🚀
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ─ Winner Modal ─ */}
        {showWinnerModal && !myWinnerPred && (
          <WinnerModal onSubmit={saveWinnerPred} />
        )}

        {/* ─ Password Modal ─ */}
        {showPwModal && (
          <div className="pw-overlay" onClick={()=>setShowPwModal(false)}>
            <div className="pw-box" onClick={e=>e.stopPropagation()}>
              <div className="pw-title">🔐 Admin</div>
              <p className="pw-sub">Entrez le mot de passe administrateur</p>
              <input type="password" className={`pw-in${pwError?" err":""}`}
                placeholder="Mot de passe…"
                value={pwInput} onChange={e=>{setPwInput(e.target.value);setPwError(false);}}
                onKeyDown={e=>e.key==="Enter"&&handlePwSubmit()}
                autoFocus
              />
              {pwError && <p className="pw-err">Mot de passe incorrect</p>}
              <button className="btn-go" style={{maxWidth:"100%"}} onClick={handlePwSubmit}>
                Connexion
              </button>
            </div>
          </div>
        )}

        {/* ─ Admin Panel ─ */}
        {showAdminPanel && isAdmin && (
          <AdminPanel
            settings={settings}
            officialScores={officialScores}
            onClose={()=>setShowAdminPanel(false)}
            onToggleShowPreds={v => saveSettings({showAllPreds:v})}
            onSetTournamentWinner={v => saveSettings({tournamentWinner:v})}
            onSaveScore={saveOfficialScore}
          />
        )}

        {/* ─ Header ─ */}
        <div className="header">
          <div className="header-row">
            <div className="logo">⚽ Pronos <em>CM 2026</em></div>
            <div className="header-btns">
              <button
                className={`admin-btn${isAdmin?" on":""}`}
                onClick={handleAdminClick}
                title={isAdmin?"Panneau admin":"Accès admin"}
              >
                {isAdmin ? "⚙️ Admin" : "🔐"}
              </button>
              <div className="user-chip"
                onClick={()=>{
                  if(window.confirm(`Changer de pseudo ?\n(Vos pronos restent liés à "${username}")`)){
                    localStorage.removeItem("wc26_me");
                    setUsername(null); setNameInput(""); setMyPreds({});
                  }
                }}
                title="Changer de pseudo"
              >
                👤 {username}
              </div>
            </div>
          </div>
          <div className="tabs">
            {[
              {key:"pronos",     label:"Mes pronos"},
              {key:"compare",    label:"Comparer"},
              {key:"classement", label:"Classement"},
            ].map(t=>(
              <button key={t.key}
                className={`tab${activeTab===t.key?" active":""}`}
                onClick={()=>setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─ Contenu ─ */}
        <div className="content">

          {activeTab==="pronos" && (
            <>
              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-num">{totalPreds}</div>
                  <div className="stat-lbl">Pronos saisis</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{openCount}</div>
                  <div className="stat-lbl">Matchs ouverts</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{players.length}</div>
                  <div className="stat-lbl">Participants</div>
                </div>
              </div>

              {/* Info joker */}
              {!myJoker && (
                <div style={{background:"rgba(245,200,66,.06)",border:"1px solid rgba(245,200,66,.2)",borderRadius:12,padding:"10px 14px",marginBottom:20,fontSize:13,color:"#907840"}}>
                  🃏 <strong style={{color:"#F5C842"}}>Joker disponible</strong> — doublez vos points sur un match de votre choix ! Activez-le sur n'importe quel match ouvert.
                </div>
              )}
              {myJoker && (
                <div style={{background:"rgba(245,200,66,.06)",border:"1px solid rgba(245,200,66,.3)",borderRadius:12,padding:"10px 14px",marginBottom:20,fontSize:13,color:"#907840"}}>
                  🃏 Joker placé sur <strong style={{color:"#F5C842"}}>{(() => { const m=MATCHES.find(x=>x.id===myJoker); return m?`${shortN(m.home)} – ${shortN(m.away)}`:"?"; })()}</strong>
                  {jokerIsLocked ? " · 🔒 Verrouillé" : " · Cliquez sur le bouton pour le déplacer"}
                </div>
              )}

              {Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([group,matches])=>(
                <div key={group} className="group-section">
                  <div className="group-title">Groupe {group}</div>
                  {matches.map(match=>(
                    <MatchCard key={match.id}
                      match={match}
                      pred={myPreds[match.id]}
                      onSave={savePred}
                      myJoker={myJoker}
                      jokerIsLocked={jokerIsLocked}
                      onJokerToggle={saveJoker}
                      officialScore={officialScores[match.id]}
                    />
                  ))}
                </div>
              ))}
            </>
          )}

          {activeTab==="compare" && (
            <CompareTab
              players={players}
              allPreds={allPreds}
              allJokers={allJokers}
              allWinnerPreds={allWinnerPreds}
              officialScores={officialScores}
              matches={MATCHES}
              username={username}
              settings={settings}
            />
          )}

          {activeTab==="classement" && (
            <ClassementTab
              players={players}
              allPreds={allPreds}
              allJokers={allJokers}
              allWinnerPreds={allWinnerPreds}
              officialScores={officialScores}
              settings={settings}
            />
          )}
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
