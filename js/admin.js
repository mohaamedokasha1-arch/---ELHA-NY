/* ============================================================
   الحَقني — ELHA'NI | Admin Dashboard Logic
   Secure gate → session → live supervision → join approvals
   ============================================================ */
(function () {
  "use strict";

  var AUTH = window.ELHANI_AUTH;
  var D = window.ELHANI_DATA;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var LS_REQ = "elhani_requests_v1";
  var LS_SEED = "elhani_seeded_v1";
  var LS_PRICES = "elhani_admin_prices_v1";
  var LS_PROVIDERS = "elhani_admin_providers_v1";
  var LS_SEQ = "elhani_req_seq";
  var LS_JOINS = "elhani_join_requests_v1";
  var LS_JOIN_SEQ = "elhani_join_seq";

  var STATUSES = {
    pending: { label: "قيد الانتظار", cls: "pill--pending" },
    active: { label: "جاري التنفيذ", cls: "pill--active" },
    done: { label: "مكتملة", cls: "pill--done" },
    cancelled: { label: "ملغاة", cls: "pill--cancelled" }
  };
  var JOIN_STATUSES = {
    pending: { label: "قيد المراجعة", cls: "pill--pending" },
    approved: { label: "معتمد — مفعل على المنصة", cls: "pill--done" },
    rejected: { label: "مرفوض", cls: "pill--cancelled" }
  };
  var DAY_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  var activeTab = "all";
  var activeJTab = "all";

  /* ---------------- Helpers ---------------- */
  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short", year: "numeric" });
  }
  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit" });
  }
  function relTime(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "الآن";
    if (m < 60) return "منذ " + m + " دقيقة";
    var h = Math.floor(m / 60);
    if (h < 24) return "منذ " + h + " ساعة";
    var d = Math.floor(h / 24);
    return "منذ " + d + " يوم";
  }
  function catEmoji(cat) {
    var c = D.categories.filter(function (x) { return x.id === cat; })[0];
    return c ? c.icon : "📦";
  }
  function catName(cat) {
    var c = D.categories.filter(function (x) { return x.id === cat; })[0];
    return c ? c.name : cat;
  }
  function toast(type, title, sub) {
    var wrap = $("#toasts");
    var icons = { ok: "✓", err: "! ", gold: "⚡" };
    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.innerHTML = '<div class="ic">' + icons[type] + '</div><div><div class="t">' + title + "</div>" + (sub ? '<div class="s">' + sub + "</div>" : "") + "</div>";
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () { el.classList.remove("show"); setTimeout(function () { el.remove(); }, 450); }, 4200);
  }

  /* ---------------- Data ---------------- */
  function loadReq() { try { return JSON.parse(localStorage.getItem(LS_REQ) || "[]"); } catch (e) { return []; } }
  function saveReq(l) { localStorage.setItem(LS_REQ, JSON.stringify(l)); }
  function loadPrices() { try { return JSON.parse(localStorage.getItem(LS_PRICES) || "{}"); } catch (e) { return {}; } }
  function savePrices(p) { localStorage.setItem(LS_PRICES, JSON.stringify(p)); }
  function loadProvState() { try { return JSON.parse(localStorage.getItem(LS_PROVIDERS) || "{}"); } catch (e) { return {}; } }
  function saveProvState(p) { localStorage.setItem(LS_PROVIDERS, JSON.stringify(p)); }
  function loadJoins() { try { return JSON.parse(localStorage.getItem(LS_JOINS) || "[]"); } catch (e) { return []; } }
  function saveJoins(l) { localStorage.setItem(LS_JOINS, JSON.stringify(l)); }
  function nextId() {
    var n = parseInt(localStorage.getItem(LS_SEQ) || "1041", 10) + 1;
    localStorage.setItem(LS_SEQ, String(n));
    return "EHN-" + n;
  }
  function nextJoinId() {
    var n = parseInt(localStorage.getItem(LS_JOIN_SEQ) || "503", 10) + 1;
    localStorage.setItem(LS_JOIN_SEQ, String(n));
    return "JN-" + n;
  }
  function priceOf(catId) {
    var p = loadPrices();
    var c = D.categories.filter(function (x) { return x.id === catId; })[0];
    return p[catId] || (c ? c.priceFrom : 0);
  }
  function providerActive(p) {
    var s = loadProvState();
    return s[p.id] === undefined ? p.active : s[p.id];
  }

  /* ===== Provider live status: نشط 🟢 / مشغول 🔴 / غير نشط ⚫ =====
     نفس المفتاح اللي قارئاته الرئيسية — أي تغيير هنا ينعكس فوراً على الموقع. */
  var LS_PSTATUS = "elhani_provider_status_v1";
  var P_STATUS_META = {
    active:   { label: "🟢 نشط",     pill: "pill--done" },
    busy:     { label: "🔴 مشغول",   pill: "pill--busy" },
    inactive: { label: "⚫ غير نشط", pill: "pill--cancelled" }
  };

  function loadPStatus() { try { return JSON.parse(localStorage.getItem(LS_PSTATUS) || "{}"); } catch (e) { return {}; } }
  function savePStatus(s) { localStorage.setItem(LS_PSTATUS, JSON.stringify(s)); }
  function migrateOldProviderState() {
    if (localStorage.getItem(LS_PSTATUS)) return;
    var old = loadProvState();
    var keys = Object.keys(old);
    if (keys.length) {
      var map = {};
      keys.forEach(function (id) { map[id] = old[id] ? "active" : "inactive"; });
      savePStatus(map);
    }
  }
  function defaultStatusFor(p) { return p.isJoin ? "active" : (p.active ? "active" : "inactive"); }
  function statusOf(p) { return loadPStatus()[p.id] || defaultStatusFor(p); }
  function seedPStatus() {
    if (localStorage.getItem("elhani_pstatus_seeded_v1")) return;
    var s = loadPStatus();
    if (!s.p09) s.p09 = "busy";
    savePStatus(s);
    localStorage.setItem("elhani_pstatus_seeded_v1", "1");
  }
  /* كل مزودي المنصة: الأساسية + المعتمدة من طلبات الانضمام */
  function allPlatformProviders() {
    var joins = loadJoins().filter(function (j) { return j.status === "approved"; }).map(function (j) {
      var c = D.categories.filter(function (x) { return x.id === j.cat; })[0];
      return {
        id: j.id, name: j.name, emoji: c ? c.icon : "🛠️",
        sub: j.jobs ? j.jobs.split("•")[0].trim() : "مقدم خدمة",
        jobs: j.jobs || "", area: (j.city || "الشرقية") + " — الشرقية",
        rating: null, reviews: 0, price: 0, active: true, isJoin: true
      };
    });
    return D.providers.concat(joins);
  }

  /* ---------------- Seed demo data (first run only) — نطاق الشرقية ---------------- */
  function seed() {
    if (localStorage.getItem(LS_SEED)) return;
    var now = Date.now();
    var H = 3600 * 1000;
    var seeds = [
      { h: 2, cat: "delivery", service: "توصيل طلب عشاء — الزقازيق القديمة", name: "كريم فوزي", phone: "01012345678", city: "الزقازيق", address: "الزقازيق، شارع الجيش", time: "now", amount: 45, status: "done" },
      { h: 5, cat: "maintenance", service: "محارة مياه في الحمام", name: "منى عبد الرحمن", phone: "01198765432", city: "العاشر من رمضان", address: "العاشر من رمضان، الحي الثالث", time: "now", amount: 220, status: "done" },
      { h: 26, cat: "cranes", service: "أونش 25 طن — نقل عمارات", name: "أحمد الشناوي", phone: "01055551234", city: "العاشر من رمضان", address: "العاشر من رمضان، المنطقة الصناعية", time: "today", amount: 18500, status: "active" },
      { h: 30, cat: "lifestyle", service: "تنظيف شامل شقة 180م", name: "هدى مصطفى", phone: "01234567890", city: "منيا القمح", address: "منيا القمح، السوق القديم", time: "2h", amount: 950, status: "done" },
      { h: 50, cat: "delivery", service: "شحنة مستندات الزقازيق ← بلبيس", name: "شركة الشرقية للمقاولات", phone: "01098765432", city: "بلبيس", address: "بلبيس، شارع الجمهورية", time: "now", amount: 120, status: "done" },
      { h: 52, cat: "maintenance", service: "صيانة تكييف سبليت", name: "محمود سعد", phone: "01567890123", city: "ديرب نجم", address: "ديرب نجم، المركز", time: "now", amount: 380, status: "cancelled" },
      { h: 74, cat: "cranes", service: "أونش 12 طن — رفع معدات مصنع", name: "مصانع الدلتا — فرع الشرقية", phone: "01022223333", city: "ديرب نجم", address: "ديرب نجم، المنطقة الصناعية", time: "today", amount: 9800, status: "done" },
      { h: 98, cat: "lifestyle", service: "تركيب أثاث غرفة نوم", name: "سارة الحسيني", phone: "01111122223", city: "ههيا", address: "ههيا، شارع 23 يوليو", time: "2h", amount: 600, status: "done" },
      { h: 120, cat: "delivery", service: "توصيل مواد بناء — طن إسمنت", name: "مقاولات الأمانة", phone: "01233334445", city: "أبو حماد", address: "أبو حماد، السوق المركزي", time: "now", amount: 150, status: "done" },
      { h: 145, cat: "maintenance", service: "حملة كهرباء شقة", name: "عبد الله رمضان", phone: "01077778889", city: "بلبيس", address: "بلبيس، حي السلام", time: "now", amount: 1450, status: "done" },
      { h: 4, cat: "maintenance", service: "سباكة طوارئ — محارة المطبخ", name: "نور عبد العزيز", phone: "01044445556", city: "الزقازيق", address: "الزقازيق، حي الصفا", time: "now", amount: 180, status: "pending" },
      { h: 1, cat: "delivery", service: "مشوار عاجل — استلام فاتورة", name: "ليلى إبراهيم", phone: "01533332221", city: "العاشر من رمضان", address: "العاشر من رمضان، المنطقة التكنولوجية", time: "now", amount: 60, status: "pending" }
    ];
    var list = loadReq();
    seeds.forEach(function (s) {
      list.push({
        id: nextId(), ts: now - s.h * H, cat: s.cat,
        catName: catName(s.cat),
        service: s.service, name: s.name, phone: s.phone,
        city: s.city, address: s.address,
        time: s.time, budget: "", notes: "طلب تجريبي", amount: s.amount, status: s.status
      });
    });
    list.sort(function (a, b) { return b.ts - a.ts; });
    saveReq(list);
    localStorage.setItem(LS_SEED, "1");

    /* طلبات انضمام تجريبية: علامة مشتركة مع الموقع نفسه */
    if (!localStorage.getItem("elhani_join_seeded_v1")) {
      var joins = [
        { id: "JN-501", ts: now - 26 * H, name: "توصيل بلبيس السريعة", phone: "01199988877", cat: "delivery", catName: catName("delivery"), jobs: "توصيل فوري • مشاوير • مستندات", city: "بلبيس", wa: "01199988877", notes: "فريق من 4 سكرتير، جاهزين نبدأ فور الاعتماد.", status: "approved" },
        { id: "JN-502", ts: now - 6 * H, name: "سباك حسن أبو علي", phone: "01088877766", cat: "maintenance", catName: catName("maintenance"), jobs: "سباكة عامة • سخانات • محارة مياه", city: "أبو حماد", wa: "", notes: "خبرة 12 سنة، أخدم كل مراكز الشرقية.", status: "pending" }
      ];
      saveJoins(joins);
      localStorage.setItem("elhani_join_seeded_v1", "1");
      if (!localStorage.getItem(LS_JOIN_SEQ)) localStorage.setItem(LS_JOIN_SEQ, "502");
    }
  }

  /* ---------------- AUTH GATE ---------------- */
  var lockTimer = null;

  function setLocked(ms) {
    var box = $("#authLock");
    box.hidden = false;
    var left = Math.ceil(ms / 1000);
    $("#lockCount").textContent = left;
    clearInterval(lockTimer);
    lockTimer = setInterval(function () {
      left--;
      if (left <= 0) { clearInterval(lockTimer); box.hidden = true; }
      else $("#lockCount").textContent = left;
    }, 1000);
  }

  function showAuth() {
    $("#authView").style.display = "grid";
    $("#appView").hidden = true;
    clearInterval(sessionWatch);
  }

  function enterApp() {
    $("#authView").style.display = "none";
    $("#appView").hidden = false;
    var s = AUTH.getSession();
    $("#sessAt").textContent = fmtDate(s.at) + " — " + fmtTime(s.at);
    $("#sessExp").textContent = fmtDate(s.exp) + " — " + fmtTime(s.exp);
    $("#todayDate").textContent = "اليوم: " + new Date().toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    renderAll();
    switchView("overview");
    startSessionWatch();
  }

  var sessionWatch = null;
  function startSessionWatch() {
    clearInterval(sessionWatch);
    sessionWatch = setInterval(function () {
      if (!AUTH.isAuthed()) {
        toast("err", "انتهت الجلسة", "سجّل الدخول مرة أخرى للمتابعة");
        showAuth();
      }
    }, 30000);
  }

  function initAuth() {
    var form = $("#authForm");
    var input = $("#pass");
    var err = $("#authErr");
    var btn = $("#authBtn");
    var card = $("#authCard");

    $("#passToggle").addEventListener("click", function () {
      input.type = input.type === "password" ? "text" : "password";
      $("#passToggle").textContent = input.type === "password" ? "👁" : "🙈";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var remaining = AUTH.isLocked();
      if (remaining > 0) { setLocked(remaining); return; }
      err.textContent = "";
      input.classList.remove("err");
      btn.disabled = true;
      btn.querySelector(".auth__spin").hidden = false;

      AUTH.verify(input.value).then(function (ok) {
        btn.disabled = false;
        btn.querySelector(".auth__spin").hidden = true;
        if (ok) {
          AUTH.clearFails();
          var remember = $("#remember").checked;
          AUTH.createSession(remember ? 30 * 24 * 3600 * 1000 : 12 * 3600 * 1000);
          toast("ok", "أهلًا بعودة المدير 👑", "جلسة آمنة حتى " + fmtDate(AUTH.getSession().exp));
          enterApp();
        } else {
          var fails = AUTH.recordFail();
          input.classList.add("err");
          card.classList.remove("shake");
          void card.offsetWidth;
          card.classList.add("shake");
          if (AUTH.isLocked()) {
            err.textContent = "محاولات كثيرة — تم الإيقاف مؤقتًا 30 ثانية.";
            setLocked(AUTH.isLocked());
          } else {
            err.textContent = "كلمة السر غير صحيحة (تجربة " + fails + " من 5)";
          }
          input.select();
        }
      });
    });

    setTimeout(function () { input.focus(); }, 300);
  }

  /* ---------------- Views ---------------- */
  var TITLES = { overview: "نظرة عامة", requests: "الطلبات", joins: "طلبات الانضمام", providers: "المزودون", services: "الخدمات والأسعار", settings: "الإعدادات" };

  function switchView(id) {
    $$("#sideNav .side__item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === id);
    });
    $$(".view").forEach(function (v) { v.hidden = v.id !== "view-" + id; });
    $("#viewTitle").textContent = TITLES[id] || "";
    if (id === "requests") renderRequests();
    if (id === "joins") renderJoins();
    if (id === "providers") renderProviders();
    if (id === "services") renderServicesAdmin();
  }

  /* ---------------- Overview ---------------- */
  function renderOverview() {
    var reqs = loadReq();
    var joins = loadJoins();
    var pendingJ = joins.filter(function (j) { return j.status === "pending"; }).length;
    var pending = reqs.filter(function (r) { return r.status === "pending"; }).length;
    var done = reqs.filter(function (r) { return r.status === "done"; }).length;
    var revenue = reqs.filter(function (r) { return r.status !== "cancelled"; })
      .reduce(function (s, r) { return s + (r.amount || 0); }, 0);

    $("#stTotal").textContent = reqs.length.toLocaleString("en-US");
    $("#stPending").textContent = pending.toLocaleString("en-US");
    $("#stDone").textContent = done.toLocaleString("en-US");
    $("#stRevenue").textContent = revenue.toLocaleString("en-US");
    $("#stJoins").textContent = pendingJ.toLocaleString("en-US");
    $("#pendingBadge").textContent = pending;
    updateJoinBadge();

    /* 7-day chart */
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ start: d.getTime(), end: d.getTime() + 86400000, label: DAY_AR[d.getDay()], count: 0, isToday: i === 0 });
    }
    reqs.forEach(function (r) {
      days.forEach(function (d) {
        if (r.ts >= d.start && r.ts < d.end) d.count++;
      });
    });
    var max = Math.max.apply(null, days.map(function (d) { return d.count; }).concat([1]));
    $("#chart").innerHTML = days.map(function (d) {
      var h = Math.max(5, Math.round((d.count / max) * 100));
      return '<div class="bar' + (d.isToday ? " bar--today" : "") + '" title="' + d.count + ' طلبات">' +
        '<div class="bar__fill" style="height:' + h + '%" data-v="' + d.count + '"></div>' +
        '<div class="bar__day">' + d.label + "</div></div>";
    }).join("");

    /* recent */
    var recent = reqs.slice(0, 5);
    $("#recentList").innerHTML = recent.length ? recent.map(function (r) {
      return '<div class="recent__item">' +
        '<div class="recent__ic">' + catEmoji(r.cat) + "</div>" +
        "<div><div class=\"recent__t\">" + r.service + '</div><div class="recent__s">' + r.name + " • " + (r.city || r.address || "") + "</div></div>" +
        '<div class="recent__side"><div class="recent__amt">' + (r.amount || 0).toLocaleString("en-US") + ' ج.م</div><div class="recent__time">' + relTime(r.ts) + "</div></div>" +
        "</div>";
    }).join("") : '<div class="empty-box"><div class="big">📭</div><h3>لا توجد طلبات بعد</h3></div>';

    /* distribution */
    var cats = D.categories.map(function (c) {
      return { name: c.icon + " " + c.name, count: reqs.filter(function (r) { return r.cat === c.id; }).length };
    });
    var cmax = Math.max.apply(null, cats.map(function (c) { return c.count; }).concat([1]));
    $("#dist").innerHTML = cats.map(function (c) {
      return '<div class="dist__row"><div class="dist__name">' + c.name + '</div><div class="dist__bar"><i data-w="' + Math.round((c.count / cmax) * 100) + '"></i></div><div class="dist__val">' + c.count + "</div></div>";
    }).join("");
    requestAnimationFrame(function () {
      setTimeout(function () {
        $$("#dist .dist__bar i").forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; });
      }, 80);
    });
  }

  function updateJoinBadge() {
    var pendingJ = loadJoins().filter(function (j) { return j.status === "pending"; }).length;
    var badge = $("#joinBadge");
    badge.textContent = pendingJ;
    badge.style.display = pendingJ > 0 ? "" : "none";
  }

  /* ---------------- Requests ---------------- */
  function renderRequests() {
    var reqs = loadReq().filter(function (r) {
      return activeTab === "all" || r.status === activeTab;
    });
    var body = $("#reqBody");
    $("#reqEmpty").hidden = reqs.length > 0;
    body.innerHTML = reqs.map(function (r) {
      var st = STATUSES[r.status] || STATUSES.pending;
      var sel = Object.keys(STATUSES).map(function (k) {
        return '<option value="' + k + '"' + (k === r.status ? " selected" : "") + ">" + STATUSES[k].label + "</option>";
      }).join("");
      return "<tr>" +
        '<td class="rid">' + r.id + "</td>" +
        '<td class="svc">' + catEmoji(r.cat) + " " + r.service + "<small>" + (r.catName || "") + " • " + relTime(r.ts) + "</small></td>" +
        "<td>" + r.name + "</td>" +
        '<td class="ph">' + r.phone + "</td>" +
        '<td class="addr" title="' + ((r.city || "") + " — " + (r.address || "")) + '">' + (r.city || r.address || "—") + "</td>" +
        '<td>' + (r.time === "now" ? "⚡ فوري" : r.time === "2h" ? "خلال ساعتين" : r.time === "today" ? "اليوم" : "موعد محدد") + "</td>" +
        '<td class="amt">' + (r.amount || 0).toLocaleString("en-US") + "</td>" +
        '<td><span class="pill ' + st.cls + '">' + st.label + "</span></td>" +
        '<td style="white-space:nowrap"><select class="status-sel" data-id="' + r.id + '" aria-label="الحالة">' + sel + '</select><button class="del-btn" data-del="' + r.id + '" title="حذف">🗑</button></td>' +
        "</tr>";
    }).join("");

    $$("#reqBody .status-sel").forEach(function (s) {
      s.addEventListener("change", function () {
        var list = loadReq();
        var r = list.filter(function (x) { return x.id === s.getAttribute("data-id"); })[0];
        if (!r) return;
        r.status = s.value;
        saveReq(list);
        renderAll();
        toast("gold", "تم تحديث الحالة", r.id + " → " + STATUSES[r.status].label);
      });
    });
    $$("#reqBody .del-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-del");
        if (!confirm("سيتم حذف الطلب " + id + " نهائيًا. متأكد؟")) return;
        saveReq(loadReq().filter(function (x) { return x.id !== id; }));
        renderAll();
        toast("err", "تم حذف الطلب", id);
      });
    });
  }

  /* ---------------- Join requests (approve / reject) ---------------- */
  function renderJoins() {
    var joins = loadJoins().filter(function (j) {
      return activeJTab === "all" || j.status === activeJTab;
    });
    var listEl = $("#joinList");
    $("#joinEmpty").hidden = joins.length > 0;
    listEl.innerHTML = joins.map(function (j) {
      var st = JOIN_STATUSES[j.status] || JOIN_STATUSES.pending;
      return '<div class="join-card gold-frame' + (j.status === "approved" ? " join-card--approved" : "") + (j.status === "rejected" ? " join-card--rejected" : "") + '">' +
        '<div class="join-card__head">' +
        '  <div class="join-card__ava">' + catEmoji(j.cat) + "</div>" +
        "  <div>" +
        '    <div class="join-card__name">' + j.name + ' <span class="pill ' + st.cls + '">' + st.label + "</span></div>" +
        '    <div class="join-card__meta">' + catName(j.cat) + " • " + (j.city || "الشرقية") + " • " + relTime(j.ts) + "</div>" +
        "  </div>" +
        '  <div class="join-card__id">' + j.id + "</div>" +
        "</div>" +
        '<div class="join-card__jobs">🛠️ ' + j.jobs + "</div>" +
        '<div class="join-card__contact">' +
        '  <a href="tel:+20' + j.phone + '">📞 ' + j.phone + "</a>" +
        (j.wa ? '  <a href="https://wa.me/20' + j.wa + '" target="_blank" rel="noopener">✆ واتساب: ' + j.wa + "</a>" : "") +
        "  <span class=\"join-card__phone-note\">للمراجعة والتواصل قبل الاعتماد</span>" +
        "</div>" +
        (j.notes ? '<div class="join-card__notes">💬 ' + j.notes + "</div>" : "") +
        '<div class="join-card__actions">' +
        '  <button class="btn btn--gold btn--sm" data-approve="' + j.id + '">✓ اعتماد وتفعيل على المنصة</button>' +
        '  <button class="btn btn--danger btn--sm" data-reject="' + j.id + '">✕ رفض الطلب</button>' +
        "</div>" +
        "</div>";
    }).join("");

    $$("#joinList [data-approve]").forEach(function (b) {
      b.addEventListener("click", function () {
        var list = loadJoins();
        var j = list.filter(function (x) { return x.id === b.getAttribute("data-approve"); })[0];
        if (!j) return;
        var wasApproved = j.status === "approved";
        j.status = "approved";
        saveJoins(list);
        renderAll();
        toast("ok", wasApproved ? "الطلب ما كانش محتاج تغيير" : "تم الاعتماد ✓", wasApproved ? j.name : j.name + " — نشاطه ظهر على الموقع الآن");
      });
    });
    $$("#joinList [data-reject]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-reject");
        var list = loadJoins();
        var j = list.filter(function (x) { return x.id === id; })[0];
        if (!j) return;
        if (j.status === "approved" && !confirm("النشاط مفعل على الموقع حاليًا — الرفض هيشيله فورًا. متأكد؟")) return;
        j.status = "rejected";
        saveJoins(list);
        renderAll();
        toast("err", "تم رفض الطلب", id + " — اتسجل في الأرشيف");
      });
    });
  }

  /* ---------------- Providers (status control) ---------------- */
  function renderProviders() {
    var body = $("#provBody");
    body.innerHTML = allPlatformProviders().map(function (p) {
      var st = statusOf(p);
      var meta = P_STATUS_META[st] || P_STATUS_META.active;
      var btns = Object.keys(P_STATUS_META).map(function (k) {
        return '<button class="sbtn sbtn--' + k + (k === st ? " on" : "") + '" data-pid="' + p.id + '" data-st="' + k + '" title="تغيير الحالة فوراً">' + P_STATUS_META[k].label + "</button>";
      }).join("");
      var rate = p.rating
        ? '<span class="rating">★ ' + p.rating.toFixed(1) + '</span> <small style="color:var(--muted-2)">(' + p.reviews + ")</small>"
        : '<span class="rating">✦ جديد</span>';
      var price = p.price > 0 ? p.price.toLocaleString("en-US") + " ج.م" : "حسب الخدمة";
      return "<tr>" +
        '<td><div class="pv-name"><span class="pv-ava">' + p.emoji + "</span><div>" + p.name + '<span class="pv-sub">' + p.sub + "</span></div></div></td>" +
        "<td>" + p.jobs.split("•")[0].trim() + "</td>" +
        "<td>" + p.area + "</td>" +
        "<td>" + rate + "</td>" +
        '<td class="amt">' + price + "</td>" +
        '<td><span class="pill ' + meta.pill + '">' + meta.label + "</span></td>" +
        '<td><div class="status-btns">' + btns + "</div></td>" +
        "</tr>";
    }).join("");
    $$("#provBody .sbtn").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-pid");
        var st = b.getAttribute("data-st");
        var s = loadPStatus();
        s[id] = st;
        savePStatus(s);
        renderProviders();
        var p = allPlatformProviders().filter(function (x) { return x.id === id; })[0];
        toast("ok", "تم تحديث الحالة ✓", (p ? p.name : id) + " ← " + P_STATUS_META[st].label + " — انعكس فوراً على الموقع");
      });
    });
  }

  /* ---------------- Services / pricing ---------------- */
  function renderServicesAdmin() {
    var prices = loadPrices();
    $("#svcAdminGrid").innerHTML = D.categories.map(function (c) {
      var cur = prices[c.id] || c.priceFrom;
      return '<div class="svc-admin gold-frame">' +
        '<div class="svc-admin__head"><div class="svc-admin__ic">' + c.icon + '</div><div><div class="svc-admin__name">' + c.name + '</div><div class="svc-admin__tag">' + c.tag + "</div></div></div>" +
        '<div class="svc-admin__field"><label for="price-' + c.id + '">أقل سعر للطلب (ج.م)</label>' +
        '<input type="number" id="price-' + c.id + '" min="0" value="' + cur + '"></div>' +
        '<button class="btn btn--gold btn--sm svc-admin__save" data-saveprice="' + c.id + '">💾 حفظ السعر</button>' +
        "</div>";
    }).join("");
    $$("#svcAdminGrid [data-saveprice]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-saveprice");
        var val = parseInt($("#price-" + id).value, 10) || 0;
        var p = loadPrices();
        p[id] = val;
        savePrices(p);
        toast("ok", "تم تحديث السعر ✓", val.toLocaleString("en-US") + " ج.م");
      });
    });
  }

  /* ---------------- Settings actions ---------------- */
  function initSettings() {
    $("#reseedBtn").addEventListener("click", function () {
      var real = loadReq().filter(function (r) { return r.notes !== "طلب تجريبي"; });
      saveReq(real);
      localStorage.removeItem(LS_SEED);
      seed();
      renderAll();
      toast("ok", "تمت إعادة البيانات التجريبية ↻", "أُلحقت الطلبات التجريبية بطلباتك الحقيقية");
    });
    $("#wipeBtn").addEventListener("click", function () {
      if (!confirm("سيتم مسح كل الطلبات نهائيًا من هذا المتصفح (طلبات الانضمام مش هتتأثر). متأكد؟")) return;
      saveReq([]);
      renderAll();
      toast("err", "تم مسح كل الطلبات 🗑", "بدأنا من الصفر");
    });
    $("#logoutBtn").addEventListener("click", function () {
      AUTH.clearSession();
      clearInterval(sessionWatch);
      toast("gold", "تم تسجيل الخروج", "إلى اللقاء 👋");
      setTimeout(showAuth, 400);
    });
  }

  /* ---------------- Render all ---------------- */
  function renderAll() {
    renderOverview();
    if (!$("#view-requests").hidden) renderRequests();
    if (!$("#view-joins").hidden) renderJoins();
    if (!$("#view-providers").hidden) renderProviders();
    if (!$("#view-services").hidden) renderServicesAdmin();
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    seed();
    migrateOldProviderState();
    seedPStatus();
    initAuth();
    initSettings();
    $$("#sideNav .side__item").forEach(function (b) {
      b.addEventListener("click", function () { switchView(b.getAttribute("data-view")); });
    });
    $$(".panel__link[data-goview]").forEach(function (l) {
      l.addEventListener("click", function (e) { e.preventDefault(); switchView(l.getAttribute("data-goview")); });
    });
    $$("#reqTabs .tab").forEach(function (t) {
      t.addEventListener("click", function () {
        $$("#reqTabs .tab").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        activeTab = t.getAttribute("data-tab");
        renderRequests();
      });
    });
    $$("#joinTabs .tab").forEach(function (t) {
      t.addEventListener("click", function () {
        $$("#joinTabs .tab").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        activeJTab = t.getAttribute("data-jtab");
        renderJoins();
      });
    });
    if (AUTH.isAuthed()) enterApp();
  });
})();
