/* ═══════════════════════════════════════════════════════
   TOC-AV  |  automata-view.js  |  Automata Viewer
   NFA diagram, TM tape step-through, DFA table
   ═══════════════════════════════════════════════════════ */

const AutomataView = (() => {
  let nfaCanvas, nfaCtx;
  let tmStepIndex = 0;

  // ── Init ──
  function init(nfaCanvasEl) {
    nfaCanvas = nfaCanvasEl;
    nfaCtx    = nfaCanvas.getContext("2d");
    _resizeNFA();
    window.addEventListener("resize", () => { _resizeNFA(); render(); });
  }

  function _resizeNFA() {
    if (!nfaCanvas) return;
    nfaCanvas.width  = nfaCanvas.parentElement.clientWidth - 2;
    nfaCanvas.height = 180;
  }

  // ── Main render ──
  function render() {
    _drawNFA();
    _renderTMTape();
    _renderTMLog();
    _renderDFATable();
    _renderSubsetConstruction();
  }

  // ══════════════════════════════════════════
  // NFA DIAGRAM
  // ══════════════════════════════════════════
  function _drawNFA() {
    if (!nfaCanvas) return;
    const W = nfaCanvas.width, H = nfaCanvas.height;
    const ctx = nfaCtx;
    ctx.clearRect(0, 0, W, H);

    const nfa = NFA_DEF;
    const activeNFAStates = _getActiveNFAStates();

    // Node positions (evenly spaced)
    const nodes = nfa.states.map((id, i) => ({
      id,
      label: nfa.labels[i],
      x: (W * 0.08) + i * ((W * 0.86) / (nfa.states.length - 1)),
      y: H * 0.52,
    }));

    const R = 20;

    // ── Edges ──
    // n0 self-loop (SEARCH)
    _drawSelfLoop(ctx, nodes[0].x, nodes[0].y, R, "SRCH", activeNFAStates.has("n0"));
    // ε from n0 to n1 (curved)
    _drawCurvedEdge(ctx, nodes[0], nodes[1], R, "ε", false, activeNFAStates.has("n0"));
    // linear edges
    [
      [1,2,"STOP"],[2,3,"REV"],[3,4,"ALGN"],[4,5,"PARK"]
    ].forEach(([a,b,lbl]) => {
      _drawEdge(ctx, nodes[a], nodes[b], R, lbl, activeNFAStates.has(nfa.states[a]));
    });

    // ── Nodes ──
    nodes.forEach((n, i) => {
      const active   = activeNFAStates.has(n.id);
      const isAccept = nfa.accept.includes(n.id);
      const color    = active ? "#00ff88" : "rgba(0,200,255,0.55)";

      // Outer ring for accept state
      if (isAccept) {
        ctx.beginPath(); ctx.arc(n.x, n.y, R + 5, 0, Math.PI*2);
        ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
      }

      ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI*2);
      ctx.fillStyle   = active ? "rgba(0,255,136,0.15)" : "rgba(0,200,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth   = active ? 2 : 1;
      if (active) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // NFA state ID
      ctx.fillStyle = color;
      ctx.font      = `bold 9px 'Share Tech Mono', monospace`;
      ctx.textAlign = "center";
      ctx.fillText(n.id, n.x, n.y + 1);

      // Label below
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font      = "7px 'Share Tech Mono', monospace";
      ctx.fillText(n.label, n.x, n.y + R + 14);

      // Start arrow for n0
      if (i === 0) {
        ctx.strokeStyle = "rgba(0,200,255,0.5)";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(n.x - R - 20, n.y);
        ctx.lineTo(n.x - R - 2, n.y);
        ctx.stroke();
        _arrowHead(ctx, n.x - R - 2, n.y, 0, "rgba(0,200,255,0.5)");
      }
    });

    // Legend
    ctx.fillStyle = "rgba(0,200,255,0.35)";
    ctx.font      = "8px 'Share Tech Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("NFA with ε-transition (n0→n1) — Subset Construction → DFA below", 8, H - 8);
  }

  function _getActiveNFAStates() {
    const state = AppState.fsm.state;
    const map = { q0:["n0","n1"], q1:["n2"], q2:["n3"], q3:["n4"], q4:["n5"], qE:[] };
    return new Set(map[state] || ["n0","n1"]);
  }

  function _drawEdge(ctx, from, to, R, label, active) {
    const color = active ? "#00ff88" : "rgba(0,200,255,0.4)";
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const sx = from.x + R * Math.cos(angle), sy = from.y + R * Math.sin(angle);
    const ex = to.x - R * Math.cos(angle),   ey = to.y - R * Math.sin(angle);

    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
    ctx.strokeStyle = color; ctx.lineWidth = active ? 1.5 : 1;
    ctx.stroke();
    _arrowHead(ctx, ex, ey, angle, color);

    // Label
    ctx.fillStyle = "rgba(255,204,0,0.85)";
    ctx.font      = "8px 'Share Tech Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, (sx+ex)/2, (sy+ey)/2 - 9);
  }

  function _drawCurvedEdge(ctx, from, to, R, label, above, active) {
    const color = active ? "#00ff88" : "rgba(0,200,255,0.35)";
    const cpY   = from.y - 45;
    ctx.beginPath();
    ctx.moveTo(from.x + R * 0.5, from.y - R * 0.8);
    ctx.quadraticCurveTo((from.x + to.x)/2, cpY, to.x - R * 0.5, to.y - R * 0.8);
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);

    ctx.fillStyle = "rgba(0,255,136,0.7)";
    ctx.font      = "8px 'Share Tech Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, (from.x + to.x)/2, cpY - 5);
  }

  function _drawSelfLoop(ctx, x, y, R, label, active) {
    const color = active ? "#00ff88" : "rgba(0,200,255,0.4)";
    ctx.beginPath();
    ctx.arc(x, y - R - 14, 14, Math.PI * 0.25, Math.PI * 2.75);
    ctx.strokeStyle = color; ctx.lineWidth = active ? 1.5 : 1;
    ctx.stroke();
    _arrowHead(ctx, x + 9, y - R - 3, Math.PI * 0.4, color);
    ctx.fillStyle = "rgba(255,204,0,0.85)";
    ctx.font      = "8px 'Share Tech Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - R - 31);
  }

  function _arrowHead(ctx, x, y, angle, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7 * Math.cos(angle - 0.45), y - 7 * Math.sin(angle - 0.45));
    ctx.lineTo(x - 7 * Math.cos(angle + 0.45), y - 7 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fill();
  }

  function render() {
    _drawNFA();
    _renderDFATable();
    _renderSubsetConstruction();
  }
  return { init, render };
})();

window.AutomataView = AutomataView;
