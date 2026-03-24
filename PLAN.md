# WanderQuest 2026 UI/UX Overhaul — Implementation Plan

## Codebase Audit

### What already exists (no changes needed)
- **PWA**: `manifest.json` already `"display": "standalone"`, `viewportFit: "cover"` set in layout.tsx, all safe-area utilities (`.pb-safe`, `.pt-header`, `.pt-safe`) defined in globals.css and used by BottomNav/header.
- **BottomSheet**: `components/ui/BottomSheet.tsx` — full drag-to-dismiss, keyboard-close, body scroll lock.
- **Framer Motion**: Already pervasive — `spring` presets in `lib/motion.ts`, `whileTap` on buttons, `AnimatePresence` throughout.
- **Glass utilities**: `.glass-card`, `.glass-card-hover` already in globals.css `@layer utilities`.
- **3-layer design token system**: Primitive → Semantic → Component already complete.
- **BentoHub structure**: 4-tile grid (Map, Safety, Rank, CommunityFeed) already exists.
- **CurrencyConverter**: Component exists in `components/features/currency/CurrencyConverter.tsx`.

### Gaps to fix (the 5 deliverables)

---

## Deliverable 1 — Typography System (`app/globals.css` + `app/layout.tsx`)

**What**: Replace `Playfair Display` (serif, editorial feel) with `Space Grotesk` (geometric, Neue Montreal alternative, free on Google Fonts). Add strict typography scale utility classes.

**Changes:**
- `app/layout.tsx`: Replace `Playfair_Display` import → `Space_Grotesk` (weights: 400, 500, 700)
- `app/globals.css`:
  - Update `--p-font-display` to `"Space Grotesk"`
  - Add to `@layer utilities`:
    ```css
    .text-hero      { font-size: clamp(2.6rem,8vw,3.2rem); font-weight:900; line-height:1.04; letter-spacing:-0.02em; }
    .text-title-lg  { font-size: 1.5rem;  font-weight:800; line-height:1.15; letter-spacing:-0.01em; }
    .text-body-md   { font-size: 0.9375rem; font-weight:400; line-height:1.65; }
    .text-mono-data { font-family: ui-monospace, "SF Mono", monospace; font-size:0.8125rem; font-weight:700; letter-spacing:0.02em; }
    ```

---

## Deliverable 2 — BentoHub Panoramica Overhaul (`components/features/home/BentoHub.tsx`)

### 2a — MapTile: Landmark thumbnail image-pins
**What**: Add 3 circular landmark thumbnail images positioned as map-pins on the pseudo-map, replacing pure text pills.

**Implementation**:
```tsx
// Replace text pills with image-pin components:
function LandmarkPin({ name, imageUrl, pts, style, color }) {
  return (
    <div className="absolute flex flex-col items-center gap-0.5" style={style}>
      <div className="h-9 w-9 rounded-full border-2 overflow-hidden shadow-lg" style={{borderColor: color}}>
        <Image src={imageUrl} alt={name} fill className="object-cover" sizes="36px"/>
      </div>
      <div className="rounded-full bg-black/70 border border-white/10 backdrop-blur-sm px-2 py-0.5">
        <span className="text-[9px] font-black text-white">{name} · {pts}pt</span>
      </div>
    </div>
  );
}
// Add 3 pins: Colosseo (teal), Pantheon (gold), Sagrada Família (purple)
// positioned at: top-[18%] left-[8%], top-[38%] right-[10%], top-[55%] left-[30%]
```

### 2b — SafetyTile: Haiku-style 1-sentence summary
**What**: Add a short contextual sentence below the status badge. Sentence is derived from level (not a live API call — the full SafetyHub widget already handles that). Map each level to a concise travel-advisory sentence.

```tsx
const SAFETY_SUMMARIES: Record<SafetyLevel, string> = {
  STABLE:   "Area sicura: esplora liberamente con le normali precauzioni.",
  WARNING:  "Evita zone isolate di notte; tieni d'occhio avvisi locali.",
  CRITICAL: "Segui le istruzioni delle autorità locali e limita gli spostamenti.",
};
```
Add this line below the status label in `SafetyTile`, styled as `text-[11px] text-white/50 leading-snug mt-1`.

### 2c — RankTile → LivePodiumTile (the biggest visual change)
**What**: Replace the single-rank tile with a "Live Mini Podium" showing top-3 users. If the current user is unranked, show: "Mancano X punti per entrare nella Top 10".

**Implementation**:
- Rename `RankTile` → `LivePodiumTile`
- Use the existing `useLeaderboard(contestId, 10)` hook (already called in BentoHub via RankTile)
- Render top-3 as 3 stacked compact rows (rank badge · avatar · name · points)
- Use `isMe` highlight for the current user's row
- If user is not in top 10: show a progress bar "X pt per Top 10" at the bottom

```tsx
// Layout inside the tile (h-36, compact):
// ┌─────────────────────────────┐
// │ 🏆  Classifica Live          │  header
// ├─────────────────────────────┤
// │ 🥇 [ava] Sofia R.    1,240pt │  row 1
// │ 🥈 [ava] Marco B.      890pt │  row 2
// │ 🥉 [ava] Lucia G.      650pt │  row 3
// ├─────────────────────────────┤
// │ ████░░░░ 340pt per Top10    │  (shown when unranked)
// └─────────────────────────────┘
```

### 2d — CommunityFeedTile: Richer social strip
**What**: Make the 4 photos more social — add a small user avatar circle on each photo card, city name badge, and a "Live" pulse dot for photos uploaded < 1h ago.

**Implementation**:
- Fetch `displayName` + `uploadedAt` alongside existing `imageUrl`/`likes`
- Add avatar initial-circle (bg-gradient-to-br) top-left of each photo
- Add "Live" green pulsing dot if `uploadedAt` within 60 minutes
- City badge bottom of photo
- Increase photo height slightly: `aspect-[2/3]` instead of `aspect-[3/4]`

---

## Deliverable 3 — Currency "Traveler's Utility" Module (`app/page.tsx`)

**What**: Add a dedicated "Strumenti del Viaggiatore" section on the home page, after the Testimonials section and before the Premium Plan, containing the `CurrencyConverter` component wrapped in a premium glass card.

**Implementation** (add new section in page.tsx):
```tsx
{/* ── TRAVELER'S UTILITY ──────────────────────────────── */}
<section className="px-4 mb-10">
  <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.92}}>
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--s-accent)] mb-1">Strumenti</p>
    <h2 className="font-display text-2xl font-black mb-4">Cambio Valuta</h2>
  </motion.div>
  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.96}} className="glass-card p-0 overflow-hidden">
    <CurrencyConverter />
  </motion.div>
</section>
```

---

## Deliverable 4 — Landmark Detail BottomSheet (`app/page.tsx`)

**What**: The hero floating pills (Sagrada Família, Park Güell, Casa Batlló) currently have no interaction. Wire them to open a `BottomSheet` with landmark details (points value, description, distance, CTA to scan).

**Implementation**:
- Add `LandmarkInfo` interface + `HERO_LANDMARKS` data array in page.tsx
- Add `useState<LandmarkInfo | null>(null)` for `activeLandmark`
- Make `FloatingPill` accept `onClick` prop
- Render `<BottomSheet open={!!activeLandmark} onClose={...} title={activeLandmark?.name}>` with points, a map CTA button

This uses the existing `BottomSheet` component — zero new dependencies.

---

## Deliverable 5 — PWA Polish (`public/manifest.json`)

Already `display: standalone`. Minor enhancement: add `display_override` for better browser support and `id` field for identity stability.

```json
{
  "id": "/",
  "display_override": ["window-controls-overlay", "standalone"],
  ...existing fields
}
```

---

## File Change Summary

| File | Type | Description |
|------|------|-------------|
| `app/globals.css` | Edit | Add typography scale utilities; update `--p-font-display` |
| `app/layout.tsx` | Edit | Replace Playfair_Display → Space_Grotesk |
| `components/features/home/BentoHub.tsx` | Edit | MapTile pins, SafetyTile sentence, LivePodiumTile, CommunityFeed enhancements |
| `app/page.tsx` | Edit | Add CurrencyConverter section + Landmark BottomSheet |
| `public/manifest.json` | Edit | Add `id` + `display_override` fields |

**Total files: 5** | No new dependencies required | TypeScript check required before commit
