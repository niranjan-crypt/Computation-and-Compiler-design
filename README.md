# TOC-AV :: Formal Verification System

> An interactive Theory of Computation (TOC) & Autonomous Vehicle formal verification and simulation dashboard.

## Overview

**TOC-AV** demonstrates how core theoretical computer science concepts (Finite Automata, Pushdown Automata, Context-Free Grammars, and Turing Machines) are applied to verify safety-critical operations in an autonomous vehicle system.

The core scenario modeled is an **autonomous parking sequence**:
$$\text{SEARCH}^+ \to \text{STOP} \to \text{REVERSE} \to \text{ALIGN} \to \text{PARK}$$
alongside asynchronous real-time events (`OBSTACLE` emergency braking and `CLEAR` resumption).

---

## Theory of Computation Coverage

### Unit 1: Regular Languages & Finite Automata
- **DFA (Deterministic Finite Automaton)**: 5-tuple $M = (Q, \Sigma, \delta, q_0, F)$ with states $\{q_0, q_1, q_2, q_3, q_4, q_E\}$.
- **NFA with $\epsilon$-transitions**: Visualized with state subsets, self-loops, and non-deterministic branching.
- **Subset Construction ($NFA \to DFA$)**: Shows $\epsilon$-closure mappings and equivalence between NFA states and DFA states.
- **Timed Automaton**: Real-time reaction timer tracking elapsed time ($\Delta T$) between obstacle detection ($q_E$) and clearance ($q_1$).

### Unit 2: Context-Free Languages & Pushdown Automata
- **Context-Free Grammar (CFG)**: Unambiguous, CNF-compatible grammar:
  - $S \to \text{SEARCH } \text{PHASE}$
  - $\text{PHASE} \to \text{SEARCH } \text{PHASE} \mid \text{STOP } \text{TAIL}$
  - $\text{TAIL} \to \text{REVERSE } \text{END}$
  - $\text{END} \to \text{ALIGN PARK}$
- **NPDA (Pushdown Automaton)**: Explicit stack simulation with bottom marker $Z_0$ and step-by-step `PUSH`/`POP` logging.
- **Parse Tree**: Dynamic canvas rendering of the derivation tree with interactive leftmost derivation stepping.

### Unit 3: Turing Machines & Computability
- **Turing Machine**: JFLAP-style simulation with an interactive tape and head pointer ($\blacktriangle$):
  - **Phase 1**: Alphabet validation scan over $\Sigma$.
  - **Phase 2**: JFLAP actuator signal generation ($b$ for brake, $r$ for reverse, $s$ for stop).

---

## Project Structure

```
├── index.html              # Main dashboard application
├── css/
│   └── theme.css           # Cyberpunk HUD styling
└── js/
    ├── core.js             # DFA, NFA, NPDA, TM logic & AppState
    ├── simulation.js       # 2D canvas vehicle animation & HUD
    ├── parser-view.js      # Parse tree layout & NPDA stack viewer
    └── automata-view.js    # NFA canvas, subset construction & TM tape
```

---

## Getting Started

No build tools, bundlers, or dependencies are required. Simply open `index.html` in any modern web browser:

```bash
# Optional: serve locally with Python
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## Keyboard Controls (Mission Control)

- `[S]`: SEARCH
- `[Space]`: STOP
- `[R]`: REVERSE
- `[A]`: ALIGN
- `[P]`: PARK
- `[O]`: OBSTACLE (Emergency Stop)
- `[C]`: CLEAR (Resume)
- `[Enter]`: COMPILE & VERIFY
