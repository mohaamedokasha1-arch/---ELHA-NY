/* ============================================================
   الحَقني — ELHA'NI | Bottom Navigation (mobile-app style)
   إضافة تجميلية/تجريبية فقط: scroll-spy + تنقل سريع للتبويبات
   لا يعدّل أي منطق موجود في app.js — بيستخدم نفس الـ chips والأنكورز.
   ============================================================ */
(function () {
  "use strict";

  var bar = document.getElementById("bottomNav");
  if (!bar) return;

  var items = Array.prototype.slice.call(bar.querySelectorAll("[data-bnav]"));
  var SCROLL_IDS = ["hero", "services", "providers", "join"]; // أقسام الـ scroll-spy
  var byId = {};
  items.forEach(function (item) { byId[item.getAttribute("data-bnav")] = item; });

  function setActive(id) {
    items.forEach(function (item) {
      var isActive = item.getAttribute("data-bnav") === id;
      item.classList.toggle("active", isActive);
      if (isActive) {
        item.setAttribute("aria-current", "true");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  }

  /* تفعيل مؤقت للتبويبات الخاصة (اتصال / دليفري) فور الضغط */
  function flashActive(item) {
    setActive(item.getAttribute("data-bnav"));
    setTimeout(function () {
      if (item.getAttribute("data-bnav") !== "hero") onScroll();
    }, 1500);
  }

  /* ---- Scroll spy: التبويب النشط بيتغير مع اللفة ---- */
  var sections = SCROLL_IDS
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function onScroll() {
    var y = window.scrollY + window.innerHeight * 0.4;
    var current = SCROLL_IDS[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= y) current = sec.id;
    });
    setActive(current);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- نقرات الشريط: تنقل ناعم + تفعيل فلتر القسم فوراً ---- */
  document.addEventListener("click", function (e) {
    var item = e.target && e.target.closest ? e.target.closest("[data-bnav]") : null;
    if (!item) return;

    var id = item.getAttribute("data-bnav");
    var chipSel = item.getAttribute("data-bnav-chip");

    /* تبويب الدليفري: يفعّل فلتر قسم التوصيل الموجود أصلاً في app.js ثم يلف للقسم */
    if (chipSel) {
      e.preventDefault();
      var chip = document.querySelector(chipSel);
      if (chip) chip.click();
      var target = document.getElementById(item.getAttribute("href").slice(1));
      if (target && target.scrollIntoView) {
        try { target.scrollIntoView({ behavior: "smooth" }); } catch (err) { target.scrollIntoView(); }
      }
      flashActive(item);
      return;
    }

    /* خط الطوارئ: تبويب شغال فعلياً (tel:) — نضيف الإضاءة المؤقتة فقط */
    if (id === "call") {
      flashActive(item);
      return;
    }

    /* باقي التبويبات: سكرول ناعم (بدل القفزة) وإضاءة فورية */
    var href = item.getAttribute("href");
    if (href && href.charAt(0) === "#") {
      var sec = document.getElementById(href.slice(1));
      if (sec) {
        e.preventDefault();
        if (sec.scrollIntoView) {
          try { sec.scrollIntoView({ behavior: "smooth" }); } catch (err) { sec.scrollIntoView(); }
        }
      }
    }
    flashActive(item);
  });
})();
