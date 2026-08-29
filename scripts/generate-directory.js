#!/usr/bin/env node
/* ============================================================
   الحَقني — ELHA'NI | Directory Generator (469 records)
   يولّد سجل قاعدة بيانات الحَقني:
   - 209 عامل / مقدم خدمة (بحد أقصى 55 لكل قسم) + 260 زبون = 469
   الشروط (تُتحقق عند التوليد وتُطبع):
   - أسماء مصرية حقيقية متنوعة 100% — فريدة تماماً (داخل السجل
     وبدون تعارض مع أسماء عمال data.js / data-500.js)
   - أرقام موبايل مصرية صحيحة (01[0125]XXXXXXXX) وفريدة
   - مراكز ومدن محافظة الشرقية فقط
   المخرَج: js/data-560.js  (window.ELHANI_DIRECTORY)
   التشغيل:  node scripts/generate-directory.js
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

/* ---------- إعدادات ---------- */
const WORKERS = 209; // 55 + 53 + 51 + 50 = 209 عامل (أعداد واقعية لكل قسم)
const MAX_PER_CAT = 55; // الحد الأقصى الواقعي لكل قسم/حرفة
const CUSTOMERS = 260;
const TOTAL = WORKERS + CUSTOMERS; // 469
const SEED = 20260831; // ثابت = نفس المخرَج بالمللي عند كل تشغيل

/* ---------- مولّد أرقام عشوائي حتمي ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}
function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

/* ---------- أسماء مصرية حقيقية (موسّعة) ---------- */
const MALE_FIRST = [
  "محمد","أحمد","مصطفى","محمود","علي","حسن","حسين","خالد","عمر","يوسف","إبراهيم","عبدالله",
  "عبدالرحمن","كريم","طارق","هشام","سامح","شريف","عصام","أيمن","وائل","إيهاب","حسام","ماجد",
  "أكرم","عادل","أشرف","عماد","فارس","رامي","سيد","حسنين","إسلام","مينا","بيتر","جورج","حنا",
  "فادي","رمزي","سامي","نادر","هاني","وليد","ياسر","زياد","ماهر","منير","هيثم","شادي","عمرو",
  "بلال","طه","أنس","صابر","إسماعيل","عبدالعزيز","عبدالفتاح","عبدالهادي","علاء","فتحي",
  "جابر","حمادة","زكريا","سعد","صلاح","عطية","فرج","مسعد","ناصر","يحيى","أبو بكر","باسم",
  "بهاء","تامر","جمال","حامد","دانيال","رافت","زين","ساهر","شاكر","طاهر","عامر","غانم",
  "فهمي","قاسم","كمال","لؤي","مدحت","نوح","هاشم","وديع","ياسين","حمدي","مروان","معتز","مؤمن"
];
const FEMALE_FIRST = [
  "فاطمة","عائشة","مريم","سارة","ياسمين","نورهان","هبة","دينا","منى","أمل","إيمان","سلمى","أسماء",
  "ريم","شيماء","نجلاء","هدى","رانيا","أميرة","دعاء","غادة","إسراء","تقى","ملك","جنى","حبيبة","نور",
  "سندس","رقية","خديجة","زينب","أمنية","مروة","نهى","إيناس","وردة","أزهار","بسمة","جيهان","حنان",
  "خلود","درة","روان","سهام","شروق","عبير","فرح","قمر","كوثر","ليلى","مها","نادية","هالة",
  "وفاء","آية","ألاء","إحسان","بشرى","تسنيم","جود","حور","دنيا","رحيق","عتاب","فدوى",
  "نجوى","هنا","ولاء","رهف","سلمى","بسنت"
];
const FATHER = [
  "محمد","أحمد","مصطفى","محمود","علي","حسن","حسين","خالد","عمر","يوسف","إبراهيم","عبدالله",
  "عبدالرحمن","كريم","طارق","هشام","سامح","شريف","عصام","أيمن","وائل","إيهاب","حسام","ماجد",
  "أكرم","عادل","أشرف","عماد","رامي","سيد","حسنين","إسلام","سامي","نادر","هاني","وليد","ياسر",
  "زياد","ماهر","منير","هيثم","شادي","عمرو","بلال","طه","أنس","إسماعيل","عبدالعزيز","علاء",
  "فتحي","جابر","زكريا","سعد","صلاح","عطية","فرج","ناصر","يحيى","باسم","بهاء","تامر","جمال",
  "حامد","رافت","زين","ساهر","شاكر","طاهر","عامر","قاسم","كمال","مدحت","ياسين","حمدي","مروان"
];
const FAMILY = [
  "الشناوي","عبدالرحمن","فوزي","حسن","محمود","إبراهيم","السيد","عبدالعال","الشربيني","النجار",
  "البنا","حجازي","عوض","عطية","حمزة","صبري","الغزالي","الدسوقي","الزناتي","البهنساوي","الفقي",
  "عيد","خليل","متولي","عبدالحميد","أبو زيد","رزق","الجندي","عبدالكريم","درويش","منصور","سليمان",
  "شاهين","سلامة","عبده","الجارحي","طه","عامر","قنديل","حمدان","الرفاعي","بركات","عليان","بدوي",
  "عرفة","يونس","زغلول","حسان","عبدالباري","كامل","شحاته","البحيري","شرقاوي","أمين","عاشور",
  "الشعري","مصيلحي","خفاجي","طنطاوي","لطفي","غزال","عكاشة","سعد","سلام","فتح الله","نور الدين",
  "أبو النجا","الأخرس","الشاذلي","الهواري","عبدالغفار","توفيق","حلمي","راشد","زهران","سالم",
  "عبدالمقصود","فايد","قباني","لاشين","مرسي","نفادي","هاشم","يوسف","سماحة","شبل","عبدالباقي",
  "الطويل","أبو سريع","الباز","الدمرداش","الصاوي","فرغلي","محروس","نجيب","حسيني","بدران"
];

/* ---------- أقسام المنصة ---------- */
const CATS = [
  { id: "delivery", icon: "🛵", weights: { worker: 55, customer: 80 }, workerSubs: [
      { sub: "توصيل فوري", emoji: "🛵", more: ["مشاوير","مستندات","طلبات مطاعم"] },
      { sub: "توصيل مشاوير", emoji: "📦", more: ["توصيل أدوية","طلبات مطاعم","مشاوير يومية"] },
      { sub: "شحن بين المراكز", emoji: "🚚", more: ["شحن سريع","مواد بناء","بضائع خفيفة"] },
      { sub: "توصيل مواد بناء", emoji: "🧱", more: ["شحن أسياخ","رمل وزلط","مواد تشطيب"] },
      { sub: "نقل عفش صغير", emoji: "📦", more: ["توصيل أثاث","نقل هدايا","أجهزة"] },
      { sub: "توصيل مستندات", emoji: "🛵", more: ["أوراق رسمية","طرود سريعة","مكاتب"] }
  ], customerReqs: [
      "توصيل طلبات مطاعم","نقل مستندات رسمية","توصيل أدوية من الصيدلية","شحن طرود بين المراكز",
      "نقل عفش صغير","توصيل مشاوير يومية","توصيل مواد بناء","توصيل هدايا وأعياد ميلاد"
  ]},
  { id: "maintenance", icon: "🔧", weights: { worker: 53, customer: 75 }, workerSubs: [
      { sub: "سباكة عامة", emoji: "🔧", more: ["سخانات","محارة مياه","دق حفر"] },
      { sub: "كهرباء وحملات", emoji: "⚡", more: ["عدادات","إنارة","أعطال مفاجئة"] },
      { sub: "تكييفات وتبريد", emoji: "❄️", more: ["تركيب سبليت","فراغات","صيانة دورية"] },
      { sub: "نجارة وأبواب", emoji: "🪚", more: ["تركيب أبواب","درمورات","غرف نوم"] },
      { sub: "دهانات وجبس", emoji: "🎨", more: ["دهان حوائط","جبس أسقف","تشطيبات"] },
      { sub: "طوارئ مياه", emoji: "🚰", more: ["تسريبات","صيانة خزانات","غسالات"] }
  ], customerReqs: [
      "سباكة طارئة — تسريب مياه","كهرباء — عطل مفاجئ","تركيب وتصليح تكييف","نجارة — باب ودرمورة",
      "دهانات وجبس أسقف","صيانة سخان","صيانة غسالة أوتوماتيك","أفران وبوتاجازات"
  ]},
  { id: "lifestyle", icon: "✨", weights: { worker: 51, customer: 60 }, workerSubs: [
      { sub: "تنظيف شقق وفلل", emoji: "✨", more: ["تلميع زجاج","تعقيم","غسيل أرضيات"] },
      { sub: "غسيل سجاد ومفروشات", emoji: "🧺", more: ["كيميكال سجاد","ستائر","مقاعد ركن"] },
      { sub: "تركيب أثاث", emoji: "🪚", more: ["إكسسوارات","ستائر","مطابخ"] },
      { sub: "صوتيات وإضاءة", emoji: "🎤", more: ["حفلات","مؤتمرات","إضاءة LED"] },
      { sub: "ترجمة معتمدة", emoji: "📜", more: ["توثيق","ترجمة فورية","مستندات رسمية"] },
      { sub: "تصوير حفلات", emoji: "📷", more: ["أفراح","خطوبة","جلسات تصوير"] }
  ], customerReqs: [
      "تنظيف شقة بالكامل","غسيل سجاد ومفروشات","تركيب أثاث وستائر","صوتيات وإضاءة حفلة",
      "ترجمة معتمدة","تنظيف بخار كنب","تنسيق حديقة","تصوير مناسبة عائلية"
  ]},
  { id: "cranes", icon: "🏗️", weights: { worker: 50, customer: 45 }, workerSubs: [
      { sub: "أونش 5 طن", emoji: "🏗️", more: ["رفع معدات","حاويات صغيرة","مواد خفيفة"] },
      { sub: "أونش 12 طن", emoji: "🏗️", more: ["رفع أعمدة","بيوت جاهزة","أحمال متوسطة"] },
      { sub: "أونش 25 طن", emoji: "🦅", more: ["نقل عمارات","مصانع","حاويات"] },
      { sub: "أونش 50 طن", emoji: "🛻", more: ["نقل مصانع كامل","تريلات","أحمال فائقة"] },
      { sub: "رفع ونقل عمارات", emoji: "🏗️", more: ["دوبلكس","عمارات مسلحة","تحميل أعمدة"] },
      { sub: "نقل معدات ثقيلة", emoji: "⚙️", more: ["ديزل","جرارات","مولدات"] }
  ], customerReqs: [
      "رفع ونقل عمارة","أونش 25 طن","نقل معدات لمصنع","حاوية 40 قدم",
      "أونش 5 طن","نقل تريلا كبيرة","رفع أعمدة إنارة","نقل ماكينات غزل"
  ]}
];

/* ---------- مراكز الشرقية (وزن واقعي — المجموع = 469) ---------- */
const CITIES = [
  { name: "الزقازيق", weight: 138 }, { name: "العاشر من رمضان", weight: 84 },
  { name: "بلبيس", weight: 57 }, { name: "منيا القمح", weight: 42 },
  { name: "ديرب نجم", weight: 34 }, { name: "أبو حماد", weight: 28 },
  { name: "ههيا", weight: 24 }, { name: "فاقوس", weight: 24 },
  { name: "القنايات", weight: 10 }, { name: "أبو كبير", weight: 8 },
  { name: "أبو بكر الصديق", weight: 4 }, { name: "تلة أبا", weight: 4 },
  { name: "حماطة", weight: 4 }, { name: "نقطة الشرقية", weight: 4 },
  { name: "سيد زرين", weight: 4 }
];

/* ---------- استيعاب الأسماء والأرقام الموجودة (منع أي تعارض) ---------- */
const usedNames = new Set();
const usedPhones = new Set();
function absorbSource(rel) {
  try {
    const txt = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
    let m, re;
    re = /"name"\s*:\s*"([^"]+)"/g;
    while ((m = re.exec(txt))) usedNames.add(m[1]);
    re = /"phone"\s*:\s*"([^"]+)"/g;
    while ((m = re.exec(txt))) usedPhones.add(m[1]);
  } catch (e) { /* ملف مش موجود — عادي */ }
}
absorbSource("js/data.js");
absorbSource("js/data-500.js"); // ملحوظة: لا نستوعب data-560.js نفسه حتى يظل التوليد حتمياً

/* ---------- أرقام موبايل مصرية صحيحة وفريدة ---------- */
function buildPhones(n, rnd) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const prefix = ["010", "011", "012", "015"][i % 4];
    let tail = String(Math.floor(rnd() * 100000000)).padStart(8, "0");
    while (usedPhones.has(prefix + tail)) {
      tail = String((parseInt(tail, 10) + 1) % 100000000).padStart(8, "0");
    }
    const phone = prefix + tail;
    usedPhones.add(phone);
    out.push(phone);
  }
  return out;
}

/* ---------- خطة المخلوطات الحتمية ---------- */
const rnd = mulberry32(SEED);
/* نسخة من الأسماء الموجودة مسبقاً (لحظة ما قبل التوليد) للتحقق من عدم التعارض */
const preexistingNames = new Set(usedNames);
const catPlanW = [];
CATS.forEach(c => { for (let i = 0; i < c.weights.worker; i++) catPlanW.push(c.id); });
const catPlanC = [];
CATS.forEach(c => { for (let i = 0; i < c.weights.customer; i++) catPlanC.push(c.id); });
shuffle(catPlanW, rnd); shuffle(catPlanC, rnd);

const cityPlan = [];
CITIES.forEach(c => { for (let i = 0; i < c.weight; i++) cityPlan.push(c.name); });
shuffle(cityPlan, rnd);

const phones = buildPhones(TOTAL, rnd);

/* ---------- اسم مصري فريد 100% ---------- */
function makeUniqueName(i, rnd) {
  const female = rnd() < 0.45;
  const first = female ? pick(FEMALE_FIRST, rnd) : pick(MALE_FIRST, rnd);
  const father = pick(FATHER, rnd);
  const family = pick(FAMILY, rnd);
  let name = first + " " + father + " " + family;
  let guard = 0;
  while (usedNames.has(name) && guard < 200000) {
    const f2 = female ? pick(FEMALE_FIRST, rnd) : pick(MALE_FIRST, rnd);
    name = f2 + " " + pick(FATHER, rnd) + " " + pick(FAMILY, rnd);
    guard++;
  }
  usedNames.add(name);
  return name;
}

/* ---------- حالات واقعية ---------- */
const WORKER_STATUSES = [["active", 0.80], ["busy", 0.12], ["inactive", 0.08]];
const CUSTOMER_STATUSES = [["new", 0.30], ["doing", 0.42], ["done", 0.28]];
function rollStatus(statuses, rnd) {
  const r = rnd();
  let acc = 0;
  for (let i = 0; i < statuses.length; i++) {
    acc += statuses[i][1];
    if (r <= acc) return statuses[i][0];
  }
  return statuses[statuses.length - 1][0];
}
function catOf(id) { return CATS.filter(c => c.id === id)[0]; }

/* ---------- التوليد ---------- */
const people = [];
let wIdx = 0, cIdx = 0;

for (let i = 0; i < TOTAL; i++) {
  const isWorker = i < WORKERS;
  const name = makeUniqueName(i, rnd);
  const city = cityPlan[i];

  if (isWorker) {
    wIdx++;
    const cat = catOf(catPlanW[i]);
    const s = pick(cat.workerSubs, rnd);
    const extra1 = pick(s.more, rnd);
    let extra2 = pick(s.more, rnd);
    if (extra2 === extra1) extra2 = s.more[(s.more.indexOf(extra1) + 1) % s.more.length];
    people.push({
      id: "W-" + String(wIdx).padStart(4, "0"),
      type: "worker",
      name: name,
      phone: phones[i],
      city: city,
      detail: s.sub + " • " + extra1 + " • " + extra2,
      category: cat.id,
      status: rollStatus(WORKER_STATUSES, rnd)
    });
  } else {
    cIdx++;
    const cat = catOf(catPlanC[i - WORKERS]);
    const req = pick(cat.customerReqs, rnd);
    let extra = "";
    if (cat.id === "delivery") {
      let dest = cityPlan[Math.floor(rnd() * cityPlan.length)];
      if (dest === city) dest = cityPlan[(cityPlan.indexOf(city) + 1) % cityPlan.length];
      extra = "طلب: " + req + " — من " + city + " إلى " + dest;
    } else {
      extra = "طلب: " + req + " — في " + city;
    }
    people.push({
      id: "C-" + String(cIdx).padStart(4, "0"),
      type: "customer",
      name: name,
      phone: phones[i],
      city: city,
      detail: extra,
      category: cat.id,
      status: rollStatus(CUSTOMER_STATUSES, rnd)
    });
  }
}

/* ---------- الإخراج (يُكتب بعد نجاح التحقق) ---------- */
const outPath = path.join(__dirname, "..", "js", "data-560.js");
const banner = `/* ============================================================
   الحَقني — ELHA'NI | Generated Directory (${TOTAL} records)
   توليد: node scripts/generate-directory.js
   ${WORKERS} عامل / مقدم خدمة + ${CUSTOMERS} زبون / عميل
   أسماء مصرية فريدة 100% • أرقام صحيحة وفريدة • الشرقية فقط
   ============================================================ */\n`;
const payload = {
  meta: {
    total: TOTAL,
    workers: WORKERS,
    customers: CUSTOMERS,
    generated: new Date().toISOString().slice(0, 10)
  },
  people: people
};

/* ---------- التحقق ---------- */
const byType = {}; const byStatus = {}; const byCity = {}; const byWorkerCat = {};
people.forEach(p => {
  byType[p.type] = (byType[p.type] || 0) + 1;
  byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  byCity[p.city] = (byCity[p.city] || 0) + 1;
  if (p.type === "worker") byWorkerCat[p.category] = (byWorkerCat[p.category] || 0) + 1;
});
const uNames = new Set(people.map(p => p.name)).size;
const uPhones = new Set(people.map(p => p.phone)).size;
const valid = people.every(p => /^01[0125][0-9]{8}$/.test(p.phone));
const onlySharqia = people.every(p => CITIES.some(c => c.name === p.city));
const workerCatsOk = Object.keys(byWorkerCat).length === CATS.length && CATS.every(c => byWorkerCat[c.id] > 0 && byWorkerCat[c.id] <= MAX_PER_CAT);
const cleanDetails = people.every(p => typeof p.detail === "string" && p.detail.length > 0 && !p.detail.includes("undefined") && !p.detail.includes("NaN"));
/* اسم مكرر مع الداتا الموجودة (data.js + data-500.js) يجب أن يساوي صفر */
const collisionsWithExisting = people.filter(p => preexistingNames.has(p.name)).length;
console.log("✅ مولّد السجل اشتغل");
console.log("   الإجمالي                 :", people.length);
console.log("   عمال / مقدمي خدمات       :", byType.worker);
console.log("   زبائن / عملاء            :", byType.customer);
console.log("   أسماء فريدة (داخل السجل) :", uNames, "/", people.length);
console.log("   أرقام فريدة + صحيحة      :", uPhones, "/", people.length, "| valid:", valid);
console.log("   تعارض مع الداتا القديمة   :", collisionsWithExisting);
console.log("   كل المراكز جوه الشرقية   :", onlySharqia);
console.log("   كل قسم عمال 1.." + MAX_PER_CAT, "  :", workerCatsOk);
console.log("   كل التفاصيل سليمة        :", cleanDetails);
console.log("   الحالات                  :", JSON.stringify(byStatus));
console.log("   توزيع أقسام العمال       :", JSON.stringify(byWorkerCat));
console.log("   المراكز (15)             :", JSON.stringify(byCity));
console.log("   الملف                    :", outPath);
if (people.length !== TOTAL || uNames !== people.length || uPhones !== people.length || !valid || collisionsWithExisting > 0 || !onlySharqia || !workerCatsOk || !cleanDetails) {
  console.error("❌ فشل التحقق من السجل — لم يتم حفظ الملف.");
  process.exit(1);
}

/* التحقق كله نجح — الآن فقط نكتب الملف */
fs.writeFileSync(outPath, banner + "window.ELHANI_DIRECTORY = " + JSON.stringify(payload, null, 2) + ";\n", "utf8");
console.log("💾 حفظ الملف بنجاح      :", outPath);
