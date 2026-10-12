/* ============================================================================
   SITE CONFIG: the ONLY place the contract address, mint link and Discord
   invite live. Changing them is a single, reviewable edit (one public commit).
   While contractAddress and mintUrl are empty, the Mint status section shows
   the standing "Nothing is deployed yet" warning.
   ========================================================================== */
const SITE_CONFIG = {
  contractAddress: "",   // the one official contract address, e.g. "0x…"
  mintUrl: "",           // the official mint page
  discordInvite: "",     // official Discord invite; "Coming soon" is shown while empty
};

/* View3Labs holding page (pre-launch): the v3 hero on its own, plus a separate Official links page
   - No wallet connection, no third-party scripts: everything here is self-hosted and local.
   - Canvas: reactive particle field (cursor parallax, energy-driven twinkle/drift).
   - Header wordmark: alpha video reveal (HEVC alpha on WebKit, VP9 alpha elsewhere, screen-blended MP4 fallback,
     PNG when no video route works); plays on load, holds its last frame, replays on hover
   - Sticky header compacts once scrolled; the Official links page reuses the same script
   - Motion toggle (hero footer) pauses the field + wordmark; honours prefers-reduced-motion by default
*/
(() => {
  const root = document.documentElement;
  root.classList.add("has-js");                       // .reveal only hides when JS is running
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ua = navigator.userAgent;
  // Engine, not brand: every iOS browser (Chrome, Firefox, in-app views) is WebKit and only plays HEVC alpha
  const isWebKit = /Apple/.test(navigator.vendor || "") && !/Chrome\/|Chromium\/|Edg\//.test(ua);
  const probe = document.createElement("video");
  const canVP9 = probe.canPlayType('video/webm; codecs="vp9"') !== "";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const state = { tx: 0, ty: 0, x: 0, y: 0, energy: 0, lastX: null, lastY: null, pressed: false, t: 0, hovered: null };

  /* ---------- Motion preference ---------- */
  let motionOn = !reduceQuery.matches;
  try {
    const saved = localStorage.getItem("v3-motion");
    if (saved === "on") motionOn = true;
    if (saved === "off") motionOn = false;
  } catch (_) {}

  /* ---------- Config-driven content: mint status + Discord ---------- */
  (function renderConfig() {
    const addr = (SITE_CONFIG.contractAddress || "").trim();
    const mint = (SITE_CONFIG.mintUrl || "").trim();
    const warning = document.querySelector("[data-mint-warning]");
    const live = document.querySelector("[data-mint-live]");
    if (!warning || !live) { /* the hero page has no mint block */ }
    else if (addr && mint && /^https:\/\//.test(mint)) {
      document.querySelector("[data-mint-address]").textContent = addr;
      document.querySelector("[data-mint-link]").href = mint;
      warning.hidden = true; live.hidden = false;
    } else {
      warning.hidden = false; live.hidden = true;      // standing warning until deploy
    }
    const invite = (SITE_CONFIG.discordInvite || "").trim();
    if (invite && /^https:\/\//.test(invite)) {
      const discord = document.querySelector("[data-discord]");
      if (!discord) return;
      const a = document.createElement("a");
      a.className = "links__link"; a.href = invite; a.target = "_blank"; a.rel = "noopener";
      a.textContent = invite.replace(/^https?:\/\//, "");
      discord.replaceWith(a);
      const f = document.querySelector("[data-discord-footer]");
      if (f) { const fa = document.createElement("a"); fa.href = invite; fa.target = "_blank"; fa.rel = "noopener"; fa.textContent = "Discord"; f.replaceWith(fa); }
    }
  })();

  /* ---------- Wordmark (alpha video) with a fallback chain: header lockup + footer lockup ---------- */
  const ASSETS = new URL("assets/", (document.currentScript && document.currentScript.src) || location.href).href;   // works from / and from /links/
  const SOURCES = isWebKit
    ? [{ src: ASSETS + "wordmark-anim-hevc.mov" }, { src: ASSETS + "wordmark-anim.mp4", blend: true }]
    : canVP9
      ? [{ src: ASSETS + "wordmark-anim.webm" }, { src: ASSETS + "wordmark-anim.mp4", blend: true }]
      : [{ src: ASSETS + "wordmark-anim.mp4", blend: true }];
  function initWordmark(video, wrap, hoverEl) {
    let idx = -1;
    const next = () => {
      idx++; const s = SOURCES[idx];
      if (!s) { wrap.classList.remove("has-video"); return false; }   // PNG stays
      video.classList.toggle("is-blend", !!s.blend); video.src = s.src; return true;
    };
    video.loop = false;
    const hold = () => { if (video.duration) video.currentTime = Math.max(0, video.duration - 0.04); video.pause(); };
    const play = () => { if (!motionOn) return; video.currentTime = 0; video.play().catch(() => {}); };
    video.addEventListener("playing", () => wrap.classList.add("has-video"));
    video.addEventListener("error", () => { if (next()) { if (motionOn) play(); else hold(); } });
    video.addEventListener("ended", hold);
    let lock = false;
    hoverEl.addEventListener("pointerenter", () => {
      if (lock || !video.paused) return;
      lock = true; play(); setTimeout(() => { lock = false; }, 1500);
    });
    next();
    if (!motionOn) {
      video.addEventListener("loadedmetadata", hold, { once: true });
      video.addEventListener("seeked", () => wrap.classList.add("has-video"), { once: true });
    }
    return { play, hold, video };
  }
  const wordWrap = document.querySelector(".brand__word");
  const word = document.querySelector("[data-wordmark]");
  const headerMark = initWordmark(word, wordWrap, document.querySelector("[data-brand]"));
  const playWord = headerMark.play, holdLastFrame = headerMark.hold;
  if (motionOn) setTimeout(playWord, 200);

  const footWord = document.querySelector("[data-footwordmark]");
  const footMark = footWord ? initWordmark(footWord, document.querySelector(".footer__word"), document.querySelector("[data-footbrand]")) : null;
  if (footMark && motionOn && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {           // plays its reveal once the footer scrolls into view
      entries.forEach((en) => { if (en.isIntersecting) { footMark.play(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(footWord.parentElement);                            // the video is display:none until it plays, so watch its wrapper
  }

  /* ---------- Hero symbol (alpha video over the particle field) with the same fallback chain ---------- */
  const heroSymbol = document.querySelector("[data-herosymbol]");
  if (heroSymbol) {
    const chain = isWebKit
      ? [{ src: ASSETS + "symbol-loop-hevc.mov" }, { src: ASSETS + "symbol-loop.mp4", blend: true }]
      : canVP9
        ? [{ src: ASSETS + "symbol-loop.webm" }, { src: ASSETS + "symbol-loop.mp4", blend: true }]
        : [{ src: ASSETS + "symbol-loop.mp4", blend: true }];
    let si = -1;
    const nextSymbolSrc = () => {
      si++; const s = chain[si];
      if (!s) { heroSymbol.removeAttribute("src"); heroSymbol.load(); return; }   // chain exhausted: the transparent poster stays
      heroSymbol.classList.toggle("is-blend", !!s.blend);                           // MP4 fallback keys its black out with a screen blend
      heroSymbol.src = s.src;
    };
    heroSymbol.addEventListener("error", nextSymbolSrc);
    if (!motionOn) heroSymbol.autoplay = false;                                    // Motion off: stays on its poster frame
    nextSymbolSrc();
  }

  /* ---------- Menu button ---------- */
  const menuBtn = document.querySelector("[data-menu]");
  const nav = document.getElementById("nav");
  if (menuBtn && nav) {                                 // the holding pages have no drawer; kept for parity
    const setMenu = (open) => { menuBtn.setAttribute("aria-expanded", String(open)); nav.classList.toggle("is-open", open); };
    menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---------- Sticky header compacts once the page is scrolled ---------- */
  const top = document.querySelector("[data-top]");
  let stuck = false;
  function onScroll() {
    const s = window.scrollY > 24;
    if (s !== stuck) { stuck = s; top.classList.toggle("is-stuck", s); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const setTopH = () => { if (!stuck) root.style.setProperty("--top-h", top.offsetHeight + "px"); };   // hero height = viewport minus the header
  setTopH(); window.addEventListener("resize", setTopH, { passive: true }); window.addEventListener("load", setTopH);

  /* ---------- Scroll reveal ---------- */
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  function revealAll() { reveals.forEach((el) => el.classList.add("is-in")); }
  function revealInView() {                           // synchronous pass: anything already on screen shows at once
    const vh = window.innerHeight;
    reveals.forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.bottom > 0 && b.top < vh) el.classList.add("is-in");
    });
  }
  if ("IntersectionObserver" in window && motionOn) {
    revealInView();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => { if (!el.classList.contains("is-in")) io.observe(el); });
    window.addEventListener("hashchange", () => setTimeout(revealInView, 50));
    setTimeout(revealInView, 600);                    // belt and braces after fonts/images settle layout
  } else {
    revealAll();
  }

  const sigEl = document.querySelector("[data-sig]");

  /* ---------- Particle field ---------- */
  const canvas = document.querySelector("[data-field]");
  const ctx = canvas.getContext("2d", { alpha: false });
  let W = 0, H = 0, DPR = 1;
  const dots = [];
  const COLORS = ["57,255,106", "255,70,90", "80,120,255", "46,230,255", "177,77,255", "220,230,225"];
  function makeDot() {
    return {
      x: Math.random(), y: Math.random(),
      z: 0.25 + Math.random() * 0.75,
      r: 0.5 + Math.random() * 1.4,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      tw: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.004, vy: (Math.random() - 0.5) * 0.003,
    };
  }
  function resize() {
    const nextDPR = Math.min(window.devicePixelRatio || 1, 1.5);
    if (W === window.innerWidth && H === window.innerHeight && DPR === nextDPR) return;
    DPR = nextDPR; W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(clamp((W * H) / 3200, 220, 520));
    while (dots.length < count) dots.push(makeDot());
    dots.length = count;
    if (!running) drawField(state.t, state.energy, 0);
  }
  let resizeTimer = 0;
  const scheduleResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 80); };
  window.addEventListener("resize", scheduleResize, { passive: true });
  window.addEventListener("orientationchange", scheduleResize, { passive: true });

  function drawField(t, e, dt) {
    ctx.fillStyle = "#050605";
    ctx.fillRect(0, 0, W, H);
    const drift = 1 + e * 2.5;
    for (const d of dots) {
      d.x += d.vx * dt * drift; d.y += d.vy * dt * drift;
      if (d.x < -0.02) d.x = 1.02; if (d.x > 1.02) d.x = -0.02;
      if (d.y < -0.02) d.y = 1.02; if (d.y > 1.02) d.y = -0.02;
      const tw = 0.5 + 0.5 * Math.sin(t * (1.2 + d.z) + d.tw);
      const sx = (d.x - state.x * 0.08 * d.z) * W;
      const sy = (d.y - state.y * 0.06 * d.z) * H;
      const a = (0.25 + e * 0.45) * tw * (0.5 + d.z * 0.5);    // dim at rest, brightens with pointer energy
      ctx.fillStyle = `rgba(${d.c},${a.toFixed(3)})`;
      const s = d.r * (0.8 + d.z * 0.6) * (1 + e * 0.6);
      ctx.fillRect(sx, sy, s, s);
      if (d.z > 0.85 && e > 0.3) {
        ctx.fillStyle = `rgba(${d.c},${(a * 0.35).toFixed(3)})`;
        ctx.fillRect(sx - d.vx * W * 40 * e, sy - d.vy * H * 40 * e, s, s);
      }
    }
  }

  /* ---------- Input ---------- */
  function onMove(cx, cy) {
    state.tx = cx / window.innerWidth - 0.5;
    state.ty = cy / window.innerHeight - 0.5;
    if (state.lastX !== null) {
      const d = Math.hypot(cx - state.lastX, cy - state.lastY);
      state.energy = clamp(state.energy + d / 480, 0, 1);
    }
    state.lastX = cx; state.lastY = cy;
  }
  const recenter = () => { state.tx = 0; state.ty = 0; state.lastX = null; };
  window.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener("pointerdown", () => { state.pressed = true; state.energy = clamp(state.energy + 0.5, 0, 1); }, { passive: true });
  window.addEventListener("pointerup", () => { state.pressed = false; }, { passive: true });
  window.addEventListener("pointercancel", () => { state.pressed = false; }, { passive: true });
  document.addEventListener("pointerout", (e) => { if (!e.relatedTarget) recenter(); }, { passive: true });
  window.addEventListener("blur", () => { recenter(); state.pressed = false; });
  window.addEventListener("wheel", (e) => { state.energy = clamp(state.energy + Math.abs(e.deltaY) / 900, 0, 1); }, { passive: true });

  function enableGyro() {
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma == null || e.beta == null) return;
      state.tx = clamp(e.gamma / 45, -0.5, 0.5);
      state.ty = clamp((e.beta - 40) / 60, -0.5, 0.5);
      state.energy = clamp(state.energy + 0.01, 0, 1);
    }, { passive: true });
  }
  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      window.addEventListener("touchend", () => {
        DeviceOrientationEvent.requestPermission().then((r) => { if (r === "granted") enableGyro(); }).catch(() => {});
      }, { once: true });
    } else if ("ontouchstart" in window) {
      enableGyro();
    }
  }

  const coordEl = document.querySelector("[data-coord]");

  /* ---------- Loop ---------- */
  let running = false, rafId = 0, frame = 0, last = 0;
  const written = { mx: "", my: "", e: "" };
  function writeVars() {
    const mx = state.x.toFixed(3), my = state.y.toFixed(3), e = state.energy.toFixed(2);
    if (mx !== written.mx) { root.style.setProperty("--mx", mx); written.mx = mx; }
    if (my !== written.my) { root.style.setProperty("--my", my); written.my = my; }
    if (e !== written.e)   { root.style.setProperty("--energy", e); written.e = e; }
  }
  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    frame++;
    state.t += dt;
    state.x = lerp(state.x, state.tx, 0.07);
    state.y = lerp(state.y, state.ty, 0.07);
    state.energy *= state.pressed ? 0.992 : 0.955;
    if (state.energy < 0.002) state.energy = 0;
    if (Math.abs(state.x) < 0.0005 && state.tx === 0) state.x = 0;
    if (Math.abs(state.y) < 0.0005 && state.ty === 0) state.y = 0;

    writeVars();
    drawField(state.t, state.energy, dt);

    if (frame % 6 === 0) {
      if (coordEl) coordEl.textContent = `X ${(state.x + 0.5).toFixed(2)} · Y ${(state.y + 0.5).toFixed(2)}`;
      if (sigEl) sigEl.textContent = `SIG ${state.energy.toFixed(2)}`;
    }
    rafId = requestAnimationFrame(tick);
  }
  function start() {
    if (running) return;
    running = true; last = performance.now();
    rafId = requestAnimationFrame(tick);
  }
  function stop() {
    running = false; cancelAnimationFrame(rafId);
    state.energy = 0; state.x = state.tx = 0; state.y = state.ty = 0;
    writeVars();
    drawField(state.t, 0, 0);
  }

  /* ---------- Background video loops follow the motion toggle ---------- */
  const bgVideos = Array.from(document.querySelectorAll("[data-bgvideo]"));

  /* ---------- Motion toggle ---------- */
  const motionBtn = document.querySelector("[data-motion]");
  function applyMotion(on, persist) {
    motionOn = on;
    root.classList.toggle("is-still", !on);
    if (motionBtn) { motionBtn.setAttribute("aria-pressed", String(on)); motionBtn.textContent = on ? "Motion on" : "Motion off"; }
    if (on) { start(); if (word.paused && word.currentTime === 0) playWord(); bgVideos.forEach((v) => v.play().catch(() => {})); }
    else { stop(); if (!word.paused) holdLastFrame(); if (footMark && !footMark.video.paused) footMark.hold(); revealAll(); bgVideos.forEach((v) => v.pause()); }
    if (persist) { try { localStorage.setItem("v3-motion", on ? "on" : "off"); } catch (_) {} }
  }
  if (motionBtn) motionBtn.addEventListener("click", () => applyMotion(!motionOn, true));
  reduceQuery.addEventListener("change", (e) => {
    let saved = null; try { saved = localStorage.getItem("v3-motion"); } catch (_) {}
    if (!saved) applyMotion(!e.matches, false);
  });

  resize();
  applyMotion(motionOn, false);

  // Browsers that block muted autoplay: retry the wordmark on the first real user gesture
  const kick = () => { if (motionOn && !wordWrap.classList.contains("has-video") && word.paused) word.play().catch(() => {}); };
  window.addEventListener("pointerdown", kick, { once: true, passive: true });
  window.addEventListener("keydown", kick, { once: true, passive: true });
  window.addEventListener("touchstart", kick, { once: true, passive: true });
})();
