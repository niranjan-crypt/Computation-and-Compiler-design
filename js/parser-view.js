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

  function render() { _renderParseTree(); }
  return { init, render };
})();

window.ParserView = ParserView;
