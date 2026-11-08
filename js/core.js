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

window.ALPHABET = ALPHABET;
window.FULL_SIGMA = FULL_SIGMA;
window.DFA_STATES_META = DFA_STATES_META;
