/* E2E smoke test for الحَقني (jsdom) — Sharqia scope + admin number + join approval flow */
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

  // provider live status (admin-controlled)
  check("p09 seeded busy by default", d.querySelectorAll('#provGrid .prov[data-status="busy"]').length === 1);
  check("p14 inactive by default", d.querySelectorAll('#provGrid .prov[data-status="inactive"]').length === 1);
  check("inactive card shows disabled button (no booking)", !!d.querySelector('#provGrid .prov[data-status="inactive"] button[disabled]') && d.querySelector('#provGrid .prov[data-status="inactive"] [data-book-prov]') === null);
  check("active cards show 'متاح الآن'", d.querySelectorAll("#provGrid .prov .status-dot.st--active").length === 13);

  // Sharqia scope: every provider area mentions الشرقية
  const areas = [...d.querySelectorAll("#provGrid .prov")].map(c => c.dataset.name);
  check("all providers inside محافظة الشرقية", areas.every(a => a.includes("الشرقية")));

  // NO prices anywhere on the public site
  const landingText = d.body.textContent;
  check("no price text anywhere on site (يبدأ من / ج.م / حسب الخدمة / السعر / جنيه)", landingText.indexOf("يبدأ من") === -1 && landingText.indexOf("ج.م") === -1 && landingText.indexOf("حسب الخدمة") === -1 && landingText.indexOf("السعر") === -1 && landingText.indexOf("جنيه") === -1);
  check("no price elements on cards", d.querySelectorAll("#provGrid .prov__price, #svcGrid .svc-card__price").length === 0);
  check("no budget field in booking form", d.querySelector("#fBudget") === null);
  check("no sort-by-price option", d.querySelector('#provSort option[value="price"]') === null);
  check("provider card keeps name+rating+status+book", !!d.querySelector("#provGrid .prov .prov__name") && !!d.querySelector("#provGrid .prov .prov__rate") && !!d.querySelector("#provGrid .prov .status-dot") && !!d.querySelector("#provGrid .prov [data-book-prov]"));

  // city filter select
  check("city select = 1 + 15 مراكز", d.querySelectorAll("#provCity option").length === 16);
  d.querySelector("#provCity").value = "بلبيس";
  fire(d.querySelector("#provCity"), "change");
  const bilbes = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("city filter 'بلبيس' → 2 مزود (كهربا برو + المعتمد الجديد)", bilbes.length === 2);
  d.querySelector("#provCity").value = "";
  fire(d.querySelector("#provCity"), "change");

  // "المتاح الآن فقط" quick filter
  d.querySelector("#availChip").click();
  let vis = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check('"المتاح الآن فقط" → 13 مزود', vis.length === 13);
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

  // admin number everywhere
  check("nav emergency button → tel admin number", (d.querySelector('.nav__actions a[href^="tel:"]').href || "").includes(ADMIN));
  check("footer wa → admin number", (d.querySelector('.footer__social a[href^="https://wa.me"]').href || "").includes(ADMIN));
  check("fab wa → admin number", (d.querySelector(".fab__wa").href || "").includes(ADMIN));
  check("fab call → tel admin number", (d.querySelector(".fab__call").href || "").includes(ADMIN));
  check("CTA emergency → admin number", (d.querySelector('.cta-band__inner a[href^="tel:"]').href || "").includes(ADMIN));

  // filter + search (reset to all first)
  d.querySelector('#filterChips .chip[data-filter="cranes"]').click();
  const visibleCranes = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("cranes filter → 3 visible", visibleCranes.length === 3);
  d.querySelector('#filterChips .chip[data-filter="all"]').click();
  const q = d.querySelector("#provQ");
  q.value = "سباك";
  fire(q, "input");
  const found = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("search 'سباك' finds ماستر سبا", found.some(c => c.dataset.name.includes("ماستر سبا")));
  q.value = ""; fire(q, "input");

  // booking flow (with required city)
  d.querySelector('[data-book]').click();
  check("modal opens", d.querySelector("#bookModal").classList.contains("modal--open"));
  check("category select populated", d.querySelectorAll("#fCat option").length === 5);
  check("city select populated (16)", d.querySelectorAll("#fCity option").length === 16);
  d.querySelector("#fCat").value = "maintenance";
  d.querySelector("#fService").value = "سباكة طوارئ";
  d.querySelector("#fName").value = "عميل تجريبي";
  d.querySelector("#fPhone").value = "01012345678";
  d.querySelector("#fAddr").value = "الزقازيق، حي الصفا، شارع 9";
  // missing city → rejected
  fire(d.querySelector("#bookForm"), "submit");
  check("booking without city rejected", d.querySelector("#bookSuccess").classList.contains("show") === false);
  d.querySelector("#fCity").value = "الزقازيق";
  fire(d.querySelector("#bookForm"), "submit");
  check("valid booking → success view", d.querySelector("#bookSuccess").classList.contains("show"));
  const stored = JSON.parse(w.localStorage.getItem("elhani_requests_v1") || "[]");
  check("request persisted with city", stored.length === 1 && stored[0].city === "الزقازيق" && stored[0].status === "pending");
  check("order id format EHN-####", /^EHN-\d{4,}$/.test(d.querySelector("#reqId").textContent));
  d.querySelector('#bookSuccess [data-close]').click();

  // join flow
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
  check("seed requests created (12)", JSON.parse(aw.localStorage.getItem("elhani_requests_v1") || "[]").length === 12);
  check("seed joins created (2)", JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1") || "[]").length === 2);

  ad.querySelector("#pass").value = "WrongPass";
  fire(ad.querySelector("#authForm"), "submit");
  await sleep(250);
  check("wrong password → error", ad.querySelector("#authErr").textContent.includes("غير صحيحة"));

  ad.querySelector("#pass").value = "MohamedAkasha12";
  fire(ad.querySelector("#authForm"), "submit");
  await sleep(400);
  check("master password → dashboard", ad.querySelector("#appView").hidden === false);
  check("session stored", !!JSON.parse(aw.localStorage.getItem("elhani_session_v1") || "{}").token);
  check("total = 12 / pending = 2 / done = 8", ad.querySelector("#stTotal").textContent === "12" && ad.querySelector("#stPending").textContent === "2" && ad.querySelector("#stDone").textContent === "8");
  check("join KPI = 1 pending", ad.querySelector("#stJoins").textContent === "1");
  check("join sidebar badge = 1", ad.querySelector("#joinBadge").textContent === "1");
  check("revenue populated", +ad.querySelector("#stRevenue").textContent.replace(/[^\d]/g, "") > 0);
  check("5 KPI cards", ad.querySelectorAll(".acard").length === 5);

  // joins view
  ad.querySelector('[data-view="joins"]').click();
  check("joins list = 2 cards", ad.querySelectorAll("#joinList .join-card").length === 2);
  check("approved card marked", ad.querySelectorAll("#joinList .join-card--approved").length === 1);
  check("join card contact has admin-style tel link", ad.querySelectorAll("#joinList .join-card__contact a[href^='tel:']").length >= 1);

  // approve pending JN-502
  fire(ad.querySelector('#joinList [data-approve="JN-502"]'), "click");
  let j2 = JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.id === "JN-502");
  check("approve → status approved", j2.status === "approved");
  check("badge cleared after approving all", ad.querySelector("#joinBadge").textContent === "0");
  check("KPI updated to 0", ad.querySelector("#stJoins").textContent === "0");

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

  // requests view still fine
  ad.querySelector('[data-view="requests"]').click();
  check("requests table = 12 rows", ad.querySelectorAll("#reqBody tr").length === 12);

  // providers + live status control
  ad.querySelector('[data-view="providers"]').click();
  check("providers table = 15 rows (14 core + 1 approved join)", ad.querySelectorAll("#provBody tr").length === 15);
  check("3 status buttons on every row", ad.querySelectorAll("#provBody .sbtn").length === 45);
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

  ad.querySelector('[data-view="services"]').click();
  const inp = ad.querySelector("#price-delivery");
  inp.value = "25";
  fire(ad.querySelector('[data-saveprice="delivery"]'), "click");
  check("price edit persisted", JSON.parse(aw.localStorage.getItem("elhani_admin_prices_v1")).delivery === 25);

  ad.querySelector("#logoutBtn").click();
  await sleep(500);
  check("logout clears session", aw.localStorage.getItem("elhani_session_v1") === null);
  a.window.close();

  console.log("\n================================");
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("FATAL", e); process.exit(1); });
