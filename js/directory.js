/* ============================================================
   الحَقني — ELHA'NI | سجل العمال والزبائن (469 سجل)
   عرض جدول + تبويبات فلترة + بحث + Pagination سلس
   إضافة مستقلة: لا تعدّل أي منطق في app.js / bottomnav.js
   ============================================================ */
(function () {
  "use strict";

  var DIR = window.ELHANI_DIRECTORY;
  if (!DIR || !DIR.people) return;

  var people = DIR.people;
  var PAGE = 12; // سجل لكل صفحة
  var tbody = document.getElementById("dirTbody");
  var pagesEl = document.getElementById("dirPages");
  var infoEl = document.getElementById("dirInfo");
  var wrap = document.getElementById("dirTableWrap");
  if (!tbody || !pagesEl || !infoEl || !wrap) return;

  var state = { type: "all", q: "", page: 1 };

  /* ---- حالات الواجهة ---- */
  var STATUS_META = {
    active:   { label: "🟢 نشط",      cls: "dir-pill--active" },
    busy:     { label: "🔴 مشغول",    cls: "dir-pill--busy" },
    inactive: { label: "⚫ غير نشط",  cls: "dir-pill--inactive" },
    new:      { label: "🆕 جديد",     cls: "dir-pill--new" },
    doing:    { label: "🔵 قيد التنفيذ", cls: "dir-pill--doing" },
    done:     { label: "✅ مكتمل",    cls: "dir-pill--done" }
  };
  var TYPE_META = {
    worker:   { label: "👷 عامل / مقدم خدمة", cls: "dir-type--worker" },
    customer: { label: "🛒 زبون / عميل",      cls: "dir-type--customer" }
  };

  /* ---- الفلترة ---- */
  function filtered() {
    var q = state.q.trim().toLowerCase();
    return people.filter(function (p) {
      if (state.type !== "all" && p.type !== state.type) return false;
      if (!q) return true;
      return (p.name + " " + p.city + " " + p.phone + " " + p.id).toLowerCase().indexOf(q) !== -1;
    });
  }

  /* ---- أرقام الصفحات (بمعالجة الحذف "…") ---- */
  function pageList(cur, total) {
    var out = [];
    if (total <= 7) {
      for (var i = 1; i <= total; i++) out.push(i);
      return out;
    }
    out.push(1);
    if (cur > 3) out.push("…");
    for (var p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) out.push(p);
    if (cur < total - 2) out.push("…");
    out.push(total);
    return out;
  }

  /* ---- العرض ---- */
  function render() {
    var rows = filtered();
    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * PAGE;
    var slice = rows.slice(start, start + PAGE);

    tbody.innerHTML = slice.length ? slice.map(function (p) {
      var st = STATUS_META[p.status] || STATUS_META.active;
      var tp = TYPE_META[p.type] || TYPE_META.worker;
      /* الزبون نميز الطلب بشارة 📌 في التفاصيل */
      var detail = p.type === "customer" ? "📌 " + p.detail : "🛠️ " + p.detail;
      return (
        "<tr>" +
        '  <td class="dir-id">' + p.id + "</td>" +
        '  <td><span class="dir-type ' + tp.cls + '">' + tp.label + "</span></td>" +
        '  <td class="dir-name">' + p.name + "</td>" +
        '  <td class="dir-phone" dir="ltr">' + p.phone + "</td>" +
        "  <td>" + p.city + "</td>" +
        '  <td class="dir-detail">' + detail + "</td>" +
        '  <td><span class="dir-pill ' + st.cls + '">' + st.label + "</span></td>" +
        "</tr>"
      );
    }).join("") : '<tr><td colspan="7" class="dir-empty">🔍 لا توجد نتائج مطابقة — جرّب كلمة تانية أو ارجع للكل</td></tr>';

    /* أنيميشن لطيف عند تغيير الصفحة */
    tbody.classList.remove("dir-anim");
    void tbody.offsetWidth;
    tbody.classList.add("dir-anim");

    /* أزرار الصفحات */
    pagesEl.innerHTML = pageList(state.page, totalPages).map(function (n) {
      if (n === "…") return '<span class="dir-page-dots">…</span>';
      return '<button class="dir-page-btn' + (n === state.page ? " active" : "") + '" data-page="' + n + '">' + n + "</button>";
    }).join("");

    /* عداد + تعطيل الأزرار عند الأطراف */
    document.getElementById("dirPrev").disabled = state.page <= 1;
    document.getElementById("dirNext").disabled = state.page >= totalPages;
    var from = rows.length ? start + 1 : 0;
    var to = Math.min(start + PAGE, rows.length);
    infoEl.textContent = "عرض " + from + "–" + to + " من " + rows.length + " سجل • " + state.page + " / " + totalPages + " صفحة";
  }

  function updateCounts() {
    document.getElementById("dirTabAll").textContent = people.length;
    document.getElementById("dirTabWorker").textContent = people.filter(function (p) { return p.type === "worker"; }).length;
    document.getElementById("dirTabCustomer").textContent = people.filter(function (p) { return p.type === "customer"; }).length;
  }

  function goPage(n) {
    state.page = n;
    render();
    /* لفّة ناعمة لبداية الجدول بعد تغيير الصفحة */
    if (wrap.scrollIntoView) {
      try { wrap.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { }
    }
  }

  /* ---- ربط الأحداث ---- */
  document.addEventListener("DOMContentLoaded", function () {
    updateCounts();
    render();

    Array.prototype.forEach.call(document.querySelectorAll("#dirTabs .dir-tab"), function (t) {
      t.addEventListener("click", function () {
        state.type = t.getAttribute("data-dir-type");
        state.page = 1;
        Array.prototype.forEach.call(document.querySelectorAll("#dirTabs .dir-tab"), function (x) {
          x.classList.toggle("active", x === t);
        });
        render();
      });
    });

    var q = document.getElementById("dirQ");
    var deb = null;
    q.addEventListener("input", function () {
      clearTimeout(deb);
      deb = setTimeout(function () {
        state.q = q.value;
        state.page = 1;
        render();
      }, 180);
    });

    document.getElementById("dirPrev").addEventListener("click", function () { goPage(state.page - 1); });
    document.getElementById("dirNext").addEventListener("click", function () { goPage(state.page + 1); });
    pagesEl.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-page]");
      if (b) goPage(parseInt(b.getAttribute("data-page"), 10));
    });
  });
})();
