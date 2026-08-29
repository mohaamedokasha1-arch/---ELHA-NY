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

  check("NO fake/demo providers rendered (directory starts empty)", d.querySelectorAll("#provGrid .prov").length === 0);
  check("empty state shown for empty directory", d.querySelector("#provEmpty").classList.contains("show"));
  check("NO demo badge or demo cards anywhere", d.querySelectorAll("#provGrid .prov--demo, #provGrid .badge--demo, #provGrid [data-demo-contact]").length === 0);
  check("demoProviders removed from data layer", !("demoProviders" in w.ELHANI_DATA));

  /* ===== عدادات صادقة (بدون أرقام إنجازات ملفقة) ===== */
  const counts = [...d.querySelectorAll("#stats .cnt")].map(c => c.getAttribute("data-count"));
  check("العدادات: 4 أقسام / 15 مركز / 24-7 / 100% مراجعة يدوية", counts.join(",") === "4,15,24,100" && !!d.querySelector("#stats .suf"));
  const statsText = d.querySelector("#stats").textContent;
  check("مفيش أرقام ملفقة قديمة (12480 / 850 / تقييم 4.9)", statsText.indexOf("12480") === -1 && statsText.indexOf("850") === -1 && statsText.indexOf("4.9") === -1);

  /* ===== هوية مرحلة الإطلاق ===== */
  check("بادج «إطلاق جديد» في الهيرو", !!d.querySelector(".hero__badge--launch"));
  const launch = d.querySelector("#launch");
  check("بانر «كن من أول العمال في مركزك» موجود", !!launch && !!launch.querySelector(".launch__panel.gold-frame") && launch.textContent.includes("أول العمال"));
  check("مكان البانر: بين الإحصائيات والأقسام", launch.previousElementSibling.id === "stats" && launch.nextElementSibling.id === "services");
  check("بانر الإطلاق بأرقام حقيقية بس (15 مركز / 4 أقسام / 24-7)", launch.querySelectorAll(".launch__chip").length === 3 && !/850|14,?327|4\.9/.test(launch.textContent));
  check("الدليل الفاضي فيه CTA انضمام", !!d.querySelector("#provEmpty [data-join]"));
  d.querySelector("#launch [data-join]").click();
  check("زر البانر بيفتح فورم الانضمام", d.querySelector("#joinModal").classList.contains("modal--open"));
  d.querySelector("#joinModal [data-close]").click();
  check("وإغلاق المودال شغال برضه", !d.querySelector("#joinModal").classList.contains("modal--open"));
  check("service cards rendered (4)", d.querySelectorAll("#svcGrid .svc-card").length === 4);
  check("NO fake testimonials — section removed", d.querySelector("#reviews") === null && d.querySelector("#testiGrid") === null);
  const tickerItems = [...d.querySelectorAll("#tickerTrack .ticker__item")];
  check("ticker runs with no fake workers mentioned", tickerItems.length > 0 && !tickerItems.some(t => t.textContent.includes("سكوتر خبير")));

  /* ===== نظام الطلبات محذوف تمامًا ===== */
  check("NO booking modal", d.querySelector("#bookModal") === null);
  check("NO booking form", d.querySelector("#bookForm") === null);
  check("NO 'اطلب الآن' buttons/triggers", d.querySelectorAll("[data-book], [data-book-cat], [data-book-prov]").length === 0);
  const landingText = d.body.textContent;
  check("no 'اطلب الآن' text anywhere", landingText.indexOf("اطلب الآن") === -1);
  check("no price text anywhere (يبدأ من / ج.م / السعر / جنيه)", landingText.indexOf("يبدأ من") === -1 && landingText.indexOf("ج.م") === -1 && landingText.indexOf("السعر") === -1 && landingText.indexOf("جنيه") === -1);
  check("no price elements on cards", d.querySelectorAll("#provGrid .prov__price, #svcGrid .svc-card__price").length === 0);
  check("no sort select (كان الأعلى تقييمًا/الأكثر طلبًا)", d.querySelector("#provSort") === null);

  /* (كارت العامل بيختبر بعد ما يظهر عامل حقيقي معتمد من الإدارة تحت) */
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
  check("clicking قسم الأوناش → no workers yet (empty)", vis.length === 0);
  check("cranes chip became active", d.querySelector('#filterChips .chip[data-filter="cranes"]').classList.contains("active"));
  d.querySelector('#filterChips .chip[data-filter="all"]').click();
  await sleep(50);
  check("back to all → still 0 cards", d.querySelectorAll("#provGrid .prov:not(.hide)").length === 0);

  // footer category deep-link works the same way
  d.querySelector('.footer__links a[data-goto-cat="delivery"]').click();
  await sleep(50);
  vis = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("footer قسم التوصيل → no workers yet (empty)", vis.length === 0);
  d.querySelector('#filterChips .chip[data-filter="all"]').click();

  // city filter select
  check("city select = 1 + 15 مراكز", d.querySelectorAll("#provCity option").length === 16);
  d.querySelector("#provCity").value = "بلبيس";
  fire(d.querySelector("#provCity"), "change");
  const bilbes = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("city filter 'بلبيس' → 0 عمال", bilbes.length === 0);
  d.querySelector("#provCity").value = "";
  fire(d.querySelector("#provCity"), "change");

  // "المتاح الآن فقط" quick filter
  d.querySelector("#availChip").click();
  vis = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check('"المتاح الآن فقط" → 0 عمال', vis.length === 0);
  d.querySelector("#availChip").click();
  check("إلغاء الفلتر → فاضية برضه", d.querySelectorAll("#provGrid .prov:not(.hide)").length === 0);

  /* ===== إخلاء المسئولية الرسمي عن الأرقام والبيانات ===== */
  const disc = d.querySelector("#disclaimer");
  check("قسم إخلاء المسئولية موجود وبارز (gold-frame)", !!disc && !!disc.querySelector(".disclaimer__panel.gold-frame"));
  const discText = disc ? disc.textContent : "";
  check("التنبيه يوضح: بيانات السيستم هي المعتمدة رسميًا", discText.includes("المعتمدة رسميًا") && discText.includes("الإدارة"));
  check("التنبيه يوضح: الإدارة غير مسئولة عن البيانات المستبعدة بره السيستم", discText.includes("غير مسئولة") && discText.includes("بره السيستم") && discText.includes("بتُستبعد"));
  check("المكان المناسب: بعد بانر CTA مباشرة وقبل الفوتر", disc.previousElementSibling.classList.contains("cta-band") && disc.parentElement.nextElementSibling.tagName === "FOOTER");

  // admin number everywhere (طوارئ فقط)
  check("nav emergency button → tel admin number", (d.querySelector('.nav__actions a[href^="tel:"]').href || "").includes(ADMIN));
  check("footer wa → admin number", (d.querySelector('.footer__social a[href^="https://wa.me"]').href || "").includes(ADMIN));
  check("fab wa → admin number", (d.querySelector(".fab__wa").href || "").includes(ADMIN));
  check("fab call → tel admin number", (d.querySelector(".fab__call").href || "").includes(ADMIN));
  check("CTA emergency → admin number", (d.querySelector('.cta-band__inner a[href^="tel:"]').href || "").includes(ADMIN));

  // join flow (لسه شغال — انضمام العمال الحقيقيين فقط)
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
  check("join persisted as pending (1 total — مفيش بيانات مزروعة)", joins.length === 1 && joins[0].status === "pending" && joins[0].city === "فاقوس");
  check("join id format JN-####", /^JN-\d{3,}$/.test(d.querySelector("#joinId").textContent));
  // pending join must NOT appear on the site
  check("pending join NOT shown on platform", d.querySelectorAll("#provGrid .prov--new").length === 0);

  /* ===== كارت العامل الحقيقي: يظهر بس بعد اعتماد الإدارة ===== */
  const jid = joins[0].id;
  joins[0].status = "approved";
  w.localStorage.setItem("elhani_join_requests_v1", JSON.stringify(joins));
  const jEv = new w.Event("storage");
  Object.defineProperty(jEv, "key", { value: "elhani_join_requests_v1" });
  w.dispatchEvent(jEv);
  const card = d.querySelector("#provGrid .prov--new");
  check("approved join appears instantly (storage event)", !!card);
  check("approved card shows 'اعتمدته الإدارة' badge", !!card.querySelector(".badge--new"));
  check("worker card has name", !!card.querySelector(".prov__name"));
  check("worker card has specialty", !!card.querySelector(".prov__cat"));
  check("worker card has live status dot", !!card.querySelector(".status-dot"));
  check("worker card has NO rating stars", card.querySelector(".prov__rate") === null);
  check("worker call button → his own number (NOT admin)", card.querySelector(".btn--call").href === "tel:+201098760000" && !card.querySelector(".btn--call").href.includes("201225990584"));
  check("worker wa button → his own wa.me", card.querySelector(".btn--wa").href === "https://wa.me/201098760000");
  check("worker inside محافظة الشرقية", card.dataset.name.includes("الشرقية"));

  // Live reflection: admin status change arriving from another tab (storage event)
  let ps = JSON.parse(w.localStorage.getItem("elhani_provider_status_v1") || "{}");
  ps[jid] = "busy";
  w.localStorage.setItem("elhani_provider_status_v1", JSON.stringify(ps));
  const stEv = new w.Event("storage");
  Object.defineProperty(stEv, "key", { value: "elhani_provider_status_v1" });
  w.dispatchEvent(stEv);
  const busyCard = d.querySelector("#provGrid .prov");
  check("storage event → كارت العامل بقى مشغول فوراً", busyCard && busyCard.dataset.status === "busy" && busyCard.classList.contains("prov--busy"));
  ps[jid] = "active";
  w.localStorage.setItem("elhani_provider_status_v1", JSON.stringify(ps));
  const stEv2 = new w.Event("storage");
  Object.defineProperty(stEv2, "key", { value: "elhani_provider_status_v1" });
  w.dispatchEvent(stEv2);
  check("الرجوع للنشط → الكارت اتحدّث فوراً", d.querySelector("#provGrid .prov").dataset.status === "active");

  // search finds the REAL approved worker
  const q = d.querySelector("#provQ");
  q.value = "نجار كريم";
  fire(q, "input");
  const found = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check("search 'نجار كريم' finds the approved worker", found.length === 1 && found[0].dataset.name.includes("نجار كريم"));
  q.value = ""; fire(q, "input");

  // "المتاح الآن فقط" quick filter → only the real active worker
  d.querySelector("#availChip").click();
  vis = [...d.querySelectorAll("#provGrid .prov")].filter(c => !c.classList.contains("hide"));
  check('"المتاح الآن فقط" → العامل الحقيقي النشط بس', vis.length === 1 && vis[0].dataset.status === "active");
  d.querySelector("#availChip").click();
  w.close();

  /* ================= ADMIN ================= */
  console.log("\n--- ADMIN (admin.html) ---");
  const a = await load("admin.html");
  const aw = a.window, ad = aw.document;
  aw.confirm = () => true;
  await new Promise(r => { aw.addEventListener("load", r); setTimeout(r, 4000); });
  await sleep(300);

  check("auth view shown initially", ad.querySelector("#authView").style.display !== "none");
  check("NO fake seeded joins (empty)", JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1") || "[]").length === 0);
  check("NO orders view in admin", ad.querySelector("#view-requests") === null);
  check("NO pricing view in admin", ad.querySelector("#svcAdminGrid") === null);

  /* طلب انضمام حقيقي (زي ما بيوصل من فورم الموقع) */
  aw.localStorage.setItem("elhani_join_requests_v1", JSON.stringify([{
    id: "JN-900", ts: Date.now() - 3600e3, name: "كهربائي ههيا السريع", phone: "01012345678",
    cat: "maintenance", catName: "صيانة منزلية طارئة", jobs: "كهرباء • حملات • عدادات", city: "ههيا", wa: "",
    notes: "خبرة 8 سنوات", status: "pending"
  }]));

  ad.querySelector("#pass").value = "WrongPass";
  fire(ad.querySelector("#authForm"), "submit");
  await sleep(250);
  check("wrong password → error", ad.querySelector("#authErr").textContent.includes("غير صحيحة"));

  ad.querySelector("#pass").value = "MohamedAkasha12";
  fire(ad.querySelector("#authForm"), "submit");
  await sleep(400);
  check("master password → dashboard", ad.querySelector("#appView").hidden === false);
  check("session stored", !!JSON.parse(aw.localStorage.getItem("elhani_session_v1") || "{}").token);
  check("workers KPI = 0 (no fake workers)", ad.querySelector("#stWorkers").textContent === "0");
  check("active/busy/inactive = 0/0/0", ad.querySelector("#stActive").textContent === "0" && ad.querySelector("#stBusy").textContent === "0" && ad.querySelector("#stInactive").textContent === "0");
  check("join KPI = 1 pending", ad.querySelector("#stJoins").textContent === "1");
  check("join sidebar badge = 1", ad.querySelector("#joinBadge").textContent === "1");
  check("5 KPI cards", ad.querySelectorAll(".acard").length === 5);
  check("quick status control on overview (0 rows)", ad.querySelectorAll("#quickBody tr").length === 0);

  // joins view
  ad.querySelector('[data-view="joins"]').click();
  check("joins list = 1 card", ad.querySelectorAll("#joinList .join-card").length === 1);
  check("no approved cards yet", ad.querySelectorAll("#joinList .join-card--approved").length === 0);
  check("join card contact has tel link", ad.querySelectorAll("#joinList .join-card__contact a[href^='tel:']").length >= 1);

  // approve pending JN-900
  fire(ad.querySelector('#joinList [data-approve="JN-900"]'), "click");
  let j2 = JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.id === "JN-900");
  check("approve → status approved", j2.status === "approved");
  check("KPI updated to 0", ad.querySelector("#stJoins").textContent === "0");
  check("workers KPI grew to 1 (real worker only)", ad.querySelector("#stWorkers").textContent === "1");

  // tab filter: approved = 1
  ad.querySelector('#joinTabs .tab[data-jtab="approved"]').click();
  check("approved tab shows 1", ad.querySelectorAll("#joinList .join-card").length === 1);
  ad.querySelector('#joinTabs .tab[data-jtab="all"]').click();

  // workers + live status control
  ad.querySelector('[data-view="providers"]').click();
  check("workers table = 1 row (approved join — no fake workers)", ad.querySelectorAll("#provBody tr").length === 1);
  check("3 status buttons on every row", ad.querySelectorAll("#provBody .sbtn").length === 3);
  check("every worker row shows tel + wa links", ad.querySelectorAll("#provBody a[href^='tel:+20']").length === 1 && ad.querySelectorAll("#provBody a[href^='https://wa.me/20']").length === 1);
  check("no price column in workers table", ad.querySelector("#view-providers").textContent.indexOf("ج.م") === -1 && ad.querySelector("#view-providers").textContent.indexOf("السعر") === -1);
  check("JN-900 default = active highlighted", ad.querySelector('#provBody .sbtn[data-pid="JN-900"][data-st="active"]').classList.contains("on"));
  const jrow = () => [...ad.querySelectorAll("#provBody tr")].find(tr => tr.querySelector('.sbtn[data-pid="JN-900"]'));
  fire(ad.querySelector('#provBody .sbtn[data-pid="JN-900"][data-st="busy"]'), "click");
  check("click busy → saved in shared store", JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1"))["JN-900"] === "busy");
  check("worker row pill → 🔴 مشغول", jrow().querySelector(".pill--busy") !== null);
  fire(ad.querySelector('#provBody .sbtn[data-pid="JN-900"][data-st="inactive"]'), "click");
  check("click inactive → saved", JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1"))["JN-900"] === "inactive");
  fire(ad.querySelector('#provBody .sbtn[data-pid="JN-900"][data-st="active"]'), "click");
  check("revert active → saved + highlighted", JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1"))["JN-900"] === "active" && ad.querySelector('#provBody .sbtn[data-pid="JN-900"][data-st="active"]').classList.contains("on"));

  // reject (with confirm stub) → worker removed from the directory
  ad.querySelector('[data-view="joins"]').click();
  fire(ad.querySelector('#joinList [data-reject="JN-900"]'), "click");
  j2 = JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.id === "JN-900");
  check("reject → status rejected", j2.status === "rejected");
  check("reject → workers KPI back to 0", ad.querySelector("#stWorkers").textContent === "0");
  ad.querySelector('#joinTabs .tab[data-jtab="rejected"]').click();
  check("rejected tab shows 1", ad.querySelectorAll("#joinList .join-card").length === 1);

  // settings: reset all statuses to active
  ad.querySelector('[data-view="settings"]').click();
  fire(ad.querySelector("#resetStatusBtn"), "click");
  const resetMap = JSON.parse(aw.localStorage.getItem("elhani_provider_status_v1"));
  check("reset → all active", Object.values(resetMap).every(v => v === "active"));

  /* ===== خاصية إضافة عامل جديد + الحالة المالية ===== */
  ad.querySelector('[data-view="providers"]').click();
  check("زر «إضافة عامل جديد» موجود في لوحة العمال", !!ad.querySelector("#addWorkerBtn"));
  check("عمود «الحالة المالية» في جدول العمال", ad.querySelector("#view-providers .table thead").textContent.includes("الحالة المالية"));

  ad.querySelector("#addWorkerBtn").click();
  check("نافذة الإضافة بتفتح", ad.querySelector("#workerModal").classList.contains("modal--open"));
  check("قائمة الأقسام متولدة (4 أقسام + اختيار)", ad.querySelectorAll("#wCat option").length === 5);
  check("قائمة المراكز متولدة (15 مركز + اختيار)", ad.querySelectorAll("#wCity option").length === 16);
  check("الحالة المالية: مدفوع / لم يُدفع", ad.querySelectorAll("#wPaid option").length === 2 && ad.querySelector("#wPaid option[value='paid']") !== null);

  // empty submit → validation blocks
  fire(ad.querySelector("#workerForm"), "submit");
  check("فورم فاضي → validation شغال والنافذة مليانه أخطاء", ad.querySelectorAll("#workerForm .field.invalid").length === 5 && ad.querySelector("#workerModal").classList.contains("modal--open"));

  // fill and submit a real worker
  ad.querySelector("#wName").value = "دليفري الزقازيق السريع";
  ad.querySelector("#wPhone").value = "01055556666";
  ad.querySelector("#wCat").value = "delivery";
  ad.querySelector("#wCity").value = "الزقازيق";
  ad.querySelector("#wJobs").value = "توصيل فوري • مشاوير";
  ad.querySelector("#wPaid").value = "paid";
  fire(ad.querySelector("#workerForm"), "submit");
  check("بعد الإضافة النافذة بتتقفل", !ad.querySelector("#workerModal").classList.contains("modal--open"));
  check("توست تأكيد ظهر", !!ad.querySelector(".toast--ok"));

  const rec = JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.name === "دليفري الزقازيق السريع");
  check("السجل اتسجل: معتمد + مدفوع + قسم دليفري + الزقازيق", !!rec && rec.status === "approved" && rec.paid === true && rec.cat === "delivery" && rec.city === "الزقازيق" && rec.phone === "01055556666" && rec.src === "admin");
  check("العامل ظهر في جدول العمال فورًا", ad.querySelectorAll("#provBody tr").length === 1);
  check("KPI إجمالي العمال = 1", ad.querySelector("#stWorkers").textContent === "1");
  check("الحالة المالية ظاهرة قدام العامل (مدفوع)", ad.querySelectorAll("#provBody .pay-toggle.pill--paid").length === 1);
  check("العامل الجديد بيهاتف على رقمه (اتصال + واتساب)", ad.querySelectorAll("#provBody a[href^='tel:+201055556666']").length === 1 && ad.querySelectorAll("#provBody a[href^='https://wa.me/201055556666']").length === 1);

  // toggle payment status in-place
  fire(ad.querySelector("#provBody .pay-toggle"), "click");
  check("ضغطة واحدة → بقت «لم يُدفع» في التخزين", JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.name === "دليفري الزقازيق السريع").paid === false);
  check("العمود اتحدث لـ «لم يُدفع»", ad.querySelectorAll("#provBody .pay-toggle.pill--unpaid").length === 1);
  fire(ad.querySelector("#provBody .pay-toggle"), "click");
  check("رجعناها «مدفوع» تاني", JSON.parse(aw.localStorage.getItem("elhani_join_requests_v1")).find(j => j.name === "دليفري الزقازيق السريع").paid === true);

  ad.querySelector("#logoutBtn").click();
  await sleep(500);
  check("logout clears session", aw.localStorage.getItem("elhani_session_v1") === null);
  a.window.close();

  console.log("\n================================");
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("FATAL", e); process.exit(1); });
