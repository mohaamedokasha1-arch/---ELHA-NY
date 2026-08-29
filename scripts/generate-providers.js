#!/usr/bin/env node
/* ============================================================
   الحَقني — ELHA'NI | Data Generator (أعداد واقعية لكل قسم)
   يولّد دليل عمال موسّع بأعداد متباينة لكل قسم (بحد أقصى 55):
   - أسماء مصرية حقيقية متنوعة، فريدة تماماً (بدون تكرار)
   - أرقام موبايل مصرية عشوائية صحيحة وفريدة (01[0125]XXXXXXXX)
   - توزيع على أقسام المنصة الأربعة + مراكز محافظة الشرقية
   المخرَج: js/data-500.js  (window.ELHANI_EXTRA_PROVIDERS)
   التشغيل:  node scripts/generate-providers.js
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

/* ---------- إعدادات ---------- */
const COUNT = 209; // 55 + 53 + 51 + 50 = 209 عامل (واقعي لكل قسم)
const MAX_PER_CAT = 55; // الحد الأقصى الواقعي لكل قسم/حرفة
const SEED = 20260830; // ثابت = نفس المخرَج بالمللي عند كل تشغيل

/* ---------- مولّد أرقام عشوائي حتمي (متوافق مع Node) ---------- */
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

/* ---------- أسماء مصرية حقيقية (أسماء + أسماء آباء + عائلات) ---------- */
const MALE = [
  "محمد","أحمد","مصطفى","محمود","علي","حسن","حسين","خالد","عمر","يوسف","إبراهيم","عبدالله",
  "عبدالرحمن","كريم","طارق","هشام","سامح","شريف","عصام","أيمن","وائل","إيهاب","حسام","ماجد",
  "أكرم","عادل","أشرف","عماد","فارس","رامي","سيد","حسنين","إسلام","مينا","بيتر","جورج","حنا",
  "فادي","رمزي","سامي","نادر","هاني","وليد","ياسر","زياد","ماهر","منير","هيثم","شادي","عمرو",
  "بلال","طه","أنس","أحمد","صابر","إسماعيل","عبدالعزيز","عبدالفتاح","عبدالهادي","علاء","فتحي",
  "جابر","حمادة","زكريا","سعد","صلاح","عطية","فرج","مسعد","ناصر","يحيى","أبو بكر","باسم","بهاء",
  "تامر","جمال","حامد","دانيال","رافت","زين","ساهر","شاكر","طاهر","عامر","غانم","فهمي","قاسم",
  "كمال","لؤي","مدحت","نوح","هاشم","وديع","ياسين","حمدي","أيمن","ساهر","مروان","معتز","مؤمن"
];
const FEMALE = [
  "فاطمة","عائشة","مريم","سارة","ياسمين","نورهان","هبة","دينا","منى","أمل","إيمان","سلمى","أسماء",
  "ريم","شيماء","نجلاء","هدى","رانيا","أميرة","دعاء","غادة","إسراء","تقى","ملك","جنى","حبيبة","نور",
  "سندس","رقية","خديجة","زينب","أمنية","مروة","نهى","إيناس","وردة","أزهار","بسمة","جيهان","حنان",
  "خلود","درة","روان","زيـنة","سهام","شروق","عبير","فرح","قمر","كوثر","ليلى","مها","نادية","هالة",
  "وفاء","ياسمين","آية","ألاء","إحسان","بشرى","تسنيم","جود","حور","دنيا","رحيق","سجدة","شيمـاء",
  "صوفيا","عتاب","فدوى","مريم","نجوى","هنا","ولاء","رهف","سلمى"
];
const FAMILY = [
  "الشناوي","عبدالرحمن","فوزي","حسن","محمود","إبراهيم","السيد","عبدالعال","الشربيني","النجار",
  "البنا","حجازي","عوض","عطية","حمزة","صبري","الغزالي","الدسوقي","الزناتي","البهنساوي","الفقي",
  "عيد","خليل","متولي","عبدالحميد","أبو زيد","رزق","الجندي","عبدالكريم","درويش","منصور","سليمان",
  "شاهين","سلامة","عبده","الجارحي","طه","عامر","قنديل","حمدان","الرفاعي","بركات","عليان","بدوي",
  "عرفة","يونس","زغلول","حسان","عبدالباري","كامل","شحاته","البحيري","شرقاوي","زناتي","أمين","عاشور",
  "الشعري","مصيلحي","خفاجي","طنطاوي","لطفي","غزال","عكاشة","سعد","سلام","فتح الله","نور الدين",
  "أبو النجا","الأخرس","الشاذلي","الهواري","عبدالغفار","توفيق","حلمي","راشد","زهران","سالم",
  "عبدالمقصود","فايد","قباني","لاشين","مرسي","نفادي","هاشم","يوسف","سماحة","شبل","عبدالباقي",
  "الطويل","أبو سريع","الباز","الدمرداش","الصاوي","عاشق","فرغلي","قنديل","محروس","نجيب"
];

/* ---------- أقسام المنصة (نفس أقسام js/data.js) ---------- */
const CATS = [
  { id: "delivery",   weight: 55, icon: "🛵", subs: [
      { sub: "توصيل فوري",        emoji: "🛵", more: ["مشاوير","مستندات","طلبات مطاعم"] },
      { sub: "توصيل مشاوير",      emoji: "📦", more: ["توصيل أدوية","طلبات مطاعم","مشاوير يومية"] },
      { sub: "شحن بين المراكز",   emoji: "🚚", more: ["شحن سريع","مواد بناء","بضائع خفيفة"] },
      { sub: "توصيل مواد بناء",   emoji: "🧱", more: ["شحن أسياخ","رمل وزلط","مواد تشطيب"] },
      { sub: "نقل عفش صغير",      emoji: "📦", more: ["توصيل أثاث","نقل هدايا","أجهزة"] },
      { sub: "توصيل مستندات",     emoji: "🛵", more: ["أوراق رسمية","طرود سريعة","مكاتب"] },
      { sub: "توصيل طلبات مطاعم", emoji: "🍔", more: ["أكل سريع","طلبات محلات","سوبر ماركت"] },
      { sub: "توصيل أدوية",       emoji: "💊", more: ["صيدليات","مستشفيات","طوارئ"] }
  ]},
  { id: "maintenance", weight: 53, icon: "🔧", subs: [
      { sub: "سباكة عامة",      emoji: "🔧", more: ["سخانات","محارة مياه","دق حفر"] },
      { sub: "كهرباء وحملات",   emoji: "⚡", more: ["عدادات","إنارة","أعطال مفاجئة"] },
      { sub: "تكييفات وتبريد",  emoji: "❄️", more: ["تركيب سبليت","فراغات","صيانة دورية"] },
      { sub: "نجارة وأبواب",    emoji: "🪚", more: ["تركيب أبواب","درمورات","غرف نوم"] },
      { sub: "دهانات وجبس",     emoji: "🎨", more: ["دهان حوائط","جبس أسقف","تشطيبات"] },
      { sub: "طوارئ مياه",      emoji: "🚰", more: ["تسريبات","صيانة خزانات","غسالات"] },
      { sub: "صيانة غسالات",    emoji: "🧺", more: ["غسالات أوتوماتيك","سخانات","أجهزة منزلية"] },
      { sub: "أفران وبوتاجازات", emoji: "🔥", more: ["صيانة أفران","بوتاجازات","سخانات غاز"] }
  ]},
  { id: "lifestyle", weight: 51, icon: "✨", subs: [
      { sub: "تنظيف شقق وفلل",   emoji: "✨", more: ["تلميع زجاج","تعقيم","غسيل أرضيات"] },
      { sub: "غسيل سجاد ومفروشات", emoji: "🧺", more: ["كيميكال سجاد","ستائر","مقاعد ركن"] },
      { sub: "تركيب أثاث",       emoji: "🪚", more: ["إكسسوارات","ستائر","مطابخ"] },
      { sub: "صوتيات وإضاءة",    emoji: "🎤", more: ["حفلات","مؤتمرات","إضاءة LED"] },
      { sub: "ترجمة معتمدة",     emoji: "📜", more: ["توثيق","ترجمة فورية","مستندات رسمية"] },
      { sub: "تصوير حفلات",      emoji: "📷", more: ["أفراح","خطوبة","جلسات تصوير"] },
      { sub: "عناية بالحدائق",   emoji: "🌿", more: ["تشجير","ري","تنسيق حدائق"] },
      { sub: "تنظيف بخار",       emoji: "🧽", more: ["موكيت","كنب","مراتب"] }
  ]},
  { id: "cranes", weight: 50, icon: "🏗️", subs: [
      { sub: "أونش 5 طن",         emoji: "🏗️", more: ["رفع معدات","حاويات صغيرة","مواد خفيفة"] },
      { sub: "أونش 12 طن",        emoji: "🏗️", more: ["رفع أعمدة","بيوت جاهزة","أحمال متوسطة"] },
      { sub: "أونش 25 طن",        emoji: "🦅", more: ["نقل عمارات","مصانع","حاويات"] },
      { sub: "أونش 50 طن",        emoji: "🛻", more: ["نقل مصانع كامل","تريلات","أحمال فائقة"] },
      { sub: "رفع ونقل عمارات",   emoji: "🏗️", more: ["دوبلكس","عمارات مسلحة","تحميل أعمدة"] },
      { sub: "نقل مصانع",         emoji: "🏭", more: ["خطوط إنتاج","معدات ثقيلة","ماكينات"] },
      { sub: "رفع معدات ثقيلة",   emoji: "⚙️", more: ["ديزل","جرارات","مولدات"] },
      { sub: "حاويات وبضائع",     emoji: "📦", more: ["حاويات 20 قدم","40 قدم","شحن داخلي"] }
  ]}
];

/* ---------- مراكز ومدن محافظة الشرقية (وزن = توزيع واقعي) ---------- */
const CITIES = [
  { name: "الزقازيق",         weight: 61 },
  { name: "العاشر من رمضان",  weight: 38 },
  { name: "بلبيس",            weight: 25 },
  { name: "منيا القمح",       weight: 19 },
  { name: "ديرب نجم",         weight: 15 },
  { name: "أبو حماد",         weight: 13 },
  { name: "ههيا",             weight: 10 },
  { name: "فاقوس",            weight: 10 },
  { name: "القنايات",         weight: 4 },
  { name: "أبو كبير",         weight: 4 },
  { name: "أبو بكر الصديق",   weight: 2 },
  { name: "تلة أبا",          weight: 2 },
  { name: "حماطة",            weight: 2 },
  { name: "نقطة الشرقية",     weight: 2 },
  { name: "سيد زرين",         weight: 2 }
];

/* ---------- أرقام موبايل مصرية صحيحة وفريدة ---------- */
function buildPhones(n, taken, rnd) {
  const phones = new Set(taken);
  const out = [];
  for (let i = 0; i < n; i++) {
    const prefix = ["010", "011", "012", "015"][i % 4];
    let tail = String(Math.floor(rnd() * 100000000)).padStart(8, "0");
    // في حال صادف رقم مستخدم، نعدّل الخطوة حتى نوصل لرقم غير مكرر
    while (phones.has(prefix + tail)) {
      tail = String((parseInt(tail, 10) + 1) % 100000000).padStart(8, "0");
    }
    const phone = prefix + tail;
    phones.add(phone);
    out.push(phone);
  }
  return out;
}

/* ---------- التوليد ---------- */
const rnd = mulberry32(SEED);
const names = new Set();
const generated = [];

/* خطة الأقسام: قائمة مكررة بالوزن ثم خلط حتمي */
const catPlan = [];
CATS.forEach(c => { for (let i = 0; i < c.weight; i++) catPlan.push(c.id); });
shuffle(catPlan, rnd);

/* خطة المدن: قائمة مكررة بالوزن ثم خلط حتمي */
const cityPlan = [];
CITIES.forEach(c => { for (let i = 0; i < c.weight; i++) cityPlan.push(c.name); });
shuffle(cityPlan, rnd);

const corePhones = [
  "01011112221","01122223332","01233334443","01044445554","01155556665","01266667776",
  "01077778887","01188889998","01299990009","01000001110","01111102221","01222203332",
  "01033304443","01144405554","01199988877","01088877766"
];
const phones = buildPhones(COUNT, corePhones, rnd);

function makeName(i, rnd) {
  const gender = i % 2 === 0;
  const first = gender ? pick(MALE, rnd) : pick(FEMALE, rnd);
  const mid = pick(i % 3 === 0 ? MALE : FAMILY, rnd);
  const family = pick(FAMILY, rnd);
  return first + " " + mid + " " + family;
}

let guard = 0;
for (let i = 0; i < COUNT; i++) {
  let name = makeName(i, rnd);
  while (names.has(name) && guard < 100000) { name = makeName(i, rnd); guard++; }
  names.add(name);

  const cat = CATS.filter(c => c.id === catPlan[i])[0];
  const s = pick(cat.subs, rnd);
  const extra1 = pick(s.more, rnd);
  let extra2 = pick(s.more, rnd);
  if (extra2 === extra1) extra2 = s.more[(s.more.indexOf(extra1) + 1) % s.more.length];
  const city = cityPlan[i];

  generated.push({
    id: "g" + String(i + 1).padStart(3, "0"),
    name: name,
    emoji: s.emoji,
    cat: cat.id,
    sub: s.sub,
    area: city + " — الشرقية",
    jobs: s.sub + " • " + extra1 + " • " + extra2,
    phone: phones[i],
    wa: phones[i],
    active: true
  });
}

/* ---------- الإخراج (يُكتب بعد نجاح التحقق) ---------- */
const outPath = path.join(__dirname, "..", "js", "data-500.js");
const banner = `/* ============================================================
   الحَقني — ELHA'NI | Generated Provider Dataset (${COUNT} workers)
   تم توليده بواسطة  node scripts/generate-providers.js
   أسماء مصرية فريدة 100% • أرقام مصرية صحيحة وفريدة • شرقية فقط
   أعداد واقعية: بحد أقصى ${MAX_PER_CAT} عامل لكل قسم
   ============================================================ */\n`;
const js = banner + "window.ELHANI_EXTRA_PROVIDERS = " + JSON.stringify(generated, null, 2) + ";\n";

/* ---------- إحصائيات التحقق ---------- */
const byCat = {}; const byCity = {};
generated.forEach(p => {
  byCat[p.cat] = (byCat[p.cat] || 0) + 1;
  byCity[p.area.split(" — ")[0]] = (byCity[p.area.split(" — ")[0]] || 0) + 1;
});
const uniqueNames = new Set(generated.map(p => p.name)).size;
const uniquePhones = new Set(generated.map(p => p.phone)).size;
const validPhones = generated.every(p => /^01[0125][0-9]{8}$/.test(p.phone));
const catsOk = Object.keys(byCat).length === CATS.length && CATS.every(c => byCat[c.id] > 0 && byCat[c.id] <= MAX_PER_CAT);
const citiesOk = Object.keys(byCity).length === CITIES.length && CITIES.every(c => byCity[c.name] > 0);
const catSum = Object.values(byCat).reduce((a, b) => a + b, 0);
const citySum = Object.values(byCity).reduce((a, b) => a + b, 0);

console.log("✅ المولّد اشتغل");
console.log("   العمال المولّدون     :", generated.length, "(بحد أقصى", MAX_PER_CAT, "لكل قسم)");
console.log("   أسماء فريدة          :", uniqueNames, "/", generated.length);
console.log("   أرقام فريدة          :", uniquePhones, "/", generated.length);
console.log("   كل الأرقام صحيحة     :", validPhones);
console.log("   كل قسم 1.." + MAX_PER_CAT + "  :", catsOk, "| المجموع:", catSum);
console.log("   كل المراكز موجودة    :", citiesOk, "| المجموع:", citySum);
console.log("   توزيع الأقسام        :", JSON.stringify(byCat));
console.log("   توزيع المراكز        :", JSON.stringify(byCity));
console.log("   الملف                :", outPath);
if (generated.length !== COUNT || uniqueNames !== COUNT || uniquePhones !== COUNT || !validPhones || !catsOk || !citiesOk || catSum !== COUNT || citySum !== COUNT) {
  console.error("❌ فشل التحقق — لم يتم حفظ الملف.");
  process.exit(1);
}

/* التحقق كله نجح — الآن فقط نكتب الملف */
fs.writeFileSync(outPath, js, "utf8");
console.log("💾 حفظ الملف بنجاح      :", outPath);
