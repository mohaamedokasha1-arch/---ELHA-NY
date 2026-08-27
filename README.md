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
│   ├── style.css       ← Landing design system ("Midnight Gold")
│   └── admin.css       ← Admin dashboard styles
├── js/
│   ├── data.js         ← Platform data (services, providers, testimonials)
│   ├── auth.js         ← SHA-256 checkpoint + session & lockout engine
│   ├── app.js          ← Landing logic (particles, filters, direct contact)
│   └── admin.js        ← Dashboard logic (views, stats, CRUD)
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

## 🎨 Brand Identity — "Midnight Gold"

### Color Palette
| Role | Swatch | Hex |
|---|---|---|
| Background Void | ⬛ | `#07090E` |
| Slate Panel | ⬛ | `#10141D` |
| Royal Gold (primary) | 🟡 | `#D4AF37` |
| Gold Highlight | 🟡 | `#F9E27D` |
| Electric Cyan (secondary) | 🩵 | `#00E5FF` |
| Neon Amber (tertiary) | 🟠 | `#FFB020` |
| Burnt Orange (alerts) | 🟧 | `#FF6B35` |
| Success Green | 🟢 | `#2EE6A8` |

**Rule of thumb:** gold = brand & money, cyan = speed & tech, amber/orange = urgency & action.

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
- Testimonials, 24/7 CTA band, **🚨 emergency button (0122 599 0584)**, full footer, floating WhatsApp/Call/Back-to-top (emergency channels on the admin number)
- Ripple buttons, toast system, RTL-perfect layout, `prefers-reduced-motion` respected

### Admin (`admin.html`)
- **Secure gate:** master password verified via **SHA-256 hash comparison** (plain text never stored), brute-force lockout (5 fails → 30 s), show/hide password, "remember me" (30 days vs 12 h session)
- **Session engine:** token in `localStorage` with TTL, live expiry watcher (auto-logout), clean lockout
- **Overview:** 5 KPI cards (workers total, 🟢/🔴/⚫ counts, pending joins), per-category worker distribution bars, latest join requests feed, and a quick status-control table
- **Join requests (طلبات الانضمام):** live review queue with pending-approval badge in the sidebar, approve (shows the worker's card + contact buttons on the site instantly) / reject with confirmation, status tabs
- **Workers (العمال والحالات):** full table with the worker's own 📞/✆ links and the 3-state live status control (reflected instantly on the site)
- **Settings:** session info, one-click "reset all workers to 🟢 نشط"
- Arabic RTL throughout, same Midnight Gold system

### Security notes (honest engineering)
- This build ships the validation **client-side** (it's a static platform). The password exists only as a SHA-256 digest + the code uses `crypto.subtle` with a pure-JS fallback.
- For production: swap `ELHANI_AUTH.verify()` for a `POST /admin/login` on your API; keep the same session shape — the dashboard won't change a line.

---

## 🧪 Testing
`e2e.test.js` is a full jsdom end-to-end suite (85+ assertions) covering: Sharqia-only worker scope, RTL, the total removal of orders/prices ("اطلب الآن", booking modal, ج.م — all gone), per-worker `tel:`/`wa.me` buttons (own numbers, not the admin's), direct category→workers navigation (service cards + footer links), city/availability filters, live status sync via `storage` events, the full join-request → admin-approval → public-card loop, admin login (wrong + exact master password), session lifecycle, worker status controls from both overview and workers views, the status reset action, and logout.
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
