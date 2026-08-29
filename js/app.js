/* ============================================================
   الحَقني — ELHA'NI | Main App
   دليل خدمي مباشر: قسم ← قائمة عمال ← اتصال/واتساب فوري
   (بدون نظام طلبات، بدون أسعار، بدون وسيط)
   ============================================================ */
(function () {
  "use strict";

  var D = window.ELHANI_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var LS_JOINS = "elhani_join_requests_v1";
  var LS_JOIN_SEQ = "elhani_join_seq";

  /* ===== حالات العمال الحية (يتحكم فيها الأدمن فقط) =====
     active: نشط 🟢 | busy: مشغول 🔴 | inactive: غير نشط ⚫ */
  var LS_PSTATUS = "elhani_provider_status_v1";

  function loadPStatus() { try { return JSON.parse(localStorage.getItem(LS_PSTATUS) || "{}"); } catch (e) { return {}; } }
  function savePStatus(s) { localStorage.setItem(LS_PSTATUS, JSON.stringify(s)); }
  /* توافق مع نظام المفاتيح القديمة (switch) */
  function migrateOldProviderState() {
    if (localStorage.getItem(LS_PSTATUS)) return;
    try {
      var old = JSON.parse(localStorage.getItem("elhani_admin_providers_v1") || "{}");
      var keys = Object.keys(old);
      if (keys.length) {
        var map = {};
        keys.forEach(function (id) { map[id] = old[id] ? "active" : "inactive"; });
        savePStatus(map);
      }
    } catch (e) {}
  }
  function defaultStatusFor(p) { return p.isNew ? "active" : (p.active ? "active" : "inactive"); }
  function statusOf(p) {
    if (p.isDemo && p.demoStatus) return p.demoStatus; /* عرض بصري للتجريبيين — من غير لمس تخزين الإدارة */
    return loadPStatus()[p.id] || defaultStatusFor(p);
  }

  /* أرقام مصرية → صيغ الاتصال المباشر */
  function telHref(phone) { return "tel:+20" + String(phone || "").replace(/^0/, ""); }
  function waHref(phone) { return "https://wa.me/20" + String(phone || "").replace(/^0/, ""); }

  /* ---------------- Preloader ---------------- */
  function hidePreloader() {
    var p = $("#preloader");
    if (!p) return;
    p.classList.add("done");
    setTimeout(function () { p.style.display = "none"; }, 700);
  }
  window.addEventListener("load", function () { setTimeout(hidePreloader, 450); });
  setTimeout(hidePreloader, 3500); // safety net

  /* ---------------- Ripple on buttons ---------------- */
  document.addEventListener("pointerdown", function (e) {
    var btn = e.target.closest(".btn");
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var rip = document.createElement("span");
    var size = Math.max(rect.width, rect.height);
    rip.className = "ripple";
    rip.style.width = rip.style.height = size + "px";
    rip.style.left = (e.clientX - rect.left - size / 2) + "px";
    rip.style.top = (e.clientY - rect.top - size / 2) + "px";
    btn.appendChild(rip);
    setTimeout(function () { rip.remove(); }, 650);
  });

  /* ---------------- Navigation ---------------- */
  var nav = $("#nav");
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("nav--scrolled", y > 10);
    var top = $("#backTop");
    if (top) top.classList.toggle("show", y > 600);
    highlightNav();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  var burger = $("#burger");
  burger.addEventListener("click", function () { nav.classList.toggle("nav--open"); });
  $$(".mobile-menu a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("nav--open"); });
  });

  function highlightNav() {
    var links = $$(".nav__link");
    var pos = window.scrollY + 140;
    var current = null;
    ["hero", "services", "how", "providers", "join"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= pos) current = id;
    });
    links.forEach(function (l) {
      l.classList.toggle("active", l.getAttribute("href") === "#" + current);
    });
  }

  $("#backTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------------- Particles (gold & cyan dust) ---------------- */
  function initParticles() {
    var canvas = $("#particles");
    if (!canvas) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ctx = canvas.getContext ? canvas.getContext("2d") : null;
    if (!ctx) return;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [], running = true, W = 0, H = 0;

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var count = Math.min(70, Math.floor(W / 18));
      parts = [];
      for (var i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.7 + Math.random() * 1.9,
          vx: (Math.random() - 0.5) * 0.22,
          vy: -0.08 - Math.random() * 0.25,
          gold: Math.random() > 0.3,
          a: 0.25 + Math.random() * 0.5,
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    function tick(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.ph += 0.02;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
        if (p.x < -6) p.x = W + 6;
        if (p.x > W + 6) p.x = -6;
        var alpha = p.a * (0.65 + 0.35 * Math.sin(p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? "rgba(212,175,55," + alpha + ")" : "rgba(0,229,255," + alpha + ")";
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(tick);
    });

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(tick);
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (en.isIntersecting) {
          en.target.style.transitionDelay = (i % 4) * 90 + "ms";
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- Animated counters ---------------- */
  function initCounters() {
    var els = $$(".cnt");
    var seen = false;
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var dur = 1700, t0 = null;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { els.forEach(animate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen) { seen = true; els.forEach(animate); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    var wrap = $("#stats");
    if (wrap) io.observe(wrap);
  }

  /* ---------------- Ticker ---------------- */
  function initTicker() {
    var track = $("#tickerTrack");
    if (!track) return;
    var html = D.ticker.map(function (t) {
      return '<div class="ticker__item"><span class="live"></span>' + t + "</div>";
    }).join("");
    track.innerHTML = html + html; // seamless loop
  }

  /* ---------------- التنقل المباشر: قسم ← قائمة العمال ---------------- */
  function gotoCategory(catId) {
    $$("#filterChips .chip").forEach(function (x) {
      x.classList.toggle("active", x.getAttribute("data-filter") === catId);
    });
    state.cat = catId;
    state.availOnly = false;
    var ac = $("#availChip");
    if (ac) ac.classList.remove("active");
    applyFilters();
    var sec = document.getElementById("providers");
    if (sec && sec.scrollIntoView) try { sec.scrollIntoView({ behavior: "smooth" }); } catch (e) {}
  }

  /* ---------------- Render: الأقسام الرئيسية ---------------- */
  function renderServices() {
    var grid = $("#svcGrid");
    if (!grid) return;
    grid.innerHTML = D.categories.map(function (c, i) {
      return (
        '<article class="svc-card gold-frame reveal" data-goto-cat="' + c.id + '" role="link" tabindex="0" aria-label="عرض عمال قسم ' + c.name + '">' +
        '  <div class="svc-card__media">' +
        '    <img src="' + c.img + '" alt="' + c.name + '" loading="lazy">' +
        '    <span class="svc-card__num">0' + (i + 1) + "</span>" +
        "  </div>" +
        '  <div class="svc-card__body">' +
        '    <h3 class="svc-card__title">' + c.icon + " " + c.name + "</h3>" +
        '    <p class="svc-card__desc">' + c.desc + "</p>" +
        '    <ul class="svc-card__list">' + c.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>" +
        '    <div class="svc-card__foot">' +
        '      <a class="svc-card__link" href="#providers" data-goto-cat="' + c.id + '">👷 عرض عمال القسم ←</a>' +
        "    </div>" +
        "  </div>" +
        "</article>"
      );
    }).join("");
  }

  /* ---------------- Join requests → admin-approved providers ---------------- */
  function loadJoins() {
    try { return JSON.parse(localStorage.getItem(LS_JOINS) || "[]"); } catch (e) { return []; }
  }
  function saveJoins(l) { localStorage.setItem(LS_JOINS, JSON.stringify(l)); }
  function nextJoinId() {
    var n = parseInt(localStorage.getItem(LS_JOIN_SEQ) || "503", 10) + 1;
    localStorage.setItem(LS_JOIN_SEQ, String(n));
    return "JN-" + n;
  }
  /* فقط الطلبات التي اعتمدها الأدمن تظهر على الدليل */
  function approvedProviders() {
    return loadJoins().filter(function (j) { return j.status === "approved"; }).map(function (j) {
      var c = catById(j.cat);
      return {
        id: j.id, name: j.name, emoji: c ? c.icon : "🛠️", cat: j.cat,
        sub: j.jobs ? j.jobs.split("•")[0].trim() : "مقدم خدمة",
        area: (j.city ? j.city + " — الشرقية" : "الشرقية"),
        badge: "new",
        jobs: j.jobs || "",
        phone: j.phone || "",
        wa: j.wa || j.phone || "",
        active: true, isNew: true
      };
    });
  }

  /* إزالة بيانات الانضمام الوهمية القديمة (JN-501 / JN-502) من متصفحات الزوار القدامى — مرة واحدة.
     مفيش أي بيانات وهمية بتتزرع بعد كده؛ الدليل بيتملى بالطلبات الحقيقية بس. */
  function purgeFakeJoins() {
    if (localStorage.getItem("elhani_fake_joins_purged_v1")) return;
    var FAKES = ["JN-501", "JN-502"];
    saveJoins(loadJoins().filter(function (j) { return FAKES.indexOf(j.id) === -1; }));
    localStorage.setItem("elhani_fake_joins_purged_v1", "1");
  }

  /* ---------------- Render: قائمة العمال ---------------- */
  var state = { cat: "all", q: "", city: "", availOnly: false };

  function renderProviders() {
    var grid = $("#provGrid");
    if (!grid) return;
    var all = D.providers.concat(D.demoProviders || [], approvedProviders());
    var ST_LABEL = { active: "نشط — متاح الآن", busy: "مشغول حالياً", inactive: "غير نشط" };
    grid.innerHTML = all.map(function (p) {
      var st = statusOf(p);
      var stHtml = '<span class="status-dot st--' + st + '" title="الحالة تحدّثها الإدارة أوتوماتيكياً"><i></i> ' + (ST_LABEL[st] || ST_LABEL.active) + "</span>";
      var newBadge = p.isNew ? '<span class="badge badge--new">✨ جديد — اعتمدته الإدارة</span>' : "";
      /* العمال التجريبيين: شارة واضحة + من غير علامة الاعتماد ✓ */
      var demoBadge = p.isDemo ? '<span class="badge badge--demo">🧪 بيانات تجريبية للعرض</span>' : "";
      var verify = p.isDemo ? "" : '<span class="verify" title="معتمد من إدارة الحقني">✓</span>';
      /* التجريبيين مفيهمش أرقام — الأزرار للعرض فقط والضغط عليها بيوضح إنها بيانات تجريبية */
      var contact = p.isDemo
        ? '<button type="button" class="btn btn--call btn--sm btn--demo" data-demo-contact>📞 اتصال فوري</button>' +
          '<button type="button" class="btn btn--wa btn--sm btn--demo" data-demo-contact>✆ واتساب</button>'
        : '<a class="btn btn--call btn--sm" href="' + telHref(p.phone) + '" data-call="' + p.id + '" aria-label="اتصال هاتفي مباشر بـ ' + p.name + '">📞 اتصال فوري</a>' +
          '<a class="btn btn--wa btn--sm" href="' + waHref(p.wa || p.phone) + '" target="_blank" rel="noopener" data-wa="' + p.id + '" aria-label="دردشة واتساب مع ' + p.name + '">✆ واتساب</a>';
      return (
        '<article class="prov gold-frame' + (p.isNew ? " prov--new" : "") + (p.isDemo ? " prov--demo" : "") + ' prov--' + st + '" data-status="' + st + '" data-cat="' + p.cat + '" data-name="' + (p.name + " " + p.sub + " " + p.jobs + " " + p.area).toLowerCase() + '">' +
        '  <div class="prov__top">' +
        '    <div class="prov__avatar">' + p.emoji + "</div>" +
        "    <div>" +
        '      <div class="prov__name">' + p.name + verify + "</div>" +
        '      <div class="prov__cat">' + p.sub + " • " + p.area + "</div>" +
        "    </div>" +
        "  </div>" +
        '  <div class="prov__badges">' + newBadge + demoBadge + '<span class="badge">🛠️ ' + p.jobs + "</span></div>" +
        '  <div class="prov__meta">' + stHtml + "</div>" +
        '  <div class="prov__foot prov__contact">' + contact + "</div>" +
        "</article>"
      );
    }).join("");
    applyFilters();
  }

  function applyFilters() {
    var cards = $$("#provGrid .prov");
    var q = state.q.trim().toLowerCase();
    var city = state.city;
    var list = cards.filter(function (c) {
      var okCat = state.cat === "all" || c.getAttribute("data-cat") === state.cat;
      var okQ = !q || c.getAttribute("data-name").indexOf(q) !== -1;
      var okCity = !city || c.getAttribute("data-name").indexOf(city.toLowerCase()) !== -1;
      var okAvail = !state.availOnly || c.getAttribute("data-status") === "active";
      c.classList.toggle("hide", !(okCat && okQ && okCity && okAvail));
      return okCat && okQ && okCity && okAvail;
    });
    /* النشط أولاً، ثم المشغول، ثم غير النشط */
    var ORDER = { active: 0, busy: 1, inactive: 2 };
    list.sort(function (a, b) {
      return (ORDER[a.getAttribute("data-status")] || 0) - (ORDER[b.getAttribute("data-status")] || 0);
    });
    list.forEach(function (c) { $("#provGrid").appendChild(c); });
    $("#provEmpty").classList.toggle("show", list.length === 0);
  }

  function initProviderTools() {
    var citySel = $("#provCity");
    D.cities.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      citySel.appendChild(o);
    });
    citySel.addEventListener("change", function (e) { state.city = e.target.value; applyFilters(); });
    $("#provQ").addEventListener("input", function (e) { state.q = e.target.value; applyFilters(); });
    $$("#filterChips .chip[data-filter]").forEach(function (ch) {
      ch.addEventListener("click", function () {
        $$("#filterChips .chip").forEach(function (x) { x.classList.remove("active"); });
        ch.classList.add("active");
        state.cat = ch.getAttribute("data-filter");
        state.availOnly = false;
        var ac = $("#availChip");
        if (ac) ac.classList.remove("active");
        applyFilters();
      });
    });
    var availChip = $("#availChip");
    if (availChip) {
      availChip.addEventListener("click", function () {
        state.availOnly = !state.availOnly;
        availChip.classList.toggle("active", state.availOnly);
        applyFilters();
      });
    }
    /* ضغطة على أي قسم (كارت أو رابط أو فوتر) → قائمة عمال القسم مباشرة */
    document.addEventListener("click", function (e) {
      var el = e.target.closest("[data-goto-cat]");
      if (!el) return;
      if (el.tagName === "A") e.preventDefault();
      gotoCategory(el.getAttribute("data-goto-cat"));
    });
    /* أزرار العمال التجريبيين — عرض فقط، بتوضح للزائر إنها بيانات تجريبية */
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-demo-contact]");
      if (!b) return;
      toast("gold", "كارت تجريبي للعرض 🧪", "الأرقام بتظهر بس للعمال الحقيقيين بعد اعتماد الإدارة من لوحة التحكم");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var el = e.target.closest && e.target.closest(".svc-card[data-goto-cat]");
      if (!el) return;
      e.preventDefault();
      gotoCategory(el.getAttribute("data-goto-cat"));
    });
    /* انعكاس لحظي: تغيير حالة العامل من تبويب الأدمن بيُحدّث الكروت هنا فوراً */
    window.addEventListener("storage", function (e) {
      if (e.key === LS_PSTATUS || e.key === LS_JOINS) renderProviders();
    });
  }

  /* ---------------- Render: testimonials ---------------- */
  function renderTestimonials() {
    var grid = $("#testiGrid");
    if (!grid) return;
    grid.innerHTML = D.testimonials.map(function (t) {
      return (
        '<div class="testi gold-frame reveal">' +
        '  <div class="testi__stars">' + "★".repeat(t.stars) + "☆".repeat(5 - t.stars) + "</div>" +
        '  <p class="testi__text">“' + t.text + "”</p>" +
        '  <div class="testi__who">' +
        '    <div class="testi__ava">' + t.name.charAt(0) + "</div>" +
        "    <div>" +
        '      <div class="testi__name">' + t.name + "</div>" +
        '      <div class="testi__role">' + t.role + "</div>" +
        "    </div>" +
        "  </div>" +
        "</div>"
      );
    }).join("");
  }

  /* ---------------- Hero search & chips ---------------- */
  function initHeroSearch() {
    var form = $("#heroSearch");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      state.q = $("#heroQ").value;
      state.cat = $("#heroCat").value;
      $$("#filterChips .chip").forEach(function (x) {
        x.classList.toggle("active", x.getAttribute("data-filter") === state.cat);
      });
      $("#provQ").value = state.q;
      applyFilters();
      document.getElementById("providers").scrollIntoView({ behavior: "smooth" });
    });
    $$("#heroChips .chip").forEach(function (ch) {
      ch.addEventListener("click", function () {
        var v = ch.getAttribute("data-chip");
        var cat = v === "delivery" ? "delivery" : v === "cranes" ? "cranes" : v === "cleaning" ? "lifestyle" : "maintenance";
        state.q = "";
        $("#heroQ").value = "";
        $("#provQ").value = "";
        ch.classList.add("active");
        setTimeout(function () { ch.classList.remove("active"); }, 900);
        gotoCategory(cat);
      });
    });
  }

  /* ---------------- Helpers ---------------- */
  function catById(id) { return D.categories.filter(function (c) { return c.id === id; })[0]; }

  function validateField(el, ok, wrap) {
    wrap = wrap || el.closest(".field");
    wrap.classList.toggle("invalid", !ok);
    return ok;
  }

  function populateCitySelect(sel) {
    sel.innerHTML = '<option value="">— اختار مركزك من الشرقية —</option>' +
      D.cities.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("");
  }

  /* ---------------- Join modal (provider onboarding request) ----------------
     لا يتم تفعيل أي نشاط أو ظهوره على الدليل إلا بعد موافقة الأدمن. */
  var joinModal = $("#joinModal");
  var joinFormView = $("#joinFormView");
  var joinSuccessView = $("#joinSuccess");

  function openJoinModal() {
    joinFormView.style.display = "block";
    joinSuccessView.classList.remove("show");
    joinModal.classList.add("modal--open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { var el = $("#jName"); if (el) el.focus(); }, 350);
  }
  function closeJoinModal() {
    joinModal.classList.remove("modal--open");
    document.body.style.overflow = "";
  }

  function submitJoin(e) {
    e.preventDefault();
    var name = $("#jName"), phone = $("#jPhone"), cat = $("#jCat"), city = $("#jCity"), jobs = $("#jJobs"), wa = $("#jWa");
    var ok = true;
    ok = validateField(name, name.value.trim().length >= 3) && ok;
    ok = validateField(phone, /^01[0-9]{9}$/.test(phone.value.trim())) && ok;
    ok = validateField(cat, !!cat.value) && ok;
    ok = validateField(city, !!city.value) && ok;
    ok = validateField(jobs, jobs.value.trim().length >= 3) && ok;
    var waVal = wa.value.trim();
    ok = validateField(wa, !waVal || /^01[0-9]{9}$/.test(waVal)) && ok;
    if (!ok) { toast("err", "راجع البيانات", "في حقل أو أكتر محتاجين تصحيح"); return; }

    var c = catById(cat.value);
    var req = {
      id: nextJoinId(),
      ts: Date.now(),
      name: name.value.trim(),
      phone: phone.value.trim(),
      cat: cat.value,
      catName: c ? c.name : cat.value,
      jobs: jobs.value.trim(),
      city: city.value,
      wa: waVal,
      notes: $("#jNotes").value.trim(),
      status: "pending"
    };
    var list = loadJoins();
    list.unshift(req);
    saveJoins(list);

    joinFormView.style.display = "none";
    $("#joinId").textContent = req.id;
    joinSuccessView.classList.add("show");
    toast("ok", "طلب الانضمام اتسجّل 🤝", req.id + " — الإدارة هتراجع خلال 24 ساعة");
    $("#joinForm").reset();
  }

  function initJoin() {
    populateCitySelect($("#jCity"));
    var jCat = $("#jCat");
    jCat.innerHTML = '<option value="">— اختار القسم —</option>' +
      D.categories.map(function (c) { return '<option value="' + c.id + '">' + c.icon + " " + c.name + "</option>"; }).join("");
    $$("[data-join]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); openJoinModal(); });
    });
    $$("[data-close]", joinModal).forEach(function (b) { b.addEventListener("click", closeJoinModal); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && joinModal.classList.contains("modal--open")) closeJoinModal();
    });
    $("#joinForm").addEventListener("submit", submitJoin);
    ["#jName", "#jPhone", "#jJobs", "#jWa"].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      el.addEventListener("input", function () { el.closest(".field").classList.remove("invalid"); });
    });
  }

  /* ---------------- Toasts ---------------- */
  function toast(type, title, sub) {
    var wrap = $("#toasts");
    var icons = { ok: "✓", err: "!", gold: "⚡" };
    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.innerHTML = '<div class="ic">' + icons[type] + "</div><div><div class=\"t\">" + title + "</div>" + (sub ? '<div class="s">' + sub + "</div>" : "") + "</div>";
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.remove(); }, 450);
    }, 4200);
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    purgeFakeJoins();
    migrateOldProviderState();
    renderServices();
    renderProviders();
    renderTestimonials();
    initTicker();
    initReveal();
    initCounters();
    initParticles();
    initProviderTools();
    initHeroSearch();
    initJoin();
    onScroll();
  });
})();
