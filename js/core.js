/* ═══════════════════════════════════════════════════════
   TOC-AV  |  core.js  |  All Theory of Computation Logic
   Units covered: 1 (DFA/NFA), 2 (CFG/NPDA), 3 (TM/Timed)
   ═══════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════
// CONSTANTS — Shared across all modules
// ══════════════════════════════════════════════════════

const ALPHABET = ["SEARCH", "STOP", "REVERSE", "ALIGN", "PARK"];
const FULL_SIGMA = [...ALPHABET, "OBSTACLE", "CLEAR"];

const DFA_STATES_META = {
  q0: { label: "SEARCH",    desc: "Scanning for spot", isStart: true,  isFinal: false, symbol: "→" },
  q1: { label: "STOP",      desc: "Vehicle halted",    isStart: false, isFinal: false, symbol: "" },
  q2: { label: "REVERSE",   desc: "Reversing into bay",isStart: false, isFinal: false, symbol: "" },
  q3: { label: "ALIGN",     desc: "Aligning position", isStart: false, isFinal: false, symbol: "" },
  q4: { label: "PARK",      desc: "Successfully parked",isStart:false, isFinal: true,  symbol: "⊙" },
  qE: { label: "EMERGENCY", desc: "Obstacle detected", isStart: false, isFinal: false, symbol: "!" },
};

const DFA_DELTA = {
  q0: { SEARCH: "q0", STOP: "q1" },
  q1: { REVERSE: "q2" },
  q2: { ALIGN: "q3" },
  q3: { PARK: "q4" },
  q4: {},
  qE: { CLEAR: "q1" },
};

// DFA transition table rows for display [state, SEARCH, STOP, REVERSE, ALIGN, PARK]
const DFA_TABLE = [
  ["q0 →", "q0",  "q1", "—", "—", "—"],
  ["q1",   "—",   "—",  "q2","—", "—"],
  ["q2",   "—",   "—",  "—", "q3","—"],
  ["q3",   "—",   "—",  "—", "—", "q4⊙"],
  ["q4 ⊙", "—",  "—",  "—", "—", "—"],
  ["qE",   "—",   "—",  "—", "—", "—"],
];

// NFA definition (with ε-transitions, pre-subset-construction)
const NFA_DEF = {
  states:  ["n0", "n1", "n2", "n3", "n4", "n5"],
  labels:  ["START", "SRCH*", "STOP", "REV", "ALIGN", "PARK⊙"],
  alphabet: ALPHABET,
  delta: {
    n0: { SEARCH: ["n0", "n1"], ε: ["n1"] },
    n1: { STOP:   ["n2"] },
    n2: { REVERSE:["n3"] },
    n3: { ALIGN:  ["n4"] },
    n4: { PARK:   ["n5"] },
    n5: {},
  },
  start:  "n0",
  accept: ["n5"],
  // Mapping NFA state → DFA state for active highlighting
  dfaMap: { n0:"q0", n1:"q0", n2:"q1", n3:"q2", n4:"q3", n5:"q4" }
};

window.ALPHABET = ALPHABET;
window.FULL_SIGMA = FULL_SIGMA;
window.DFA_STATES_META = DFA_STATES_META;
window.DFA_DELTA = DFA_DELTA;
window.DFA_TABLE = DFA_TABLE;
window.NFA_DEF = NFA_DEF;
