/* ═══════════════════════════════════════════════════════
   TOC-AV  |  parser-view.js  |  Grammar Lab View
   Parse tree canvas, NPDA stack, derivation step-through
   ═══════════════════════════════════════════════════════ */

const ParserView = (() => {
  let ptCanvas, ptCtx;
  let currentStep = 0;

  // ── Init ──
  function init(parseTreeCanvasEl) {
    ptCanvas = parseTreeCanvasEl;
    ptCtx    = ptCanvas.getContext("2d");
    _resizePT();
    window.addEventListener("resize", _resizePT);
  }

  function _resizePT() {
    if (!ptCanvas) return;
    ptCanvas.width  = ptCanvas.parentElement.clientWidth - 2;
    ptCanvas.height = 260;
    render();
  }

  // ── Main render (called after compile or on tab switch) ──
  function render() {
    _renderStack();
    _renderParseTree();
    _renderDerivationSteps();
    _renderPDALog();
  }

  // ── NPDA Stack ──
  function _renderStack() {
    const el = document.getElementById("pdaStackEl");
    if (!el) return;
    // Clear existing stack cells (keep bottom label)
    el.querySelectorAll(".stack-cell").forEach(c => c.remove());

    const stack = AppState.npda.stack;
    stack.forEach((sym, i) => {
      if (sym === "Z₀") return; // bottom marker shown via CSS label
      const cell = document.createElement("div");
      cell.className = "stack-cell" + (i === stack.length - 1 ? " top" : "");
      cell.textContent = sym;
      el.appendChild(cell);
    });

    const stateEl = document.getElementById("pdaCurrentState");
    if (stateEl) stateEl.textContent = AppState.npda.state || "—";
  }

  // ── Parse Tree Canvas ──
  function _renderParseTree() {
    if (!ptCanvas || !ptCtx) return;
    const W = ptCanvas.width, H = ptCanvas.height;
    ptCtx.clearRect(0, 0, W, H);
    ptCtx.fillStyle = "rgba(0,0,0,0)";

    const tree = AppState.pdaResult?.tree;

    if (!tree) {
      ptCtx.fillStyle = "rgba(0,200,255,0.2)";
      ptCtx.font      = "11px 'Share Tech Mono', monospace";
      ptCtx.textAlign = "center";
      ptCtx.fillText("Compile a valid route to see parse tree", W/2, H/2 - 8);
      ptCtx.fillStyle = "rgba(0,200,255,0.1)";
      ptCtx.fillText("S → SEARCH PHASE → ...", W/2, H/2 + 14);
      return;
    }

    // Layout tree with positional calculation
    _layoutTree(tree, 0, 0, W);
    _drawEdges(tree);
    _drawNodes(tree);
  }

  function _layoutTree(node, depth, leftBound, rightBound) {
    const H = ptCanvas.height;
    const levels = _treeDepth(node);
    const vertSpacing = Math.min(50, (H - 30) / levels);

    node._x = (leftBound + rightBound) / 2;
    node._y = depth * vertSpacing + 24;

    if (node.children && node.children.length > 0) {
      const segW = (rightBound - leftBound) / node.children.length;
      node.children.forEach((child, i) => {
        _layoutTree(child, depth + 1, leftBound + i * segW, leftBound + (i + 1) * segW);
      });
    }
  }

  function _treeDepth(node) {
    if (!node.children || node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map(_treeDepth));
  }

  function _drawEdges(node) {
    if (!node.children) return;
    node.children.forEach(child => {
      ptCtx.beginPath();
      ptCtx.moveTo(node._x, node._y + 13);
      ptCtx.lineTo(child._x, child._y - 13);
      ptCtx.strokeStyle = "rgba(153,102,255,0.35)";
      ptCtx.lineWidth   = 1;
      ptCtx.stroke();
      _drawEdges(child);
    });
  }

  function _drawNodes(node) {
    const isLeaf     = !node.children || node.children.length === 0;
    const isNonTerm  = ["S","PHASE","TAIL","END"].includes(node.name);
    const color      = isLeaf ? "#ffcc00" : (isNonTerm ? "#9966ff" : "#00c8ff");
    const radius     = 15;

    // Node circle
    ptCtx.beginPath();
    ptCtx.arc(node._x, node._y, radius, 0, Math.PI * 2);
    ptCtx.fillStyle   = isLeaf ? "rgba(255,204,0,0.12)" : "rgba(153,102,255,0.15)";
    ptCtx.fill();
    ptCtx.strokeStyle = color;
    ptCtx.lineWidth   = 1.5;
    ptCtx.stroke();

    // Glow on non-terminals
    if (isNonTerm) {
      ptCtx.shadowColor = color;
      ptCtx.shadowBlur  = 6;
      ptCtx.stroke();
      ptCtx.shadowBlur  = 0;
    }

    // Label (truncate for space)
    const label = node.name.length > 5 ? node.name.slice(0, 4) : node.name;
    ptCtx.fillStyle = color;
    ptCtx.font      = `bold ${isLeaf ? 7 : 8}px 'Share Tech Mono', monospace`;
    ptCtx.textAlign = "center";
    ptCtx.fillText(label, node._x, node._y + 3);

    if (node.children) node.children.forEach(_drawNodes);
  }

  // ── Leftmost Derivation Steps ──
  function _renderDerivationSteps() {
    const el = document.getElementById("derivationSteps");
    if (!el) return;

    const steps = AppState.npda.derivation;

    if (!steps || steps.length === 0) {
      el.innerHTML = `<div class="derivation-step" style="color:var(--text-dim)">No derivation yet — compile a route</div>`;
      return;
    }

    el.innerHTML = "";
    steps.forEach((step, i) => {
      const div = document.createElement("div");
      div.className = "derivation-step" + (i === currentStep ? " active" : i < currentStep ? " done" : "");
      div.innerHTML = `<span style="color:var(--dim);margin-right:8px">${i === 0 ? "S" : `⇒${i}`}</span>${_highlight(step)}`;
      div.style.cursor = "pointer";
      div.addEventListener("click", () => { currentStep = i; _renderDerivationSteps(); });
      el.appendChild(div);
    });
  }

  function _highlight(str) {
    return str.replace(/\b(SEARCH|STOP|REVERSE|ALIGN|PARK)\b/g,
      `<span style="color:var(--cyan)">$1</span>`)
      .replace(/\b(S|PHASE|TAIL|END)\b/g,
      `<span style="color:var(--purple)">$1</span>`);
  }

  function stepForward() {
    const max = (AppState.npda.derivation?.length || 1) - 1;
    if (currentStep < max) currentStep++;
    _renderDerivationSteps();
  }

  function stepBack() {
    if (currentStep > 0) currentStep--;
    _renderDerivationSteps();
  }

  function resetStep() {
    currentStep = 0;
    _renderDerivationSteps();
  }

  // ── PDA Transition Log ──
  function _renderPDALog() {
    const el = document.getElementById("pdaTransitionLog");
    if (!el) return;

    const logs = AppState.npda.log;
    if (!logs || logs.length === 0) {
      el.innerHTML = `<div class="log-dim">No PDA transitions yet</div>`;
      return;
    }

    el.innerHTML = "";
    logs.slice(-30).forEach(entry => {
      const div = document.createElement("div");
      const actionColor = {
        PUSH: "var(--purple)",
        POP:  "var(--orange)",
        HALT: "var(--yellow)",
      }[entry.action] || "var(--text-dim)";

      div.innerHTML = `<span style="color:${actionColor}">[${entry.action}]</span> `
        + `<span style="color:var(--cyan)">${entry.sym}</span> `
        + `<span style="color:var(--text-dim)">| State: ${entry.state} | Stack: [${entry.stack.join(",")}]</span>`;
      div.style.fontSize    = "0.58rem";
      div.style.lineHeight  = "1.9";
      el.appendChild(div);
    });
    el.scrollTop = el.scrollHeight;
  }

  return { init, render, stepForward, stepBack, resetStep };
})();

window.ParserView = ParserView;
