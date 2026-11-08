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


// ══════════════════════════════════════════════════════
// NPDA — Non-deterministic Push Down Automaton  (Unit 2)
// Explicit stack with push/pop logged at every step
// ══════════════════════════════════════════════════════
class NPDA {
  constructor() {
    this.reset();
  }

  reset() {
    this.stack      = ["Z₀"];   // Z₀ = bottom-of-stack marker
    this.state      = "q_start";
    this.log        = [];
    this.parseTree  = null;
    this.derivation = [];       // leftmost derivation steps
  }

  _push(sym) {
    this.stack.push(sym);
    this.log.push({ action: "PUSH", sym, stack: [...this.stack], state: this.state });
  }

  _pop() {
    const sym = this.stack.pop();
    this.log.push({ action: "POP", sym, stack: [...this.stack], state: this.state });
    return sym;
  }

  validate(tokens) {
    this.reset();
    // Filter OBSTACLE/CLEAR — not part of grammar
    const gTokens = tokens.filter(t => !["OBSTACLE","CLEAR"].includes(t));

    // Push start symbol
    this._push("S");
    this.derivation.push("S");

    const root = { name: "S", children: [] };
    const result = this._parseS(gTokens, 0, root);

    if (result.ok && result.pos === gTokens.length) {
      this.state     = "q_accept";
      this.parseTree = root;
      this.log.push({ action: "HALT", sym: "—", stack: [...this.stack], state: "q_accept" });
      return { ok: true, tree: root };
    } else {
      this.state = "q_reject";
      this.log.push({ action: "HALT", sym: "—", stack: [...this.stack], state: "q_reject" });
      return { ok: false, tree: null };
    }
  }

  _parseS(tokens, pos, node) {
    // S → SEARCH PHASE
    if (pos >= tokens.length || tokens[pos] !== "SEARCH") {
      return { ok: false, pos };
    }
    this._pop();                // pop S
    this._push("PHASE");
    this._push("SEARCH");
    this.derivation.push("SEARCH PHASE");

    const sNode = { name: "SEARCH", children: [] };
    node.children.push(sNode);
    pos++;
    this._pop();                // match SEARCH

    const phaseNode = { name: "PHASE", children: [] };
    node.children.push(phaseNode);
    this._pop();                // pop PHASE symbol (will handle inside _parsePhase)

    return this._parsePhase(tokens, pos, phaseNode);
  }

  _parsePhase(tokens, pos, node) {
    if (pos < tokens.length && tokens[pos] === "SEARCH") {
      // PHASE → SEARCH PHASE
      this._push("PHASE");
      this._push("SEARCH");
      const last = this.derivation[this.derivation.length - 1];
      this.derivation.push(last.replace("PHASE", "SEARCH PHASE"));

      const sNode = { name: "SEARCH", children: [] };
      node.children.push(sNode);
      pos++;
      this._pop(); // match SEARCH

      const phaseNode = { name: "PHASE", children: [] };
      node.children.push(phaseNode);
      this._pop(); // pop PHASE

      return this._parsePhase(tokens, pos, phaseNode);
    }

    // PHASE → STOP REVERSE ALIGN PARK  (Terminal production)
    const terminals = ["STOP", "REVERSE", "ALIGN", "PARK"];
    this._push("PARK");
    this._push("ALIGN");
    this._push("REVERSE");
    this._push("STOP");
    const last = this.derivation[this.derivation.length - 1];
    this.derivation.push(last.replace("PHASE", "STOP REVERSE ALIGN PARK"));

    for (const exp of terminals) {
      if (pos >= tokens.length || tokens[pos] !== exp) {
        return { ok: false, pos };
      }
      node.children.push({ name: exp, children: [] });
      this._pop(); // match terminal
      pos++;
    }
    return { ok: true, pos };
  }
}


// ══════════════════════════════════════════════════════
// TIMED FSM / DFA  (Unit 1 + Unit 3)
// 5-tuple DFA with clock variable for reaction time
// ══════════════════════════════════════════════════════
class TimedFSM {
  constructor() {
    this.reset();
  }

  reset() {
    this.state          = "q0";
    this.clockStart     = 0;
    this.reactionTime   = 0;    // ΔT in seconds
    this.tokensProcessed = 0;
    this.history        = [];   // [{from, token, to, time}]
    this.log            = [];
  }

  process(token) {
    this.tokensProcessed++;
    const from = this.state;

    // Timed Automaton: OBSTACLE triggers clock start
    if (token === "OBSTACLE" && this.state !== "q4") {
      this.state      = "qE";
      this.clockStart = performance.now();
      this._addLog("warn", `δ(${from}, OBSTACLE) → qE :: Clock T started`);
      this.history.push({ from, token, to: "qE", time: Date.now() });
      return { ok: true };
    }

    // CLEAR measures ΔT (Timed Automaton constraint verification)
    if (token === "CLEAR" && this.state === "qE") {
      this.reactionTime = (performance.now() - this.clockStart) / 1000;
      this.state        = "q1";
      this._addLog("ok", `δ(qE, CLEAR) → q1 :: ΔT = ${this.reactionTime.toFixed(3)}s`);
      this.history.push({ from: "qE", token, to: "q1", time: Date.now() });
      return { ok: true, reaction: this.reactionTime };
    }

    const next = DFA_DELTA[this.state]?.[token];
    if (next !== undefined) {
      this.state = next;
      this._addLog("info", `δ(${from}, ${token}) → ${next}`);
      this.history.push({ from, token, to: next, time: Date.now() });
      return { ok: true };
    } else {
      this._addLog("err", `δ(${from}, ${token}) = undefined — transition blocked`);
      return { ok: false };
    }
  }

  _addLog(type, msg) {
    this.log.push({ type, msg, ts: new Date().toLocaleTimeString("en", { hour12: false }) });
  }
}

window.TimedFSM = TimedFSM;
