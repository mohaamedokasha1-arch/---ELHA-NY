/* ============================================================
   الحَقني — ELHA'NI | Admin Dashboard Logic
   Secure gate → session → worker live-status control → join approvals
   (نموذج الدليل المباشر: بدون طلبات وبدون أسعار)
   ============================================================ */
(function () {
  "use strict";

  var AUTH = window.ELHANI_AUTH;
  var D = window.ELHANI_DATA;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var LS_PROVIDERS = "elhani_admin_providers_v1";
  var LS_JOINS = "elhani_join_requests_v1";
  var LS_JOIN_SEQ = "elhani_join_seq";

  var JOIN_STATUSES = {
    pending: { label: "قيد المراجعة", cls: "pill--pending" },
    approved: { label: "معتمد — ظاهر على الدليل", cls: "pill--done" },
    rejected: { label: "مرفوض", cls: "pill--cancelled" }
  };
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
    return c ? c.icon : "🛠️";
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
  function telHref(phone) { return "tel:+20" + String(phone || "").replace(/^0/, ""); }
  function waHref(phone) { return "https://wa.me/20" + String(phone || "").replace(/^0/, ""); }

  /* ---------------- Data ---------------- */
  function loadProvState() { try { return JSON.parse(localStorage.getItem(LS_PROVIDERS) || "{}"); } catch (e) { return {}; } }
  function loadJoins() { try { return JSON.parse(localStorage.getItem(LS_JOINS) || "[]"); } catch (e) { return []; } }
  function saveJoins(l) { localStorage.setItem(LS_JOINS, JSON.stringify(l)); }

  /* ===== Worker live status: نشط 🟢 / مشغول 🔴 / غير نشط ⚫ =====
     نفس المفتاح اللي بيقرأه الموقع الرئيسي — أي تغيير هنا ينعكس فوراً على كروت العمال. */
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
  /* كل عمال الدليل: الأساسيون + المعتمدون من طلبات الانضمام */
  function allPlatformProviders() {
    var joins = loadJoins().filter(function (j) { return j.status === "approved"; }).map(function (j) {
      var c = D.categories.filter(function (x) { return x.id === j.cat; })[0];
      return {
        id: j.id, name: j.name, emoji: c ? c.icon : "🛠️",
        sub: j.jobs ? j.jobs.split("•")[0].trim() : "مقدم خدمة",
        jobs: j.jobs || "", area: (j.city || "الشرقية") + " — الشرقية",
        phone: j.phone || "", wa: j.wa || j.phone || "",
        active: true, isJoin: true
      };
    });
    return D.providers.concat(joins);
  }

  /* ---------------- Seed demo join requests (first run only) ---------------- */
  function seed() {
    if (localStorage.getItem("elhani_join_seeded_v1")) return;
    var now = Date.now(), H = 3600 * 1000;
    var joins = [
      { id: "JN-501", ts: now - 26 * H, name: "توصيل بلبيس السريعة", phone: "01199988877", cat: "delivery", catName: catName("delivery"), jobs: "توصيل فوري • مشاوير • مستندات", city: "بلبيس", wa: "01199988877", notes: "فريق من 4 سكرتير، جاهزين نبدأ فور الاعتماد.", status: "approved" },
      { id: "JN-502", ts: now - 6 * H, name: "سباك حسن أبو علي", phone: "01088877766", cat: "maintenance", catName: catName("maintenance"), jobs: "سباكة عامة • سخانات • محارة مياه", city: "أبو حماد", wa: "", notes: "خبرة 12 سنة، أخدم كل مراكز الشرقية.", status: "pending" }
    ];
    saveJoins(joins);
    localStorage.setItem("elhani_join_seeded_v1", "1");
    if (!localStorage.getItem(LS_JOIN_SEQ)) localStorage.setItem(LS_JOIN_SEQ, "502");
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
  var TITLES = { overview: "نظرة عامة", joins: "طلبات الانضمام", providers: "العمال والحالات", settings: "الإعدادات" };

  function switchView(id) {
    $$("#sideNav .side__item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === id);
    });
    $$(".view").forEach(function (v) { v.hidden = v.id !== "view-" + id; });
    $("#viewTitle").textContent = TITLES[id] || "";
    if (id === "joins") renderJoins();
    if (id === "providers") renderProviders();
  }

  /* ---------------- Overview ---------------- */
  function renderOverview() {
    var provs = allPlatformProviders();
    var joins = loadJoins();
    var pendingJ = joins.filter(function (j) { return j.status === "pending"; }).length;
    var counts = { active: 0, busy: 0, inactive: 0 };
    provs.forEach(function (p) { counts[statusOf(p)] = (counts[statusOf(p)] || 0) + 1; });

    $("#stWorkers").textContent = provs.length.toLocaleString("en-US");
    $("#stActive").textContent = counts.active.toLocaleString("en-US");
    $("#stBusy").textContent = counts.busy.toLocaleString("en-US");
    $("#stInactive").textContent = counts.inactive.toLocaleString("en-US");
    $("#stJoins").textContent = pendingJ.toLocaleString("en-US");
    updateJoinBadge();

    /* آخر طلبات الانضمام */
    var recent = joins.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 5);
    $("#recentList").innerHTML = recent.length ? recent.map(function (j) {
      var st = JOIN_STATUSES[j.status] || JOIN_STATUSES.pending;
      return '<div class="recent__item">' +
        '<div class="recent__ic">' + catEmoji(j.cat) + "</div>" +
        "<div><div class=\"recent__t\">" + j.name + '</div><div class="recent__s">' + catName(j.cat) + " • " + (j.city || "الشرقية") + "</div></div>" +
        '<div class="recent__side"><div class="recent__amt"><span class="pill ' + st.cls + '">' + st.label + '</span></div><div class="recent__time">' + relTime(j.ts) + "</div></div>" +
        "</div>";
    }).join("") : '<div class="empty-box"><div class="big">🤝</div><h3>لا توجد طلبات انضمام بعد</h3></div>';

    /* توزيع العمال على الأقسام */
    var cats = D.categories.map(function (c) {
      return { name: c.icon + " " + c.name, count: provs.filter(function (p) { return p.cat === c.id; }).length };
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

    renderQuickControl();
  }

  function updateJoinBadge() {
    var pendingJ = loadJoins().filter(function (j) { return j.status === "pending"; }).length;
    var badge = $("#joinBadge");
    badge.textContent = pendingJ;
    badge.style.display = pendingJ > 0 ? "" : "none";
  }

  function statusButtons(p, st) {
    return Object.keys(P_STATUS_META).map(function (k) {
      return '<button class="sbtn sbtn--' + k + (k === st ? " on" : "") + '" data-pid="' + p.id + '" data-st="' + k + '" title="تغيير الحالة فوراً">' + P_STATUS_META[k].label + "</button>";
    }).join("");
  }
  function bindStatusButtons(scope) {
    $$(scope + " .sbtn").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-pid");
        var st = b.getAttribute("data-st");
        var s = loadPStatus();
        s[id] = st;
        savePStatus(s);
        renderAll();
        var p = allPlatformProviders().filter(function (x) { return x.id === id; })[0];
        toast("ok", "تم تحديث الحالة ✓", (p ? p.name : id) + " ← " + P_STATUS_META[st].label + " — انعكس فوراً على الموقع");
      });
    });
  }

  /* التحكم السريع في النظرة العامة */
  function renderQuickControl() {
    var body = $("#quickBody");
    if (!body) return;
    body.innerHTML = allPlatformProviders().map(function (p) {
      var st = statusOf(p);
      var meta = P_STATUS_META[st] || P_STATUS_META.active;
      return "<tr>" +
        '<td><div class="pv-name"><span class="pv-ava">' + p.emoji + "</span><div>" + p.name + '<span class="pv-sub">' + p.area + "</span></div></div></td>" +
        "<td>" + p.sub + "</td>" +
        '<td><span class="pill ' + meta.pill + '">' + meta.label + "</span></td>" +
        '<td><div class="status-btns">' + statusButtons(p, st) + "</div></td>" +
        "</tr>";
    }).join("");
    bindStatusButtons("#quickBody");
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
        '  <a href="' + telHref(j.phone) + '">📞 ' + j.phone + "</a>" +
        (j.wa ? '  <a href="' + waHref(j.wa) + '" target="_blank" rel="noopener">✆ واتساب: ' + j.wa + "</a>" : "") +
        "  <span class=\"join-card__phone-note\">هذا الرقم سيظهر للعملاء على كارت العامل بعد الاعتماد</span>" +
        "</div>" +
        (j.notes ? '<div class="join-card__notes">💬 ' + j.notes + "</div>" : "") +
        '<div class="join-card__actions">' +
        '  <button class="btn btn--gold btn--sm" data-approve="' + j.id + '">✓ اعتماد وإظهار على الدليل</button>' +
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
        toast("ok", wasApproved ? "الطلب ما كانش محتاج تغيير" : "تم الاعتماد ✓", wasApproved ? j.name : j.name + " — كارته ظهر على الدليل بأزرار التواصل");
      });
    });
    $$("#joinList [data-reject]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-reject");
        var list = loadJoins();
        var j = list.filter(function (x) { return x.id === id; })[0];
        if (!j) return;
        if (j.status === "approved" && !confirm("العامل ظاهر على الدليل حاليًا — الرفض هيشيله فورًا. متأكد؟")) return;
        j.status = "rejected";
        saveJoins(list);
        renderAll();
        toast("err", "تم رفض الطلب", id + " — اتسجل في الأرشيف");
      });
    });
  }

  /* ---------------- Workers (status control) ---------------- */
  function renderProviders() {
    var body = $("#provBody");
    body.innerHTML = allPlatformProviders().map(function (p) {
      var st = statusOf(p);
      var meta = P_STATUS_META[st] || P_STATUS_META.active;
      var tel = p.phone ? '<a class="contact-link" href="' + telHref(p.phone) + '" dir="ltr">📞 ' + p.phone + "</a>" : "—";
      var wa = (p.wa || p.phone) ? '<a class="contact-link" href="' + waHref(p.wa || p.phone) + '" target="_blank" rel="noopener" dir="ltr">✆ ' + (p.wa || p.phone) + "</a>" : "—";
      return "<tr>" +
        '<td><div class="pv-name"><span class="pv-ava">' + p.emoji + "</span><div>" + p.name + '<span class="pv-sub">' + p.sub + "</span></div></div></td>" +
        "<td>" + p.jobs.split("•")[0].trim() + "</td>" +
        "<td>" + p.area + "</td>" +
        "<td>" + tel + "</td>" +
        "<td>" + wa + "</td>" +
        '<td><span class="pill ' + meta.pill + '">' + meta.label + "</span></td>" +
        '<td><div class="status-btns">' + statusButtons(p, st) + "</div></td>" +
        "</tr>";
    }).join("");
    bindStatusButtons("#provBody");
  }

  /* ---------------- Settings actions ---------------- */
  function initSettings() {
    $("#resetStatusBtn").addEventListener("click", function () {
      if (!confirm("سيتم إعادة كل العمال إلى حالة «نشط 🟢» فورًا على الموقع. متأكد؟")) return;
      var s = {};
      allPlatformProviders().forEach(function (p) { s[p.id] = "active"; });
      savePStatus(s);
      renderAll();
      toast("ok", "تمت إعادة الضبط ↻", "كل العمال دلوقتي نشطين 🟢 على الدليل");
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
    if (!$("#view-joins").hidden) renderJoins();
    if (!$("#view-providers").hidden) renderProviders();
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
