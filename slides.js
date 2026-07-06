/* =========================================================================
   slides.js — content model + layout renderers for all 30 pages
   Each slide = { num, id, title, effect, theme, wide, layout, ...data }
   A layout renderer returns the innerHTML of .slide-content.
   Optional slide.bg(): background layer HTML.  slide.curtain: adds curtain panels.
   ========================================================================= */
(function () {
  "use strict";

  /* ---- inline icon set ---------------------------------------------------- */
  const I = {
    health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l2 5 4-12 2 7h6"/></svg>',
    chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20s2-6 8-6M14 14l6-9a2 2 0 00-3-2l-7 8"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3v18M5 11h4V3M9 3v8M15 3c-1.5 0-2 2-2 5s.5 4 2 4 2-1 2-4-.5-5-2-5zM15 12v9"/></svg>',
    heartHand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 8.5a3 3 0 00-5.2-2A3 3 0 009.6 8.5c0 3 4.4 6 5.2 6.5.8-.5 5.2-3.5 5.2-6.5z"/><path d="M3 21l4-1 3 1"/></svg>',
    grad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 8l10-4 10 4-10 4z"/><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h8l4 4v16H6z"/><path d="M9 12h6M9 16h6M9 8h2"/></svg>',
    handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 11l3 3 5-5 3 2M2 12l4-4 4 3M14 9l3-3 5 4"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z"/><path d="M4 17h14"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3l11 9-11 9-1-6-6-3 6-3z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4l6 6-11 11H3v-6z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  };

  /* ---- shared bits -------------------------------------------------------- */
  const anim = (t, d) => `data-animate="${t}"${d != null ? ` style="transition-delay:${d}ms"` : ""}`;
  /* AI-generated media background layer (image or looping video + veil) */
  const mediaBg = (src, o = {}) => {
    const el = o.video
      ? `<video src="${src}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`
      : `<img src="${src}" alt="" loading="lazy" aria-hidden="true" />`;
    return `<div class="media-bg${o.cls ? ` ${o.cls}` : ""}">${el}</div>`;
  };
  const head = (s, opts = {}) =>
    `<div class="slide-head">
       ${s.eyebrow ? `<span class="eyebrow" ${anim("fade-right", 0)}>${s.eyebrow}</span>` : ""}
       <h2 class="stitle" ${anim("fade-up", s.eyebrow ? 90 : 0)}>${s.title}</h2>
       ${s.sub ? `<p class="ssub" ${anim("fade-up", 180)}>${s.sub}</p>` : ""}
     </div>`;
  const list = (b, from = 0, step = 90) =>
    `<ul class="bullets">${b.map((t, i) => `<li ${anim("fade-up", from + i * step)}>${t}</li>`).join("")}</ul>`;

  /* ---- gallery data (curated dept illustrations) -------------------------- */
  const GALLERY = [
    { f: "dept-nursing.png", l: "간호학과", c: "보건의료" },
    { f: "dept-physio.png", l: "물리치료과", c: "보건의료" },
    { f: "dept-dental.png", l: "치위생과", c: "보건의료" },
    { f: "dept-software.png", l: "소프트웨어융합과", c: "IT·반도체·기계" },
    { f: "dept-security.png", l: "사이버보안과", c: "IT·반도체·기계" },
    { f: "dept-semicon.png", l: "ICT반도체전자계열", c: "IT·반도체·기계" },
    { f: "dept-ecar.png", l: "스마트e-자동차과", c: "IT·반도체·기계" },
    { f: "dept-arch.png", l: "건축학과", c: "건축·생활" },
    { f: "dept-chem.png", l: "화장품화공계열", c: "건축·생활" },
    { f: "dept-visual.png", l: "시각영상디자인과", c: "디자인·콘텐츠" },
    { f: "dept-webtoon.png", l: "웹툰과", c: "디자인·콘텐츠" },
    { f: "dept-game.png", l: "게임애니메이션과", c: "디자인·콘텐츠" },
    { f: "dept-culinary.png", l: "글로벌외식조리과", c: "외식·뷰티·서비스" },
    { f: "dept-kbeauty.png", l: "K-뷰티과", c: "외식·뷰티·서비스" },
    { f: "dept-hair.png", l: "헤어디자인과", c: "외식·뷰티·서비스" },
    { f: "dept-pethealth.png", l: "반려동물보건과", c: "외식·뷰티·서비스" },
    { f: "dept-welfare.png", l: "사회복지학과", c: "복지·경영·국제" },
    { f: "dept-biz.png", l: "i-경영·회계계열", c: "복지·경영·국제" },
  ];

  /* =======================================================================
     LAYOUT RENDERERS
     ======================================================================= */
  const L = {
    /* 1. cover ------------------------------------------------------------ */
    cover: (s) => `
      <div class="cover">
        <div class="kicker" ${anim("fade-down", 0)}>TILON × UNIVERSITY</div>
        <h1 class="type-title" ${anim("fade-up", 120)}><span class="type-line en grad">AI Native Campus</span><br><span class="type-line">구축 시 기대효과</span></h1>
        <div class="lead" ${anim("fade-up", 320)}>VDI <span class="sep">·</span> GPU <span class="sep">·</span> Internal AI <span class="sep">·</span> Tstation <span class="sep">·</span> CBT 통합 기반</div>
        <div class="lead2" ${anim("fade-up", 420)}>미래를 선도하는 대학의 실행 인프라</div>
        <div class="cta" ${anim("fade-in", 640)}>
          <span class="scroll-hint"><span class="mouse"></span> 스크롤 또는 → 키로 시작하세요</span>
        </div>
      </div>`,

    /* 2 & 8. statement (eyebrow + big title + bullets + footer) ----------- */
    statement: (s) => `
      ${s.eyebrow ? `<span class="eyebrow" ${anim("fade-right", 0)}>${s.eyebrow}</span>` : ""}
      <h2 class="stitle" ${anim("fade-up", 100)}>${s.big}</h2>
      ${s.bullets ? list(s.bullets, 260, 110) : ""}
      ${s.footer ? `<p class="footnote" ${anim("fade-up", 260 + (s.bullets ? s.bullets.length : 0) * 110 + 120)}>${s.footer}</p>` : ""}`,

    /* 3. transform (Teaching AI -> Operating on AI) ---------------------- */
    transform: (s) => `
      ${head(s)}
      <div class="split" style="margin-top:4px;align-items:center;grid-template-columns:.85fr 1.15fr">
        <div>
          <div class="card" ${anim("fade-right", 200)} style="text-align:center">
            <div class="eyebrow" style="justify-content:center">TEACHING AI</div>
            <div style="font-size:clamp(17px,1.9vw,24px);font-weight:800;color:var(--muted)">AI를 <b style="color:#fff">가르치는</b> 대학</div>
            <div style="font-size:34px;color:var(--accent);margin:12px 0">↓</div>
            <div class="eyebrow" style="justify-content:center;color:var(--cyan)">OPERATING ON AI</div>
            <div style="font-size:clamp(17px,1.9vw,24px);font-weight:800">AI 인프라 <b class="hl">위에서 운영되는</b> 대학</div>
          </div>
          <div class="callout" ${anim("fade-up", 560)} style="margin-top:22px">
            <div class="big" style="font-size:clamp(15px,1.7vw,22px)">‘AI를 가르치는 대학’을 넘어<br><span class="hl">‘AI 인프라 위에서 모든 전공을 혁신하는 대학’</span>으로</div>
          </div>
        </div>
        <div class="side-visual side-visual--xl" ${anim("zoom-in", 320)}>
          <video class="fit-contain" src="assets/media/core-flow.mp4" autoplay muted loop playsinline preload="metadata" aria-label="VDI·GPU 코어에서 각 시스템으로 전류가 흐르는 통합 인프라 허브"></video>
          <div class="side-cap">VDI · GPU 코어에서 LMS · CBT · AI · 분석 · 운영으로 흐르는 데이터 전류</div>
        </div>
      </div>`,

    /* 4. quadrant (4 pillars) -------------------------------------------- */
    quadrant: (s) => `
      ${head(s)}
      <div class="quad">
        ${s.pillars.slice(0, 2).map((p, i) => pillar(p, 200 + i * 120)).join("")}
        <div class="core lift" ${anim("zoom-in", 160)}>AX Native<br>Campus Core</div>
        ${s.pillars.slice(2).map((p, i) => pillar(p, 440 + i * 120)).join("")}
      </div>
      ${s.footer ? `<p class="footnote plain" style="text-align:center;border:none;padding:0" ${anim("fade-up", 720)}>${s.footer}</p>` : ""}`,

    /* 5. flow (architecture layers, framed as one platform) --------------- */
    flow: (s) => `
      ${head(s)}
      <div class="flow-frame">
        <svg class="flow-frame__stroke" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
          <rect class="base" x="0.6" y="0.6" width="98.8" height="98.8" rx="3" ry="6" pathLength="100"/>
          <rect class="runner" x="0.6" y="0.6" width="98.8" height="98.8" rx="3" ry="6" pathLength="100"/>
        </svg>
        <span class="flow-frame__label">ONE PLATFORM · 한 몸으로 설계된 구조</span>
        <div class="flow">
          ${s.rows.map((r, i) => `
            <div class="flow-row" ${anim("fade-right", 200 + i * 130)}>
              <div><h3>${r.title}</h3><p>${r.desc}</p></div>
              <div class="flow-tags">${r.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
            </div>`).join("")}
        </div>
      </div>`,

    /* 6 & 18-20. table --------------------------------------------------- */
    table: (s) => `
      ${head(s)}
      <div class="table-wrap" ${anim("fade-up", 200)}>
        <table class="tbl">
          <thead><tr>${s.cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>${s.rows.map((r) => `<tr>${r.map((c, i) =>
            `<td class="${i === 1 ? "sol" : i === s.cols.length - 1 && s.rvLast ? "rv" : ""}">${c}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
      ${s.footer ? `<p class="footnote" ${anim("fade-up", 360)}>${s.footer}</p>` : ""}`,

    /* 7. index columns (5 혁신지수) -------------------------------------- */
    index5: (s) => `
      ${head(s)}
      <div class="idx5">
        ${s.items.map((it, i) => `
          <div class="idx-card" ${anim("fade-up", 200 + i * 100)}>
            <div class="ic">${I[it.icon]}</div>
            <h3>${it.title}</h3>
            <div class="bar-mini" style="margin-top:14px"><i style="--w:${it.w}%;transition-delay:${350 + i * 160}ms"></i></div>
            <p>${it.desc}</p>
          </div>`).join("")}
      </div>`,

    /* 8 handled by statement */

    /* 9. kedi columns ---------------------------------------------------- */
    kedi: (s) => `
      ${head(s)}
      <div class="split">
        <div>
          ${list(s.bullets, 220, 110)}
          <p class="footnote" ${anim("fade-up", 560)}>${s.note}</p>
        </div>
        <div>
          <div class="callout" style="margin:0 0 26px" ${anim("fade-up", 300)}>
            <div class="big"><span class="hl">디지털 버추얼 캠퍼스 전환</span>으로<br>PC사양 <span class="hl-gold">90.0점 이상</span> 달성</div>
          </div>
          <div class="cols3" ${anim("fade-up", 420)}>
            <div class="col-bar c1"><div class="fillv" style="--h:72.6%"><span class="v">72.6</span></div><div class="cap">수도권<small>대학생 PC 평균</small></div></div>
            <div class="col-bar c2"><div class="fillv" style="--h:65.3%"><span class="v">65.3</span></div><div class="cap">비수도권<small>대학생 PC 평균</small></div></div>
            <div class="col-bar c3"><div class="fillv" style="--h:100%"><span class="v">90.0</span></div><div class="cap">VDI 도입대학<small>전환 후 목표</small></div></div>
          </div>
          <p class="gal-note" style="margin-top:14px">출처: 한국교육개발원(KEDI) 2023 ‘대학생 IT학습 환경 실태조사’ (최신PC=100)</p>
        </div>
      </div>`,

    /* 10. gallery (전 학과 X+AI) — seamless auto-flow marquee ------------- */
    gallery: (s) => {
      const cards = GALLERY.map((g) => `
        <figure class="gal-card">
          <img src="assets/img/${g.f}" alt="${g.l}" loading="lazy" />
          <span class="cat">${g.c}</span>
          <figcaption class="cap">${g.l}</figcaption>
        </figure>`).join("");
      return `
      ${head(s)}
      ${list(s.bullets, 200, 110)}
      <div class="gallery" ${anim("fade-up", 380)}>
        <div class="gal-marquee">
          <div class="gal-track">${cards}${cards}</div>
        </div>
        <p class="gal-note">학과 이미지가 자동으로 흐릅니다 · 마우스를 올리면 일시정지 — 35개 전 학과·계열 맞춤형 X+AI 실습 설계</p>
      </div>`;
    },

    /* 11. split bullets + illustration ----------------------------------- */
    career: (s) => `
      ${head(s)}
      <div class="split">
        <div>
          ${list(s.bullets, 220, 100)}
        </div>
        <div class="visual" style="align-self:start">
          <div class="card career-card" ${anim("fade-left", 300)} style="text-align:center;width:100%">
            <video class="career-shot" src="assets/media/career-live.mp4" autoplay muted loop playsinline preload="metadata" aria-label="VDI 업무환경에서 근무하는 졸업생"></video>
            <div class="eyebrow" style="justify-content:center">4학년 취업준비 C학생 사례</div>
            <div class="grid g-2" style="margin:8px 0 0">
              <div class="tag" style="justify-content:center">VDI 업무환경 선행학습</div>
              <div class="tag" style="justify-content:center">클라우드PC 창업지원</div>
            </div>
            <div class="callout" style="margin-top:12px">
              <div class="big">채용서류에<br><span class="hl">“디지털 스마트 업무환경 숙련”</span><br>자신있게 기재</div>
              <div class="small">2,260여 개 협력업체 산학연계 취업 강점과 결합</div>
            </div>
          </div>
        </div>
      </div>`,

    /* 12. hub (virtual hub) ---------------------------------------------- */
    hub: (s) => `
      ${head(s)}
      <div class="hub">
        <div>
          <p class="ssub" ${anim("fade-right", 200)}>${s.lead}</p>
          ${list(s.bullets, 320, 110)}
        </div>
        <div class="side-visual" ${anim("zoom-in", 360)}>
          <video src="assets/media/global-reach.mp4" autoplay muted loop playsinline preload="metadata" aria-label="한국에서 전 세계로 뻗어나가는 글로벌 네트워크"></video>
          <div class="side-legend">
            <div ${anim("fade-up", 520)}><b>해외 유학생</b>가상 랩(Lab) 원격 학사과정 · ‘스터디 코리아 300K’ 선제 대응</div>
            <div ${anim("fade-up", 620)}><b>성인학습자</b>장소 제약 해소로 학령인구 감소 대응</div>
            <div ${anim("fade-up", 720)}><b>재직자</b>설치 없이 접속하는 실습환경 · 지역사회 교육 거점</div>
          </div>
        </div>
      </div>`,

    /* 13. talent (map stats + 6-track) ----------------------------------- */
    talent: (s) => `
      ${head(s)}
      <div class="talent">
        <div class="stat-list">
          <div class="tstat" ${anim("fade-right", 220)}><div class="n">최소 <span class="hl-gold">58만 명</span> 부족</div><div class="t">2025~2029년 전문인력 (정부 전망)</div></div>
          <div class="tstat" ${anim("fade-right", 340)}><div class="n">AI <span class="hl-gold">12,800명</span> 부족</div><div class="t">2027년 기준</div></div>
          <div class="tstat" ${anim("fade-right", 460)}><div class="n">클라우드 <span class="hl-gold">18,800명</span> 부족</div><div class="t">신기술 전문인력</div></div>
          <div class="callout" style="margin-top:8px" ${anim("fade-up", 560)}>
            <div class="big" style="font-size:clamp(16px,1.9vw,26px)">클라우드와 AI 기반 교육환경에서 실무 역량 향상으로<br><span class="hl">거대한 인력 공백을 채우는 핵심 인재</span>로 성장 가능</div>
            <div class="small">AID 기반 스마트 교육 인프라로 클라우드 전문 인력 양성 촉진</div>
          </div>
        </div>
        <div class="side-visual" ${anim("zoom-in", 400)}>
          <video class="fit-contain" src="assets/media/talent-live.mp4" autoplay muted loop playsinline preload="metadata" aria-label="GPU 가속 VDI 기반 신기술 인재 양성"></video>
          <div class="track-chips" ${anim("fade-up", 560)}>
            <span>모빌리티</span><span>반도체</span><span>로봇</span>
            <span>ABB</span><span>헬스케어</span><span>도심형서비스</span>
          </div>
          <div class="side-cap">6-Track · GPU 가속 VDI 기반 실무형 인력 양성</div>
        </div>
      </div>`,

    /* 14. donuts (62 / 86) ----------------------------------------------- */
    donuts2: (s) => `
      ${head(s)}
      <div class="donuts g-2" style="margin-top:10px">
        ${s.items.map((d, i) => `
          <div class="donut" ${anim("zoom-in", 240 + i * 160)}>
            <div class="ring" data-p="${d.p}" style="--dc:${d.color || "var(--accent)"}"><span class="pct">${d.p}%</span></div>
            <div class="cap">${d.cap}</div>
          </div>`).join("")}
      </div>
      <div class="callout" ${anim("fade-up", 620)}>
        <div class="big">검증된 <span class="hl">교육 경쟁력</span>에 디지털 혁신을 결합</div>
        <div class="small">"세계 명문 62%의 선택 — 최고 수준의 AI Native Campus 선점"</div>
      </div>
      <div class="brand-quotes" ${anim("fade-up", 780)}>
        <p>“우리 대학은 전 학과에서 AI·VDI 실습환경을 제공합니다.”</p>
        <p>“학생 개인 장비가 아니라 대학 인프라가 실습 품질을 보장합니다.”</p>
        <p class="bq-note">Z세대와 알파세대가 선호하는 미래형 대학 이미지로 이어질 수 있습니다.</p>
      </div>`,

    /* 15. efficiency ----------------------------------------------------- */
    efficiency: (s) => `
      ${head(s)}
      <video class="eff-banner eff-banner--tall" src="assets/media/central-live.mp4" autoplay muted loop playsinline preload="metadata" aria-label="각 학과 전산실이 하나의 중앙 관제로 통합" ${anim("fade-up", 180)}></video>
      <p class="ssub" style="text-align:center;max-width:none;margin:0 auto 26px" ${anim("fade-up", 320)}>각 학과 전산실을 하나의 중앙 관제 화면으로 통합 · 하드웨어 업그레이드/보안 패치 중앙 통제 · <b class="hl">부서별 전산관리자 불필요</b></p>
      <div class="badges3">
        ${[["25% 절감", "LG전자 (2023)"], ["15% 절감", "삼성전자 (2021)"], ["20% 절감", "한국전력공사 (2022)"]].map(([n, c], i) => `
          <div class="badge-save" ${anim("fade-up", 420 + i * 110)}><div class="b-n">${n}</div><div class="b-c">${c}</div></div>`).join("")}
      </div>
      <p class="footnote plain" style="text-align:center;border:none;padding:0" ${anim("fade-up", 780)}>도입 기관 사례 기준 — 전체 운영비용 약 20% 절감 예상</p>`,

    /* 16 & 28. divider --------------------------------------------------- */
    divider: (s) => `
      <div class="divider">
        ${s.chapter ? `<div class="chapter" ${anim("zoom-in", 100)}>${s.chapter}</div>` : ""}
        <h2 ${anim("fade-up", 220)}>${s.big}</h2>
        <div class="rule" ${anim("fade-in", 420)}></div>
        ${s.sub ? `<p class="sub" ${anim("fade-up", 520)}>${s.sub}</p>` : ""}
      </div>`,

    /* 17. category cards ------------------------------------------------- */
    categories: (s) => `
      ${head(s)}
      <div class="split" style="grid-template-columns:1fr auto;align-items:start">
        <div class="cats">
          ${s.cats.map((c, i) => `
            <div class="cat-row" ${anim("fade-right", 200 + i * 90)}>
              <div class="ci" style="background:${c.color}">${I[c.icon]}</div>
              <div><h3>${c.title}</h3><p>${c.depts}</p></div>
            </div>`).join("")}
        </div>
        <div class="callout" style="margin:0;align-self:start" ${anim("zoom-in", 260)}>
          <div class="big" style="font-size:clamp(40px,6vw,88px);color:var(--accent)">35개</div>
          <div class="small">학과 · 계열</div>
        </div>
      </div>`,

    /* 21. cycle ---------------------------------------------------------- */
    cycle: (s) => `
      ${head(s)}
      <div class="split">
        <div class="cycle" ${anim("zoom-in", 300)}>
          <svg class="cycle-orbit" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <marker id="cycArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" fill="#38bdf8"/>
              </marker>
            </defs>
            <g class="orbit-rot">
              <path d="M 50 11 A 39 39 0 0 1 88.4 43.2" fill="none" stroke="#38bdf8" stroke-width="0.9" stroke-linecap="round" marker-end="url(#cycArrow)"/>
            </g>
          </svg>
          <div class="cycle-center">Data-Driven<br>Education</div>
          ${s.nodes.map((n, i) => `
            <div class="cycle-node p${i}">
              <div class="cn-ic">${I[n.icon]}</div>
              <h4>${n.title}</h4><span class="prod">${n.prod}</span>
              <p>${n.desc}</p>
            </div>`).join("")}
        </div>
        <div>
          <p class="ssub" ${anim("fade-left", 260)}>강의 설계 → 실습 수행 → AI 활용 → 평가 운영 → 성과 분석이 하나의 루프로 연결됩니다.</p>
          <div class="callout" ${anim("fade-up", 420)}>
            <div class="big" style="font-size:clamp(16px,2vw,24px)"><span class="hl">Key Insight</span></div>
            <div class="small" style="font-size:clamp(14px,1.5vw,18px);color:#dbe6f5">교수학습 전 과정의 데이터화 · 학습 이력 축적 및 AID 성과지표 완벽 대응</div>
          </div>
        </div>
      </div>`,

    /* 22-25. timeline ---------------------------------------------------- */
    timeline: (s) => `
      ${head(s)}
      <div class="timeline" ${anim("fade-up", 220)}>
        <div class="tl-row" style="--n:${s.items.length}">
          ${s.items.map((t, i) => `
            <div class="tl-item" ${anim("fade-up", 260 + i * 130)}>
              <div class="tl-when"><span class="time">${t.time}</span><span class="place">${t.place}</span></div>
              <div><span class="prod-chip">${t.prod}</span></div>
              <h4>${t.head}</h4><p>${t.desc}</p>
            </div>`).join("")}
        </div>
      </div>
      ${s.ba ? `<div class="ba">
        <div class="b" ${anim("fade-right", 620)}><b>Before</b> · ${s.ba.b}</div>
        <div class="a" ${anim("fade-left", 620)}><b>After</b> · ${s.ba.a}</div>
      </div>` : ""}
      ${s.foot ? `<p class="tl-foot" ${anim("fade-up", 760)}>${s.foot}</p>` : ""}`,

    /* 26. compare bars (AS-IS / TO-BE) ----------------------------------- */
    compare: (s) => `
      ${head(s)}
      <div class="legend" ${anim("fade-up", 180)}>
        <span><i style="background:#61748e"></i>도입 전 (AS-IS)</span>
        <span><i style="background:var(--accent)"></i>도입 후 (TO-BE)</span>
      </div>
      <div class="bars">
        ${s.rows.map((r, i) => `
          <div ${anim("fade-up", 240 + i * 140)}>
            <div class="bar-row" style="margin-bottom:10px">
              <div class="lbl">${r.label}</div>
              <div class="bar-track"><div class="bar-fill f-muted" style="--w:${r.as.w}%;transition-delay:${300 + i * 240}ms">${r.as.t}</div></div>
            </div>
            <div class="bar-row">
              <div class="lbl"></div>
              <div class="bar-track"><div class="bar-fill f-accent" style="--w:${r.to.w}%;transition-delay:${480 + i * 240}ms">${r.to.t}</div></div>
            </div>
          </div>`).join("")}
      </div>
      <p class="footnote" ${anim("fade-up", 720)}>${s.note}</p>`,

    /* 27. values (6 cards) ----------------------------------------------- */
    values: (s) => `
      ${head(s)}
      <div class="vals">
        ${s.items.map((v, i) => `
          <div class="val-card" style="--vc:${v.color}" ${anim("fade-up", 200 + i * 90)}>
            <h3>${v.title}</h3>
            <ul>${v.points.map((p) => `<li>${p}</li>`).join("")}</ul>
          </div>`).join("")}
      </div>
      ${s.footer ? `<p class="footnote" style="text-align:center" ${anim("fade-up", 780)}>${s.footer}</p>` : ""}`,

    /* 29. survey (donuts row + note) ------------------------------------- */
    survey: (s) => `
      ${head(s)}
      <div class="donuts g-4" style="grid-template-columns:repeat(${s.items.length},1fr)">
        ${s.items.map((d, i) => `
          <div class="donut" ${anim("zoom-in", 220 + i * 130)}>
            <div class="ring" data-p="${d.p}" style="--sz:clamp(120px,13vw,180px);--dc:${d.color || "var(--accent)"}"><span class="pct" style="font-size:clamp(22px,2.6vw,38px)">${d.p}%</span></div>
            <div class="cap">${d.cap}</div>
          </div>`).join("")}
      </div>
      ${s.footer ? `<p class="footnote plain" style="text-align:center;border:none;padding:0" ${anim("fade-up", 720)}>${s.footer}</p>` : ""}`,

    /* 9. bootcamp (video showcase → text reveal) --------------------------- */
    bootcamp: (s) => `
      <div class="bc-hero" aria-hidden="true"><div class="bc-hero__t">전교생이 만드는<br><span class="grad">'AI 캡스톤 캠퍼스'</span></div></div>
      <div class="slide-head">
        <span class="eyebrow" ${anim("fade-right", 5600)}>${s.eyebrow}</span>
        <h2 class="stitle" ${anim("fade-up", 5750)}>${s.title}</h2>
        <p class="ssub" ${anim("fade-up", 5900)} style="max-width:72ch">${s.sub}</p>
      </div>
      <div class="bc-grid">
        <div class="bc-card" ${anim("fade-up", 6080)}>
          <h3><span class="bc-n">①</span> 전교생 대상 AI 캡스톤 개최 기반 확보</h3>
          <ul>
            <li>iStation이 제공하는 각종 API(AI 모델 호출 · 데이터 처리 · 가상 개발환경)를 활용해 <b>전공 구분 없이 전체 학생이 참여</b>하는 AI 캡스톤 프로젝트 운영</li>
            <li>드론·로봇·피지컬AI(공학계열), 금융·경영(상경계열) 등 <b>5대 분야별 AI 소프트웨어 개발 트랙</b> 구성 — 비전공자도 초급→중·고급 단계별 진입 가능</li>
          </ul>
        </div>
        <div class="bc-card" ${anim("fade-up", 6260)}>
          <h3><span class="bc-n">②</span> 틸론 최고 엔지니어의 현장 파견 지원</h3>
          <ul>
            <li>AI SW 개발 전 과정에 <b>틸론 최정예 개발자가 파견</b>되어 설계·코드리뷰·기술 멘토링 수행</li>
            <li>기업 현직 개발자와의 <b>협업 경험 자체가 포트폴리오</b>이자 인적 네트워크로 축적</li>
          </ul>
        </div>
      </div>
      <div class="callout bc-effect" ${anim("fade-up", 6440)}>
        <div class="eyebrow" style="justify-content:center">③ 기대효과</div>
        <div class="big" style="font-size:clamp(15px,1.75vw,23px)">"전교생 AI 실무역량 + 산학 공동 교육실적 + 정부 재정지원사업 수주 경쟁력 + 취업연계형 포트폴리오"</div>
        <div class="small">지역 AI 인재양성 거점대학으로의 포지셔닝</div>
      </div>`,

    /* scenes: full-bleed video + caption (AI Native Campus Life) ---------- */
    scene: (s) => `
      <div class="scene-cap">
        <span class="scene-tag" ${anim("fade-right", 400)}>${s.tag}</span>
        ${s.prod ? `<h2 class="scene-t" ${anim("fade-up", 600)}>${s.prod}</h2>` : ""}
        <p class="scene-d" ${anim("fade-up", 800)}>${s.desc}</p>
      </div>`,

    /* 31. finale (mascot growth video) ------------------------------------ */
    finale: (s) => `
      ${head(s)}
      ${s.video ? `<div class="finale" ${anim("zoom-in", 240)}>
        <video class="finale-video" src="${s.video}" autoplay muted loop playsinline preload="metadata"></video>
      </div>` : ""}
      ${s.footer ? `<p class="footnote plain" style="text-align:center;border:none;padding:0" ${anim("fade-up", 560)}>${s.footer}</p>` : ""}`,

    /* 55. filmreel (8-cut sequential mascot movie, full-bleed) ------------ */
    filmreel: () => "",

    /* 30. distribution (single donut + list) ----------------------------- */
    distribution: (s) => `
      ${head(s)}
      <div class="split">
        <div class="donut" ${anim("zoom-in", 260)}>
          <div class="ring" data-p="${s.main.p}" style="--sz:clamp(180px,22vw,280px)"><span class="pct" style="font-size:clamp(40px,5vw,66px)">${s.main.p}%</span></div>
          <div class="cap" style="max-width:32ch">${s.main.cap}</div>
        </div>
        <div>
          <p class="ssub" ${anim("fade-left", 300)}>${s.lead}</p>
          <div class="bars" style="margin-top:24px">
            ${s.dist.map((d, i) => `
              <div class="bar-row" ${anim("fade-up", 380 + i * 100)}>
                <div class="lbl" style="font-size:14px">${d.label}</div>
                <div class="bar-track" style="height:34px"><div class="bar-fill f-cyan" style="--w:${d.w}%">${d.w}%</div></div>
              </div>`).join("")}
          </div>
        </div>
      </div>`,
  };

  function pillar(p, d) {
    return `<div class="pillar lift-2" style="--pc:${p.color}" ${anim("fade-up", d)}>
      <h3>${p.title}</h3><div class="prod">${p.prod}</div><div class="desc">${p.desc}</div></div>`;
  }

  /* =======================================================================
     SLIDE DATA — all 30 pages
     ======================================================================= */
  const SLIDES = [
    { id: "slide-1", title: "Opening", effect: "parallax", layout: "cover",
      bg: () => mediaBg("assets/media/hero-campus.mp4", { video: true, cls: "media-bg--strong" }) + '<div class="cover-orb"></div>' },

    { id: "slide-2", title: "종합 제안", effect: "fade", layout: "statement",
      bg: () => mediaBg("assets/media/bg-vision.mp4", { video: true }),
      eyebrow: "AI Native Campus 종합 제안",
      big: "대학의 비전,<br><span class='grad'>틸론이 완성하는 인프라</span>",
      bullets: [
        "“AI-Native 실무역량으로 산업을 혁신하는 <b>X+AI 교육혁신 선도대학</b>” 비전 완성",
        "“실력을 넘어 학생의 미래를 여는 대학” 슬로건의 <b>기술적 실현</b>",
        "<b>3A</b>(Anyone, Anytime, Anywhere), 디지털·페이퍼리스 교육환경 구현",
        "강의와 실습, 평가, 행정, 산학협력을 <b>하나의 플랫폼</b>으로 연결하는 것",
        "대학의 <b>디지털 전환(DX) 표준 모델</b> 확립",
      ],
      footer: "틸론과 함께, 우리 대학만의 AI Native Campus를 완성합니다." },

    { id: "slide-3", title: "제안의 핵심", effect: "zoom", layout: "transform", wide: true,
      bg: () => '<div class="darkveil-wrap"><canvas class="darkveil-canvas"></canvas></div>',
      title2: true, eyebrow: "The Core Proposal",
      title: "AI 도입은 솔루션이 아니라 <span class='hl'>인프라</span>입니다",
      sub: "VDI와 GPU를 캠퍼스의 심장에 두고, LMS · AI 플랫폼 · CBT · 학사 서비스 · 학습 분석 · 연구 데이터가 하나의 운영체계로 연결 — 이 구조가 갖춰질 때 비로소 일부 학과가 아닌 <b class='hl'>전 학과의 AX</b>가 가능합니다." },

    { id: "slide-4", title: "4 Pillars", effect: "tilt3d", layout: "quadrant", wide: true,
      eyebrow: "4 Pillars of AX Native Campus",
      title: "4개의 기둥으로 세우는 캠퍼스",
      sub: "개별 제품이 아니라 “대학 AX Native Campus 구축 패키지”로 제안합니다.",
      pillars: [
        { title: "차별 없는 실습", color: "var(--cyan)", prod: "DstationX Enterprise · Estation 3.0", desc: "PC 성능 및 장소의 제약 완벽 해소" },
        { title: "전 학과 X+AI", color: "var(--accent)", prod: "iStation Professional · Tstation · CenterBridge", desc: "전공 데이터 기반의 맞춤형 AI 실습 인프라" },
        { title: "디지털 교수학습 플랫폼", color: "var(--gold)", prod: "CAS · TAS · CenterFace · Station", desc: "CBT·LMS·대시보드 연계를 통한 평가 데이터화" },
        { title: "보안형 스마트 캠퍼스", color: "var(--violet)", prod: "Twater · Rstation · Vstation · CenterVista", desc: "중앙저장·워터마크·MFA를 통한 완벽한 통제" },
      ],
      footer: "핵심은 AX Native Campus를 구성하는 네 가지 축이 개별이 아닌 <b class='hl'>하나의 플랫폼</b>으로 운영되는 AI 캠퍼스 운영체계를 만들어 가는 것입니다." },

    { id: "slide-5", title: "Solution Architecture", effect: "fade", layout: "flow",
      bg: () => mediaBg("assets/media/bg-vision-net.mp4", { video: true, cls: "media-bg--faint" }),
      eyebrow: "TILON Solution Architecture",
      title: "개별 제품이 아닌 ‘구축 패키지’",
      sub: "대학 AX Native Campus를 구성하는 4개 계층.",
      rows: [
        { title: "디지털 교수학습 플랫폼", desc: "강의·실습·과제·시험 통합 운영", tags: ["CAS", "TAS", "CenterFace", "Station"] },
        { title: "AI Native 교육 인프라", desc: "전 학과 X+AI 실습 · Internal AI", tags: ["iStation", "Tstation", "CenterBridge", "CenterVista"] },
        { title: "차별 없는 실습 인프라", desc: "고성능 동일 실습환경", tags: ["DstationX", "Estation 3.0"] },
        { title: "보안 · 운영 · 관리 체계", desc: "민감정보 보호 · 원격지원 · 대학 맞춤 최적화", tags: ["Twater", "Rstation", "Vstation"] },
      ] },

    { id: "slide-7", title: "5대 혁신지수", effect: "fade", layout: "index5", wide: true,
      bg: () => mediaBg("assets/media/bg-arrows.mp4", { video: true, cls: "media-bg--faint" }),
      eyebrow: "Innovation Index", title: "5대 혁신지수 달성 및 환류 고도화",
      items: [
        { icon: "grad", title: "교육품질혁신지수", w: 88, desc: "수업별 표준 실습환경 보장, AI·GPU 접근성 확보, 학습성과 데이터 정량 관리" },
        { icon: "doc", title: "학생교육혁신지수", w: 84, desc: "개인 맞춤형 디지털 학습경로 제공 및 포트폴리오 축적을 통한 만족도 강화" },
        { icon: "handshake", title: "산학협력혁신지수", w: 90, desc: "기업 멘토·교수·학생이 동일 가상환경에서 접속하는 공동 프로젝트 허브" },
        { icon: "globe", title: "글로벌혁신지수", w: 82, desc: "해외 접속형 강의·평가 운영, 외국인 유학생 유치 및 글로벌 공동교육 확대" },
        { icon: "gear", title: "대학체계혁신지수", w: 92, desc: "VDI·GPU·CBT 사용현황 통합 대시보드로 데이터 기반 의사결정 체계 전환" },
      ] },

    { id: "slide-effects", title: "CHAPTER — 도입효과", effect: "curtain", layout: "divider",
      bg: () => mediaBg("assets/media/divider-effects.mp4", { video: true, cls: "media-bg--strong" }),
      chapter: "02", big: "AX Native Campus 도입효과",
      sub: "AI 캡스톤 캠퍼스부터 운영 효율·ESG까지 — 9가지 관점에서 살펴보는 대학의 변화", curtain: true },

    { id: "slide-bootcamp", title: "AI 부트캠프", effect: "fade", layout: "bootcamp", wide: true,
      bg: () => mediaBg("assets/media/bg-capstone.mp4", { video: true, cls: "media-bg--showcase" }),
      eyebrow: "AI Bootcamp — Capstone Campus",
      title: "AI 부트캠프 운영 — 전교생이 만드는 <span class='hl'>'AI 캡스톤 캠퍼스'</span>",
      sub: "iStation의 개방형 API 위에서 전 학과 학생이 드론·로봇·피지컬AI·금융·경영 AI 소프트웨어를 직접 개발하고, 틸론 최정예 엔지니어가 현장에 상주 멘토링하는 실전형 AI 인재양성 체계를 완성합니다." },

    { id: "slide-9", title: "차별없는 교육환경", effect: "zoom", layout: "kedi", wide: true,
      eyebrow: "Equal Access", title: "차별없는 디지털 교육환경",
      bullets: [
        "개인 PC·실습실·고가 SW <b>접근성 격차 해소</b>",
        "학생 장비 격차를 <b>교육 성과 격차로 만들지 않는</b> 캠퍼스",
        "학과·강의·커리큘럼별 특성에 맞는 클라우드PC <small>(Standard PC · Workstation · GPU)</small>",
      ],
      note: "학습 환경에 공정하고 우수한 IT자원 배분으로 학업 성취률 향상" },

    { id: "slide-11", title: "취업·창업 경쟁력", effect: "fade", layout: "career", wide: true,
      eyebrow: "Career & Startup", title: "취업·창업 경쟁력 강화", sub: "실무 경험으로 입사하는 4년",
      bullets: [
        "<b>(취업)</b> 국내 대기업·공공기관 대부분 VDI 업무환경 운영 — 근무환경을 교내에서 선행학습",
        "<b>(창업)</b> 창업동아리·창업 시 클라우드PC 지원으로 초기 투자비용 절감",
        "재학 중 동일 환경 선행 경험으로 입사 후 <b>적응기간 단축</b>",
        "폭넓은 산학 협력 네트워크 기반 <b>산학연계 취업 강점</b> 결합",
      ] },

    { id: "slide-12", title: "글로벌·평생교육", effect: "tilt3d", layout: "hub", wide: true,
      eyebrow: "Global & Lifelong", title: "글로벌 및 평생교육 확장 영역",
      lead: "언제 어디서나 접속 가능한, 장소 제약 없는 학습 환경",
      bullets: [
        "해외 유학생, 성인학습자, 재직자도 <b>동일한 가상 실습환경</b>으로 원격 실습형 교육 참여",
        "해외 학생은 <b>입국 전부터 사전교육</b>을 받을 수 있음",
        "재직자는 직장을 유지하면서 원격으로 <b>AI·DX 직무전환 교육</b> 참여",
        "대학은 이를 통해 학령인구 감소에 대응하고, <b>지역사회 AI 평생학습 거점</b>으로서 역할 강화",
      ] },

    { id: "slide-13", title: "신기술 인재 거점", effect: "zoom", layout: "talent", wide: true,
      eyebrow: "National Talent Hub", title: "국가적 신기술 인재 부족 해소의 거점",
      sub: "비어 있는 신기술 일자리를 채우는 대학, 나아가 <b class='hl'>국가 신기술 인재 공급 거점</b>으로 자리매김" },

    { id: "slide-14", title: "세계 명문의 선택", effect: "zoom", layout: "donuts2", wide: true,
      eyebrow: "The Choice of World-Class", title: "세계 명문의 선택, 미래혁신 위상 제고",
      items: [
        { p: 62, color: "var(--accent)", cap: "2023년 기준 세계 <b>Top 100 대학</b> 중 VDI 도입률" },
        { p: 86, color: "var(--cyan)", cap: "2023년 기준 세계 <b>Top 100 기업</b> 중 VDI 사용률" },
      ] },

    { id: "slide-15", title: "운영 효율 & ESG", effect: "fade", layout: "efficiency", wide: true,
      eyebrow: "Operational Efficiency & ESG", title: "운영 효율성 및 친환경 캠퍼스" },

    { id: "slide-8", title: "AI Native Campus 구현", effect: "curtain", layout: "statement",
      bg: () => mediaBg("assets/media/bg-ainative.mp4", { video: true }),
      eyebrow: "AI Native Campus 구현",
      big: "“AI를 가르치는 대학”에서<br><span class='grad'>“AI 위에서 운영되는 대학”</span>으로",
      bullets: [
        "교육·실습·평가·행정·산학협력을 <b>AI 기반으로 연결</b>하는 대학 운영체계 전환",
        "단일 솔루션 도입이 아닌, 캠퍼스 전체의 <b>운영 패러다임 전환</b>",
      ],
      curtain: true },

    { id: "slide-21", title: "교육 운영 루프", effect: "tilt3d", layout: "cycle", wide: true,
      eyebrow: "Data-Driven Loop", title: "강의·실습·과제·시험이 하나로 연결되는 AI 교육 운영 루프",
      nodes: [
        { icon: "pen", title: "강의 설계", prod: "CAS", desc: "자료/주차/과제 등록" },
        { icon: "monitor", title: "실습 수행", prod: "DstationX / Estation", desc: "표준 실습환경 배포" },
        { icon: "ai", title: "AI 활용", prod: "iStation / Tstation", desc: "전공 특화 AI 프로젝트" },
        { icon: "check", title: "평가 운영", prod: "TAS", desc: "CBT/IBT 자동채점·공정 평가" },
        { icon: "chart", title: "성과 분석", prod: "CenterVista", desc: "학습·AI 사용 Dashboard" },
      ] },

    { id: "scene-1", title: "Scene 1 — 8AM 통학버스", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-bus.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "8AM · 통학버스", prod: "Dstation 접속", desc: "태블릿으로 나의 가상 PC에 접속, 발표자료 작성" },

    { id: "scene-2", title: "Scene 2 — 9AM 강의실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-class.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "9AM · 강의실", prod: "CAS 통합 강의 플랫폼", desc: "강의자료·출석·과제·질의응답을 한 번에 확인" },

    { id: "scene-3", title: "Scene 3 — 10AM AI 실습실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-ailab.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "10AM · AI 실습실", prod: "Tstation 원클릭 실행", desc: "VSCode·Python·AI 프레임워크가 준비된 개발환경" },

    { id: "scene-4", title: "Scene 4 — 11AM 전공실습실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-cad.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "11AM · 전공실습실", prod: "Estation 엔지니어링 VDI", desc: "노후 노트북에서도 CAD·시뮬레이션 실습 가능" },

    { id: "scene-5", title: "Scene 5 — Before / After", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-ba.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "Before / After",
      desc: "<b>Before</b> | 실습실 PC와 개인 노트북 성능에 의존<br><b class='hl'>After</b> | 언제 어디서나 동일한 전공 실습환경 접속" },

    { id: "scene-6", title: "Scene 6 — 12PM 휴게공간", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-msg.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "12PM · 휴게공간", prod: "Station VDI 전용 메신저", desc: "교수 피드백과 팀 프로젝트 공지 확인" },

    { id: "scene-7", title: "Scene 7 — 1PM 프로젝트룸", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-ai.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "1PM · 프로젝트룸", prod: "iStation Internal AI", desc: "전공 데이터를 활용한 AI 실습 수행" },

    { id: "scene-8", title: "Scene 8 — 3PM CBT 시험실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-cbt.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "3PM · CBT 시험실", prod: "TAS 기반 CBT 평가", desc: "문제은행·자동저장·부정행위 방지·자동채점" },

    { id: "scene-9", title: "Scene 9 — 4PM 첨단강의실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-vs.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "4PM · 첨단강의실", prod: "Vstation 무선 발표", desc: "USB 없이 가상 데스크톱 결과물 바로 발표" },

    { id: "scene-10", title: "Scene 10 — 6PM 집·기숙사", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/scene-home.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "6PM · 집·기숙사", prod: "Dstation + Tstation", desc: "학교에서 작업하던 결과물을 그대로 이어서 작업" },

    { id: "scene-end", title: "AI Native Campus Life", effect: "zoom", layout: "scene",
      bg: () => mediaBg("assets/media/scene-end.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "AI Native Campus Life",
      prod: "캠퍼스는 특정 공간이 아니라,<br>졸업까지 이어지는 <span class='grad'>나만의 전공 클라우드 환경</span>",
      desc: "학생의 장비가 아닌, 학생의 역량이 실습 결과를 결정하는 캠퍼스" },

    { id: "slide-22", title: "학생의 하루 ①", effect: "parallax", layout: "timeline", wide: true,
      bg: () => mediaBg("assets/media/bg-student-am.mp4", { video: true, cls: "media-bg--faint" }),
      eyebrow: "05  Student Life — AM", title: "학생 라이프스타일 변화 ①",
      sub: "신입생의 오전 — 캠퍼스는 “장소”가 아니라 “접속 가능한 전공 실습환경”이 됩니다.",
      items: [
        { time: "8AM", place: "통학버스", prod: "DstationX", head: "버스 안에서 실습자료 리뷰", desc: "태블릿으로 가상 데스크톱 접속, 오늘 발표자료·실습파일 확인" },
        { time: "9AM", place: "강의실", prod: "CAS", head: "강의·출석·자료 확인", desc: "강의자료·과제·출석·질의응답이 하나의 플랫폼에서 진행" },
        { time: "10AM", place: "AI실습실", prod: "Tstation", head: "AI 개발환경 원클릭 실행", desc: "VSCode·Python·AI 프레임워크를 설정 없이 실습 시작" },
        { time: "11AM", place: "전공실습실", prod: "Estation", head: "GPU 기반 CAD·시뮬레이션", desc: "개인 노트북 성능과 무관하게 고성능 실습환경 사용" },
      ],
      ba: { b: "실습실 PC가 비어 있어야 하고, 내 노트북 성능이 좋아야 실습 가능", a: "언제 어디서나 동일한 전공 실습환경에 접속" } },

    { id: "slide-23", title: "학생의 하루 ②", effect: "fade", layout: "timeline", wide: true,
      bg: () => mediaBg("assets/media/bg-student-pm.mp4", { video: true, cls: "media-bg--faint" }),
      eyebrow: "06  Student Life — PM", title: "학생 라이프스타일 변화 ②",
      sub: "오후 — AI 활용, 팀 프로젝트, CBT 평가, 포트폴리오가 하나로 이어집니다.",
      items: [
        { time: "12PM", place: "휴게공간", prod: "Station", head: "팀 피드백·공지 확인", desc: "교수 피드백과 팀 프로젝트 이슈를 메신저 기반으로 확인" },
        { time: "1PM", place: "프로젝트룸", prod: "iStation", head: "전공 데이터 기반 AI 실습", desc: "기계·보건·관광·조리 등 전공 지식으로 Internal AI 활용" },
        { time: "3PM", place: "CBT시험실", prod: "TAS", head: "실습형 CBT·IBT 응시", desc: "문제은행·자동저장·부정행위 방지·자동채점으로 평가 공정성 강화" },
        { time: "4PM", place: "첨단강의실", prod: "Vstation", head: "팀 프로젝트 무선 발표", desc: "USB 없이 가상 데스크톱 산출물을 Paperless 방식으로 발표" },
      ],
      foot: "6PM · 집/기숙사 — <b class='hl'>DstationX + Tstation</b>으로 학교에서 작업하던 AI 코드·CAD·디자인 결과물을 그대로 이어서 작업. 캠퍼스는 “졸업까지 이어지는 나만의 전공 클라우드 환경”이 됩니다." },

    { id: "teach-1", title: "Teaching 1 — 8AM 연구실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-vista.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "8AM · 연구실", prod: "CenterVista", desc: "학생 접속 현황·AI 사용량·과제 진행률 확인" },

    { id: "teach-2", title: "Teaching 2 — 9AM 연구실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-cas.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "9AM · 연구실", prod: "CAS 통합 강의 플랫폼", desc: "수업자료·과제·평가 기준을 한 번에 준비" },

    { id: "teach-3", title: "Teaching 3 — 10AM 강의실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-deploy.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "10AM · 강의실", prod: "DstationX", desc: "수업별 표준 실습환경 즉시 배포" },

    { id: "teach-4", title: "Teaching 4 — 11AM AI 수업", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-gpu.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "11AM · AI 수업", prod: "Tstation + iStation", desc: "AI 개발환경과 GPU 자원을 학생·팀 단위로 배분" },

    { id: "teach-5", title: "Teaching 5 — Before / After", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-ba.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "Before / After",
      desc: "<b>Before</b> | PC 점검·SW 설치 오류·학생별 환경 차이 해결<br><b class='hl'>After</b> | 자동 배포·표준 실습환경·학생 피드백 집중" },

    { id: "teach-6", title: "Teaching 6 — 1PM 산학 원격수업", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-face.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "1PM · 산학 원격수업", prod: "CenterFace", desc: "지역 기업 전문가·졸업생과 실시간 멘토링" },

    { id: "teach-7", title: "Teaching 7 — 2PM 전공 실습실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-cad.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "2PM · 전공 실습실", prod: "Estation", desc: "CAD·3D·시뮬레이션·영상 실습 품질 표준화" },

    { id: "teach-8", title: "Teaching 8 — 3PM 평가실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-cbt.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "3PM · 평가실", prod: "TAS CBT 평가", desc: "문제은행·자동저장·자동채점 기반 공정평가" },

    { id: "teach-9", title: "Teaching 9 — 4PM 연구실", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-rpa.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "4PM · 연구실", prod: "iStation Internal AI", desc: "공문·엑셀을 AI가 자동으로 문서화 (RPA) · 수업 Q&A와 실습 매뉴얼을 AI 조교로 응대" },

    { id: "teach-10", title: "Teaching 10 — 5PM 원격지원·보안", effect: "fade", layout: "scene",
      bg: () => mediaBg("assets/media/teach-remote.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "5PM · 원격지원·보안관리", prod: "Rstation + Twater", desc: "학생 실습 오류 원격 확인, 시험·산학자료 보안 강화" },

    { id: "teach-end", title: "AI Native Teaching Life", effect: "zoom", layout: "scene",
      bg: () => mediaBg("assets/media/teach-end.mp4", { video: true, cls: "media-bg--scene" }),
      tag: "AI Native Teaching Life",
      prod: "교수님은 운영자가 아니라,<br><span class='grad'>AI 기반 수업 설계자이자 학생 성장 코치</span>",
      desc: "실습환경은 자동으로 배포되고, 교수님은 교육의 본질에 집중합니다." },

    { id: "slide-24", title: "교수의 하루 ①", effect: "fade", layout: "timeline", wide: true,
      bg: () => mediaBg("assets/media/bg-prof-am.mp4", { video: true, cls: "media-bg--faint" }),
      eyebrow: "07  Teaching Life — AM", title: "교수 라이프스타일 변화 ①",
      sub: "오전 — 실습실 관리에서 벗어나 수업 설계와 학습 데이터 기반 피드백에 집중합니다.",
      items: [
        { time: "8AM", place: "연구실", prod: "CenterVista", head: "수업·AI 사용 현황 확인", desc: "학생 접속·AI 사용량·과제 진행률을 Dashboard에서 파악" },
        { time: "9AM", place: "연구실", prod: "CAS", head: "강의·과제·평가 설계", desc: "수업자료·과제·평가 기준을 하나의 교육 플랫폼에서 준비" },
        { time: "10AM", place: "강의실", prod: "DstationX", head: "표준 실습환경 즉시 배포", desc: "학생 PC 버전·설치 오류 없이 수업별 가상PC 이미지 배포" },
        { time: "11AM", place: "AI수업", prod: "Tstation + iStation", head: "AI 실습수업 운영", desc: "AI 개발환경과 GPU 자원을 학생·팀 단위로 공정하게 배분" },
      ],
      ba: { b: "PC 상태 확인·SW 설치 오류·학생별 환경 차이 해결에 수업 시간 소모", a: "실습환경은 자동 배포, 교수님은 교육 설계와 피드백에 집중" } },

    { id: "slide-25", title: "교수의 하루 ②", effect: "fade", layout: "timeline", wide: true,
      bg: () => mediaBg("assets/media/bg-prof-pm.mp4", { video: true, cls: "media-bg--faint" }),
      eyebrow: "08  Teaching Life — PM", title: "교수 라이프스타일 변화 ②",
      sub: "오후 — 산학수업, CBT 평가, AI 조교, 원격지원까지 수업 운영이 데이터화됩니다.",
      items: [
        { time: "1PM", place: "산학회의", prod: "CenterFace", head: "기업·외부전문가 원격수업", desc: "지역 기업 전문가·졸업생이 실시간으로 강의·멘토링 참여" },
        { time: "2PM", place: "실습실", prod: "Estation", head: "고성능 전공 실습 운영", desc: "CAD·3D·시뮬레이션·영상 등 GPU 기반 실습 품질 표준화" },
        { time: "3PM", place: "평가실", prod: "TAS", head: "CBT 기반 실습평가", desc: "시험지 출력·수작업 채점을 문제은행·자동채점으로 전환" },
        { time: "4PM", place: "연구실", prod: "iStation", head: "전공 지식 기반 AI 조교", desc: "수업 Q&A와 실습 매뉴얼을 Internal AI로 응대·검색" },
      ],
      foot: "5PM · 원격지원 — <b class='hl'>Rstation</b>으로 학생 실습 오류를 직접 확인하고, <b class='hl'>Twater</b>로 시험·산학자료 보안까지 강화. 교수님은 “AI 기반 수업 설계자이자 학생 성장 코치”가 됩니다." },

    { id: "slide-26", title: "정량 기대효과", effect: "zoom", layout: "compare", wide: true,
      eyebrow: "Quantitative Impact", title: "도입 전후 정량적 기대효과 비교",
      rows: [
        { label: "GPU 서버 자원 활용률", as: { w: 15, t: "15%" }, to: { w: 90, t: "90% · 최적화 9배 향상" } },
        { label: "대학 IT 학습 환경 만족도", as: { w: 63, t: "63.5점" }, to: { w: 90, t: "90.0점 · 만족도 42% 향상" } },
        { label: "연간 유지보수 비용 절감", as: { w: 8, t: "" }, to: { w: 55, t: "중앙 관리화로 전산 유지비 25%+ 절감" } },
      ],
      note: "출처: 한국교육개발원(KEDI) 대학생 IT학습 환경 데이터 및 동사 내부 데이터 분석 기준" },

    { id: "slide-27", title: "6대 전략적 가치", effect: "fade", layout: "values", wide: true,
      eyebrow: "6 Strategic Values", title: "대학 경쟁력 강화를 위한 6대 전략적 가치",
      sub: "의사결정 관점에서 틸론 솔루션 도입은 교육혁신·운영효율·대학브랜드를 동시에 개선합니다.",
      items: [
        { title: "교육 경쟁력", color: "#e0455a", points: ["전 학과 X+AI 실습", "AI Native 실무인재 양성", "학생 포트폴리오 축적"] },
        { title: "교수학습 혁신", color: "var(--cyan)", points: ["강의·실습·과제·시험 통합", "CBT/IBT 공정평가", "AI 조교 기반 피드백"] },
        { title: "운영 효율", color: "var(--gold)", points: ["PC·SW·GPU 중앙관리", "원격 지원·자동 배포", "유지보수 비용 절감"] },
        { title: "보안 · 거버넌스", color: "var(--violet)", points: ["중앙 저장·화면 전송", "워터마크·MFA", "AI 사용량 Dashboard"] },
        { title: "정부사업 대응", color: "var(--accent)", points: ["정부재정지원사업 성과관리", "지역산업 연계 교육", "평생교육 확장"] },
        { title: "대학 브랜드", color: "#3f7fe0", points: ["AX 선도 대학 이미지", "글로벌 유학생·재직자 교육", "대학 연합 모델 주도"] },
      ],
      footer: "틸론 도입은 “전산 솔루션 구매”가 아니라 대학의 X+AI 교육혁신 비전을 매일 쓰이는 캠퍼스 인프라로 전환하는 의사결정입니다." },

    { id: "slide-31", title: "Growing with AI", effect: "zoom", layout: "finale", wide: true,
      bg: () => mediaBg("assets/media/bg-ainative.mp4", { video: true, cls: "media-bg--faint" }),
      eyebrow: "Epilogue", title: "AI와 함께 성장하는 <span class='hl'>대학교</span>",
      sub: "실력을 넘어 학생의 미래를 여는 대학 — 틸론이 그 성장의 인프라가 되겠습니다.",
      footer: "TILON × UNIVERSITY — AX Native Campus" },
  ];

  // attach index numbers
  SLIDES.forEach((s, i) => (s.num = i + 1));

  window.DECK = { SLIDES, LAYOUTS: L, GALLERY };
})();
