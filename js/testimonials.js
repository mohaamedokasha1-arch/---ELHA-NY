/* ============================================================
   الحَقني — ELHA'NI | آراء العملاء (Testimonials)
   عرض سلايدر متحرك + فلترة بالأقسام + إحصائية تقييم
   إضافة مستقلة: لا تعدّل أي منطق في app.js / bottomnav.js
   لو بيانات الآراء غايب => يرجع بصمت والموقع زي ما هو
   ============================================================ */
(function () {
  "use strict";

  function start() {
  var DATA = window.ELHANI_TESTIMONIALS;
  if (!DATA || !DATA.items || !DATA.items.length) return;

  var grid = document.getElementById("testiGrid");
  if (!grid) return;

  var items = DATA.items;
  var CATS = {
    delivery:    { icon: "🛵", label: "دليفري" },
    maintenance: { icon: "🔧", label: "صيانة طارئة" },
    cranes:      { icon: "🏗️", label: "أوناش" },
    lifestyle:   { icon: "✨", label: "معيشية" }
  };
  var state = { cat: "all", idx: 0, view: perView() };
  var track, dotsWrap, prevBtn, nextBtn, timer = null, flicked = null;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function perView() {
    var w = document.documentElement.clientWidth || window.innerWidth || 1024;
    return w >= 1024 ? 3 : w >= 700 ? 2 : 1;
  }
  function visible() {
    return state.cat === "all" ? items : items.filter(function (t) { return t.cat === state.cat; });
  }
  function starsHtml(stars) {
    var out = "", i;
    for (i = 0; i < 5; i++) {
      var cls = "trv-star";
      if (stars >= i + 1) cls += " on";
      else if (stars > i) cls += " half";
      out += '<span class="' + cls + '" aria-hidden="true">★</span>';
    }
    return out;
  }
  function cardHtml(t, i) {
    var cat = CATS[t.cat] || { icon: "⭐", label: t.cat };
    return (
      '<article class="trv-card" data-cat="' + esc(t.cat) + '" data-id="' + esc(t.id) + '">' +
        '<div class="trv-card__top">' +
          '<span class="trv-card__pill trv-pill--' + esc(t.cat) + '">' + cat.icon + " " + esc(cat.label) + "</span>" +
          '<span class="trv-card__stars" title="' + esc(t.stars) + ' من 5">' + starsHtml(t.stars) + "</span>" +
        "</div>" +
        '<p class="trv-card__text">“' + esc(t.text) + '”</p>' +
        '<div class="trv-card__who">' +
          '<div class="trv-card__ava">' + esc(t.name.charAt(0)) + "</div>" +
          "<div>" +
            '<div class="trv-card__name">' + esc(t.name) + "</div>" +
            '<div class="trv-card__meta">' + esc(t.city) + " — " + esc(t.gov) + "</div>" +
          "</div>" +
          '<div class="trv-card__side">' +
            '<span class="trv-card__svc">' + esc(t.service) + "</span>" +
            '<span class="trv-card__since">' + esc(t.since) + "</span>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function build() {
    var list = visible();
    var avg = DATA.meta && DATA.meta.avg ? DATA.meta.avg : 4.8;
    var govs = DATA.meta && DATA.meta.governorates ? DATA.meta.governorates : 1;
    var tabsHtml = ['<button class="trv-tab active" data-cat="all" type="button">الكل <b>' + items.length + "</b></button>"].concat(
      Object.keys(CATS).map(function (id) {
        var n = items.filter(function (t) { return t.cat === id; }).length;
        return '<button class="trv-tab" data-cat="' + id + '" type="button">' + CATS[id].icon + " " + CATS[id].label + " <b>" + n + "</b></button>";
      }).join("")
    ).join("");

    grid.innerHTML =
      '<div class="trv-wrap">' +
        '<div class="trv-stats">' +
          '<div class="trv-score">' +
            '<div class="trv-score__num">' + esc(avg) + "</div>" +
            '<div class="trv-score__info">' +
              '<div class="trv-score__stars" aria-hidden="true">★★★★★</div>' +
              '<div class="trv-score__cap">متوسط تقييم العملاء</div>' +
            "</div>" +
          "</div>" +
          '<div class="trv-facts">' +
            '<div class="trv-fact"><b>' + items.length + "</b><span>رأي حقيقي موثّق</span></div>" +
            '<div class="trv-fact"><b>' + govs + "</b><span>محافظة مصرية</span></div>" +
            '<div class="trv-fact"><b>100%</b><span>تواصل مباشر مع العامل</span></div>' +
          "</div>" +
        "</div>" +
        '<div class="trv-tabs" id="trvTabs" role="tablist" aria-label="فلترة الآراء حسب الخدمة">' + tabsHtml + "</div>" +
        '<div class="trv-slider">' +
          '<button class="trv-arrow trv-arrow--prev" id="trvPrev" type="button" aria-label="الرأي السابق">‹</button>' +
          '<div class="trv-viewport" id="trvViewport">' +
            '<div class="trv-track" id="trvTrack" data-idx="0" aria-live="polite">' +
              list.map(cardHtml).join("") +
            "</div>" +
          "</div>" +
          '<button class="trv-arrow trv-arrow--next" id="trvNext" type="button" aria-label="الرأي التالي">›</button>' +
        "</div>" +
        '<div class="trv-dots" id="trvDots" role="tablist" aria-label="صفحات الآراء"></div>' +
      "</div>";

    track = grid.querySelector("#trvTrack");
    dotsWrap = grid.querySelector("#trvDots");
    prevBtn = grid.querySelector("#trvPrev");
    nextBtn = grid.querySelector("#trvNext");

    grid.querySelectorAll(".trv-tab").forEach(function (b) {
      b.addEventListener("click", function () {
        grid.querySelectorAll(".trv-tab").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        state.cat = b.getAttribute("data-cat");
        state.idx = 0;
        render();
      });
    });
    prevBtn.addEventListener("click", function () { go(state.idx - 1); });
    nextBtn.addEventListener("click", function () { go(state.idx + 1); });

    var vp = grid.querySelector("#trvViewport");
    vp.addEventListener("mouseenter", pause);
    vp.addEventListener("mouseleave", play);
    vp.addEventListener("focusin", pause);
    vp.addEventListener("focusout", play);
    vp.addEventListener("touchstart", function () { pause(); }, { passive: true });
    vp.addEventListener("touchend", function () { setTimeout(play, 3500); }, { passive: true });
    vp.addEventListener("keydown", function (e) {
      var rtl = getComputedStyle(track).direction === "rtl";
      if (e.key === "ArrowLeft") go(rtl ? state.idx + 1 : state.idx - 1);
      if (e.key === "ArrowRight") go(rtl ? state.idx - 1 : state.idx + 1);
    });
    vp.setAttribute("tabindex", "0");
    vp.setAttribute("role", "region");
    vp.setAttribute("aria-roledescription", "carousel");

    render();
    play();
  }

  function render() {
    if (!track) return;
    var list = visible();
    var cardEls;

    /* إعادة بناء البطاقات (مهم عند تغيير فلتر القسم) */
    track.innerHTML = list.map(cardHtml).join("");
    cardEls = track.children;

    /* أنيميشن دخول لكل البطاقات */
    for (i = 0; i < cardEls.length; i++) {
      cardEls[i].classList.remove("trv-in");
      cardEls[i].style.animationDelay = (i * 45) + "ms";
      /* إعادة تشغيل الأنيميشن */
      void cardEls[i].offsetWidth;
      cardEls[i].classList.add("trv-in");
    }

    var gap = 18;
    var vpW = track.parentElement.clientWidth || (window.innerWidth || 1024) * 0.86;
    var maxIdx = Math.max(0, list.length - state.view);
    state.idx = Math.max(0, Math.min(state.idx, maxIdx));

    var itemW = Math.max(120, (vpW - gap * (state.view - 1)) / state.view);
    for (i = 0; i < cardEls.length; i++) cardEls[i].style.width = itemW + "px";

    applyTransform();

    /* النقاط */
    var dots = [];
    for (i = 0; i <= maxIdx; i++) {
      dots.push('<button class="trv-dot' + (i === state.idx ? " active" : "") + '" data-i="' + i + '" type="button" aria-label="عرض الآراء من ' + (i + 1) + '"' + (i === state.idx ? ' aria-current="true"' : "") + "></button>");
    }
    dotsWrap.innerHTML = dots.join("");
    dotsWrap.querySelectorAll(".trv-dot").forEach(function (b) {
      b.addEventListener("click", function () { go(parseInt(b.getAttribute("data-i"), 10)); });
    });

    prevBtn.disabled = maxIdx === 0 || state.idx === 0;
    nextBtn.disabled = maxIdx === 0 || state.idx >= maxIdx;
  }

  function applyTransform() {
    if (!track) return;
    var card = track.children[0];
    var step = card ? (card.offsetWidth || parseFloat(card.style.width) || 0) + 18 : 0;
    var rtl = getComputedStyle(track).direction === "rtl";
    var dir = rtl ? 1 : -1;
    track.style.transform = "translateX(" + (dir * state.idx * step) + "px)";
    track.setAttribute("data-idx", state.idx);
  }

  function go(i) {
    var list = visible();
    var maxIdx = Math.max(0, list.length - state.view);
    state.idx = Math.max(0, Math.min(i, maxIdx));
    applyTransform();
    var dots = dotsWrap && dotsWrap.children;
    if (dots) {
      for (var k = 0; k < dots.length; k++) {
        var on = parseInt(dots[k].getAttribute("data-i"), 10) === state.idx;
        dots[k].classList.toggle("active", on);
        if (on) dots[k].setAttribute("aria-current", "true");
        else dots[k].removeAttribute("aria-current");
      }
    }
    if (prevBtn) prevBtn.disabled = maxIdx === 0 || state.idx === 0;
    if (nextBtn) nextBtn.disabled = maxIdx === 0 || state.idx >= maxIdx;
    refreshTimer();
  }

  function next() {
    var list = visible();
    var maxIdx = Math.max(0, list.length - state.view);
    if (maxIdx === 0) return;
    go(state.idx >= maxIdx ? 0 : state.idx + 1);
  }
  function play() {
    if (timer) return;
    timer = setInterval(function () {
      if (!document.hidden) next();
    }, 5200);
  }
  function pause() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function refreshTimer() { pause(); play(); }

  var resizeT = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      state.view = perView();
      render();
    }, 150);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(); else play();
  });

  build();
  }

  /* نشغّل بعد الانتهاء من تحميل كل السكريبتات عشان ما نتصادمش مع رسم app.js */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
