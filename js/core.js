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


// ══════════════════════════════════════════════════════
// TURING MACHINE  (Unit 3)
// Simulates the JFLAP diagram:
//   q0 --(P;b,R)--> q1 --(□;r,R)--> q2 --(□;s,S)--> q3(accept)
// Extended to scan full tape and validate alphabet
// ══════════════════════════════════════════════════════
class TuringMachine {
  constructor() {
    this.reset();
  }

  reset() {
    this.tape      = [];
    this.head      = 0;
    this.state     = "q_init";
    this.log       = [];
    this.steps     = [];   // snapshots for step-through
    this.accepted  = null;
    this.invalid   = [];
  }

  load(tokens) {
    this.reset();
    // Tape: blank + tokens + blank (standard TM format)
    this.tape  = ["□", ...tokens.map(t => t), "□"];
    this.head  = 1;
    this.state = "q_scan";
    this.log.push({ state: "q_scan", msg: "Tape loaded. Head at cell 1. Begin scan." });
  }

  run() {
    const result = { accepted: true, invalidTokens: [], normalizedTokens: [] };

    // Phase 1: alphabet validation scan (q_scan phase)
    for (let i = 1; i < this.tape.length - 1; i++) {
      this.head = i;
      const sym = this.tape[i];

      if (FULL_SIGMA.includes(sym)) {
        this.state = "q_valid";
        this.tape[i] = sym; // no change, just "reading"
        result.normalizedTokens.push(sym);
        this.log.push({ state: "q_valid", msg: `READ '${sym}' @ [${i}] ∈ Σ — VALID ✓`, head: i });
        this.steps.push({ tape: [...this.tape], head: i, state: "q_valid", mark: "ok" });
      } else {
        this.state = "q_reject";
        result.invalidTokens.push(sym);
        result.accepted = false;
        this.log.push({ state: "q_reject", msg: `READ '${sym}' @ [${i}] ∉ Σ — REJECT ✗`, head: i });
        this.steps.push({ tape: [...this.tape], head: i, state: "q_reject", mark: "err" });
      }
    }

    // Phase 2: JFLAP simulation — find PARK token, write b/r/s
    // q0 --(PARK;b,R)--> q1 --(□;r,R)--> q2 --(□;s,S)--> q3
    if (result.accepted) {
      const parkIdx = this.tape.indexOf("PARK");
      if (parkIdx !== -1) {
        this.head = parkIdx;
        this.state = "q_tm0";
        this.log.push({ state: "q_tm0", msg: `JFLAP Phase: Found 'PARK' @ [${parkIdx}]. Write 'b', move R.`, head: parkIdx });
        this.tape[parkIdx] = "b";
        this.steps.push({ tape: [...this.tape], head: parkIdx, state: "q_tm0", mark: "written" });

        this.head = parkIdx + 1;
        this.state = "q_tm1";
        this.log.push({ state: "q_tm1", msg: `Read '□' @ [${this.head}]. Write 'r', move R.`, head: this.head });
        this.tape[this.head] = "r";
        this.steps.push({ tape: [...this.tape], head: this.head, state: "q_tm1", mark: "written" });

        this.head = parkIdx + 2;
        this.state = "q_tm2";
        this.log.push({ state: "q_tm2", msg: `Read '□' @ [${this.head}]. Write 's', STAY.`, head: this.head });
        this.tape[this.head] = "s";
        this.steps.push({ tape: [...this.tape], head: this.head, state: "q_tm2", mark: "written" });

        this.state = "q_halt_accept";
        this.log.push({ state: "q_halt_accept", msg: "HALT-ACCEPT: Brake/Reverse/Stop signals written to tape." });
        this.steps.push({ tape: [...this.tape], head: this.head, state: "q_halt_accept", mark: "ok" });
      } else {
        this.state = "q_halt_accept";
        this.log.push({ state: "q_halt_accept", msg: "HALT-ACCEPT: Alphabet valid. No PARK token — JFLAP phase skipped." });
      }
    } else {
      this.state = "q_halt_reject";
      this.log.push({ state: "q_halt_reject", msg: `HALT-REJECT: ${result.invalidTokens.length} invalid symbol(s) found.` });
    }

    this.accepted = result.accepted;
    this.invalid  = result.invalidTokens;
    return result;
  }
}

window.TuringMachine = TuringMachine;
