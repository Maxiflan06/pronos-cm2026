import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove } from "firebase/database";

// ═══════════════════════════════════════════════════════════════
//  🔥  CONFIG FIREBASE
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
//  🔐  MOT DE PASSE ADMIN
// ═══════════════════════════════════════════════════════════════
const ADMIN_PASSWORD = "Meux@1991";

// ═══════════════════════════════════════════════════════════════
//  ⚙️  MATCHS PHASE DE GROUPES (journées 1, 2, 3)
//  Les horaires sont en UTC. Heure Paris (CEST, UTC+2) :
//  ex. 19:00Z = 21h Paris | 21:00Z = 23h Paris | 00:00Z = 2h Paris
// ═══════════════════════════════════════════════════════════════
const BASE_MATCHES = [
  // ── JOURNÉE 1 ─────────────────────────────────────────────
  { id:"A1", group:"A", day:1, home:"Mexique",         away:"Afrique du Sud",   kickoff:"2026-06-11T21:00:00+02:00", venue:"Mexico City" },
  { id:"A2", group:"A", day:1, home:"Corée du Sud",    away:"Tchéquie",         kickoff:"2026-06-12T04:00:00+02:00", venue:"Guadalajara" },
  { id:"B1", group:"B", day:1, home:"Canada",          away:"Bosnie-Herz.",     kickoff:"2026-06-12T21:00:00+02:00", venue:"Toronto" },
  { id:"D1", group:"D", day:1, home:"États-Unis",      away:"Paraguay",         kickoff:"2026-06-13T03:00:00+02:00", venue:"Los Angeles" },
  { id:"B2", group:"B", day:1, home:"Qatar",           away:"Suisse",           kickoff:"2026-06-13T21:00:00+02:00", venue:"San Francisco" },
  { id:"C1", group:"C", day:1, home:"Brésil",          away:"Maroc",            kickoff:"2026-06-14T00:00:00+02:00", venue:"New York" },
  { id:"C2", group:"C", day:1, home:"Haïti",           away:"Écosse",           kickoff:"2026-06-14T03:00:00+02:00", venue:"Boston" },
  { id:"D2", group:"D", day:1, home:"Australie",       away:"Turquie",          kickoff:"2026-06-14T06:00:00+02:00", venue:"Vancouver" },
  { id:"E1", group:"E", day:1, home:"Allemagne",       away:"Curaçao",          kickoff:"2026-06-14T19:00:00+02:00", venue:"Houston" },
  { id:"F1", group:"F", day:1, home:"Pays-Bas",        away:"Japon",            kickoff:"2026-06-14T22:00:00+02:00", venue:"Dallas" },
  { id:"E2", group:"E", day:1, home:"Côte d'Ivoire",   away:"Équateur",         kickoff:"2026-06-15T01:00:00+02:00", venue:"Philadelphie" },
  { id:"F2", group:"F", day:1, home:"Suède",           away:"Tunisie",          kickoff:"2026-06-15T04:00:00+02:00", venue:"Monterrey" },
  { id:"H1", group:"H", day:1, home:"Espagne",         away:"Cap Vert",         kickoff:"2026-06-15T18:00:00+02:00", venue:"Atlanta" },
  { id:"G1", group:"G", day:1, home:"Belgique",        away:"Égypte",           kickoff:"2026-06-15T21:00:00+02:00", venue:"Seattle" },
  { id:"H2", group:"H", day:1, home:"Arabie Saoudite", away:"Uruguay",          kickoff:"2026-06-16T00:00:00+02:00", venue:"Miami" },
  { id:"G2", group:"G", day:1, home:"Iran",            away:"Nouvelle-Zélande", kickoff:"2026-06-16T03:00:00+02:00", venue:"Los Angeles" },
  { id:"I1", group:"I", day:1, home:"France",          away:"Sénégal",          kickoff:"2026-06-16T21:00:00+02:00", venue:"New York" },
  { id:"I2", group:"I", day:1, home:"Irak",            away:"Norvège",          kickoff:"2026-06-17T00:00:00+02:00", venue:"Boston" },
  { id:"J1", group:"J", day:1, home:"Argentine",       away:"Algérie",          kickoff:"2026-06-17T03:00:00+02:00", venue:"Kansas City" },
  { id:"J2", group:"J", day:1, home:"Autriche",        away:"Jordanie",         kickoff:"2026-06-17T06:00:00+02:00", venue:"San Francisco" },
  { id:"K1", group:"K", day:1, home:"Portugal",        away:"Congo",            kickoff:"2026-06-17T19:00:00+02:00", venue:"Houston" },
  { id:"L1", group:"L", day:1, home:"Angleterre",      away:"Croatie",          kickoff:"2026-06-17T22:00:00+02:00", venue:"Dallas" },
  { id:"L2", group:"L", day:1, home:"Ghana",           away:"Panama",           kickoff:"2026-06-18T01:00:00+02:00", venue:"Toronto" },
  { id:"K2", group:"K", day:1, home:"Ouzbékistan",     away:"Colombie",         kickoff:"2026-06-18T04:00:00+02:00", venue:"Mexico City" },

  // ── JOURNÉE 2 ─────────────────────────────────────────────
  { id:"A3", group:"A", day:2, home:"Tchéquie",        away:"Afrique du Sud",   kickoff:"2026-06-18T18:00:00+02:00", venue:"Atlanta" },
  { id:"B3", group:"B", day:2, home:"Suisse",          away:"Bosnie-Herz.",     kickoff:"2026-06-18T21:00:00+02:00", venue:"Los Angeles" },
  { id:"B4", group:"B", day:2, home:"Canada",          away:"Qatar",            kickoff:"2026-06-19T00:00:00+02:00", venue:"Vancouver" },
  { id:"A4", group:"A", day:2, home:"Mexique",         away:"Corée du Sud",     kickoff:"2026-06-19T03:00:00+02:00", venue:"Guadalajara" },
  { id:"D3", group:"D", day:2, home:"États-Unis",      away:"Australie",        kickoff:"2026-06-19T21:00:00+02:00", venue:"Seattle" },
  { id:"C3", group:"C", day:2, home:"Écosse",          away:"Maroc",            kickoff:"2026-06-20T00:00:00+02:00", venue:"Boston" },
  { id:"C4", group:"C", day:2, home:"Brésil",          away:"Haïti",            kickoff:"2026-06-20T02:30:00+02:00", venue:"Philadelphie" },
  { id:"D4", group:"D", day:2, home:"Turquie",         away:"Paraguay",         kickoff:"2026-06-20T05:00:00+02:00", venue:"San Francisco" },
  { id:"F3", group:"F", day:2, home:"Pays-Bas",        away:"Suède",            kickoff:"2026-06-20T19:00:00+02:00", venue:"Houston" },
  { id:"E3", group:"E", day:2, home:"Allemagne",       away:"Côte d'Ivoire",    kickoff:"2026-06-20T22:00:00+02:00", venue:"Toronto" },
  { id:"E4", group:"E", day:2, home:"Équateur",        away:"Curaçao",          kickoff:"2026-06-21T02:00:00+02:00", venue:"Kansas City" },
  { id:"F4", group:"F", day:2, home:"Tunisie",         away:"Japon",            kickoff:"2026-06-21T06:00:00+02:00", venue:"Monterrey" },
  { id:"H3", group:"H", day:2, home:"Espagne",         away:"Arabie Saoudite",  kickoff:"2026-06-21T18:00:00+02:00", venue:"Atlanta" },
  { id:"G3", group:"G", day:2, home:"Belgique",        away:"Iran",             kickoff:"2026-06-21T21:00:00+02:00", venue:"Los Angeles" },
  { id:"H4", group:"H", day:2, home:"Uruguay",         away:"Cap Vert",         kickoff:"2026-06-22T00:00:00+02:00", venue:"Miami" },
  { id:"G4", group:"G", day:2, home:"Nouvelle-Zélande",away:"Égypte",           kickoff:"2026-06-22T03:00:00+02:00", venue:"Vancouver" },
  { id:"J3", group:"J", day:2, home:"Argentine",       away:"Autriche",         kickoff:"2026-06-22T19:00:00+02:00", venue:"Dallas" },
  { id:"I3", group:"I", day:2, home:"France",          away:"Irak",             kickoff:"2026-06-22T23:00:00+02:00", venue:"Philadelphie" },
  { id:"I4", group:"I", day:2, home:"Norvège",         away:"Sénégal",          kickoff:"2026-06-23T02:00:00+02:00", venue:"New York" },
  { id:"J4", group:"J", day:2, home:"Jordanie",        away:"Algérie",          kickoff:"2026-06-23T05:00:00+02:00", venue:"San Francisco" },
  { id:"K3", group:"K", day:2, home:"Portugal",        away:"Ouzbékistan",      kickoff:"2026-06-23T19:00:00+02:00", venue:"Houston" },
  { id:"L3", group:"L", day:2, home:"Angleterre",      away:"Ghana",            kickoff:"2026-06-23T22:00:00+02:00", venue:"Boston" },
  { id:"L4", group:"L", day:2, home:"Panama",          away:"Croatie",          kickoff:"2026-06-24T01:00:00+02:00", venue:"Toronto" },
  { id:"K4", group:"K", day:2, home:"Colombie",        away:"Congo",            kickoff:"2026-06-24T04:00:00+02:00", venue:"Guadalajara" },

  // ── JOURNÉE 3 — matchs simultanés par groupe ──────────────
  { id:"B5", group:"B", day:3, home:"Suisse",          away:"Canada",           kickoff:"2026-06-24T21:00:00+02:00", venue:"Vancouver" },
  { id:"B6", group:"B", day:3, home:"Bosnie-Herz.",    away:"Qatar",            kickoff:"2026-06-24T21:00:00+02:00", venue:"Seattle" },
  { id:"C5", group:"C", day:3, home:"Écosse",          away:"Brésil",           kickoff:"2026-06-25T00:00:00+02:00", venue:"Miami" },
  { id:"C6", group:"C", day:3, home:"Maroc",           away:"Haïti",            kickoff:"2026-06-25T00:00:00+02:00", venue:"Atlanta" },
  { id:"A5", group:"A", day:3, home:"Tchéquie",        away:"Mexique",          kickoff:"2026-06-25T03:00:00+02:00", venue:"Mexico City" },
  { id:"A6", group:"A", day:3, home:"Afrique du Sud",  away:"Corée du Sud",     kickoff:"2026-06-25T03:00:00+02:00", venue:"Monterrey" },
  { id:"E5", group:"E", day:3, home:"Curaçao",         away:"Côte d'Ivoire",    kickoff:"2026-06-25T22:00:00+02:00", venue:"Philadelphie" },
  { id:"E6", group:"E", day:3, home:"Équateur",        away:"Allemagne",        kickoff:"2026-06-25T22:00:00+02:00", venue:"New York" },
  { id:"F5", group:"F", day:3, home:"Japon",           away:"Suède",            kickoff:"2026-06-26T01:00:00+02:00", venue:"Dallas" },
  { id:"F6", group:"F", day:3, home:"Tunisie",         away:"Pays-Bas",         kickoff:"2026-06-26T01:00:00+02:00", venue:"Kansas City" },
  { id:"D5", group:"D", day:3, home:"Turquie",         away:"États-Unis",       kickoff:"2026-06-26T04:00:00+02:00", venue:"Los Angeles" },
  { id:"D6", group:"D", day:3, home:"Paraguay",        away:"Australie",        kickoff:"2026-06-26T04:00:00+02:00", venue:"San Francisco" },
  { id:"I5", group:"I", day:3, home:"Norvège",         away:"France",           kickoff:"2026-06-26T21:00:00+02:00", venue:"Boston" },
  { id:"I6", group:"I", day:3, home:"Sénégal",         away:"Irak",             kickoff:"2026-06-26T21:00:00+02:00", venue:"Toronto" },
  { id:"H5", group:"H", day:3, home:"Cap Vert",        away:"Arabie Saoudite",  kickoff:"2026-06-27T02:00:00+02:00", venue:"Houston" },
  { id:"H6", group:"H", day:3, home:"Uruguay",         away:"Espagne",          kickoff:"2026-06-27T02:00:00+02:00", venue:"Guadalajara" },
  { id:"G5", group:"G", day:3, home:"Égypte",          away:"Iran",             kickoff:"2026-06-27T05:00:00+02:00", venue:"Seattle" },
  { id:"G6", group:"G", day:3, home:"Nouvelle-Zélande",away:"Belgique",         kickoff:"2026-06-27T05:00:00+02:00", venue:"Vancouver" },
  { id:"L5", group:"L", day:3, home:"Panama",          away:"Angleterre",       kickoff:"2026-06-27T23:00:00+02:00", venue:"New York" },
  { id:"L6", group:"L", day:3, home:"Croatie",         away:"Ghana",            kickoff:"2026-06-27T23:00:00+02:00", venue:"Philadelphie" },
  { id:"K5", group:"K", day:3, home:"Colombie",        away:"Portugal",         kickoff:"2026-06-28T01:30:00+02:00", venue:"Miami" },
  { id:"K6", group:"K", day:3, home:"Congo",           away:"Ouzbékistan",      kickoff:"2026-06-28T01:30:00+02:00", venue:"Atlanta" },
  { id:"J5", group:"J", day:3, home:"Algérie",         away:"Autriche",         kickoff:"2026-06-28T04:00:00+02:00", venue:"Kansas City" },
  { id:"J6", group:"J", day:3, home:"Jordanie",        away:"Argentine",        kickoff:"2026-06-28T04:00:00+02:00", venue:"Dallas" },
];

const DEFAULT_POINTS = { exact: 3, result: 1, joker: 2, winnerBonus: 15 };

const DEFAULT_POINTS_2 = {
  winner:      3,  // bon vainqueur ou nul
  exactHome:   1,  // buts exacts équipe domicile
  exactAway:   1,  // buts exacts équipe extérieur
  exactDiff:   1,  // différence de buts exacte
  joker:       2,  // multiplicateur joker
  winnerBonus: 15, // bonus vainqueur CdM
};
const APP = "wc26";
const fKey = s => s.replace(/[.#$[\]/]/g,"_");
const pPath = u => `${APP}/preds/${fKey(u)}`;
const jPath = u => `${APP}/jokers/${fKey(u)}`;
const wPath = u => `${APP}/winnerPreds/${fKey(u)}`;

// ── Firebase init ─────────────────────────────────────────────
const firebaseOK = !FIREBASE_CONFIG.apiKey.startsWith("VOTRE");
const fApp = initializeApp(FIREBASE_CONFIG);
const db   = getDatabase(fApp);

// ── Utilitaires ───────────────────────────────────────────────
const isLocked = k => Date.now() >= new Date(k).getTime();
const fmtDate  = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short",timeZone:"Europe/Paris"})
    +" · "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Paris"});
};
const norm = s => (s||"").replace(/^\S+\s*/,"").toLowerCase().trim();
// Compatibilité ascendante : ancien format = string, nouveau = {matchId: true}
const normalizeJokers = val => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return [val];
  if (typeof val === 'object') return Object.keys(val);
  return [];
};

// Coefficients multiplicatifs par phase (1 = pas de modification)
const DEFAULT_PHASE_COEFS = { "Groupes": 1 };

// Jokers : 3 pour la phase de groupes, 1 pour la phase finale
const DEFAULT_GROUP_JOKER_COUNT    = 3;
const DEFAULT_KNOCKOUT_JOKER_COUNT = 1;
const isGroupMatch = id => BASE_MATCHES.some(m => m.id === id);

function calcPoints(preds, scores, jokerMatchIds, winnerPred, tournamentWinner, pts, matchPhaseMap, phaseCoefs) {
  const P    = { ...DEFAULT_POINTS, ...(pts||{}) };
  const jIds = normalizeJokers(jokerMatchIds);
  const coefs = { ...DEFAULT_PHASE_COEFS, ...(phaseCoefs||{}) };
  let total=0, exact=0, result=0, jokerBonus=0;
  for (const [id, pred] of Object.entries(preds||{})) {
    const s = scores?.[id];
    if (!s||pred.home==null||pred.away==null) continue;
    let p=0;
    if (pred.home===s.home&&pred.away===s.away) { p=P.exact; exact++; }
    else if (Math.sign(pred.home-pred.away)===Math.sign(s.home-s.away)) { p=P.result; result++; }
    const coef = coefs[fKey(matchPhaseMap?.[id] ?? "Groupes")] ?? 1;
    if (coef!==1) p = Math.round(p*coef);
    if (jIds.includes(id)) { jokerBonus+=p; p=Math.round(p*P.joker); }
    total+=p;
  }
  const winnerOK = tournamentWinner&&winnerPred&&norm(winnerPred)===norm(tournamentWinner);
  if (winnerOK) total+=P.winnerBonus;
  const jokerExtra = Math.round(jokerBonus*(P.joker-1));
  return { total, exact, result, jokerBonus, jokerExtra, winnerOK };
}

function calcPoints2(preds, scores, jokerMatchIds, winnerPred, tournamentWinner, pts2, matchPhaseMap, phaseCoefs) {
  const P    = { ...DEFAULT_POINTS_2, ...(pts2||{}) };
  const jIds = normalizeJokers(jokerMatchIds);
  const coefs = { ...DEFAULT_PHASE_COEFS, ...(phaseCoefs||{}) };
  let total=0, winnerCount=0, homeCount=0, awayCount=0, diffCount=0, jokerBonus=0;
  for (const [id, pred] of Object.entries(preds||{})) {
    const s = scores?.[id];
    if (!s||pred.home==null||pred.away==null) continue;
    let p=0;
    if (Math.sign(pred.home-pred.away)===Math.sign(s.home-s.away)) { p+=P.winner; winnerCount++; }
    if (pred.home===s.home) { p+=P.exactHome; homeCount++; }
    if (pred.away===s.away) { p+=P.exactAway; awayCount++; }
    if ((pred.home-pred.away)===(s.home-s.away)) { p+=P.exactDiff; diffCount++; }
    const coef = coefs[fKey(matchPhaseMap?.[id] ?? "Groupes")] ?? 1;
    if (coef!==1) p = Math.round(p*coef);
    if (jIds.includes(id)) { jokerBonus+=p; p=Math.round(p*P.joker); }
    total+=p;
  }
  const winnerOK = tournamentWinner&&winnerPred&&norm(winnerPred)===norm(tournamentWinner);
  if (winnerOK) total+=P.winnerBonus;
  const jokerExtra = Math.round(jokerBonus*(P.joker-1));
  return { total, winnerCount, homeCount, awayCount, diffCount, jokerBonus, jokerExtra, winnerOK };
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
.header-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px;}
.logo{font-family:'Bebas Neue',sans-serif;font-size:24px;color:#F5C842;letter-spacing:2px;line-height:1;display:flex;align-items:center;gap:6px;flex-shrink:0;}
.logo em{font-style:normal;color:#fff;opacity:.55;font-size:18px;}
.header-btns{display:flex;gap:6px;align-items:center;}
.user-chip{display:flex;align-items:center;gap:5px;background:rgba(245,200,66,.1);border:1px solid rgba(245,200,66,.3);border-radius:999px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:600;color:#F5C842;transition:background .2s;white-space:nowrap;}
.user-chip:hover{background:rgba(245,200,66,.2);}
.admin-btn{background:transparent;border:1px solid rgba(239,68,68,.25);border-radius:999px;color:#F87171;font-size:11px;font-weight:700;padding:4px 10px;cursor:pointer;transition:all .2s;white-space:nowrap;}
.admin-btn:hover,.admin-btn.on{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.5);}
.tabs{display:flex;}
.tab{flex:1;background:transparent;border:none;border-bottom:3px solid transparent;color:#4E5E84;font-family:'Outfit',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:8px 4px 10px;cursor:pointer;transition:color .2s,border-color .2s;}
.tab.active{color:#F5C842;border-bottom-color:#F5C842;}
.tab:hover:not(.active){color:#8A9AC0;}

/* CONTENT */
.content{padding:16px 14px;}
.stats-row{display:flex;gap:8px;margin-bottom:20px;}
.stat-box{flex:1;background:linear-gradient(135deg,#10182E,#141E38);border:1px solid #1B2A47;border-radius:12px;padding:12px 8px;text-align:center;}
.stat-num{font-family:'Bebas Neue',sans-serif;font-size:28px;color:#F5C842;line-height:1;letter-spacing:1px;}
.stat-lbl{font-size:9px;font-weight:700;color:#3D5070;text-transform:uppercase;letter-spacing:.7px;margin-top:3px;}

/* GROUP / PHASE sections */
.section-header{font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:3px;color:#F5C842;margin-bottom:10px;margin-top:8px;display:flex;align-items:center;gap:8px;}
.section-header::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(245,200,66,.3),transparent);}
.day-label{font-size:9px;font-weight:700;color:#3D5070;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;margin-top:12px;}

/* MATCH CARD */
.card{background:linear-gradient(135deg,#0F182C,#121B30);border:1px solid #1B2A47;border-radius:14px;padding:12px 14px;margin-bottom:8px;transition:border-color .2s;}
.card:hover:not(.locked){border-color:#263A5E;}
.card.locked{opacity:.65;}
.card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.card-date{font-size:11px;color:#3D5070;font-weight:500;}
.badge{font-size:9px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;padding:2px 8px;border-radius:999px;}
.badge-locked{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#F87171;}
.badge-open{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#4ADE80;}
.card-teams{display:flex;align-items:center;gap:6px;}
.team-block{flex:1;min-width:0;}
.team-block.right{text-align:right;}
.team-label{font-size:13px;font-weight:700;color:#D0DCFF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;}
.score-wrap{display:flex;align-items:center;gap:4px;flex-shrink:0;}
.score-in{width:42px;height:42px;background:#141E36;border:2px solid #1E2E4A;border-radius:10px;color:#F5C842;font-family:'Bebas Neue',sans-serif;font-size:22px;text-align:center;transition:border-color .15s,background .15s;-moz-appearance:textfield;appearance:textfield;}
.score-in::-webkit-outer-spin-button,.score-in::-webkit-inner-spin-button{-webkit-appearance:none;}
.score-in::placeholder{color:#2C3E5A;}
.score-in:focus{outline:none;border-color:#F5C842;background:#1A2640;}
.score-in.has-val{border-color:rgba(34,197,94,.45);background:rgba(34,197,94,.07);}
.score-in:disabled{color:#2C3E5A;cursor:not-allowed;border-color:#141E36;background:#0F172A;}
.score-sep{font-family:'Bebas Neue',sans-serif;font-size:18px;color:#2C3E5A;user-select:none;}
.card-venue{font-size:10px;color:#2C3E5A;margin-top:6px;text-align:center;}
.official-score{text-align:center;margin-top:4px;font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:1px;color:#4E5E84;}
.official-score span{color:#F5C842;}
.joker-row{display:flex;justify-content:center;margin-top:8px;}
.joker-btn{background:transparent;border:1px solid #2C3E5A;border-radius:8px;color:#3D5070;font-size:11px;font-weight:700;padding:3px 12px;cursor:pointer;transition:all .2s;letter-spacing:.4px;}
.joker-btn:hover:not(:disabled){border-color:#F5C842;color:#F5C842;background:rgba(245,200,66,.05);}
.joker-btn.active{border-color:#F5C842;color:#F5C842;background:rgba(245,200,66,.12);}
.joker-btn:disabled{opacity:.3;cursor:not-allowed;}

/* PHASE TABS */
.phase-tabs-wrap{display:flex;gap:6px;overflow-x:auto;margin-bottom:16px;padding-bottom:2px;-ms-overflow-style:none;scrollbar-width:none;}
.phase-tabs-wrap::-webkit-scrollbar{display:none;}
.phase-tab{flex-shrink:0;background:#0F182C;border:1px solid #1B2A47;border-radius:20px;color:#4E5E84;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;padding:6px 14px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;white-space:nowrap;}
.phase-tab:hover{border-color:#2C3E5A;color:#8A9AC0;}
.phase-tab.active{background:rgba(245,200,66,.12);border-color:rgba(245,200,66,.5);color:#F5C842;}
.phase-tab-dot{width:5px;height:5px;border-radius:50%;background:#4ADE80;flex-shrink:0;}
.info-bar{background:rgba(245,200,66,.06);border:1px solid rgba(245,200,66,.2);border-radius:10px;padding:8px 12px;margin-bottom:14px;font-size:12px;color:#907840;line-height:1.5;}
.info-bar strong{color:#F5C842;}

/* COMPARE */
.cmp-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.cmp-label{font-size:11px;color:#4E5E84;font-weight:600;text-transform:uppercase;letter-spacing:.7px;}
.live-row{display:flex;align-items:center;gap:5px;font-size:11px;color:#4ADE80;}
.live-dot{width:6px;height:6px;border-radius:50%;background:#4ADE80;animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.7);}}
.players-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;}
.p-chip{background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.18);color:#907840;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;}
.p-chip.me{background:rgba(245,200,66,.18);border-color:rgba(245,200,66,.5);color:#F5C842;}
.hidden-notice{background:rgba(245,200,66,.05);border:1px solid rgba(245,200,66,.15);border-radius:10px;padding:10px 14px;font-size:12px;color:#907840;text-align:center;margin-bottom:12px;}
.scroll-wrap{overflow-x:auto;overflow-y:auto;max-height:calc(100vh - 220px);border-radius:12px;border:1px solid #1B2A47;}
.cmp-table{width:100%;border-collapse:collapse;font-size:12px;}
.cmp-table th{background:#0F182C;padding:8px 12px;text-align:center;color:#4E5E84;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #1B2A47;white-space:nowrap;position:sticky;top:0;z-index:2;}
.cmp-table th.mc{text-align:left;min-width:130px;position:sticky;left:0;top:0;z-index:3;background:#0F182C;}
.cmp-table td{padding:8px 12px;border-bottom:1px solid rgba(27,42,71,.5);text-align:center;white-space:nowrap;}
.cmp-table td.mc{text-align:left;color:#8A9AC0;font-weight:600;font-size:11px;position:sticky;left:0;background:#0D1425;}
.cmp-table tr:last-child td{border-bottom:none;}
.cmp-table tr:nth-child(even) td{background:rgba(255,255,255,.015);}
.cmp-table tr:nth-child(even) td.mc{background:#0E1629;}
.pred-val{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;color:#F5C842;}
.pred-val.joker-pred{color:#FFD700;text-shadow:0 0 8px rgba(245,200,66,.6);}
.no-pred{color:#2C3E5A;font-size:14px;}
.open-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#4ADE80;margin-left:3px;vertical-align:middle;}

/* CLASSEMENT */
.rank-card{display:flex;align-items:center;gap:12px;padding:12px 14px;background:linear-gradient(135deg,#0F182C,#121B30);border:1px solid #1B2A47;border-radius:14px;margin-bottom:8px;}
.rank-num{font-family:'Bebas Neue',sans-serif;font-size:26px;width:28px;text-align:center;flex-shrink:0;color:#3D5070;}
.rank-num.gold{color:#F5C842;} .rank-num.silver{color:#C0C0C0;} .rank-num.bronze{color:#CD7F32;}
.rank-info{flex:1;min-width:0;}
.rank-name{font-size:14px;font-weight:700;color:#D0DCFF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rank-detail{font-size:10px;color:#3D5070;margin-top:2px;line-height:1.5;}
.rank-detail .ok{color:#4ADE80;} .rank-detail .jok{color:#F5C842;}
.rank-pts-block{text-align:right;flex-shrink:0;}
.rank-pts{font-family:'Bebas Neue',sans-serif;font-size:30px;color:#F5C842;line-height:1;letter-spacing:1px;}
.rank-pts-lbl{font-size:9px;color:#3D5070;text-transform:uppercase;letter-spacing:.5px;}
.no-scores{text-align:center;padding:48px 24px;color:#2C3E5A;}
.winner-banner{background:linear-gradient(135deg,rgba(245,200,66,.12),rgba(245,200,66,.05));border:1px solid rgba(245,200,66,.3);border-radius:12px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:12px;color:#907840;}
.winner-banner strong{color:#F5C842;}

/* CAGNOTTE TAB */
.cagnotte-hero{background:linear-gradient(135deg,#10182E,#141E38);border:1px solid #1B2A47;border-radius:16px;padding:24px 16px;text-align:center;margin-bottom:16px;}
.cagnotte-total{font-family:'Bebas Neue',sans-serif;font-size:52px;color:#F5C842;line-height:1;letter-spacing:2px;}
.cagnotte-sub{font-size:12px;color:#4E5E84;margin-top:4px;}
.pay-btn{display:inline-block;background:linear-gradient(135deg,#F5C842,#D4A800);border:none;border-radius:12px;color:#080D18;font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;padding:12px 28px;cursor:pointer;transition:transform .1s,box-shadow .2s;letter-spacing:.2px;margin-top:14px;text-decoration:none;}
.pay-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(245,200,66,.3);}
.payment-instructions{background:#0F182C;border:1px solid #1B2A47;border-radius:12px;padding:14px;margin-bottom:14px;font-size:13px;color:#8A9AC0;line-height:1.6;white-space:pre-wrap;}
.paid-list{display:flex;flex-direction:column;gap:6px;}
.paid-row{display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(135deg,#0F182C,#121B30);border:1px solid #1B2A47;border-radius:12px;}
.paid-name{flex:1;font-size:13px;font-weight:600;color:#D0DCFF;}
.paid-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;}
.paid-yes{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#4ADE80;}
.paid-no{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#F87171;}

/* WINNER MODAL */
.winner-overlay{position:fixed;inset:0;z-index:200;background:#080D1A;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;}
.winner-title{font-family:'Bebas Neue',sans-serif;font-size:34px;color:#F5C842;letter-spacing:3px;line-height:1.1;margin-bottom:8px;}
.winner-sub{font-size:13px;color:#4E5E84;line-height:1.6;margin-bottom:28px;}
.winner-in{display:block;width:100%;max-width:320px;background:#0F182C;border:2px solid #1B2A47;border-radius:14px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;padding:12px 16px;text-align:center;transition:border-color .2s;margin-bottom:12px;}
.winner-in:focus{outline:none;border-color:#F5C842;}
.winner-in::placeholder{color:#2C3E5A;}

/* ADMIN */
.admin-overlay{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.9);backdrop-filter:blur(6px);overflow-y:auto;}
.admin-panel{max-width:640px;margin:0 auto;padding:20px 14px 60px;}
.admin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.admin-title{font-family:'Bebas Neue',sans-serif;font-size:26px;color:#F5C842;letter-spacing:3px;}
.close-btn{background:transparent;border:1px solid #1B2A47;border-radius:8px;color:#4E5E84;font-size:16px;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.close-btn:hover{color:#E2E8FF;border-color:#2C3E5A;}
.admin-section{background:#0F182C;border:1px solid #1B2A47;border-radius:14px;padding:14px;margin-bottom:12px;}
.admin-sec-title{font-size:10px;font-weight:700;color:#4E5E84;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:3px 0;}
.toggle-label{font-size:13px;color:#D0DCFF;font-weight:500;}
.toggle-btn{position:relative;width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background .2s;flex-shrink:0;}
.toggle-btn.on{background:#22C55E;} .toggle-btn.off{background:#1B2A47;}
.toggle-thumb{position:absolute;top:2px;width:20px;height:20px;background:#fff;border-radius:50%;transition:left .2s;}
.toggle-btn.on .toggle-thumb{left:22px;} .toggle-btn.off .toggle-thumb{left:2px;}
.admin-text-in{width:100%;background:#141E36;border:1px solid #1B2A47;border-radius:10px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:13px;padding:9px 12px;margin-top:6px;transition:border-color .2s;}
.admin-text-in:focus{outline:none;border-color:#F5C842;}
.admin-text-in.sm{width:72px;}
.pts-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;}
.pts-row{display:flex;flex-direction:column;gap:3px;}
.pts-lbl{font-size:10px;color:#4E5E84;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
.pts-in{background:#141E36;border:1px solid #1B2A47;border-radius:8px;color:#F5C842;font-family:'Bebas Neue',sans-serif;font-size:20px;text-align:center;padding:6px 4px;width:100%;-moz-appearance:textfield;appearance:textfield;transition:border-color .2s;}
.pts-in::-webkit-outer-spin-button,.pts-in::-webkit-inner-spin-button{-webkit-appearance:none;}
.pts-in:focus{outline:none;border-color:#F5C842;}
.admin-match-row{display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid rgba(27,42,71,.4);}
.admin-match-row:last-child{border-bottom:none;}
.admin-match-name{flex:1;font-size:11px;color:#8A9AC0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.adm-in{width:38px;height:34px;background:#141E36;border:1px solid #1B2A47;border-radius:8px;color:#F5C842;font-family:'Bebas Neue',sans-serif;font-size:18px;text-align:center;-moz-appearance:textfield;appearance:textfield;transition:border-color .2s;}
.adm-in::-webkit-outer-spin-button,.adm-in::-webkit-inner-spin-button{-webkit-appearance:none;}
.adm-in:focus{outline:none;border-color:#F5C842;}
.adm-in.has-val{border-color:rgba(245,200,66,.4);}
.adm-sep{color:#2C3E5A;font-family:'Bebas Neue',sans-serif;font-size:14px;}
.saved-dot{width:7px;height:7px;border-radius:50%;background:#22C55E;flex-shrink:0;}
.add-match-form{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;}
.add-match-form input{background:#141E36;border:1px solid #1B2A47;border-radius:8px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:12px;padding:8px 10px;transition:border-color .2s;}
.add-match-form input:focus{outline:none;border-color:#F5C842;}
.add-match-form input.full{grid-column:1/-1;}
.btn-add{background:linear-gradient(135deg,#F5C842,#D4A800);border:none;border-radius:10px;color:#080D18;font-family:'Outfit',sans-serif;font-size:13px;font-weight:800;padding:10px;cursor:pointer;margin-top:4px;grid-column:1/-1;transition:opacity .2s;}
.btn-add:hover{opacity:.88;}
.extra-match-row{display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid rgba(27,42,71,.4);}
.extra-match-row:last-child{border-bottom:none;}
.extra-match-info{flex:1;min-width:0;}
.extra-match-name{font-size:12px;color:#8A9AC0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.extra-match-date{font-size:10px;color:#2C3E5A;}
.btn-del{background:transparent;border:1px solid rgba(239,68,68,.2);border-radius:6px;color:#F87171;font-size:11px;padding:2px 8px;cursor:pointer;flex-shrink:0;transition:all .2s;}
.btn-del:hover{background:rgba(239,68,68,.1);}
.btn-hide{background:transparent;border:1px solid #1B2A47;border-radius:6px;color:#4E5E84;font-size:11px;padding:2px 8px;cursor:pointer;flex-shrink:0;transition:all .2s;white-space:nowrap;}
.btn-hide:hover{border-color:#2C3E5A;color:#8A9AC0;}
.btn-hide.hidden{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.25);color:#F87171;}
.btn-hide.hidden:hover{background:rgba(239,68,68,.16);}
.paid-toggle-btn{font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;cursor:pointer;border:1px solid;transition:all .2s;}
.paid-toggle-btn.yes{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.25);color:#4ADE80;}
.paid-toggle-btn.no{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.2);color:#F87171;}

/* PASSWORD MODAL */
.pw-overlay{position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.8);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:24px;}
.pw-box{background:#0F182C;border:1px solid #1B2A47;border-radius:16px;padding:26px 22px;width:100%;max-width:300px;text-align:center;}
.pw-title{font-family:'Bebas Neue',sans-serif;font-size:20px;color:#F5C842;letter-spacing:2px;margin-bottom:4px;}
.pw-sub{font-size:12px;color:#4E5E84;margin-bottom:16px;}
.pw-in{display:block;width:100%;background:#141E36;border:2px solid #1B2A47;border-radius:10px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:15px;padding:10px 12px;text-align:center;margin-bottom:8px;transition:border-color .2s;}
.pw-in:focus{outline:none;border-color:#F5C842;}
.pw-in.err{border-color:#F87171;}
.pw-err{font-size:11px;color:#F87171;margin-bottom:8px;}

/* WELCOME */
.welcome{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;background:radial-gradient(ellipse at 50% 30%,#162040,#080D1A 70%);}
.welcome-ball{font-size:68px;margin-bottom:20px;display:block;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0) rotate(-5deg);}50%{transform:translateY(-14px) rotate(5deg);}}
.welcome-title{font-family:'Bebas Neue',sans-serif;font-size:44px;color:#F5C842;letter-spacing:4px;line-height:1;margin-bottom:6px;}
.welcome-sub{font-size:15px;color:#4E5E84;margin-bottom:40px;}
.name-in{display:block;width:100%;max-width:300px;background:#0F182C;border:2px solid #1B2A47;border-radius:14px;color:#E2E8FF;font-family:'Outfit',sans-serif;font-size:17px;font-weight:600;padding:13px 18px;text-align:center;transition:border-color .2s;margin-bottom:12px;}
.name-in:focus{outline:none;border-color:#F5C842;}
.name-in::placeholder{color:#2C3E5A;}
.btn-go{display:block;width:100%;max-width:300px;background:linear-gradient(135deg,#F5C842,#D4A800);border:none;border-radius:14px;color:#080D18;font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;padding:14px;cursor:pointer;transition:transform .1s,box-shadow .2s;}
.btn-go:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(245,200,66,.35);}
.btn-go:active{transform:translateY(0);}
.btn-go:disabled{opacity:.35;cursor:not-allowed;}

/* MISC */
.empty{text-align:center;padding:48px 24px;color:#2C3E5A;}
.empty-icon{font-size:40px;margin-bottom:10px;}
.empty-txt{font-size:14px;font-weight:500;line-height:1.6;}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#22C55E;color:#000;font-weight:700;font-size:13px;padding:8px 20px;border-radius:999px;z-index:999;animation:tin .3s cubic-bezier(.34,1.56,.64,1);pointer-events:none;}
@keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(12px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
.loading-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;gap:12px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:3px;color:#F5C842;}
.spin{width:26px;height:26px;border:3px solid rgba(245,200,66,.2);border-top-color:#F5C842;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
`;

// ═══════════════════════════════════════════════════════════════
//  ÉQUIPES pour datalist
// ═══════════════════════════════════════════════════════════════
const TEAMS = [
  "Argentine","France","Brésil","Espagne","Portugal","Allemagne","Angleterre",
  "Pays-Bas","Belgique","Uruguay","Mexique","États-Unis","Canada","Colombie",
  "Équateur","Paraguay","Chili","Pérou","Japon","Corée du Sud","Australie",
  "Iran","Arabie Saoudite","Qatar","Ouzbékistan","Maroc","Sénégal",
  "Côte d'Ivoire","Nigéria","Ghana","Cameroun","Afrique du Sud","Algérie",
  "Tunisie","Égypte","Mali","Congo","Cap Vert","Haïti","Suisse","Tchéquie",
  "Pologne","Autriche","Turquie","Écosse","Roumanie","Hongrie","Bosnie-Herz.",
  "Irak","Norvège","Curaçao","Croatie","Panama","Suède","Jordanie",
  "Algérie","Nouvelle-Zélande",
];

// ═══════════════════════════════════════════════════════════════
//  WinnerModal
// ═══════════════════════════════════════════════════════════════
function WinnerModal({ onSubmit }) {
  const [team, setTeam] = useState("");
  return (
    <div className="winner-overlay">
      <span style={{fontSize:60,marginBottom:20}}>🏆</span>
      <h1 className="winner-title">Qui va gagner<br/>la Coupe du Monde ?</h1>
      <p className="winner-sub">
        Réponse définitive, non modifiable.<br/>
        Si vous avez raison : <strong style={{color:"#F5C842"}}>+15 pts</strong> (ou le bonus configuré par l'admin)
      </p>
      <input list="teams-dl" className="winner-in"
        placeholder="Tapez le nom d'une équipe…"
        value={team} onChange={e=>setTeam(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&team.trim()&&onSubmit(team.trim())}
        autoFocus
      />
      <datalist id="teams-dl">{TEAMS.map(t=><option key={t} value={t}/>)}</datalist>
      <button className="btn-go" style={{maxWidth:320}}
        onClick={()=>team.trim()&&onSubmit(team.trim())}
        disabled={!team.trim()}
      >Confirmer 🎯</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MatchCard
// ═══════════════════════════════════════════════════════════════
function MatchCard({ match, pred, onSave, myJokers, groupJokerMax, knockoutJokerMax, onJokerToggle, officialScore }) {
  const locked = isLocked(match.kickoff);
  const [h, setH] = useState(pred?.home!=null?String(pred.home):"");
  const [a, setA] = useState(pred?.away!=null?String(pred.away):"");
  useEffect(()=>{
    setH(pred?.home!=null?String(pred.home):"");
    setA(pred?.away!=null?String(pred.away):"");
  },[pred?.home,pred?.away]);
  const trySave=(lh,la)=>{ if(lh!==""&&la!==""&&!locked) onSave(match.id,Number(lh),Number(la)); };

  const jokers   = normalizeJokers(myJokers);
  const isJ      = jokers.includes(match.id);
  const isGroup  = !!match.group;

  const groupJokersPlaced   = jokers.filter(isGroupMatch).length;
  const knockoutJokersPlaced = jokers.filter(id=>!isGroupMatch(id)).length;
  const poolMax  = isGroup ? groupJokerMax : knockoutJokerMax;
  const poolUsed = isGroup ? groupJokersPlaced : knockoutJokersPlaced;

  const canAdd    = !isJ && !locked && poolUsed < poolMax;
  const canRemove = isJ && !locked;
  const showJoker = isJ || canAdd;

  const jokerLabel = isGroup
    ? (isJ ? `🃏 Joker groupes actif` : `🃏 Placer un joker groupes (${poolUsed}/${poolMax})`)
    : (isJ ? `⭐ Joker finale actif`  : `⭐ Placer le joker finale (${poolUsed}/${poolMax})`);

  return (
    <div className={`card${locked?" locked":""}`}>
      <div className="card-top">
        <span className="card-date">{fmtDate(match.kickoff)}</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {match.group&&<span style={{fontSize:10,fontWeight:700,color:"#4E5E84",letterSpacing:.5}}>Gr. {match.group}</span>}
          {match.phase&&!match.group&&<span style={{fontSize:10,fontWeight:700,color:"#907840",letterSpacing:.5}}>{match.phase}</span>}
          {locked?<span className="badge badge-locked">🔒</span>:<span className="badge badge-open">● Ouvert</span>}
        </div>
      </div>
      <div className="card-teams">
        <div className="team-block"><span className="team-label">{match.home}</span></div>
        <div className="score-wrap">
          <input type="number" min="0" max="30" placeholder="–"
            className={`score-in${h!==""?" has-val":""}`}
            value={h} disabled={locked}
            onChange={e=>setH(e.target.value)} onBlur={e=>trySave(e.target.value,a)}
          />
          <span className="score-sep">–</span>
          <input type="number" min="0" max="30" placeholder="–"
            className={`score-in${a!==""?" has-val":""}`}
            value={a} disabled={locked}
            onChange={e=>setA(e.target.value)} onBlur={e=>trySave(h,e.target.value)}
          />
        </div>
        <div className="team-block right"><span className="team-label">{match.away}</span></div>
      </div>
      {officialScore&&<div className="official-score">Score officiel : <span>{officialScore.home}–{officialScore.away}</span></div>}
      <div className="card-venue">📍 {match.venue}</div>
      {showJoker&&(
        <div className="joker-row">
          <button className={`joker-btn${isJ?" active":""}`}
            disabled={!canRemove && !canAdd}
            onClick={()=>{
              if (canRemove) onJokerToggle(jokers.filter(id=>id!==match.id));
              else if (canAdd) onJokerToggle([...jokers, match.id]);
            }}
          >{jokerLabel}</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PronosTab
// ═══════════════════════════════════════════════════════════════
function PronosTab({ allMatches, myPreds, myJokers, officialScores, players, settings, onSave, onJoker, hiddenMatches }) {
  const pts              = { ...DEFAULT_POINTS, ...(settings.points||{}) };
  const groupJokerMax    = settings.groupJokerCount    ?? DEFAULT_GROUP_JOKER_COUNT;
  const knockoutJokerMax = settings.knockoutJokerCount ?? DEFAULT_KNOCKOUT_JOKER_COUNT;
  const jokers           = normalizeJokers(myJokers);
  const groupJokers      = jokers.filter(isGroupMatch);
  const knockoutJokers   = jokers.filter(id => !isGroupMatch(id));

  const visibleMatches = allMatches.filter(m=>!(hiddenMatches||{})[m.id]);
  const totalPreds     = Object.keys(myPreds).length;
  const openCount      = visibleMatches.filter(m=>!isLocked(m.kickoff)).length;
  const finishedCount  = visibleMatches.filter(m=>isLocked(m.kickoff)).length;

  const extraPhases = [...new Set(visibleMatches.filter(m=>!m.group&&m.phase).map(m=>m.phase))];
  extraPhases.sort((a,b)=>{
    const firstA = visibleMatches.filter(m=>m.phase===a).sort((x,y)=>new Date(x.kickoff)-new Date(y.kickoff))[0];
    const firstB = visibleMatches.filter(m=>m.phase===b).sort((x,y)=>new Date(x.kickoff)-new Date(y.kickoff))[0];
    return new Date(firstA?.kickoff||0)-new Date(firstB?.kickoff||0);
  });

  const hasDayMatches = d => visibleMatches.some(m=>m.group&&m.day===d);
  const phaseTabs = [
    ...[1,2,3].filter(hasDayMatches).map(d=>({ key:`J${d}`, label:`Journée ${d}` })),
    ...extraPhases.map(p=>({ key:`P:${p}`, label:p })),
  ];
  const defaultTab = phaseTabs.find(t=>{
    const ms = t.key.startsWith("J")
      ? visibleMatches.filter(m=>m.group&&m.day===Number(t.key[1]))
      : visibleMatches.filter(m=>m.phase===t.key.slice(2));
    return ms.some(m=>!isLocked(m.kickoff));
  }) || phaseTabs[0];

  const [activePhase, setActivePhase] = useState(defaultTab?.key||"J1");

  const isKnockoutTab = activePhase.startsWith("P:");
  const tabMatches = visibleMatches
    .filter(m => activePhase.startsWith("J")
      ? m.group && m.day===Number(activePhase[1])
      : !m.group && m.phase===activePhase.slice(2)
    )
    .sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff));

  // Banners jokers
  const groupRemaining   = groupJokerMax   - groupJokers.length;
  const knockoutRemaining = knockoutJokerMax - knockoutJokers.length;
  const groupLockedJokers = groupJokers.filter(id=>isLocked(BASE_MATCHES.find(m=>m.id===id)?.kickoff??"9999"));

  return (
    <>
      <div className="stats-row">
        <div className="stat-box"><div className="stat-num">{totalPreds}</div><div className="stat-lbl">Pronos</div></div>
        <div className="stat-box"><div className="stat-num">{openCount}</div><div className="stat-lbl">Ouverts</div></div>
        <div className="stat-box"><div className="stat-num">{finishedCount}</div><div className="stat-lbl">Terminés</div></div>
        <div className="stat-box"><div className="stat-num">{players.length}</div><div className="stat-lbl">Joueurs</div></div>
      </div>

      {/* Banner jokers groupes */}
      {!isKnockoutTab && groupJokerMax > 0 && (
        groupRemaining > 0
          ? <div className="info-bar">🃏 <strong>{groupRemaining} joker{groupRemaining>1?"s":""} groupes disponible{groupRemaining>1?"s":""}</strong> sur {groupJokerMax} — ×{pts.joker} sur un match !</div>
          : <div className="info-bar">🃏 Jokers groupes : <strong>{groupJokers.length}/{groupJokerMax} placés</strong>{groupLockedJokers.length>0?` · ${groupLockedJokers.length} verrouillé${groupLockedJokers.length>1?"s":""}`:""}</div>
      )}

      {/* Banner joker finale */}
      {isKnockoutTab && knockoutJokerMax > 0 && (
        knockoutRemaining > 0
          ? <div className="info-bar">⭐ <strong>Joker finale disponible</strong> — ×{pts.joker} sur un match de phase finale !</div>
          : <div className="info-bar">⭐ Joker finale placé sur <strong>{allMatches.find(m=>m.id===knockoutJokers[0])?.home||"?"} – {allMatches.find(m=>m.id===knockoutJokers[0])?.away||"?"}</strong></div>
      )}

      {phaseTabs.length>0&&(
        <div className="phase-tabs-wrap">
          {phaseTabs.map(t=>{
            const ms = t.key.startsWith("J")
              ? visibleMatches.filter(m=>m.group&&m.day===Number(t.key[1]))
              : visibleMatches.filter(m=>m.phase===t.key.slice(2));
            const hasOpen = ms.some(m=>!isLocked(m.kickoff));
            return (
              <button key={t.key}
                className={`phase-tab${activePhase===t.key?" active":""}${hasOpen?" has-open":""}`}
                onClick={()=>setActivePhase(t.key)}
              >{t.label}{hasOpen&&<span className="phase-tab-dot"/>}</button>
            );
          })}
        </div>
      )}

      {tabMatches.length===0
        ? <div className="empty"><div className="empty-icon">📭</div><div className="empty-txt">Aucun match disponible dans cette phase.</div></div>
        : tabMatches.map(match=>(
          <MatchCard key={match.id} match={match} pred={myPreds[match.id]}
            onSave={onSave} myJokers={myJokers}
            groupJokerMax={groupJokerMax} knockoutJokerMax={knockoutJokerMax}
            onJokerToggle={onJoker} officialScore={officialScores[match.id]}
          />
        ))
      }
    </>
  );
}


// ═══════════════════════════════════════════════════════════════
//  CompareTab
// ═══════════════════════════════════════════════════════════════
function CompareTab({ players, allPreds, allJokers, allWinnerPreds, allMatches, officialScores, username, settings }) {
  const showAll = settings.showAllPreds!==false;
  const cols = showAll ? players : players.filter(p=>p===username);

  // Filtres groupe/phase
  const groups = [...new Set(allMatches.filter(m=>m.group).map(m=>m.group))].sort();
  const phases = [...new Set(allMatches.filter(m=>!m.group&&m.phase).map(m=>m.phase))];
  const filterOptions = [
    {key:"tous", label:"Tous"},
    ...groups.map(g=>({key:`G:${g}`, label:`Groupe ${g}`})),
    ...phases.map(p=>({key:`P:${p}`, label:p})),
  ];
  const [filter, setFilter] = useState("tous");

  const filteredMatches = allMatches
    .filter(m => {
      if (filter==="tous") return true;
      if (filter.startsWith("G:")) return m.group===filter.slice(2);
      if (filter.startsWith("P:")) return m.phase===filter.slice(2);
      return true;
    })
    .sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff));

  if (!players.length) return (
    <div className="empty"><div className="empty-icon">👥</div>
    <div className="empty-txt">Personne d'autre n'a encore rejoint.</div></div>
  );
  return (
    <>
      <div className="cmp-top">
        <span className="cmp-label">{players.length} participant{players.length>1?"s":""}</span>
        <span className="live-row"><span className="live-dot"/>Temps réel</span>
      </div>
      <div className="players-chips">
        {players.map(p=><span key={p} className={`p-chip${p===username?" me":""}`}>{p===username?"👤 ":""}{p}</span>)}
      </div>
      {!showAll&&<div className="hidden-notice">🔒 L'admin a masqué les pronos des autres</div>}

      {/* Filtre par groupe */}
      <div className="phase-tabs-wrap" style={{marginBottom:12}}>
        {filterOptions.map(o=>(
          <button key={o.key}
            className={`phase-tab${filter===o.key?" active":""}`}
            onClick={()=>setFilter(o.key)}
          >{o.label}</button>
        ))}
      </div>

      <div className="scroll-wrap">
        <table className="cmp-table">
          <thead><tr>
            <th className="mc">Match</th>
            {cols.map(p=><th key={p}>{p===username?"👤 ":""}{p}</th>)}
          </tr></thead>
          <tbody>
            {filteredMatches.map(match=>{
              const open=!isLocked(match.kickoff);
              const official=officialScores[match.id];
              return (
                <tr key={match.id}>
                  <td className="mc">
                    {match.group&&<span style={{fontSize:9,color:"#3D5070",marginRight:4,fontWeight:700}}>Gr.{match.group}</span>}
                    {match.home} – {match.away}
                    {open&&!official&&<span className="open-dot"/>}
                    {official&&(
                      <span style={{
                        display:"inline-block",marginLeft:6,
                        fontFamily:"'Bebas Neue',sans-serif",fontSize:13,
                        color:"#F5C842",letterSpacing:1,
                        background:"rgba(245,200,66,.1)",borderRadius:4,padding:"0 5px"
                      }}>{official.home}–{official.away}</span>
                    )}
                  </td>
                  {cols.map(p=>{
                    const pred=allPreds[fKey(p)]?.[match.id];
                    const isJ=normalizeJokers(allJokers[fKey(p)]).includes(match.id);
                    return <td key={p}>{pred!=null
                      ?<span className={`pred-val${isJ?" joker-pred":""}`}>{isJ?"🃏 ":""}{pred.home}–{pred.away}</span>
                      :<span className="no-pred">—</span>}</td>;
                  })}
                </tr>
              );
            })}
            <tr>
              <td className="mc">🏆 Vainqueur</td>
              {cols.map(p=><td key={p} style={{fontSize:11,color:"#907840"}}>{allWinnerPreds[fKey(p)]||<span className="no-pred">—</span>}</td>)}
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
function RankingList({ players, allPreds, allJokers, allWinnerPreds, officialScores, tw, pts, pts2, system, allMatches, phaseCoefs }) {
  const P  = { ...DEFAULT_POINTS,   ...(pts||{}) };
  const P2 = { ...DEFAULT_POINTS_2, ...(pts2||{}) };

  // Map matchId → phase pour les coefficients
  const matchPhaseMap = {};
  (allMatches||[]).forEach(m => {
    matchPhaseMap[m.id] = m.group ? "Groupes" : (m.phase||"Groupes");
  });

  const rankings = [...players].map(p => {
    const k = fKey(p);
    const preds  = allPreds[k]||{};
    const jIds   = normalizeJokers(allJokers[k]);
    const wPred  = allWinnerPreds[k]||null;
    if (system===2) {
      const s = calcPoints2(preds, officialScores, jIds, wPred, tw, P2, matchPhaseMap, phaseCoefs);
      return { name:p, wPred, ...s };
    }
    const s = calcPoints(preds, officialScores, jIds, wPred, tw, P, matchPhaseMap, phaseCoefs);
    return { name:p, wPred, ...s };
  }).sort((a,b)=>b.total-a.total);

  let rank=1;
  return (
    <>
      {rankings.map((r,i)=>{
        if(i>0&&r.total<rankings[i-1].total) rank=i+1;
        const medal=rank===1?"gold":rank===2?"silver":rank===3?"bronze":"";
        return (
          <div key={r.name} className="rank-card">
            <div className={`rank-num${medal?" "+medal:""}`}>{rank}</div>
            <div className="rank-info">
              <div className="rank-name">{r.name}</div>
              <div className="rank-detail">
                {system===1&&<>
                  {r.exact>0&&<span>⚽ {r.exact} exact{r.exact>1?"s":""} (+{r.exact*P.exact}pts) · </span>}
                  {r.result>0&&<span>✓ {r.result} résultat{r.result>1?"s":""} (+{r.result*P.result}pts) · </span>}
                </>}
                {system===2&&<>
                  {r.winnerCount>0&&<span>🏆 {r.winnerCount} vainqueur{r.winnerCount>1?"s":""} (+{r.winnerCount*P2.winner}pts) · </span>}
                  {r.homeCount>0&&<span>1️⃣ {r.homeCount}×dom. · </span>}
                  {r.awayCount>0&&<span>2️⃣ {r.awayCount}×ext. · </span>}
                  {r.diffCount>0&&<span>↔ {r.diffCount}×diff. · </span>}
                </>}
                {r.jokerExtra>0&&<span className="jok">🃏 +{r.jokerExtra} pts (joker) · </span>}
                {r.winnerOK&&tw&&<span className="ok">🏆 +{system===1?P.winnerBonus:P2.winnerBonus}pts CdM</span>}
                {!r.winnerOK&&(system===1?(r.exact||r.result):( r.winnerCount||r.homeCount||r.awayCount||r.diffCount))?null:<span>{r.total===0?"Aucun point":""}</span>}
              </div>
              {r.wPred&&<div className="rank-detail">🎯 Prédit : {r.wPred}</div>}
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

function ClassementTab({ players, allPreds, allJokers, allWinnerPreds, officialScores, settings, allMatches }) {
  const hasScores = Object.keys(officialScores||{}).length>0;
  const tw  = settings.tournamentWinner||"";
  const pts  = { ...DEFAULT_POINTS,   ...(settings.points||{}) };
  const pts2 = { ...DEFAULT_POINTS_2, ...(settings.points2||{}) };
  const phaseCoefs = { ...DEFAULT_PHASE_COEFS, ...(settings.phaseCoefs||{}) };
  const display = settings.scoringDisplay||"s1";

  const [activeSystem, setActiveSystem] = useState(display==="s2"?2:1);

  if (!hasScores) return (
    <div className="no-scores"><div style={{fontSize:36,marginBottom:10}}>⏳</div>
    <p style={{fontSize:13,color:"#3D5070",lineHeight:1.6}}>Le classement apparaîtra dès que<br/>l'admin aura saisi les premiers scores.</p></div>
  );

  const showBoth = display==="both";

  return (
    <>
      {tw&&<div className="winner-banner">🏆 Vainqueur officiel : <strong>{tw}</strong></div>}

      {showBoth&&(
        <div className="phase-tabs-wrap" style={{marginBottom:16}}>
          <button className={`phase-tab${activeSystem===1?" active":""}`} onClick={()=>setActiveSystem(1)}>⭐ Système 1</button>
          <button className={`phase-tab${activeSystem===2?" active":""}`} onClick={()=>setActiveSystem(2)}>🔢 Système 2</button>
        </div>
      )}
      <div style={{fontSize:11,color:"#4E5E84",fontWeight:700,textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>
        {(showBoth?activeSystem===1:display==="s1")?"⭐ Système 1 — Score exact / Bon résultat":"🔢 Système 2 — Vainqueur + buts individuels + différence"}
      </div>

      <RankingList
        players={players} allPreds={allPreds} allJokers={allJokers}
        allWinnerPreds={allWinnerPreds} officialScores={officialScores}
        tw={tw} pts={pts} pts2={pts2}
        system={showBoth ? activeSystem : (display==="s2" ? 2 : 1)}
        allMatches={allMatches} phaseCoefs={phaseCoefs}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CagnotteTab
// ═══════════════════════════════════════════════════════════════
function CagnotteTab({ players, cagnotteSettings, paidPlayers, username }) {
  const amount = cagnotteSettings?.amount || 2;
  const link   = cagnotteSettings?.link || "";
  const method = cagnotteSettings?.method || "";
  const instructions = cagnotteSettings?.instructions || "";
  const total  = (players.filter(p=>paidPlayers[fKey(p)]).length) * amount;
  const mePaid = paidPlayers[fKey(username)];
  return (
    <>
      <div className="cagnotte-hero">
        <div style={{fontSize:36,marginBottom:6}}>💰</div>
        <div className="cagnotte-total">{total} €</div>
        <div className="cagnotte-sub">
          Cagnotte actuelle · {players.filter(p=>paidPlayers[fKey(p)]).length}/{players.length} paiements reçus
        </div>
        {!mePaid&&link&&(
          <a className="pay-btn" href={link} target="_blank" rel="noopener noreferrer">
            Payer {amount} € {method?" via "+method:""}
          </a>
        )}
        {mePaid&&<div style={{marginTop:14,fontSize:13,color:"#4ADE80",fontWeight:700}}>✓ Vous avez payé !</div>}
      </div>

      {instructions&&<div className="payment-instructions">{instructions}</div>}

      <div className="admin-sec-title" style={{marginBottom:8}}>État des paiements</div>
      <div className="paid-list">
        {players.map(p=>{
          const paid=paidPlayers[fKey(p)];
          return (
            <div key={p} className="paid-row">
              <span className="paid-name">{p===username?"👤 ":""}{p}</span>
              <span className={`paid-badge ${paid?"paid-yes":"paid-no"}`}>{paid?"✓ Payé":"En attente"}</span>
            </div>
          );
        })}
        {players.length===0&&<div style={{fontSize:12,color:"#2C3E5A",textAlign:"center",padding:16}}>Aucun participant pour l'instant.</div>}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  AdminPanel
// ═══════════════════════════════════════════════════════════════
function AdminPanel({ settings, officialScores, extraMatches, players, paidPlayers, onClose,
  onToggleShowPreds, onSetTournamentWinner, onSaveScore, onDeleteScore, onSavePoints, onSavePoints2,
  onScoringDisplay, onSaveGroupJokerCount, onSaveKnockoutJokerCount, onSavePhaseCoefs,
  onAddMatch, onDeleteMatch, onSaveCagnotte, onTogglePaid, onToggleHideMatch }) {

  const [localScores, setLocalScores] = useState({});
  const [savedIds,    setSavedIds]    = useState({});
  const [winnerVal,   setWinnerVal]   = useState(settings.tournamentWinner||"");
  const [pts,         setPts]         = useState({ ...DEFAULT_POINTS,   ...(settings.points||{}) });
  const [pts2,        setPts2]        = useState({ ...DEFAULT_POINTS_2, ...(settings.points2||{}) });
  const [localCoefs,  setLocalCoefs]  = useState({ ...DEFAULT_PHASE_COEFS, ...(settings.phaseCoefs||{}) });
  // Cagnotte
  const [cAmount,  setCAmount]  = useState(settings.cagnotte?.amount || 2);
  const [cMethod,  setCMethod]  = useState(settings.cagnotte?.method || "");
  const [cLink,    setCLink]    = useState(settings.cagnotte?.link || "");
  const [cInstr,   setCInstr]   = useState(settings.cagnotte?.instructions || "");
  // Nouveau match
  const [newHome,  setNewHome]  = useState("");
  const [newAway,  setNewAway]  = useState("");
  const [newDate,  setNewDate]  = useState("");
  const [newTime,  setNewTime]  = useState("");
  const [newPhase, setNewPhase] = useState("");
  const [newVenue, setNewVenue] = useState("");

  useEffect(()=>{
    const init={};
    [...BASE_MATCHES,...extraMatches].forEach(m=>{
      const s=officialScores?.[m.id];
      init[m.id]={home:s?String(s.home):"",away:s?String(s.away):""};
    });
    setLocalScores(init);
  },[extraMatches.length]);

  const handleScoreBlur=async(matchId)=>{
    const s=localScores[matchId];
    if(!s) return;
    // Si les deux champs sont vides → supprimer le score
    if(s.home===""&&s.away==="") {
      await onDeleteScore(matchId);
      setSavedIds(p=>({...p,[matchId]:true}));
      setTimeout(()=>setSavedIds(p=>{const n={...p};delete n[matchId];return n;}),2000);
      return;
    }
    if(s.home===""||s.away==="") return; // un seul champ rempli, on attend
    const h=parseInt(s.home),a=parseInt(s.away);
    if(isNaN(h)||isNaN(a)) return;
    await onSaveScore(matchId,h,a);
    setSavedIds(p=>({...p,[matchId]:true}));
    setTimeout(()=>setSavedIds(p=>{const n={...p};delete n[matchId];return n;}),2000);
  };

  const handleAddMatch=()=>{
    if(!newHome.trim()||!newAway.trim()||!newDate||!newTime) return;
    // Interpréter la date/heure saisie comme heure de Paris (CEST = UTC+2 en été)
    const kickoff=new Date(`${newDate}T${newTime}:00+02:00`).toISOString();
    onAddMatch({home:newHome.trim(),away:newAway.trim(),kickoff,phase:newPhase.trim(),venue:newVenue.trim()});
    setNewHome(""); setNewAway(""); setNewDate(""); setNewTime(""); setNewPhase(""); setNewVenue("");
  };

  const grouped=BASE_MATCHES.reduce((acc,m)=>{(acc[m.group]=acc[m.group]||[]).push(m);return acc;},{});

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <span className="admin-title">🔐 Admin</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Paramètres généraux */}
        <div className="admin-section">
          <div className="admin-sec-title">Paramètres</div>
          <div className="toggle-row">
            <span className="toggle-label">Afficher les pronos de tous</span>
            <button className={`toggle-btn${settings.showAllPreds!==false?" on":" off"}`}
              onClick={()=>onToggleShowPreds(settings.showAllPreds===false)}>
              <span className="toggle-thumb"/>
            </button>
          </div>
          <div className="toggle-row" style={{marginTop:10}}>
            <span className="toggle-label">Jokers phase de groupes</span>
            <input type="number" min="0" max="10"
              style={{width:52,background:"#141E36",border:"1px solid #1B2A47",borderRadius:8,color:"#F5C842",fontFamily:"'Bebas Neue',sans-serif",fontSize:22,textAlign:"center",padding:"3px 4px"}}
              defaultValue={settings.groupJokerCount ?? DEFAULT_GROUP_JOKER_COUNT}
              onBlur={e=>onSaveGroupJokerCount(Number(e.target.value))}
            />
          </div>
          <div className="toggle-row" style={{marginTop:8}}>
            <span className="toggle-label">Joker phase finale</span>
            <input type="number" min="0" max="5"
              style={{width:52,background:"#141E36",border:"1px solid #1B2A47",borderRadius:8,color:"#F5C842",fontFamily:"'Bebas Neue',sans-serif",fontSize:22,textAlign:"center",padding:"3px 4px"}}
              defaultValue={settings.knockoutJokerCount ?? DEFAULT_KNOCKOUT_JOKER_COUNT}
              onBlur={e=>onSaveKnockoutJokerCount(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Système de points 1 */}
        <div className="admin-section">
          <div className="admin-sec-title">⭐ Système 1 — Score exact / Bon résultat</div>
          <div className="pts-grid">
            {[
              {key:"exact",  label:"Score exact"},
              {key:"result", label:"Bon résultat"},
              {key:"joker",  label:"Multiplicateur joker (×N)"},
              {key:"winnerBonus", label:"Bonus vainqueur CdM"},
            ].map(({key,label})=>(
              <div key={key} className="pts-row">
                <span className="pts-lbl">{label}</span>
                <input type="number" min="0" max="50" className="pts-in"
                  value={pts[key]}
                  onChange={e=>{ const v=Number(e.target.value); if(!isNaN(v)) setPts(p=>({...p,[key]:v})); }}
                  onBlur={e=>{ const updated={...pts,[key]:Number(e.target.value)||0}; setPts(updated); onSavePoints(updated); }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Système de points 2 */}
        <div className="admin-section">
          <div className="admin-sec-title">🔢 Système 2 — Vainqueur + buts + différence</div>
          <div className="pts-grid">
            {[
              {key:"winner",      label:"Bon vainqueur ou nul"},
              {key:"exactHome",   label:"Buts exacts équipe dom."},
              {key:"exactAway",   label:"Buts exacts équipe ext."},
              {key:"exactDiff",   label:"Différence de buts exacte"},
              {key:"joker",       label:"Multiplicateur joker (×N)"},
              {key:"winnerBonus", label:"Bonus vainqueur CdM"},
            ].map(({key,label})=>(
              <div key={key} className="pts-row">
                <span className="pts-lbl">{label}</span>
                <input type="number" min="0" max="50" className="pts-in"
                  value={pts2[key]}
                  onChange={e=>{ const v=Number(e.target.value); if(!isNaN(v)) setPts2(p=>({...p,[key]:v})); }}
                  onBlur={e=>{ const updated={...pts2,[key]:Number(e.target.value)||0}; setPts2(updated); onSavePoints2(updated); }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Coefficients par phase */}
        {(()=>{
          const allPhases = ["Groupes", ...new Set(extraMatches.filter(m=>m.phase).map(m=>m.phase))];
          return (
            <div className="admin-section">
              <div className="admin-sec-title">⚖️ Coefficients par phase</div>
              <p style={{fontSize:11,color:"#4E5E84",marginBottom:10}}>
                Multiplie les points de chaque match selon sa phase, puis arrondit.<br/>
                Ex : 4 pts × 1.2 → 5 pts. S'applique aux deux systèmes.
              </p>
              {allPhases.map(phase=>{
                const val = localCoefs[fKey(phase)] ?? 1;
                return (
                  <div key={phase} className="admin-match-row">
                    <span className="admin-match-name" style={{color:"#D0DCFF",fontWeight:600}}>{phase}</span>
                    <span className="adm-sep" style={{color:"#4E5E84",fontSize:11}}>×</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="adm-in"
                      style={{width:58,fontSize:15,textAlign:"center"}}
                      key={`${phase}-${val}`}
                      defaultValue={String(val).replace('.',',')}
                      onBlur={e => {
                        const raw = e.target.value.trim().replace(',','.');
                        const parsed = parseFloat(raw);
                        const finalVal = (!isNaN(parsed) && parsed > 0) ? parsed : 1;
                        e.target.value = String(finalVal).replace('.',',');
                        const updated = { ...localCoefs, [fKey(phase)]: finalVal };
                        setLocalCoefs(updated);
                        onSavePhaseCoefs(updated);
                      }}
                    />
                  </div>
                );
              })}
              <p style={{fontSize:10,color:"#3D5070",marginTop:8}}>
                Les phases finales apparaissent ici dès que vous ajoutez des matchs ci-dessous.
              </p>
            </div>
          );
        })()}

        {/* Affichage du classement */}
        <div className="admin-section">
          <div className="admin-sec-title">📊 Affichage du classement</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
            {[
              {val:"s1",   label:"⭐ Système 1 uniquement"},
              {val:"s2",   label:"🔢 Système 2 uniquement"},
              {val:"both", label:"🔀 Les deux (avec onglets)"},
            ].map(o=>(
              <label key={o.val} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"6px 0"}}>
                <input type="radio" name="scoring_display"
                  checked={(settings.scoringDisplay||"s1")===o.val}
                  onChange={()=>onScoringDisplay(o.val)}
                  style={{accentColor:"#F5C842",width:16,height:16}}
                />
                <span style={{fontSize:13,color:"#D0DCFF",fontWeight:500}}>{o.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Vainqueur officiel */}
        <div className="admin-section">
          <div className="admin-sec-title">🏆 Vainqueur officiel (fin de tournoi)</div>
          <input list="teams-admin-dl" className="admin-text-in"
            placeholder="Ex : France" value={winnerVal}
            onChange={e=>setWinnerVal(e.target.value)}
            onBlur={()=>onSetTournamentWinner(winnerVal.trim())}
          />
          <datalist id="teams-admin-dl">{TEAMS.map(t=><option key={t} value={t}/>)}</datalist>
        </div>

        {/* Scores officiels - Phase de groupes */}
        <div className="admin-section">
          <div className="admin-sec-title">⚽ Scores officiels — Phase de groupes</div>
          {Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([group,matches])=>(
            <div key={group} style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#F5C842",letterSpacing:2,marginBottom:4,fontFamily:"'Bebas Neue',sans-serif"}}>Groupe {group}</div>
              {matches.map(m=>{
                const s=localScores[m.id]||{home:"",away:""};
                const hidden=(settings.hiddenMatches||{})[m.id];
                return (
                  <div key={m.id} className="admin-match-row">
                    <span className="admin-match-name" style={hidden?{color:"#2C3E5A",textDecoration:"line-through"}:{}}>
                      {m.home} – {m.away} <span style={{color:"#2C3E5A",fontSize:9}}>J{m.day}</span>
                    </span>
                    <button className={`btn-hide${hidden?" hidden":""}`}
                      onClick={()=>onToggleHideMatch(m.id,!hidden)}
                      title={hidden?"Afficher dans les pronos":"Masquer des pronos"}
                    >{hidden?"🚫 Masqué":"👁"}</button>
                    <input type="number" min="0" max="30" placeholder="–"
                      className={`adm-in${s.home!==""?" has-val":""}`} value={s.home}
                      onChange={e=>setLocalScores(p=>({...p,[m.id]:{...p[m.id],home:e.target.value}}))}
                      onBlur={()=>handleScoreBlur(m.id)}
                    />
                    <span className="adm-sep">–</span>
                    <input type="number" min="0" max="30" placeholder="–"
                      className={`adm-in${s.away!==""?" has-val":""}`} value={s.away}
                      onChange={e=>setLocalScores(p=>({...p,[m.id]:{...p[m.id],away:e.target.value}}))}
                      onBlur={()=>handleScoreBlur(m.id)}
                    />
                    {savedIds[m.id]&&<span className="saved-dot"/>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Phases finales — Ajouter matchs */}
        <div className="admin-section">
          <div className="admin-sec-title">🏅 Phases finales — Ajouter des matchs</div>
          <p style={{fontSize:11,color:"#4E5E84",marginBottom:8}}>Ajoutez les matchs de la phase finale une fois les groupes terminés. L'heure est en heure locale (Paris).</p>
          <div className="add-match-form">
            <input placeholder="Équipe domicile" value={newHome} onChange={e=>setNewHome(e.target.value)}/>
            <input placeholder="Équipe extérieur" value={newAway} onChange={e=>setNewAway(e.target.value)}/>
            <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}/>
            <input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)}/>
            <input className="full" placeholder="Phase (ex: 1/32, 1/16, Quart, Demi, Finale)" value={newPhase} onChange={e=>setNewPhase(e.target.value)}/>
            <input className="full" placeholder="Stade / Ville (optionnel)" value={newVenue} onChange={e=>setNewVenue(e.target.value)}/>
            <button className="btn-add"
              onClick={handleAddMatch}
              disabled={!newHome.trim()||!newAway.trim()||!newDate||!newTime}
            >+ Ajouter ce match</button>
          </div>

          {extraMatches.length>0&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:10,color:"#4E5E84",fontWeight:700,textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Matchs ajoutés</div>
              {extraMatches.sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff)).map(m=>{
                const hidden=(settings.hiddenMatches||{})[m.id];
                return (
                <div key={m.id} className="extra-match-row">
                  <div className="extra-match-info">
                    <div className="extra-match-name" style={hidden?{color:"#2C3E5A",textDecoration:"line-through"}:{}}>{m.home} – {m.away}</div>
                    <div className="extra-match-date">{m.phase&&m.phase+" · "}{fmtDate(m.kickoff)}</div>
                  </div>
                  <button className={`btn-hide${hidden?" hidden":""}`}
                    onClick={()=>onToggleHideMatch(m.id,!hidden)}
                  >{hidden?"🚫":"👁"}</button>
                  {/* Score */}
                  {(()=>{
                    const s=localScores[m.id]||{home:"",away:""};
                    return <>
                      <input type="number" min="0" max="30" placeholder="–"
                        className={`adm-in${s.home!==""?" has-val":""}`} value={s.home}
                        onChange={e=>setLocalScores(p=>({...p,[m.id]:{...p[m.id],home:e.target.value}}))}
                        onBlur={()=>handleScoreBlur(m.id)}
                      />
                      <span className="adm-sep">–</span>
                      <input type="number" min="0" max="30" placeholder="–"
                        className={`adm-in${s.away!==""?" has-val":""}`} value={s.away}
                        onChange={e=>setLocalScores(p=>({...p,[m.id]:{...p[m.id],away:e.target.value}}))}
                        onBlur={()=>handleScoreBlur(m.id)}
                      />
                      {savedIds[m.id]&&<span className="saved-dot"/>}
                    </>;
                  })()}
                  <button className="btn-del" onClick={()=>onDeleteMatch(m.id)}>✕</button>
                </div>
              );})}
            </div>
          )}
        </div>

        {/* Cagnotte config */}
        <div className="admin-section">
          <div className="admin-sec-title">💰 Configuration Cagnotte</div>
          <div className="pts-grid" style={{marginBottom:8}}>
            <div className="pts-row">
              <span className="pts-lbl">Montant (€)</span>
              <input type="number" min="0" max="1000" className="pts-in" value={cAmount} onChange={e=>setCAmount(Number(e.target.value))} onBlur={()=>onSaveCagnotte({amount:cAmount,method:cMethod,link:cLink,instructions:cInstr})}/>
            </div>
            <div className="pts-row">
              <span className="pts-lbl">Méthode</span>
              <input className="admin-text-in" style={{marginTop:0}} placeholder="Revolut, PayPal…" value={cMethod} onChange={e=>setCMethod(e.target.value)} onBlur={()=>onSaveCagnotte({amount:cAmount,method:cMethod,link:cLink,instructions:cInstr})}/>
            </div>
          </div>
          <span className="pts-lbl">Lien de paiement</span>
          <input className="admin-text-in" placeholder="https://revolut.me/…" value={cLink} onChange={e=>setCLink(e.target.value)} onBlur={()=>onSaveCagnotte({amount:cAmount,method:cMethod,link:cLink,instructions:cInstr})}/>
          <span className="pts-lbl" style={{display:"block",marginTop:8}}>Instructions / message (optionnel)</span>
          <textarea className="admin-text-in" rows={3} placeholder="Ex: Virement à faire avant le 15 juin…" value={cInstr} onChange={e=>setCInstr(e.target.value)} onBlur={()=>onSaveCagnotte({amount:cAmount,method:cMethod,link:cLink,instructions:cInstr})} style={{resize:"vertical"}}/>

          <div style={{fontSize:10,color:"#4E5E84",fontWeight:700,textTransform:"uppercase",letterSpacing:.7,marginTop:12,marginBottom:6}}>Marquer comme payé</div>
          {players.map(p=>(
            <div key={p} className="admin-match-row">
              <span className="admin-match-name">{p}</span>
              <button className={`paid-toggle-btn ${paidPlayers[fKey(p)]?"yes":"no"}`}
                onClick={()=>onTogglePaid(p,!paidPlayers[fKey(p)])}>
                {paidPlayers[fKey(p)]?"✓ Payé":"En attente"}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  APP PRINCIPALE
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [loading,        setLoading]        = useState(true);
  const [username,       setUsername]       = useState(null);
  const [nameInput,      setNameInput]      = useState("");
  const [myPreds,        setMyPreds]        = useState({});
  const [myJokers,       setMyJokers]       = useState([]);
  const [myWinnerPred,   setMyWinnerPred]   = useState(null);
  const [players,        setPlayers]        = useState([]);
  const [allPreds,       setAllPreds]       = useState({});
  const [allJokers,      setAllJokers]      = useState({});
  const [allWinnerPreds, setAllWinnerPreds] = useState({});
  const [officialScores, setOfficialScores] = useState({});
  const [extraMatches,   setExtraMatches]   = useState([]);
  const [settings,       setSettings]       = useState({ showAllPreds:true, tournamentWinner:"", points:DEFAULT_POINTS });
  const [paidPlayers,    setPaidPlayers]    = useState({});
  const [activeTab,      setActiveTab]      = useState("pronos");
  const [isAdmin,        setIsAdmin]        = useState(()=>localStorage.getItem("wc26_admin")==="true");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPwModal,    setShowPwModal]    = useState(false);
  const [pwInput,        setPwInput]        = useState("");
  const [pwError,        setPwError]        = useState(false);
  const [showWinnerModal,setShowWinnerModal]= useState(false);
  const [toast,          setToast]          = useState(null);

  // ── Chargement initial ──────────────────────────────────────
  useEffect(()=>{
    const saved=localStorage.getItem("wc26_me");
    if (saved) setUsername(saved);
    else setLoading(false);
  },[]);

  // ── Listener Firebase ───────────────────────────────────────
  useEffect(()=>{
    if (!username) return;
    setLoading(true);
    const unsub=onValue(ref(db,APP),snap=>{
      const d=snap.val()||{};
      const k=fKey(username);
      setPlayers(Object.values(d.players||{}));
      setAllPreds(d.preds||{});
      setAllJokers(d.jokers||{});
      setAllWinnerPreds(d.winnerPreds||{});
      setOfficialScores(d.officialScores||{});
      setSettings({showAllPreds:true,tournamentWinner:"",points:DEFAULT_POINTS,...(d.settings||{})});
      setPaidPlayers(d.cagnotte?.paid||{});

      setMyPreds(d.preds?.[k]||{});
      setMyJokers(normalizeJokers(d.jokers?.[k]));

      const wp=d.winnerPreds?.[k]||null;
      setMyWinnerPred(wp);
      if (!wp) setShowWinnerModal(true);

      // Extra matches
      const em=d.extraMatches||{};
      setExtraMatches(Object.entries(em).map(([id,v])=>({id,...v})));

      setLoading(false);
    });
    return ()=>unsub();
  },[username]);

  const allMatches = [...BASE_MATCHES, ...extraMatches];

  const showToast=msg=>{ setToast(msg); setTimeout(()=>setToast(null),2200); };

  // ── Firebase writes ─────────────────────────────────────────
  async function handleJoin() {
    const name=nameInput.trim().slice(0,24);
    if (!name) return;
    localStorage.setItem("wc26_me",name);
    setUsername(name);
    await set(ref(db,`${APP}/players/${fKey(name)}`),name);
  }

  async function savePred(matchId,home,away) {
    await update(ref(db,pPath(username)),{[matchId]:{home,away}});
    showToast("✓ Prono enregistré");
  }

  async function saveJoker(jokerArray, auto=false) {
    setMyJokers(jokerArray);
    const obj = jokerArray.length>0 ? Object.fromEntries(jokerArray.map(id=>[id,true])) : null;
    await set(ref(db,jPath(username)), obj);
    if (auto) showToast("🃏 Jokers auto-placés sur les derniers matchs !");
    else if (jokerArray.length > (myJokers?.length||0)) showToast("🃏 Joker placé !");
  }

  // ── Auto-placement des jokers groupes en fin de phase ────────
  useEffect(()=>{
    if (!username || !firebaseOK) return;
    const groupJokerMax = settings.groupJokerCount ?? DEFAULT_GROUP_JOKER_COUNT;
    const placedGroup   = myJokers.filter(isGroupMatch);
    const unplaced      = groupJokerMax - placedGroup.length;
    if (unplaced <= 0) return;

    // Matchs de groupe encore ouverts sans joker, triés du plus tardif au plus tôt
    const available = BASE_MATCHES
      .filter(m => !isLocked(m.kickoff) && !placedGroup.includes(m.id))
      .sort((a,b) => new Date(b.kickoff) - new Date(a.kickoff));

    if (available.length === 0 || available.length > unplaced + 1) return;

    // Auto-placer sur les derniers matchs disponibles
    const toPlace   = available.slice(0, unplaced).map(m => m.id);
    const kJokers   = myJokers.filter(id => !isGroupMatch(id));
    const newJokers = [...new Set([...placedGroup, ...toPlace, ...kJokers])];

    const changed = newJokers.length !== myJokers.length
      || newJokers.some(id => !myJokers.includes(id));
    if (changed) saveJoker(newJokers, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([...myJokers].sort()), settings.groupJokerCount,
      BASE_MATCHES.filter(m=>isLocked(m.kickoff)).length]);

  async function saveWinnerPred(team) {
    setMyWinnerPred(team); setShowWinnerModal(false);
    await set(ref(db,wPath(username)),team);
    showToast("🏆 Vainqueur enregistré !");
  }

  async function saveOfficialScore(matchId,home,away) {
    await update(ref(db,`${APP}/officialScores`),{[matchId]:{home,away}});
  }

  async function deleteOfficialScore(matchId) {
    await remove(ref(db,`${APP}/officialScores/${matchId}`));
  }

  async function saveSettings(changes) {
    await update(ref(db,`${APP}/settings`),changes);
  }

  const savePoints            = pts  => saveSettings({points:pts});
  const savePoints2           = pts2 => saveSettings({points2:pts2});
  const saveScoringDisplay    = v    => saveSettings({scoringDisplay:v});
  const saveGroupJokerCount   = n    => saveSettings({groupJokerCount:n});
  const saveKnockoutJokerCount = n   => saveSettings({knockoutJokerCount:n});
  const savePhaseCoefs        = c    => saveSettings({phaseCoefs:c});

  async function addExtraMatch(data) {
    const id="E"+Date.now();
    await set(ref(db,`${APP}/extraMatches/${id}`),data);
    showToast("✓ Match ajouté !");
  }

  async function deleteExtraMatch(id) {
    await remove(ref(db,`${APP}/extraMatches/${id}`));
    showToast("Match supprimé");
  }

  async function saveCagnotte(cfg) {
    await update(ref(db,`${APP}/settings`),{cagnotte:cfg});
  }

  async function toggleHideMatch(matchId, hide) {
    await set(ref(db,`${APP}/settings/hiddenMatches/${matchId}`), hide||null);
  }

  async function togglePaid(player,paid) {
    await set(ref(db,`${APP}/cagnotte/paid/${fKey(player)}`),paid||null);
  }

  // ── Admin auth ──────────────────────────────────────────────
  function handleAdminClick() {
    if (isAdmin) { setShowAdminPanel(true); return; }
    setPwInput(""); setPwError(false); setShowPwModal(true);
  }
  function handlePwSubmit() {
    if (pwInput===ADMIN_PASSWORD) {
      setIsAdmin(true); localStorage.setItem("wc26_admin","true");
      setShowPwModal(false); setShowAdminPanel(true);
    } else setPwError(true);
  }

  // ── Rendu ────────────────────────────────────────────────────
  if (loading) return <><style>{CSS}</style><div className="loading-screen"><div className="spin"/>Chargement…</div></>;

  if (!username) return (
    <>
      <style>{CSS}</style>
      <div className="welcome">
        <span className="welcome-ball">⚽</span>
        <h1 className="welcome-title">Pronos<br/>CM 2026</h1>
        <p className="welcome-sub">Entrez votre prénom pour rejoindre</p>
        <input className="name-in" placeholder="Votre prénom / pseudo"
          value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleJoin()} maxLength={24} autoFocus
        />
        <button className="btn-go" onClick={handleJoin} disabled={!nameInput.trim()}>Rejoindre 🚀</button>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {showWinnerModal&&!myWinnerPred&&<WinnerModal onSubmit={saveWinnerPred}/>}

        {showPwModal&&(
          <div className="pw-overlay" onClick={()=>setShowPwModal(false)}>
            <div className="pw-box" onClick={e=>e.stopPropagation()}>
              <div className="pw-title">🔐 Admin</div>
              <p className="pw-sub">Mot de passe administrateur</p>
              <input type="password" className={`pw-in${pwError?" err":""}`}
                placeholder="Mot de passe…" value={pwInput}
                onChange={e=>{setPwInput(e.target.value);setPwError(false);}}
                onKeyDown={e=>e.key==="Enter"&&handlePwSubmit()} autoFocus
              />
              {pwError&&<p className="pw-err">Mot de passe incorrect</p>}
              <button className="btn-go" style={{maxWidth:"100%"}} onClick={handlePwSubmit}>Connexion</button>
            </div>
          </div>
        )}

        {showAdminPanel&&isAdmin&&(
          <AdminPanel
            settings={settings} officialScores={officialScores}
            extraMatches={extraMatches} players={players} paidPlayers={paidPlayers}
            onClose={()=>setShowAdminPanel(false)}
            onToggleShowPreds={v=>saveSettings({showAllPreds:v})}
            onSetTournamentWinner={v=>saveSettings({tournamentWinner:v})}
            onSaveScore={saveOfficialScore}
            onDeleteScore={deleteOfficialScore}
            onSavePoints={savePoints}
            onSavePoints2={savePoints2}
            onScoringDisplay={saveScoringDisplay}
            onSaveGroupJokerCount={saveGroupJokerCount}
            onSaveKnockoutJokerCount={saveKnockoutJokerCount}
            onSavePhaseCoefs={savePhaseCoefs}
            onAddMatch={addExtraMatch} onDeleteMatch={deleteExtraMatch}
            onSaveCagnotte={saveCagnotte} onTogglePaid={togglePaid}
            onToggleHideMatch={toggleHideMatch}
          />
        )}

        {/* HEADER */}
        <div className="header">
          <div className="header-row">
            <div className="logo">
              ⚽ Pronos <em>CdM 2026</em>
              <span style={{display:"block",fontSize:"10px",fontFamily:"'Outfit',sans-serif",fontWeight:500,color:"rgba(255,255,255,.35)",letterSpacing:"1px",marginTop:"-2px"}}>par Maxime Lamy</span>
            </div>
            <div className="header-btns">
              <button className={`admin-btn${isAdmin?" on":""}`} onClick={handleAdminClick}>
                {isAdmin?"⚙️ Admin":"🔐"}
              </button>
              <div className="user-chip"
                onClick={()=>{if(window.confirm(`Changer de pseudo ?\n(Pronos conservés pour "${username}")`)){
                  localStorage.removeItem("wc26_me"); setUsername(null); setNameInput(""); setMyPreds({});
                }}}
              >👤 {username}</div>
            </div>
          </div>
          <div className="tabs">
            {[
              {key:"pronos",    label:"Pronos"},
              {key:"compare",   label:"Comparer"},
              {key:"classement",label:"Classement"},
              {key:"cagnotte",  label:"💰 Cagnotte"},
            ].map(t=>(
              <button key={t.key} className={`tab${activeTab===t.key?" active":""}`} onClick={()=>setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENU */}
        <div className="content">
          {activeTab==="pronos"&&(
            <PronosTab allMatches={allMatches} myPreds={myPreds} myJokers={myJokers}
              officialScores={officialScores} players={players} settings={settings}
              onSave={savePred} onJoker={saveJoker}
              hiddenMatches={settings.hiddenMatches||{}}
            />
          )}
          {activeTab==="compare"&&(
            <CompareTab players={players} allPreds={allPreds} allJokers={allJokers}
              allWinnerPreds={allWinnerPreds} allMatches={allMatches}
              officialScores={officialScores} username={username} settings={settings}
            />
          )}
          {activeTab==="classement"&&(
            <ClassementTab players={players} allPreds={allPreds} allJokers={allJokers}
              allWinnerPreds={allWinnerPreds} officialScores={officialScores}
              settings={settings} allMatches={allMatches}
            />
          )}
          {activeTab==="cagnotte"&&(
            <CagnotteTab players={players} cagnotteSettings={settings.cagnotte}
              paidPlayers={paidPlayers} username={username}
            />
          )}
        </div>

        {toast&&<div className="toast">{toast}</div>}
      </div>
    </>
  );
}
