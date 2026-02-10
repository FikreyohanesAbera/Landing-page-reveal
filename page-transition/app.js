document.addEventListener("DOMContentLoaded", () => {
  const svg = document.querySelector(".smoke-overlay");
  if (!svg) return;

  const circle = svg.querySelector("#maskCircle");

  // NEW: 3-layer smoke nodes
  const turbB = svg.querySelector("#turbulenceBig");
  const turbS = svg.querySelector("#turbulenceSmall");
  const turbM = svg.querySelector("#turbulenceMicro");

  const dispB = svg.querySelector("#displaceBig");
  const dispS = svg.querySelector("#displaceSmall");
  const dispM = svg.querySelector("#displaceMicro");

  const app = document.getElementById("app");
  if (!app || !circle || !turbB || !turbS || !turbM || !dispB || !dispS || !dispM) return;

  let lastClick = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // Capture click position (for origin)
  document.addEventListener(
    "click",
    (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;

      // allow normal new-tab behavior
      if (link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;

      const url = new URL(link.href, location.href);
      const sameOrigin = url.origin === location.origin;
      if (!sameOrigin) return;

      e.preventDefault();
      lastClick = { x: e.clientX, y: e.clientY };
      navigate(url.pathname);
    },
    true
  );

  window.addEventListener("popstate", () => {
    lastClick = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    navigate(location.pathname, { push: false });
  });

  // ✅ FIXED: return the real click coords in viewBox space
  function clickToViewBoxCenter() {
    const cx = (lastClick.x / window.innerWidth) * 1000;
    const cy = (lastClick.y / window.innerHeight) * 1000;
    return { cx, cy };
  }

  function requiredOpenRadius(cx, cy) {
    const corners = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 0, y: 1000 },
      { x: 1000, y: 1000 },
    ];
    let maxD = 0;
    for (const c of corners) {
      const dx = cx - c.x;
      const dy = cy - c.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > maxD) maxD = d;
    }
    // extra margin for displacement “spray”
    return maxD + 280;
  }

  function setCircle(cx, cy, r) {
    circle.setAttribute("cx", String(cx));
    circle.setAttribute("cy", String(cy));
    circle.setAttribute("r", String(r));
  }

  function openAt(cx, cy) {
    setCircle(cx, cy, requiredOpenRadius(cx, cy));
  }

  function closeAt(cx, cy) {
    setCircle(cx, cy, 0);
  }

  function intro() {
    return gsap.fromTo(
      ".content > *",
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.06 }
    );
  }

  function smokeReveal(cx, cy) {
    const rOpen = requiredOpenRadius(cx, cy);

    // start closed (covered)
    closeAt(cx, cy);

    const tl = gsap.timeline();

    // Punchy start: stronger distortion + higher frequencies
    tl.to(dispB, { attr: { scale: 230 }, duration: 1.0, ease: "power2.out" }, 0);
    tl.to(turbB, { attr: { baseFrequency: "0.018 0.024" }, duration: 1.0, ease: "power2.out" }, 0);

    tl.to(dispS, { attr: { scale: 55 }, duration: 0.8, ease: "power2.out" }, 0);
    tl.to(turbS, { attr: { baseFrequency: 0.11 }, duration: 0.8, ease: "power2.out" }, 0);

    tl.to(dispM, { attr: { scale: 22 }, duration: 0.7, ease: "power2.out" }, 0);
    tl.to(turbM, { attr: { baseFrequency: 0.22 }, duration: 0.7, ease: "power2.out" }, 0);

    // Open the hole
    tl.to(circle, { attr: { r: rOpen }, duration: 1.75, ease: "power3.inOut" }, 0.05);

    // Settle back (keeps detail but stops “violent shaking”)
    tl.to(dispB, { attr: { scale: 170 }, duration: 1.2, ease: "power2.out" }, 0.35);
    tl.to(turbB, { attr: { baseFrequency: "0.007 0.010" }, duration: 1.2, ease: "power2.out" }, 0.35);

    tl.to(dispS, { attr: { scale: 34 }, duration: 1.1, ease: "power2.out" }, 0.35);
    tl.to(turbS, { attr: { baseFrequency: 0.070 }, duration: 1.1, ease: "power2.out" }, 0.35);

    tl.to(dispM, { attr: { scale: 14 }, duration: 1.0, ease: "power2.out" }, 0.35);
    tl.to(turbM, { attr: { baseFrequency: 0.160 }, duration: 1.0, ease: "power2.out" }, 0.35);

    return tl;
  }

  // Optional: subtle micro drift so the edge feels alive even after settle
  gsap.to(turbM, {
    attr: { seed: 200 },
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });

  async function navigate(pathname, opts = { push: true }) {
    const { cx, cy } = clickToViewBoxCenter();

    // 1) INSTANT COVER
    closeAt(cx, cy);

    // Force paint so you never see "reveal then swap"
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 2) FETCH + SWAP #app CONTENT (do not replace the element)
    let html;
    try {
      const res = await fetch(pathname, { cache: "no-store" });
      html = await res.text();
    } catch {
      location.href = pathname;
      return;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const nextApp = doc.getElementById("app");
    if (!nextApp) {
      location.href = pathname;
      return;
    }

    document.title = doc.title || document.title;

    app.setAttribute("data-page", nextApp.getAttribute("data-page") || "");
    app.innerHTML = nextApp.innerHTML;

    if (opts.push) history.pushState({}, "", pathname);

    // 3) NOW REVEAL THE NEW CONTENT
    intro();
    smokeReveal(cx, cy);
  }

  // INITIAL: make sure you are NOT stuck covered
  openAt(500, 500);
  intro();
});
