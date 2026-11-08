/* ═══════════════════════════════════════════════════════
   TOC-AV  |  simulation.js  |  Mission Control Canvas
   Car physics, animation loop, FSM state visualization
   ═══════════════════════════════════════════════════════ */

const Simulation = (() => {
  // ── Canvas & Context ──
  let canvas, ctx;
  let animFrame = null;

  // ── Car state ──
  const car = {
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    w: 28, h: 48,
    trail: [],
    angle: 0,
    speed: 0,
  };

  // ── Scene objects ──
  const scene = {
    parkSpot: { x: 0, y: 0, w: 64, h: 110 },
    obstacles: [],
    frameCount: 0,
  };

  // ── Init ──
  function init(canvasEl) {
    canvas = canvasEl;
    ctx    = canvas.getContext("2d");
    _resize();
    window.addEventListener("resize", _resize);
    _loop();
  }

  function _resize() {
    canvas.width  = canvas.parentElement.clientWidth - 2;
    canvas.height = 360;
    scene.parkSpot = {
      x: canvas.width * 0.68,
      y: canvas.height * 0.62,
      w: 64, h: 110,
    };
    car.x = canvas.width * 0.22;
    car.y = canvas.height * 0.12;
  }

  // ── Main draw ──
  function _draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const state = AppState.fsm.state;

    // Background
    ctx.fillStyle = "#04101e";
    ctx.fillRect(0, 0, W, H);

    // Road grid
    ctx.strokeStyle = "rgba(0,200,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Road lane markings
    ctx.setLineDash([16, 12]);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W*0.5, 0); ctx.lineTo(W*0.5, H); ctx.stroke();
    ctx.setLineDash([]);

    // Parking bay
    const ps = scene.parkSpot;
    const parked = state === "q4";
    const psColor = parked ? "#00ff88" : "rgba(255,204,0,0.6)";
    ctx.strokeStyle = psColor;
    ctx.lineWidth   = parked ? 2 : 1.5;
    ctx.strokeRect(ps.x - ps.w/2, ps.y - ps.h/2, ps.w, ps.h);
    ctx.fillStyle = parked ? "rgba(0,255,136,0.08)" : "rgba(255,204,0,0.04)";
    ctx.fillRect(ps.x - ps.w/2, ps.y - ps.h/2, ps.w, ps.h);
    // P label
    ctx.fillStyle   = psColor;
    ctx.font        = "bold 18px Orbitron, monospace";
    ctx.textAlign   = "center";
    ctx.fillText("P", ps.x, ps.y + 7);
    // Parking spot guide lines
    ctx.strokeStyle = "rgba(255,204,0,0.15)";
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(ps.x, ps.y - ps.h/2 - 20); ctx.lineTo(ps.x, ps.y - ps.h/2); ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    if (car.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(car.trail[0].x + car.w/2, car.trail[0].y + car.h/2);
      for (let i = 1; i < car.trail.length; i++) {
        ctx.lineTo(car.trail[i].x + car.w/2, car.trail[i].y + car.h/2);
      }
      ctx.strokeStyle = "rgba(0,200,255,0.18)";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Car physics update
    _updateCar(state);

    // Draw car
    _drawCar(state);

    // HUD overlays
    _drawHUD(state, W, H);

    scene.frameCount++;
  }

  function _updateCar(state) {
    const ps = scene.parkSpot;

    if (state === "q0") {
      car.y += 1.4;
      if (car.y > canvas.height - 70) car.y = canvas.height - 70;
    } else if (state === "q2") {
      car.y -= 0.9;
      if (car.y < 10) car.y = 10;
    } else if (state === "q3") {
      car.x += (ps.x - car.w/2 - car.x) * 0.04;
      car.y += (ps.y - car.h/2 - car.y) * 0.04;
    } else if (state === "q4") {
      car.x += (ps.x - car.w/2 - car.x) * 0.08;
      car.y += (ps.y - car.h/2 - car.y) * 0.08;
    }

    // Record trail
    if (Math.abs(car.speed) > 0.05) {
      car.trail.push({ x: car.x, y: car.y });
      if (car.trail.length > 100) car.trail.shift();
    }

    car.speed = (state === "q0") ? 1.4 : (state === "q2") ? -0.9 : 0;
  }

  function _drawCar(state) {
    const cx = car.x, cy = car.y, W = car.w, H = car.h;

    const colorMap = {
      q0: "#0099cc", q1: "#ffcc00", q2: "#ff8844",
      q3: "#9966ff", q4: "#00ff88", qE: "#ff3355",
    };
    const carColor = colorMap[state] || "#0099cc";

    // Headlight glow (when driving forward)
    if (state === "q0") {
      const g = ctx.createRadialGradient(cx+W/2, cy, 2, cx+W/2, cy-30, 50);
      g.addColorStop(0, "rgba(255,255,180,0.25)");
      g.addColorStop(1, "rgba(255,255,180,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx-20, cy-50, W+40, 50);
    }

    // Body shadow
    ctx.shadowColor = carColor;
    ctx.shadowBlur  = state === "qE" ? 20 : 10;

    // Car body
    ctx.fillStyle   = carColor + "22";
    ctx.strokeStyle = carColor;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, cy, W, H, 3);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Windshield
    ctx.fillStyle = "rgba(0,200,255,0.18)";
    ctx.fillRect(cx+4, cy+7, W-8, 11);

    // Rear window
    ctx.fillStyle = "rgba(0,200,255,0.1)";
    ctx.fillRect(cx+4, cy+H-18, W-8, 9);

    // Wheels
    const wheelPositions = [[-5,8],[W+1,8],[-5,H-18],[W+1,H-18]];
    wheelPositions.forEach(([wx,wy]) => {
      ctx.fillStyle   = "#222";
      ctx.strokeStyle = "#444";
      ctx.lineWidth   = 0.5;
      ctx.fillRect(cx+wx, cy+wy, 5, 10);
      ctx.strokeRect(cx+wx, cy+wy, 5, 10);
    });

    // State label below car
    ctx.fillStyle = carColor;
    ctx.font      = "bold 9px 'Share Tech Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(state, cx+W/2, cy+H+13);
  }

  function _drawHUD(state, W, H) {
    // Emergency overlay
    if (state === "qE") {
      const alpha = 0.08 + 0.06 * Math.sin(scene.frameCount * 0.25);
      ctx.fillStyle = `rgba(255,51,85,${alpha})`;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ff3355";
      ctx.font      = "bold 13px 'Orbitron', monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠  EMERGENCY BRAKE ACTIVE", W/2, H/2 - 12);

      ctx.fillStyle = "rgba(255,51,85,0.6)";
      ctx.font      = "9px 'Share Tech Mono', monospace";
      ctx.fillText("PRESS [C] TO CLEAR OBSTACLE", W/2, H/2 + 10);
    }

    // Park complete banner
    if (state === "q4") {
      ctx.fillStyle = "rgba(0,255,136,0.9)";
      ctx.font      = "bold 11px 'Orbitron', monospace";
      ctx.textAlign = "center";
      ctx.fillText("✓  VEHICLE PARKED — MISSION COMPLETE", W/2, 22);
    }

    // State label top-left
    ctx.fillStyle = "rgba(0,200,255,0.5)";
    ctx.font      = "9px 'Share Tech Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`FSM: ${state}  |  TOKENS: ${AppState.fsm.tokensProcessed}`, 10, H - 8);
  }

  function _loop() {
    _draw();
    animFrame = requestAnimationFrame(_loop);
  }

  function resetCar() {
    car.trail = [];
    car.x = canvas ? canvas.width * 0.22 : 100;
    car.y = canvas ? canvas.height * 0.12 : 40;
    car.speed = 0;
  }

  return { init, resetCar };
})();

window.Simulation = Simulation;
