# الحَقني — Elha'ni 🏆
### The Complete Brand Ecosystem & Platform Codebase

> **«الحَقَّني»… كلم العامل مباشرة من غير وسيط!**
> *Sharqia's direct, interactive service directory — delivery, cranes, emergency maintenance & lifestyle. Pick a category → see the workers → call or WhatsApp them instantly. No orders, no prices, no middleman.*

## 📍 Geographic Scope — محافظة الشرقية ONLY
Every provider, seed order, testimonial, ticker item, city filter, and form select is restricted to Sharqia Governorate:
**الزقازيق • العاشر من رمضان • بلبيس • منيا القمح • ديرب نجم • أبو حماد • ههيا • فاقوس • حماطة • تلة أبا • القنايات • نقطة الشرقية • أبو بكر الصديق • أبو كبير • سيد زرين**
(The list lives in `ELHANI_DATA.cities` in `js/data.js` — add/remove a center in one place and every select updates.)

## 🎛 Worker Status Control (admin-only, live)
Each worker on the directory has a live status managed **only** from the admin dashboard (العمال والحالات tab — quick 3-button control per row, also on the overview):

| Status | Card on the site | Contact buttons |
|---|---|---|
| 🟢 نشط (`active`) | Green pulsing "نشط — متاح الآن" | 📞 + ✆ enabled |
| 🔴 مشغول (`busy`) | Red pulsing "مشغول حالياً" | 📞 + ✆ enabled |
| ⚫ غير نشط (`inactive`) | Dimmed card, "غير نشط" | Dimmed/disabled |

- Changes are written to `elhani_provider_status_v1` and **reflected instantly**: the landing page listens to the browser `storage` event, so changing a status in the admin tab updates the customer-facing card in the other tab immediately (no reload).
- The old boolean switch storage auto-migrates (`active`/`inactive`) on first boot.
- Customers can also toggle the **🟢 المتاح الآن فقط** chip in the workers toolbar to see only available workers.
- The dashboard, its buttons, and the admin gate remain strictly admin-only.

## 🚫 No Orders, No Prices — Direct Directory Model
The old booking system was removed entirely. The customer-facing interface contains:
- **No "اطلب الآن" buttons**, no booking modal/forms, no order IDs, no request storage.
- **No prices at all** — no "يبدأ من …", no ج.م, no budget fields, no price sorting. The admin pricing panel was removed too.
- **Worker cards show only:** name ✓ + exact specialty, **live status** (🟢 نشط / 🔴 مشغول / ⚫ غير نشط, auto-synced from the admin dashboard), and two very clear contact buttons:
  - **📞 اتصال فوري** → `tel:+20xxxxxxxxxx` (the worker's own mobile)
  - **✆ واتساب** → `https://wa.me/20xxxxxxxxxx` (opens a direct WhatsApp chat with the worker)
- Clicking any main category (services grid, hero chips, footer links) jumps **directly to the filtered workers list** for that category — no intermediate page.

## 📞 Numbers
- **Each worker card** carries the worker's own `phone` / `wa` (defined per provider in `js/data.js`; approved join requests use the number the applicant submitted).
- The **emergency/admin channels** (nav 🚨, FAB, footer, CTA band) point to the admin number: **0122 599 0584** (`tel:+201225990584` / `https://wa.me/201225990584`).

## 🤝 Provider Onboarding — Approval Gate (no instant activation)
Regular users **cannot** add services or activities to the platform. The only path is:
1. **«انضم إلينا»** section / button → join modal (name, phone, activity type, specialty, Sharqia center, notes)
2. Request saved to `elhani_join_requests_v1` with `status: "pending"` — **never rendered on the public site**
3. Admin reviews it in **لوحة التحكم ← طلبات الانضمام** (tabs: pending / approved / rejected)
4. **Approve** → the worker instantly appears on the landing page (verified ✓, "جديد — اعتمدته الإدارة" badge, with direct 📞/✆ buttons on their own number) — **Reject** → archived, stays hidden
5. Admins can reverse a decision at any time; approvals are persisted in localStorage

**Run it:** any static server in this folder:
```bash
python3 -m http.server 8000
# then open http://localhost:8000            → site
# and      http://localhost:8000/admin.html  → admin (master password)
```

---

## 📁 Project Structure

```
elhani/
├── index.html          ← Main landing experience (Arabic RTL)
├── admin.html          ← Secure admin dashboard (password-protected)
├── css/
│   ├── style.css       ← Landing design system ("Pearl & Sapphire")
│   └── admin.css       ← Admin dashboard styles
├── js/
│   ├── data.js         ← Platform data (services, providers, testimonials)
│   ├── data-500.js     ← Generated provider dataset (209 workers, ELHANI_EXTRA_PROVIDERS)
│   ├── data-560.js     ← Generated directory (469 records — 209 workers + 260 customers)
│   ├── data-testimonials.js ← Generated testimonials (24 reviews, ELHANI_TESTIMONIALS)
│   ├── auth.js         ← SHA-256 checkpoint + session & lockout engine
│   ├── app.js          ← Landing logic (particles, filters, direct contact)
│   ├── bottomnav.js    ← Mobile-style bottom navigation (scroll-spy)
│   ├── directory.js    ← Landing records table (tabs, search, pagination)
│   ├── testimonials.js ← Landing reviews carousel (tabs, slider, rating stats)
│   └── admin.js        ← Dashboard logic (views, stats, CRUD, workers management)
├── scripts/
│   ├── generate-providers.js ← توليد البيانات الموسّعة (بحد أقصى 55 عامل لكل قسم)
│   ├── generate-directory.js ← توليد سجل العمال والزبائن (469 سجل)
│   └── generate-testimonials.js ← توليد آراء العملاء (24 رأي واقعي)
└── assets/
    ├── logo-mark.png   ← AI-generated gold emblem (the "bolt-wing shield")
    ├── hero-rider.png  ← Cinematic night delivery rider
    ├── cranes.png      ├── Heavy-duty crane at dusk
    ├── maintenance.png ← Emergency maintenance pro
    └── lifestyle.png   └─ Premium lifestyle services scene
```

**Run it:** any static server in this folder:
```bash
python3 -m http.server 8000
# then open http://localhost:8000            → site
# and      http://localhost:8000/admin.html  → admin
```

---

## 🎨 Brand Identity — "Pearl & Sapphire" (Light Luxe)

### Color Palette
| Role | Swatch | Hex |
|---|---|---|
| Ivory White (base) | ⬜ | `#F3F7FD` |
| Clean White Panel | ⬜ | `#FFFFFF` |
| Pale Sapphire Panel | 🟦 | `#EEF4FB` |
| Calm Sapphire (primary) | 🔵 | `#2F6FD0` |
| Light Navy Text | ⬛ | `#12233F` |
| Champagne Gold (brand) | 🟡 | `#E3B94F` |
| Gold Highlight | 🟡 | `#F7DC8C` |
| Emerald (trust) | 🟢 | `#17A97E` |
| Aqua Cyan (speed) | 🩵 | `#1FA8C9` |
| Soft Amber (urgency) | 🟠 | `#E8A33D` |

**Rule of thumb:** white/ivory = clean & trustworthy, calm sapphire = confidence & depth, gold = premium brand, emerald green = hygiene/verified/success.

### Typography
- **Display / Headlines:** `Cairo` (700–900) — bold, modern, unmistakably Arabic.
- **Body / UI:** `Tajawal` (400–700) — clean, high legibility at small sizes.
- Both from Google Fonts with `display=swap` + system fallbacks for zero CLS pain.

### Voice & Tone
Egyptian-confident, fast, slightly witty. Short sentences. "الحق" energy:
*«كلم العامل… على طول.»* — never corporate-stiff, always human.

---

## ⚡ The Logo

**Concept:** *"The Gold Bolt-Wing Shield"*
A metallic-gold lightning bolt (speed) fused with forward-leaning wings (motion, delivery) inside a subtle shield silhouette (trust, protection, emergency-ready). A thin electric-cyan rim light on one edge signals the tech layer. On midnight-slate it reads as premium armor.

**Lockup:** mark (48–56 px, rounded-square crop) + wordmark «الحَقني» in Cairo 900 with a gold gradient + micro-tagline `ELHA'NI • خدمات فورية`.

**Full generation prompt (reproducible):**
> Ultra-premium brand emblem logo, abstract metallic gold lightning bolt fused with a forward-leaning winged chevron forming a subtle shield silhouette, polished 3D liquid-gold material with fine brushed texture, thin electric-cyan rim light on one edge, floating over a very dark charcoal (#0b0e14) studio background with a soft golden glow pool beneath, perfectly centered, sharp clean edges, cinematic product lighting, luxury fintech and emergency-response brand feel, no text, no letters.

**Usage rules:** never on light backgrounds without the dark plate; keep 12 px+ clearspace; cyan rim must never be recolored.

---

## 🖼 AI Asset Prompts (all sections)

**1. Hero — "The Chase" (delivery rider):**
> Cinematic wide shot of a futuristic delivery rider on a sleek electric scooter speeding through a city street at night, dramatic motion blur and trailing light streaks, dark charcoal atmosphere, warm golden streetlights and electric cyan neon signs reflecting on wet asphalt, rider in a black jacket with gold accents, premium high-energy commercial photography, dark moody color grade with gold highlights.

**2. Cranes — "The Titan":**
> Massive heavy-duty crane lifting a steel beam at a large construction site at dusk, dramatic golden-hour backlight, dust particles floating in the air, dark slate sky with amber glow, industrial power and precision, cinematic wide angle, premium commercial photography, high detail, dark moody grade with gold highlights.

**3. Emergency Maintenance — "The Fixer":**
> Confident professional home maintenance technician in a dark navy uniform with a gold emblem patch, holding a glowing tablet and professional tools, standing in a modern elegant dark living room, warm golden accent lighting, shallow depth of field, premium commercial photography, trustworthy high-tech emergency service feel, dark charcoal palette with gold highlights.

**4. Lifestyle — "The Polish":**
> Elegant professional home service scene: a professional service provider in a premium dark uniform with gold accents tidying a spotless modern luxury living room, warm golden evening light, minimal high-end interior, sparkling clean surfaces, soft bokeh background, premium commercial lifestyle photography, dark elegant palette with gold and cyan accents.

---

## 🧩 Platform Features

### Landing (`index.html`)
- Cinematic preloader (gold conic ring + logo float)
- Canvas particle field (gold/cyan dust, DPR-capped, pause on tab-hide)
- Fixed glass nav that compresses on scroll + scroll-spy highlighting
- Hero with live search (input + category select) & quick-filter chips
- Infinite live availability ticker marquee (pause on hover)
- Animated stat counters (IntersectionObserver-triggered)
- 4 category pillars — **clicking a category jumps straight to its filtered workers list**
- 3-step "How it works" (اختار القسم ← شوف المتاح 🟢 ← كلمه فوراً) with rotating conic number rings
- **Workers directory:** text search + **Sharqia center filter** + category chips, verified badges, **live status** (🟢 نشط / 🔴 مشغول / ⚫ غير نشط), active-first ordering, and per-worker **📞 tel: + ✆ wa.me buttons** — **no prices, no booking, no ratings clutter**
- **Join-us section + modal**: worker onboarding via admin-approval gate (see above)
- **Testimonials carousel (#reviews):** 24 realistic Egyptian reviews — 11 governorates (11× الشرقية + القاهرة، الجيزة، القليوبية، الدقهلية، الغربية، المنوفية، الإسماعيلية، بورسعيد، السويس، دمياط), all 4 service categories (دليفري 6 • صيانة 7 • أوناش 5 • معيشية 6), 4–5★ only, auto-playing slider (pause on hover/touch), filter chips with counts, rating summary (avg 4.8 + facts), arrows/dots/keyboard/swipe — price-free texts about speed, honesty & performance
- 24/7 CTA band, **🚨 emergency button (0122 599 0584)**, full footer, floating WhatsApp/Call/Back-to-top (emergency channels on the admin number)
- Ripple buttons, toast system, RTL-perfect layout, `prefers-reduced-motion` respected

### Admin (`admin.html`) — Managers' Management System
- **Secure gate:** master password verified via **SHA-256 hash comparison** (plain text never stored), brute-force lockout (5 fails → 30 s), show/hide password, "remember me" (30 days vs 12 h session)
- **Session engine:** token in `localStorage` with TTL, live expiry watcher (auto-logout), clean lockout
- **Overview:** 5 KPI cards (workers total, 🟢/🔴/⚫ counts, pending joins), per-category worker distribution bars, latest join requests feed, and a quick status-control table
- **Join requests (طلبات الانضمام):** every join request from the site appears here for review (sidebar badge = count of pending). Actions:
  - **✓ اعتماد** (quick) — instant approval with the applicant's own data
  - **🗂 اعتماد + بيانات كاملة** — review/edit full data (name, phone, WhatsApp, category, Sharqia center, specialty) + set subscription status before publishing
  - **✕ رفض** — archived, stays hidden
- **Workers (العمال والحالات):** full table with per-worker 📞/✆ links, the 3-state live status control, and the **subscription column** (✅ مدفوع / ⏳ لم يُدفع — admin-only, never shown to customers) with a one-click toggle (`elhani_provider_paid_v1`). **➕ إضافة عامل جديد** button opens a full manual-add form: name, phone, WhatsApp, category, center, specialty, notes + paid status → saved to `elhani_custom_providers_v1` (ID `MP-####`) and appears on the landing page instantly with a "🛡️ أضافته الإدارة — موثّق" badge.
- **Settings:** session info, one-click "reset all workers to 🟢 نشط"
- The dashboard listens to cross-tab `storage` events, so new join requests / manual adds reflect live in both directions.
- Arabic RTL throughout, same Pearl & Sapphire system

### Security notes (honest engineering)
- This build ships the validation **client-side** (it's a static platform). The password exists only as a SHA-256 digest + the code uses `crypto.subtle` with a pure-JS fallback.
- For production: swap `ELHANI_AUTH.verify()` for a `POST /admin/login` on your API; keep the same session shape — the dashboard won't change a line.

---

## 📦 Generated Provider Dataset (209 workers — realistic per-category counts)

The platform ships with a **209-worker generated pool, capped at 55 workers per category** — realistic, varied sizes per trade instead of huge numbers. Merged into the landing page (`D.providers`), the admin tables, and the live status / subscription systems — with zero code duplication.

**Generator:** `node scripts/generate-providers.js` → writes `js/data-500.js` (`window.ELHANI_EXTRA_PROVIDERS`). Deterministic (`SEED` at the top) — rerunning gives the exact same dataset. The file is **written only after every validation passes**.

**Data guarantees (validated at generation time):**
- **أسماء مصرية حقيقية 100%** — first name + middle + family from ~250 distinct real Egyptian names, all **unique**, no duplicates.
- **أرقام مصرية صحيحة وفريدة** — `01[0125]XXXXXXXX` (11 digits), 209 unique, never colliding with the core providers' numbers.
- **أعداد متباينة لكل قسم (1..55):** دليفري 55 • صيانة طارئة 53 • معيشية 51 • أوناش 50 (open `CATS` weights — validator refuses any category above 55).
- **النطاق الجغرافي:** only Sharqia centers — الزقازيق 61 • العاشر من رمضان 38 • بلبيس 25 • منيا القمح 19 • ديرب نجم 15 • أبو حماد 13 • ههيا 10 • فاقوس 10 • القنايات 4 • أبو كبير 4 • أبو بكر الصديق / تلة أبا / حماطة / نقطة الشرقية / سيد زرين 2 each (+ open `CITIES` weights in the script).
- Every worker has a realistic specialty / services list + emoji, `tel:`/`wa.me` buttons, and defaults to 🟢 نشط (status still admin-controlled per worker).

The site still renders every worker as a normal card — search, city filter, category chips, availability filter, and the admin status/subscription controls all work across the full 224-worker directory (15 core + 209 generated).

## 📋 Generated Directory — سجل الحَقني (469 records)

A dedicated records section near the bottom of the landing page (`#records`) that ships a **469-record directory: 209 workers/providers (max 55 per trade) + 260 customers/clients** — browsable without touching the existing cards.

**Generator:** `node scripts/generate-directory.js` → writes `js/data-560.js` (`window.ELHANI_DIRECTORY = {meta:{total:469,workers:209,customers:260}, people:[...]}`). Deterministic (`SEED = 20260831`); rerunning always produces the same dataset, and the file is **written only after every validation passes** (the validator exits non-zero without saving on failure).

**Data guarantees (validated at generation time):**
- **أسماء مصرية فريدة 100%** — first + father + family from ~330 distinct real Egyptian names; **0 duplicates inside the 469** and **0 collisions** with `data.js` + `data-500.js` names.
- **أرقام مصرية صحيحة وفريدة** — 469 unique `01[0125]XXXXXXXX` numbers, never colliding within the record set.
- **أعداد عمال متباينة لكل قسم (1..55):** دليفري 55 • صيانة 53 • معيشية 51 • أوناش 50; customers — دليفري 80 • صيانة 75 • معيشية 60 • أوناش 45 (open weights in the script).
- **النطاق الجغرافي:** only 15 Sharqia centers (الزقازيق 138 • العاشر 84 • بلبيس 57 • منيا القمح 42 • ديرب نجم 34 • أبو حماد 28 • ههيا 24 • فاقوس 24 • القنايات 10 • أبو كبير 8 • أبو بكر الصديق / تلة أبا / حماطة / نقطة الشرقية / سيد زرين 4 each).
- **Realistic details:** each worker lists a specialty + 2 services; each customer has a "طلب: …" note (delivery requests include an origin → destination route, e.g. "من الزقازيق إلى بلبيس").
- **Statuses:** workers — 🟢 نشط / 🟠 مشغول / ⚪ غير نشط (80/12/8%); customers — 🆕 جديد / 🔵 قيد التنفيذ / ✅ تم (30/42/28%).

**Section behavior (landing only, purely additive — admin panel untouched):**
- 7-column table: ID • النوع • الاسم • الموبايل • المركز • التفاصيل • الحالة
- **Tabs** الكل / عمال / زبائن with live counts • **debounced search** (name, phone, city, ID) • **pagination: 12 rows/page** (40 pages) with prev/next + page buttons with ellipses, auto-disabled at the edges, smooth-scroll on page change.
- `js/directory.js` guards on load — if `js/data-560.js` is missing it returns silently and the site is untouched.
- E2E (`e2e.test.js`) now covers the directory: dataset size/uniqueness, valid Egyptian phones, tab filtering, next/prev pagination — full suite **120/120 passing**.

## 💬 Generated Testimonials — آراء العملاء (24 reviews)

The landing `#reviews` section now ships a **24-review carousel** of realistic Egyptian customer experiences — covering every service category and 11 governorates.

**Generator:** `node scripts/generate-testimonials.js` → writes `js/data-testimonials.js` (`window.ELHANI_TESTIMONIALS = {meta:{total:24,avg:4.8,governorates:11}, items:[...]}`). Deterministic (`SEED = 20260832`); the file is **written only after every validation passes** (unique names, ≥10 Sharqia reviews, all 4 categories, 4–5★ only, price-free texts, no `undefined`).

**Content guarantees:**
- **أسماء مصرية حقيقية متنوعة** — 24 unique reviewer names, **0 collisions** with `data.js` / `data-500.js` / `data-560.js` names.
- **من كل مصر:** 11 × الشرقية (الزقازيق، بلبيس، العاشر، ههيا، فاقوس، منيا القمح) + القاهرة، الجيزة، القليوبية، الدقهلية، الغربية، المنوفية، الإسماعيلية، بورسعيد، السويس، دمياط.
- **كل الأقسام:** دليفري 6 • صيانة طارئة 7 • أوناش 5 • معيشية 6 — كل رأي مربوط بخدمة حقيقية (توصيل فوري، سباكة طوارئ، أونش 25 طن، غسيل سجاد…).
- **نصوص مصرية واقعية** عن سرعة الخدمة، أمانة العمال، والالتزام — **صفر كلام أسعار** (فاحص دائم في المولّد يرفض "السعر/جنيه/ج.م/يبدأ من").
- **تقييمات 4–5★ فقط** (متوسط 4.8) مع `since` واقعي (منذ أسبوع… منذ سنة).

**Section behavior (additive, falls back gracefully):**
- `js/testimonials.js` renders a **rating summary** (4.8 + عدد الآراء + عدد المحافظات + تواصل مباشر), **filter tabs** with live counts, and an **auto-playing slider** (every 5.2s) — 3 cards desktop / 2 tablet / 1 mobile, arrows + dots + swipe + keyboard, pause on hover/touch, RTL-aware transforms.
- If `js/data-testimonials.js` is missing it returns silently and the original 3 static reviews from `data.js` remain (app.js fallback untouched).

## 🧪 Testing
`e2e.test.js` is a full jsdom end-to-end suite (133 assertions) covering: Sharqia-only worker scope, RTL, the total removal of orders/prices ("اطلب الآن", booking modal, ج.م — all gone), per-worker `tel:`/`wa.me` buttons (own numbers, not the admin's), direct category→workers navigation (service cards + footer links), city/availability filters, live status sync via `storage` events, the full join-request → admin-approval → public-card loop, admin login (wrong + exact master password), session lifecycle, worker status controls from both overview and workers views, the status reset action, logout, the 469-record directory — including the **55-per-category cap** and varied per-trade counts (dataset guarantees, tabs, pagination) — and the **24-review testimonials carousel** (unique Egyptian names, 11 governorates, all 4 categories, 4–5★ only, price-free texts, arrows, filter tabs, rating summary).
```bash
npm install jsdom && node e2e.test.js
```

---

## ⚙️ Tech
- Zero build step, zero dependencies, zero network calls (fonts aside) — pure HTML/CSS/JS
- Arabic-first RTL with logical properties (`inset-inline`, `margin-inline`) so it flips correctly
- Performance: transform/opacity-only animations, capped DPR, lazy images, IO-driven reveals
- Works offline after first load (localStorage persistence)

© 2026 الحَقني Elha'ni — Made in Egypt, at full speed. ⚡
