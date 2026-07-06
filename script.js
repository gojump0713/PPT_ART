/* =========================================================================
   script.js — presentation runtime
   scroll-snap · keyboard · IntersectionObserver · dots · effects · fullscreen
   ========================================================================= */
(function () {
  "use strict";

  const { SLIDES, LAYOUTS } = window.DECK;
  const deck = document.getElementById("deck");
  const counter = document.getElementById("counter");
  const dotsWrap = document.getElementById("dots");
  const progress = document.querySelector("#progress span");
  const boot = document.getElementById("boot");

  const total = SLIDES.length;
  let current = 0;
  let userNavigating = false;

  /* ---- build sections ---------------------------------------------------- */
  function buildSlide(s) {
    const sec = document.createElement("section");
    sec.className = "slide";
    sec.id = s.id;
    sec.dataset.effect = s.effect || "fade";
    sec.dataset.index = s.num;
    sec.setAttribute("aria-roledescription", "슬라이드");
    sec.setAttribute("aria-label", `${s.num} / ${total} — ${s.title}`);
    if (s.wide) sec.setAttribute("data-wide", "");

    let inner = "";
    if (typeof s.bg === "function") inner += `<div class="slide-bg">${s.bg()}</div>`;
    if (s.curtain) inner += '<div class="curtain-panel top"></div><div class="curtain-panel bottom"></div>';

    const render = LAYOUTS[s.layout];
    inner += `<div class="slide-content">${render ? render(s) : `<h2 class="stitle">${s.title}</h2>`}</div>`;
    sec.innerHTML = inner;
    return sec;
  }

  const frag = document.createDocumentFragment();
  SLIDES.forEach((s) => frag.appendChild(buildSlide(s)));
  deck.appendChild(frag);

  const slides = [...deck.querySelectorAll(".slide")];

  /* init DarkVeil shader backgrounds (paused until slide activates) */
  deck.querySelectorAll("canvas.darkveil-canvas").forEach((c) => {
    if (window.DarkVeil) c._veil = window.DarkVeil(c, {
      hueShift: 0, noiseIntensity: 0, scanlineIntensity: 0,
      speed: 0.9, scanlineFrequency: 0, warpAmount: 0, resolutionScale: 1,
    });
  });

  /* sequential multi-cut videos (film reel slide): play cuts back-to-back, loop */
  deck.querySelectorAll("video[data-seq]").forEach((v) => {
    const cuts = JSON.parse(v.dataset.seq);
    let cur = 0;
    v.src = cuts[0];
    v.addEventListener("ended", () => {
      cur = (cur + 1) % cuts.length;
      v.src = cuts[cur];
      v.play().catch(() => {});
    });
    v._seqReset = () => {
      if (cur !== 0) { cur = 0; v.src = cuts[0]; }
      else v.currentTime = 0;
    };
  });

  /* typewriter titles: type each [data-type] line in order when its slide activates */
  function runTyping(slide) {
    const lines = [...slide.querySelectorAll("[data-type]")];
    if (!lines.length) return;
    const token = (runTyping._token = (runTyping._token || 0) + 1);
    const caret = document.createElement("span");
    caret.className = "type-caret";
    lines.forEach((l) => (l.textContent = ""));
    let li = 0, ci = 0;
    (function tick() {
      if (token !== runTyping._token) { caret.remove(); return; }
      if (li >= lines.length) {
        setTimeout(() => { if (token === runTyping._token) caret.remove(); }, 2200);
        return;
      }
      const line = lines[li], text = line.dataset.type;
      line.appendChild(caret);
      if (ci < text.length) {
        ci++;
        line.insertBefore(document.createTextNode(text[ci - 1]), caret);
        setTimeout(tick, 70);
      } else { li++; ci = 0; setTimeout(tick, 300); }
    })();
  }

  /* prime donut ring targets from data-p */
  deck.querySelectorAll(".donut .ring[data-p]").forEach((r) => {
    r.style.setProperty("--target", r.dataset.p);
  });

  /* ---- dots -------------------------------------------------------------- */
  slides.forEach((slide, i) => {
    const dot = document.createElement("button");
    dot.className = "slide-dot";
    dot.setAttribute("aria-label", `${i + 1}번 슬라이드: ${SLIDES[i].title}`);
    dot.dataset.title = `${String(i + 1).padStart(2, "0")}. ${SLIDES[i].title}`;
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = [...dotsWrap.children];

  /* ---- navigation -------------------------------------------------------- */
  function goTo(index) {
    const i = Math.max(0, Math.min(index, total - 1));
    userNavigating = true;
    slides[i].scrollIntoView({ behavior: "smooth", block: "start" });
    clearTimeout(goTo._t);
    goTo._t = setTimeout(() => (userNavigating = false), 720);
  }

  function setActive(index) {
    if (index === current) {
      updateUI(index);
      return;
    }
    current = index;
    // restart film-reel sequences from cut 1 whenever their slide is entered
    slides[index].querySelectorAll("video[data-seq]").forEach((v) => v._seqReset && v._seqReset());
    // replay typewriter titles whenever their slide is entered
    runTyping(slides[index]);
    updateUI(index);
  }

  function updateUI(index) {
    slides.forEach((s, i) => {
      s.classList.toggle("is-active", i === index);
      s.classList.toggle("is-prev", i < index);
      s.classList.toggle("is-next", i > index);
      s.setAttribute("aria-current", i === index ? "true" : "false");
    });
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    // play videos / shader canvases only on the active slide (saves GPU/battery)
    slides.forEach((s, i) => {
      s.querySelectorAll("video").forEach((v) => {
        if (i === index) v.play().catch(() => {});
        else v.pause();
      });
      s.querySelectorAll("canvas.darkveil-canvas").forEach((c) => {
        if (c._veil) (i === index ? c._veil.start() : c._veil.stop());
      });
    });
    counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    progress.style.width = `${((index + 1) / total) * 100}%`;

    const id = slides[index].id;
    if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  }

  /* ---- active detection via IntersectionObserver ------------------------- */
  const io = new IntersectionObserver(
    (entries) => {
      // pick the most-visible intersecting slide
      let best = null;
      entries.forEach((e) => {
        if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
      });
      if (best) setActive(slides.indexOf(best.target));
    },
    { root: deck, threshold: [0.5, 0.6, 0.75] }
  );
  slides.forEach((s) => io.observe(s));

  /* ---- keyboard ---------------------------------------------------------- */
  const NEXT = ["ArrowDown", "ArrowRight", " ", "PageDown"];
  const PREV = ["ArrowUp", "ArrowLeft", "PageUp"];
  document.addEventListener("keydown", (e) => {
    if (!help.hidden || !overview.hidden) {
      if (e.key === "Escape") {
        closeHelp();
        closeOverview();
      }
      return;
    }
    if (NEXT.includes(e.key)) { e.preventDefault(); goTo(current + 1); }
    else if (PREV.includes(e.key)) { e.preventDefault(); goTo(current - 1); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(total - 1); }
    else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
    else if (e.key === "?" || (e.shiftKey && e.key === "/")) { e.preventDefault(); openHelp(); }
    else if (e.key.toLowerCase() === "o") { e.preventDefault(); openOverview(); }
  });

  /* ---- wheel: enforce one-slide-per-gesture on trackpads ---------------- */
  let wheelLock = false, wheelAccum = 0;
  deck.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // ignore horizontal gestures
    wheelAccum += e.deltaY;
    if (wheelLock) { e.preventDefault(); return; }
    if (Math.abs(wheelAccum) > 26) {
      e.preventDefault();
      goTo(current + (wheelAccum > 0 ? 1 : -1));
      wheelAccum = 0;
      wheelLock = true;
      setTimeout(() => (wheelLock = false), 680);
    }
  }, { passive: false });

  /* ---- touch swipe ------------------------------------------------------- */
  let touchY = null, touchX = null;
  deck.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; touchX = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener("touchend", (e) => {
    if (touchY == null) return;
    const dy = e.changedTouches[0].clientY - touchY;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) goTo(current + (dy < 0 ? 1 : -1));
    touchY = touchX = null;
  }, { passive: true });

  /* ---- controls ---------------------------------------------------------- */
  document.getElementById("btnPrev").addEventListener("click", () => goTo(current - 1));
  document.getElementById("btnNext").addEventListener("click", () => goTo(current + 1));
  document.getElementById("btnFull").addEventListener("click", toggleFullscreen);
  document.getElementById("btnHelp").addEventListener("click", openHelp);

  /* ---- fullscreen + cursor hide ----------------------------------------- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)?.call(document.documentElement);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    }
  }
  document.addEventListener("fullscreenchange", () => {
    document.body.classList.toggle("presentation-mode", !!document.fullscreenElement);
    if (!document.fullscreenElement) document.body.classList.remove("cursor-hidden");
  });

  let cursorTimer;
  document.addEventListener("mousemove", () => {
    if (!document.body.classList.contains("presentation-mode")) return;
    document.body.classList.remove("cursor-hidden");
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => document.body.classList.add("cursor-hidden"), 2000);
  });

  /* ---- 3D tilt (pointer parallax on active tilt slide) ------------------- */
  window.addEventListener("mousemove", (e) => {
    const active = slides[current];
    if (!active || active.dataset.effect !== "tilt3d") return;
    const mx = (e.clientX / window.innerWidth - 0.5) * 2;
    const my = (e.clientY / window.innerHeight - 0.5) * 2;
    active.style.setProperty("--mx", mx.toFixed(3));
    active.style.setProperty("--my", my.toFixed(3));
  });

  /* ---- parallax background on scroll ------------------------------------- */
  let ticking = false;
  deck.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const vh = deck.clientHeight;
      slides.forEach((s) => {
        if (s.dataset.effect !== "parallax") return;
        const bg = s.querySelector(".slide-bg");
        if (!bg) return;
        const rect = s.getBoundingClientRect();
        const offset = (rect.top / vh) * -60; // px
        bg.style.transform = `translateY(${offset}px)`;
      });
      ticking = false;
    });
  }, { passive: true });

  /* ---- help overlay ------------------------------------------------------ */
  const help = document.getElementById("help");
  const overview = document.getElementById("overview");
  function openHelp() { help.hidden = false; }
  function closeHelp() { help.hidden = true; }
  document.getElementById("helpClose").addEventListener("click", closeHelp);
  help.addEventListener("click", (e) => { if (e.target === help) closeHelp(); });

  /* ---- overview (outline) ------------------------------------------------ */
  const ovGrid = document.getElementById("overviewGrid");
  SLIDES.forEach((s, i) => {
    const c = document.createElement("button");
    c.className = "ov-card";
    c.innerHTML = `<div class="ov-n">${String(i + 1).padStart(2, "0")}</div>
      <div class="ov-t">${s.title}</div>
      <div class="ov-eff">${s.effect}</div>`;
    c.addEventListener("click", () => { closeOverview(); goTo(i); });
    ovGrid.appendChild(c);
  });
  function openOverview() { overview.hidden = false; }
  function closeOverview() { overview.hidden = true; }
  document.getElementById("overviewClose").addEventListener("click", closeOverview);

  /* ---- initial hash jump ------------------------------------------------- */
  function jumpToHash() {
    const id = location.hash.slice(1);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx >= 0) {
      slides[idx].scrollIntoView({ block: "start" });
      setActive(idx);
    }
  }
  window.addEventListener("hashchange", () => {
    if (userNavigating) return;
    jumpToHash();
  });

  /* ---- boot -------------------------------------------------------------- */
  function ready() {
    if (ready._done) return;
    ready._done = true;
    if (location.hash) jumpToHash();
    updateUI(current);
    setTimeout(() => boot.classList.add("hide"), 360);
  }
  window.addEventListener("load", ready);
  if (document.readyState === "complete") ready();
  // failsafe: never trap the deck behind the loading veil (slow media/network)
  setTimeout(ready, 2500);
})();
