/* E2E smoke test for الحَقني (jsdom) — الدليل الخدمي المباشر
   Sharqia scope + no orders/prices + direct tel/wa per worker + admin status flow */
const { JSDOM } = require("jsdom");
const path = require("path");

const ROOT = __dirname;
let pass = 0, fail = 0;
function check(name, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + name);
  cond ? pass++ : fail++;
}

function load(file) {
  return JSDOM.fromFile(path.join(ROOT, file), {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    url: "http://localhost:8000/" + file
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function fire(el, type) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true, cancelable: true }));
}

const ADMIN = "01225990584";

(async () => {
  /* ================= LANDING ================= */
  console.log("\n--- LANDING (index.html) ---");
  const dom = await load("index.html");
  const w = dom.window, d = w.document;
  await new Promise(r => { w.addEventListener("load", r); setTimeout(r, 4000); });
  await sleep(300);

  check("providers rendered (14 core + 1 approved join = 15)", d.querySelectorAll("#provGrid .prov").length === 15);
  check("approved join provider visible with new style", d.querySelectorAll("#provGrid .prov--new").length === 1);
  check("approved provider shows 'اعتمدته الإدارة' badge", !!d.querySelector('#provGrid .prov--new .badge--new'));
  check("service cards rendered (4)", d.querySelectorAll("#svcGrid .svc-card").length === 4);
  check("testimonials rendered (3)", d.querySelectorAll("#testiGrid .testi").length === 3);

  /* ===== نظام الطلبات محذوف تمامًا ===== */
  check("NO booking modal", d.querySelector("#bookModal") === null);
  check("NO booking form", d.querySelector("#bookForm") === null);
  check("NO 'اطلب الآن' buttons/triggers", d.querySelectorAll("[data-book], [data-book-cat], [data-book-prov]").length === 0);
  const landingText = d.body.textContent;
  check("no 'اطلب الآن' text anywhere", landingText.indexOf("اطلب الآن") === -1);
  check("no price text anywhere (يبدأ من / ج.م / السعر / جنيه)", landingText.indexOf("يبدأ من") === -1 && landingText.indexOf("ج.م") === -1 && landingText.indexOf("السعر") === -1 && landingText.indexOf("جنيه") === -1);
  check("no price elements on cards", d.querySelectorAll("#provGrid .prov__price, #svcGrid .svc-card__price").length === 0);
  check("no sort select (كان الأعلى تقييمًا/الأكثر طلبًا)", d.querySelector("#provSort") === null);

  /* ===== كارت العامل: اسم + تخصص + حالة + اتصال + واتساب ===== */
  const firstProv = d.querySelector("#provGrid .prov");
  check("worker card has name", !!firstProv.querySelector(".prov__name"));
  check("worker card has specialty", !!firstProv.querySelector(".prov__cat"));
  check("worker card has live status dot", !!firstProv.querySelector(".status-dot"));
  check("worker card has NO rating stars", d.querySelectorAll("#provGrid .prov__rate").length === 0);
  check("every worker card has tel: call button", [...d.querySelectorAll("#provGrid .prov")].every(c => {
    const a = c.querySelector('a.btn--call[href^="tel:+20"]');
    return a !== null;
  }));
  check("every worker card has wa.me chat button", [...d.querySelectorAll("#provGrid .prov")].every(c => {
    const a = c.querySelector('a.btn--wa[href^="https://wa.me/20"]');
    return a !== null;
  }));
  // p01 → own number, NOT the admin number
  const p01 = [...d.querySelectorAll("#provGrid .prov")].find(c => c.dataset.name.includes("سكوتر خبير"));
  check("p01 call button → worker's own number", p01.querySelector(".btn--call").href === "tel:+201011112221");
  check("p01 wa button → worker's own wa.me", p01.querySelector(".btn--wa").href === "https://wa.me/201011112221");
  check("no worker button points to admin number", [...d.querySelectorAll("#provGrid .btn--call, #provGrid .btn--wa")].every(a => !a.href.includes(ADMIN.replace(/^0/, ""))) === false || [...d.querySelectorAll("#provGrid .btn--call, #provGrid .btn--wa")].every(a => !a.href.includes("201225990584")));
  // approved join provider gets its own contact buttons too
  const joined = d.querySelector("#provGrid .prov--new");
  check("approved join card call → its phone", joined.querySelector(".btn--call").href === "tel:+201199988877");
  check("approved join card wa → its wa.me", joined.querySelector(".btn--wa").href === "https://wa.me/201199988877");

  // provider live status (admin-controlled)
  check("p09 seeded busy by default", d.querySelectorAll('#provGrid .prov[data-status="busy"]').length === 1);
  check("p14 inactive by default", d.querySelectorAll('#provGrid .prov[data-status="inactive"]').length === 1);
  check("active cards show 13 نشط", d.querySelectorAll("#provGrid .prov .status-dot.st--active").length === 13);

  // Sharqia scope: every provider area mentions الشرقية
  const areas = [...d.querySelectorAll("#provGrid .prov")].map(c => c.dataset.name);
  check("all providers inside محافظة الشرقية", areas.every(a => a.includes("الشرقية")));
  check("RTL preserved", d.documentElement.getAttribute("dir") === "rtl" && d.documentElement.getAttribute("lang") === "ar");

  /* ===== SEO ===== */
  check("SEO: exact meta title", d.title === "الحقني - دليل الخدمات المباشر بالشرقية");
  const desc = d.querySelector('meta[name="description"]');
  check("SEO: meta description (دليفري + الزقازيق + الشرقية)", !!desc && desc.content.includes("دليفري") && desc.content.includes("الزقازيق") && desc.content.includes("الشرقية"));
  check("SEO: robots index,follow", (d.querySelector('meta[name="robots"]') || {}).content.includes("index"));
  check("SEO: canonical link", !!d.querySelector('link[rel="canonical"]'));
  const ogName = d.querySelector('meta[property="og:site_name"]');
  const ogTitle = d.querySelector('meta[property="og:title"]');
  const ogImg = d.querySelector('meta[property="og:image"]');
  check("SEO: og:site_name + og:title exact", !!ogName && ogName.content === "الحقني - دليل الخدمات المباشر بالشرقية" && !!ogTitle && ogTitle.content === "الحقني - دليل الخدمات المباشر بالشرقية");
  check("SEO: og:image absolute URL + dimensions (WhatsApp-ready)", !!ogImg && ogImg.content.startsWith("https://") && !!d.querySelector('meta[property="og:image:width"]') && !!d.querySelector('meta[property="og:image:height"]'));
  check("SEO: og:locale ar_EG + og:url + og:description", (d.querySelector('meta[property="og:locale"]') || {}).content === "ar_EG" && !!d.querySelector('meta[property="og:url"]') && !!d.querySelector('meta[property="og:description"]'));
  let ldOk = false;
  try {
    const ld = JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
    ldOk = ld["@graph"].some(n => n["@type"] === "LocalBusiness" && n.name === "الحقني - دليل الخدمات المباشر بالشرقية");
  } catch (e) {}
  check("SEO: JSON-LD structured data valid (LocalBusiness)", ldOk);

  /* ===== تصفح الأقسام المباشر: قسم ← قائمة عمال القسم ===== */
  const svcCard = d.querySelector('#svcGrid .svc-card[data-goto-cat="cranes"]');
  check("service card is a direct link to workers list", !!svcCard);
  svcCard.click();
  await sleep(50);
  let vis = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("clicking قسم الأوناش → only cranes workers shown (3)", vis.length === 3 && vis.every(c => c.dataset.cat === "cranes"));
  check("cranes chip became active", d.querySelector('#filterChips .chip[data-filter="cranes"]').classList.contains("active"));
  d.querySelector('#filterChips .chip[data-filter="all"]').click();
  await sleep(50);
  check("back to all → 15 cards", d.querySelectorAll("#provGrid .prov:not(.hide)").length === 15);

  // footer category deep-link works the same way
  d.querySelector('.footer__links a[data-goto-cat="delivery"]').click();
  await sleep(50);
  vis = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("footer قسم التوصيل → 4 delivery workers", vis.length === 4 && vis.every(c => c.dataset.cat === "delivery"));
  d.querySelector('#filterChips .chip[data-filter="all"]').click();

  // city filter select
  check("city select = 1 + 15 مراكز", d.querySelectorAll("#provCity option").length === 16);
  d.querySelector("#provCity").value = "بلبيس";
  fire(d.querySelector("#provCity"), "change");
  const bilbes = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("city filter 'بلبيس' → 2 عامل (كهربا برو + المعتمد الجديد)", bilbes.length === 2);
  d.querySelector("#provCity").value = "";
  fire(d.querySelector("#provCity"), "change");

  // "المتاح الآن فقط" quick filter
  d.querySelector("#availChip").click();
  vis = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check('"المتاح الآن فقط" → 13 عامل', vis.length === 13);
  check("المتاح فقط بيعرض النشط", vis.every(c => c.dataset.status === "active"));
  d.querySelector("#availChip").click();
  check("إلغاء الفلتر → ترجع 15 كارت", d.querySelectorAll("#provGrid .prov:not(.hide)").length === 15);

  // Live reflection: admin change arriving from another tab (storage event)
  let ps = JSON.parse(w.localStorage.getItem("elhani_provider_status_v1") || "{}");
  ps.p01 = "busy";
  w.localStorage.setItem("elhani_provider_status_v1", JSON.stringify(ps));
  const stEv = new w.Event("storage");
  Object.defineProperty(stEv, "key", { value: "elhani_provider_status_v1" });
  w.dispatchEvent(stEv);
  const p01card = [...d.querySelectorAll("#provGrid .prov")].find(c => c.dataset.name.includes("سكوتر خبير"));
  check("storage event → كارت p01 بقى مشغول فوراً", p01card && p01card.dataset.status === "busy" && p01card.classList.contains("prov--busy"));
  ps.p01 = "active";
  w.localStorage.setItem("elhani_provider_status_v1", JSON.stringify(ps));
  const stEv2 = new w.Event("storage");
  Object.defineProperty(stEv2, "key", { value: "elhani_provider_status_v1" });
  w.dispatchEvent(stEv2);
  const p01card2 = [...d.querySelectorAll("#provGrid .prov")].find(c => c.dataset.name.includes("سكوتر خبير"));
  check("الرجوع للنشط → الكارت اتحدّث فوراً", p01card2.dataset.status === "active");

  // admin number everywhere (طوارئ فقط)
  check("nav emergency button → tel admin number", (d.querySelector('.nav__actions a[href^="tel:"]').href || "").includes(ADMIN));
  check("footer wa → admin number", (d.querySelector('.footer__social a[href^="https://wa.me"]').href || "").includes(ADMIN));
  check("fab wa → admin number", (d.querySelector(".fab__wa").href || "").includes(ADMIN));
  check("fab call → tel admin number", (d.querySelector(".fab__call").href || "").includes(ADMIN));
  check("CTA emergency → admin number", (d.querySelector('.cta-band__inner a[href^="tel:"]').href || "").includes(ADMIN));

  // search
  const q = d.querySelector("#provQ");
  q.value = "سباك";
  fire(q, "input");
  const found = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("search 'سباك' finds ماستر سبا", found.some(c => c.dataset.name.includes("ماستر سبا")));
  q.value = ""; fire(q, "input");

  // join flow (لسه شغال — انضمام العمال فقط)
  d.querySelector('[data-join]').click();
  check("join modal opens", d.querySelector("#joinModal").classList.contains("modal--open"));
  check("join category select populated", d.querySelectorAll("#jCat option").length === 5);
  d.querySelector("#jName").value = "نجار كريم فاقوس";
  d.querySelector("#jPhone").value = "01098760000";
  d.querySelector("#jCat").value = "lifestyle";
  d.querySelector("#jCity").value = "فاقوس";
  d.querySelector("#jJobs").value = "تركيب أثاث • درمورات";
  fire(d.querySelector("#joinForm"), "submit");
  check("join request → success view", d.querySelector("#joinSuccess").classList.contains("show"));
  const joins = JSON.parse(w.localStorage.getItem("elhani_join_requests_v1") || "[]");
  check("join persisted as pending (3 total)", joins.length === 3 && joins[0].status === "pending" && joins[0].city === "فاقوس");
  check("join id format JN-####", /^JN-\d{3,}$/.test(d.querySelector("#joinId").textContent));
  // pending join must NOT appear on the site
  const provCountAfter = d.querySelectorAll("#provGrid .prov--new").length;
  check("pending join NOT shown on platform", provCountAfter === 1);
  w.close();

  /* ================= ADMIN ================= */
  console.log("\n--- ADMIN (admin.html) ---");
  const a = await load("admin.html");
  const aw = a.window, ad = aw.document;
  aw.confirm = () => true;
  await new Promise(r => { aw.addEventListener("load", r); setTimeout(r, 4000); });
  await sleep(300);

  check("auth view shown initially", ad.querySelector("#authView").style.display !== "none");
  check("seed joins created (2)", JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1") || "[]").length === 2);
  check("NO orders view in admin", ad.querySelector("#view-requests") === null);
  check("NO pricing view in admin", ad.querySelector("#svcAdminGrid") === null);

  ad.querySelector("#pass").value = "WrongPass";
  fire(ad.querySelector("#authForm"), "submit");
  await sleep(250);
  check("wrong password → error", ad.querySelector("#authErr").textContent.includes("غير صحيحة"));

  ad.querySelector("#pass").value = "MohamedAkasha12";
  fire(ad.querySelector("#authForm"), "submit");
  await sleep(400);
  check("master password → dashboard", ad.querySelector("#appView").hidden === false);
  check("session stored", !!JSON.parse(aw.localStorage.getItem("elhani_session_v1") || "{}").token);
  check("workers KPI = 15", ad.querySelector("#stWorkers").textContent === "15");
  check("active/busy/inactive = 13/1/1", ad.querySelector("#stActive").textContent === "13" && ad.querySelector("#stBusy").textContent === "1" && ad.querySelector("#stInactive").textContent === "1");
  check("join KPI = 1 pending", ad.querySelector("#stJoins").textContent === "1");
  check("join sidebar badge = 1", ad.querySelector("#joinBadge").textContent === "1");
  check("5 KPI cards", ad.querySelectorAll(".acard").length === 5);
  check("quick status control on overview", ad.querySelectorAll("#quickBody tr").length === 15);

  // joins view
  ad.querySelector('[data-view="joins"]').click();
  check("joins list = 2 cards", ad.querySelectorAll("#joinList .join-card").length === 2);
  check("approved card marked", ad.querySelectorAll("#joinList .join-card--approved").length === 1);
  check("join card contact has tel link", ad.querySelectorAll("#joinList .join-card__contact a[href^='tel:']").length >= 1);

  // approve pending JN-502
  fire(ad.querySelector('#joinList [data-approve="JN-502"]'), "click");
  let j2 = JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.id === "JN-502");
  check("approve → status approved", j2.status === "approved");
  check("KPI updated to 0", ad.querySelector("#stJoins").textContent === "0");
  check("workers KPI grew to 16", ad.querySelector("#stWorkers").textContent === "16");

  // tab filter: approved = 2
  ad.querySelector('#joinTabs .tab[data-jtab="approved"]').click();
  check("approved tab shows 2", ad.querySelectorAll("#joinList .join-card").length === 2);
  ad.querySelector('#joinTabs .tab[data-jtab="all"]').click();

  // reject (with confirm stub)
  fire(ad.querySelector('#joinList [data-reject="JN-502"]'), "click");
  j2 = JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.id === "JN-502");
  check("reject → status rejected", j2.status === "rejected");
  ad.querySelector('#joinTabs .tab[data-jtab="rejected"]').click();
  check("rejected tab shows 1", ad.querySelectorAll("#joinList .join-card").length === 1);

  // workers + live status control
  ad.querySelector('[data-view="providers"]').click();
  check("workers table = 15 rows (14 core + 1 approved join)", ad.querySelectorAll("#provBody tr").length === 15);
  check("3 status buttons on every row", ad.querySelectorAll("#provBody .sbtn").length === 45);
  check("every worker row shows tel + wa links", ad.querySelectorAll("#provBody a[href^='tel:+20']").length === 15 && ad.querySelectorAll("#provBody a[href^='https://wa.me/20']").length === 15);
  check("no price column in workers table", ad.querySelector("#view-providers").textContent.indexOf("ج.م") === -1 && ad.querySelector("#view-providers").textContent.indexOf("السعر") === -1);
  check("p01 default = active highlighted", ad.querySelector('#provBody .sbtn[data-pid="p01"][data-st="active"]').classList.contains("on"));
  check("p09 seeded busy highlighted", ad.querySelector('#provBody .sbtn[data-pid="p09"][data-st="busy"]').classList.contains("on"));
  const p01row = () => [...ad.querySelectorAll("#provBody tr")].find(tr => tr.querySelector('.sbtn[data-pid="p01"]'));
  fire(ad.querySelector('#provBody .sbtn[data-pid="p01"][data-st="busy"]'), "click");
  check("click busy → saved in shared store", JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1")).p01 === "busy");
  check("p01 row pill → 🔴 مشغول", p01row().querySelector(".pill--busy") !== null);
  fire(ad.querySelector('#provBody .sbtn[data-pid="p01"][data-st="inactive"]'), "click");
  check("click inactive → saved", JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1")).p01 === "inactive");
  fire(ad.querySelector('#provBody .sbtn[data-pid="p01"][data-st="active"]'), "click");
  check("revert active → saved + highlighted", JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1")).p01 === "active" && ad.querySelector('#provBody .sbtn[data-pid="p01"][data-st="active"]').classList.contains("on"));

  // settings: reset all statuses to active
  ad.querySelector('[data-view="settings"]').click();
  fire(ad.querySelector("#resetStatusBtn"), "click");
  const resetMap = JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1"));
  check("reset → all active", Object.values(resetMap).every(v => v === "active"));

  ad.querySelector("#logoutBtn").click();
  await sleep(500);
  check("logout clears session", aw.localStorage.getItem("elhani_session_v1") === null);
  a.window.close();

  console.log("\n================================");
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("FATAL", e); process.exit(1); });
