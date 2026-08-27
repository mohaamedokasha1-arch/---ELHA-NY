/* ============================================================
   الحَقني — ELHA'NI | Main App
   ============================================================ */
(function () {
  "use strict";

  var D = window.ELHANI_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var LS_REQUESTS = "elhani_requests_v1";
  var LS_JOINS = "elhani_join_requests_v1";
  var LS_JOIN_SEQ = "elhani_join_seq";
  /* رقم الإدارة الموحد: اتصال + واتساب + طوارئ */
  var ADMIN_PHONE = "01225990584";
  var ADMIN_TEL = "tel:+201225990584";
  var ADMIN_WA = "https://wa.me/201225990584";

  /* ===== حالات المزودين الحية (يتحكم فيها الأدمن فقط) =====
     active: متاح الآن 🟢 | busy: مشغول 🔴 | inactive: غير نشط ⚫ */
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
  function statusOf(p) { return loadPStatus()[p.id] || defaultStatusFor(p); }
  function seedPStatus() {
    if (localStorage.getItem("elhani_pstatus_seeded_v1")) return;
    var s = loadPStatus();
    if (!s.p09) s.p09 = "busy"; /* حالة تجريبية للعرض */
    savePStatus(s);
    localStorage.setItem("elhani_pstatus_seeded_v1", "1");
  }

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
    ["hero", "services", "how", "providers", "reviews", "join"].forEach(function (id) {
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

  /* ---------------- Render: services ---------------- */
  function renderServices() {
    var grid = $("#svcGrid");
    if (!grid) return;
    grid.innerHTML = D.categories.map(function (c, i) {
      return (
        '<article class="svc-card gold-frame reveal">' +
        '  <div class="svc-card__media">' +
        '    <img src="' + c.img + '" alt="' + c.name + '" loading="lazy">' +
        '    <span class="svc-card__num">0' + (i + 1) + "</span>" +
        "  </div>" +
        '  <div class="svc-card__body">' +
        '    <h3 class="svc-card__title">' + c.icon + " " + c.name + "</h3>" +
        '    <p class="svc-card__desc">' + c.desc + "</p>" +
        '    <ul class="svc-card__list">' + c.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>" +
        '    <div class="svc-card__foot">' +
        '      <a class="svc-card__link" href="#providers" data-book-cat="' + c.id + '">اطلب الآن ←</a>' +
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
  /* فقط الطلبات التي اعتمدها الأدمن تظهر على المنصة */
  function approvedProviders() {
    return loadJoins().filter(function (j) { return j.status === "approved"; }).map(function (j) {
      var c = catById(j.cat);
      return {
        id: j.id, name: j.name, emoji: c ? c.icon : "🛠️", cat: j.cat,
        sub: j.jobs ? j.jobs.split("•")[0].trim() : "مقدم خدمة",
        rating: null, reviews: 0,
        area: (j.city ? j.city + " — الشرقية" : "الشرقية"),
        price: 0, badge: "new",
        jobs: j.jobs || "", active: true, isNew: true
      };
    });
  }

  /* Seed بيانات الانضمام التجريبية (مرة واحدة، بنفس علامة الأدمن) */
  function seedJoins() {
    if (localStorage.getItem("elhani_join_seeded_v1")) return;
    var now = Date.now(), H = 3600 * 1000;
    var cn = function (id) { var c = D.categories.filter(function (x) { return x.id === id; })[0]; return c ? c.name : id; };
    var joins = [
      { id: "JN-501", ts: now - 26 * H, name: "توصيل بلبيس السريعة", phone: "01199988877", cat: "delivery", catName: cn("delivery"), jobs: "توصيل فوري • مشاوير • مستندات", city: "بلبيس", wa: "01199988877", notes: "فريق من 4 سكرتير، جاهزين نبدأ فور الاعتماد.", status: "approved" },
      { id: "JN-502", ts: now - 6 * H, name: "سباك حسن أبو علي", phone: "01088877766", cat: "maintenance", catName: cn("maintenance"), jobs: "سباكة عامة • سخانات • محارة مياه", city: "أبو حماد", wa: "", notes: "خبرة 12 سنة، أخدم كل مراكز الشرقية.", status: "pending" }
    ];
    saveJoins(joins);
    localStorage.setItem("elhani_join_seeded_v1", "1");
    if (!localStorage.getItem(LS_JOIN_SEQ)) localStorage.setItem(LS_JOIN_SEQ, "502");
  }

  /* ---------------- Render: providers ---------------- */
  var state = { cat: "all", q: "", sort: "rating", city: "", availOnly: false };

  function starStr(r) {
    var full = Math.round(r);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }
  function badgeHtml(b) {
    if (b === "top") return '<span class="badge badge--top">👑 الأكثر طلبًا</span>';
    if (b === "fast") return '<span class="badge badge--fast">⚡ استجابة سريعة</span>';
    if (b === "urgent") return '<span class="badge badge--urgent">🚨 طوارئ 24/7</span>';
    if (b === "new") return '<span class="badge badge--new">✨ جديد — اعتمدته الإدارة</span>';
    return "";
  }

  function renderProviders() {
    var grid = $("#provGrid");
    if (!grid) return;
    var all = D.providers.concat(approvedProviders());
    var ST_LABEL = { active: "متاح الآن", busy: "مشغول حالياً — هيرجع متاح", inactive: "غير متاح مؤقتاً" };
    grid.innerHTML = all.map(function (p) {
      var st = statusOf(p);
      var rateHtml = p.rating
        ? '<span class="prov__rate"><span class="stars">' + starStr(p.rating) + "</span> " + p.rating.toFixed(1) + ' <span class="rev">(' + p.reviews + " تقييم)</span></span>"
        : '<span class="prov__rate prov__rate--new">✦ مزود جديد — اعتماد حديث</span>';
      var firstJob = p.jobs ? p.jobs.split("•")[0].trim() : "مقدم خدمة";
      var stHtml = '<span class="status-dot st--' + st + '" title="الحالة تحدّثها الإدارة لحظياً"><i></i> ' + (ST_LABEL[st] || ST_LABEL.active) + "</span>";
      var bookBtn = st === "inactive"
        ? '<button class="btn btn--gold btn--sm" style="flex:1" disabled title="هذا المزود غير متاح حالياً">غير متاح حالياً</button>'
        : '<button class="btn btn--gold btn--sm" style="flex:1" data-book-prov="' + p.id + '">⚡ اطلب الآن</button>';
      return (
        '<article class="prov gold-frame' + (p.isNew ? " prov--new" : "") + ' prov--' + st + '" data-status="' + st + '" data-cat="' + p.cat + '" data-rating="' + (p.rating || 0) + '" data-reviews="' + p.reviews + '" data-name="' + (p.name + " " + p.sub + " " + p.jobs + " " + p.area).toLowerCase() + '">' +
        '  <div class="prov__top">' +
        '    <div class="prov__avatar">' + p.emoji + "</div>" +
        "    <div>" +
        '      <div class="prov__name">' + p.name + '<span class="verify" title="معتمد من إدارة الحقني">✓</span></div>' +
        '      <div class="prov__cat">' + p.sub + " • " + p.area + "</div>" +
        "    </div>" +
        "  </div>" +
        '  <div class="prov__badges">' + badgeHtml(p.badge) + '<span class="badge">' + firstJob + "</span></div>" +
        '  <div class="prov__meta">' + rateHtml + "</div>" +
        '  <div class="prov__meta">' + stHtml + "</div>" +
        '  <div class="prov__foot">' + bookBtn +
        '    <button class="btn btn--ghost btn--sm" data-wa="' + encodeURIComponent(p.name) + '" aria-label="واتساب">✆</button>' +
        "  </div>" +
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
    list.sort(function (a, b) {
      if (state.sort === "reviews") return (+b.dataset.reviews) - (+a.dataset.reviews);
      return (+b.dataset.rating) - (+a.dataset.rating);
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
    $("#provSort").addEventListener("change", function (e) { state.sort = e.target.value; applyFilters(); });
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
    // footer deep-links
    $$("[data-goto-cat]").forEach(function (a) {
      a.addEventListener("click", function () {
        var cat = a.getAttribute("data-goto-cat");
        setTimeout(function () {
          $$("#filterChips .chip").forEach(function (x) {
            x.classList.toggle("active", x.getAttribute("data-filter") === cat);
          });
          state.cat = cat;
          state.availOnly = false;
          applyFilters();
        }, 350);
      });
    });
    /* انعكاس لحظي: تغيير حالة المزود من تبويب الأدمن بيُحدّث الكروت هنا فوراً */
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
      document.getElementById("providers").scrollIntoView({ behavior: "smooth" });
    });
    $$("#heroChips .chip").forEach(function (ch) {
      ch.addEventListener("click", function () {
        var v = ch.getAttribute("data-chip");
        var cat = v === "delivery" ? "delivery" : v === "cranes" ? "cranes" : v === "cleaning" ? "lifestyle" : "maintenance";
        state.cat = cat;
        state.q = "";
        $("#heroQ").value = "";
        $$("#filterChips .chip").forEach(function (x) {
          x.classList.toggle("active", x.getAttribute("data-filter") === cat);
        });
        ch.classList.add("active");
        setTimeout(function () { ch.classList.remove("active"); }, 900);
        document.getElementById("providers").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------------- Booking modal ---------------- */
  var modal = $("#bookModal");
  var formView = $("#bookFormView");
  var successView = $("#bookSuccess");
  var fCat = $("#fCat");

  function catById(id) { return D.categories.filter(function (c) { return c.id === id; })[0]; }

  function openModal(catId) {
    formView.style.display = "block";
    successView.classList.remove("show");
    if (fCat.options.length === 0) {
      fCat.innerHTML = '<option value="">— اختار الخدمة —</option>' +
        D.categories.map(function (c) { return '<option value="' + c.id + '">' + c.icon + " " + c.name + "</option>"; }).join("");
      // sub-services
      buildSubservices("");
    }
    if (catId && catById(catId)) {
      fCat.value = catId;
      buildSubservices(catId);
    }
    modal.classList.add("modal--open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { $("#fService").focus(); }, 350);
  }
  function closeModal() {
    modal.classList.remove("modal--open");
    document.body.style.overflow = "";
  }

  function buildSubservices(catId) {
    var c = catById(catId);
    var sub = $("#fService");
    if (c) {
      sub.value = "";
      sub.placeholder = "مثال: " + c.services[0];
      sub.setAttribute("list", "");
      var dl = document.getElementById("svcDatalist");
      if (!dl) {
        dl = document.createElement("datalist");
        dl.id = "svcDatalist";
        document.body.appendChild(dl);
      }
      dl.innerHTML = c.services.map(function (s) { return '<option value="' + s + '">'; }).join("");
      sub.setAttribute("list", "svcDatalist");
    }
  }
  fCat.addEventListener("change", function () { buildSubservices(fCat.value); });

  function loadRequests() {
    try { return JSON.parse(localStorage.getItem(LS_REQUESTS) || "[]"); } catch (e) { return []; }
  }
  function saveRequests(list) { localStorage.setItem(LS_REQUESTS, JSON.stringify(list)); }

  function nextReqId() {
    var n = parseInt(localStorage.getItem("elhani_req_seq") || "1041", 10) + 1;
    localStorage.setItem("elhani_req_seq", String(n));
    return "EHN-" + n;
  }

  function validateField(el, ok, wrap) {
    wrap = wrap || el.closest(".field");
    wrap.classList.toggle("invalid", !ok);
    return ok;
  }

  function submitBooking(e) {
    e.preventDefault();
    var cat = fCat;
    var service = $("#fService");
    var name = $("#fName");
    var phone = $("#fPhone");
    var city = $("#fCity");
    var addr = $("#fAddr");

    var ok = true;
    ok = validateField(cat, !!cat.value) && ok;
    ok = validateField(service, service.value.trim().length >= 3) && ok;
    ok = validateField(name, name.value.trim().length >= 3) && ok;
    ok = validateField(phone, /^01[0-9]{9}$/.test(phone.value.trim())) && ok;
    ok = validateField(city, !!city.value) && ok;
    ok = validateField(addr, addr.value.trim().length >= 5) && ok;
    if (!ok) { toast("err", "راجع البيانات", "في حقل أو أكتر محتاجين تصحيح"); return; }

    var c = catById(cat.value);
    var req = {
      id: nextReqId(),
      ts: Date.now(),
      cat: cat.value,
      catName: c ? c.name : cat.value,
      service: service.value.trim(),
      name: name.value.trim(),
      phone: phone.value.trim(),
      city: city.value,
      address: addr.value.trim(),
      time: $("#fTime").value,
      notes: $("#fNotes").value.trim(),
      amount: c ? c.priceFrom : 0,
      status: "pending"
    };
    var list = loadRequests();
    list.unshift(req);
    saveRequests(list);

    formView.style.display = "none";
    $("#reqId").textContent = req.id;
    successView.classList.add("show");
    toast("ok", "طلبك اتسجّل ✅", "رقم الطلب " + req.id);
    $("#bookForm").reset();
    fCat.value = "";
    buildSubservices("");
  }

  function populateCitySelect(sel) {
    sel.innerHTML = '<option value="">— اختار مركزك من الشرقية —</option>' +
      D.cities.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("");
  }

  function initBooking() {
    populateCitySelect($("#fCity"));
    populateCitySelect($("#jCity"));
    var jCat = $("#jCat");
    jCat.innerHTML = '<option value="">— اختار النوع —</option>' +
      D.categories.map(function (c) { return '<option value="' + c.id + '">' + c.icon + " " + c.name + "</option>"; }).join("");
    $$("[data-book]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); openModal(null); });
    });
    $$("[data-book-cat]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); openModal(b.getAttribute("data-book-cat")); });
    });
    document.addEventListener("click", function (e) {
      var bp = e.target.closest("[data-book-prov]");
      if (bp) {
        e.preventDefault();
        var p = D.providers.concat(approvedProviders()).filter(function (x) { return x.id === bp.getAttribute("data-book-prov"); })[0];
        openModal(p ? p.cat : null);
        if (p) {
          var s = $("#fService");
          s.value = "طلب من مزود: " + p.name;
        }
      }
      var wa = e.target.closest("[data-wa]");
      if (wa) {
        e.preventDefault();
        window.open(ADMIN_WA + "?text=" + wa.getAttribute("data-wa") + " — عندي طلب عبر منصة الحقني", "_blank");
      }
    });
    $$("[data-close]", modal).forEach(function (b) { b.addEventListener("click", closeModal); });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (modal.classList.contains("modal--open")) closeModal();
      if (joinModal.classList.contains("modal--open")) closeJoinModal();
    });
    $("#bookForm").addEventListener("submit", submitBooking);
    // live validation
    ["#fService", "#fName", "#fPhone", "#fAddr", "#jWa"].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      el.addEventListener("input", function () { el.closest(".field").classList.remove("invalid"); });
    });
  }

  /* ---------------- Join modal (provider onboarding request) ----------------
     لا يتم تفعيل أي نشاط أو ظهوره على المنصة إلا بعد موافقة الأدمن. */
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
    if (!modal.classList.contains("modal--open")) document.body.style.overflow = "";
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
    $$("[data-join]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); openJoinModal(); });
    });
    $$("[data-close]", joinModal).forEach(function (b) { b.addEventListener("click", closeJoinModal); });
    $("#joinForm").addEventListener("submit", submitJoin);
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
    seedJoins();
    migrateOldProviderState();
    seedPStatus();
    renderServices();
    renderProviders();
    renderTestimonials();
    initTicker();
    initReveal();
    initCounters();
    initParticles();
    initProviderTools();
    initHeroSearch();
    initBooking();
    initJoin();
    onScroll();
  });
})();
