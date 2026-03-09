# Tiplives — Tasks (Source of Truth)

> **How to use this file**
> This is the canonical task tracker. Every feature must live here before it's built.
> Mark tasks as `[x]` when done. Add ✅ to section headers when the full section is complete.
> Reference: `masterplan.md`, `implementation-plan.md`, `app-flow-pages-and-roles.md`, `design-guidelines.md`

---

## Status Legend

- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Done
- `[-]` — Skipped / deferred

---

## PHASE 1 — Foundation ✅ (Mostly Complete)

### 1.1 Project Setup ✅

- [x] Initialize Vite + React + TypeScript project
- [x] Configure Tailwind CSS with design system tokens (`tailwind.config.ts`, `src/index.css`)
- [x] Install and configure shadcn/ui components
- [x] Setup `react-router-dom` with page routes
- [x] Setup `@tanstack/react-query`
- [x] Connect Lovable Cloud (Supabase) backend

**Design token checklist** (`src/index.css` + `tailwind.config.ts`):
```css
/* Must exist in :root */
--background: 216 27% 5%;        /* #0B0F14 */
--card: 216 27% 8%;              /* #121821 */
--border: 215 27% 14%;           /* #1D2633 */
--primary: 142 72% 50%;          /* #22C55E */
--foreground: 213 11% 96%;       /* #F3F4F6 */
--muted-foreground: 215 9% 64%;  /* #9CA3AF */
--warning: 38 92% 50%;           /* #F59E0B */
```

---

### 1.2 Database Schema ✅

- [x] `matches_history` table created
- [x] `opportunities` table created
- [x] `profiles` table created
- [x] `subscriptions` table created
- [ ] `favorites` table — **NEEDED for v1**

**`favorites` table SQL** (run as migration):
```sql
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  team_id integer,
  team_name text,
  league_id integer,
  league_name text,
  created_at timestamptz not null default now(),
  unique (user_id, team_id)
);

alter table public.favorites enable row level security;

create policy "Users can manage their own favorites"
on public.favorites for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

**RLS already in place:**
- `matches_history` — public read, service role write ✅
- `opportunities` — public read, service role write ✅
- `profiles` — user-scoped read/write ✅
- `subscriptions` — user-scoped read, service role write ✅

---

### 1.3 Authentication ✅

- [x] Email + password signup / login (`src/pages/Auth.tsx`)
- [x] Google OAuth (`lovable.auth.signInWithOAuth`)
- [x] `AuthContext` with `user`, `session`, `isPremium`, `signOut` (`src/contexts/AuthContext.tsx`)
- [x] Redirect to `/dashboard` after login
- [x] Email confirmation flow (toast shown after signup)
- [ ] Password reset page — **NEEDED**

**Password reset snippet** (add to `src/pages/Auth.tsx`):
```tsx
const handlePasswordReset = async () => {
  if (!email) return toast.error("Escribe tu email primero");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) toast.error(error.message);
  else toast.success("Revisa tu email para restablecer tu contraseña");
};
```

---

## PHASE 2 — Data Pipeline [~]

> Reference: `implementation-plan.md` Phase 2 + `supabase/functions/analyze-trends/index.ts`

### 2.1 Fetch Football Data ✅

- [x] Edge function `analyze-trends` created and deployed
- [x] Fetches fixtures for last 7 days + today + tomorrow (9 API calls)
- [x] Filters to **11 top leagues only** (saves ~70% API credits):
  - Champions League (42), Europa League (73)
  - Premier League (47), La Liga (87), Serie A (55)
  - Bundesliga (54), Ligue 1 (53)
  - Liga MX (239), MLS (41), Eredivisie (130), Liga Portugal (61)
- [x] Upserts finished matches to `matches_history`
- [x] Loads full history from DB for trend analysis (no re-fetch)

**Current API credit usage per run:**
```
9 date fetches + up to 15 odds fetches = ~24 max requests per run
```

---

### 2.2 Fetch Odds Data [~]

- [x] Odds fetched from `football-event-odds` endpoint (RapidAPI)
- [x] Prioritizes **Bet365** (bookmaker ID = 2)
- [x] Parses: Over 2.5, Over 1.5, BTTS Yes, Home Win, Away Win
- [ ] **BUG**: odds often fallback to hardcoded defaults (1.85, 1.30, etc.) when the API response structure doesn't match
  - Fix: Add detailed logging of raw odds response + improve parser robustness
  - Reference: `analyze-trends/index.ts` lines 375–420

**Improved odds parser snippet:**
```typescript
// More defensive parsing — handles nested/flat structures
function parseOddsFromResponse(data: any): Record<string, number> {
  const parsed: Record<string, number> = {};
  const oddsArr = data?.response?.odds 
    ?? data?.response?.bookmakers
    ?? data?.odds ?? [];
  
  for (const group of oddsArr) {
    const isBet365 = group?.bookmakerId === 2 || group?.id === 2;
    for (const market of (group?.markets ?? group?.items ?? [])) {
      const name = (market?.name ?? market?.marketName ?? "").toLowerCase();
      for (const val of (market?.values ?? market?.outcomes ?? [])) {
        const label = (val?.name ?? val?.label ?? "").toLowerCase();
        const odd = parseFloat(val?.odd ?? val?.price ?? val?.value);
        if (isNaN(odd) || odd < 1.01) continue;
        if (name.includes("over") && label.includes("2.5") && label.includes("over")) {
          if (isBet365 || !parsed.over25) parsed.over25 = odd;
        }
        if (name.includes("over") && label.includes("1.5") && label.includes("over")) {
          if (isBet365 || !parsed.over15) parsed.over15 = odd;
        }
        if ((name.includes("btts") || name.includes("both teams")) && label.includes("yes")) {
          if (isBet365 || !parsed.btts) parsed.btts = odd;
        }
        if ((name.includes("1x2") || name.includes("result")) && (label === "1" || label === "home")) {
          if (isBet365 || !parsed.homeWin) parsed.homeWin = odd;
        }
      }
    }
  }
  return parsed;
}
```

---

### 2.3 Trend Detection Engine [~]

- [x] Analyzes Over 2.5, Over 1.5, BTTS, Home Win, Team Scored patterns
- [x] Supports sample sizes: 3, 5, 10, 15, 20 matches
- [x] Deduplicates per team + market + context (keeps strongest)
- [x] Attaches upcoming match data (`next_match_home`, `away`, `time`)
- [x] Only generates opportunities for teams with **an upcoming match**
- [ ] **Add corner trend analysis** (v1 scope)
- [ ] **Add discipline/cards trend** (v1 scope)
- [ ] **Add away win streak** pattern
- [ ] **Add unbeaten streak** pattern (won or drawn)

**Corner / Cards analysis snippet** (add to `analyzeTeamTrends`):
```typescript
// Corners — requires corners data (currently not in matches_history)
// TODO: add total_corners column to matches_history when API provides it

// Unbeaten streak
const unbeatenCount = sample.filter((m) => !m.lost).length;
if (unbeatenCount >= Math.ceil(sampleSize * 0.75)) {
  opps.push({
    ...baseFields,
    pattern_type: "RESULT", market: "Result",
    description: `${stats.teamName} sin perder en ${unbeatenCount} de ${sampleSize} partidos`,
    context: "general", hits: unbeatenCount, sample: sampleSize,
    is_hot: unbeatenCount / sampleSize >= 0.85,
    odds: realOdds?.homeWin || 1.50,
  });
}

// Away win streak
const awayMatches = sample.filter((m) => !m.isHome);
if (awayMatches.length >= 3) {
  const awayWins = awayMatches.filter((m) => m.won).length;
  if (awayWins >= Math.ceil(awayMatches.length * 0.70)) {
    opps.push({
      ...baseFields,
      pattern_type: "RESULT", market: "Result",
      description: `Victoria visitante en ${awayWins} de ${awayMatches.length} partidos fuera`,
      context: "away", hits: awayWins, sample: awayMatches.length,
      is_hot: awayWins / awayMatches.length >= 0.80,
      odds: realOdds?.awayWin || 2.10,
    });
  }
}
```

---

### 2.4 Strength Scoring & Ranking ✅

- [x] `strength` = `hits / sample` (percentage), sorted descending
- [x] Larger sample size breaks ties (20 > 15 > 10 > 5 > 3)
- [x] `is_hot = true` when strength ≥ 85%
- [ ] Add `strength` column computation directly in DB via trigger (deferred to v2)

---

### 2.5 Scheduled Runs [ ]

- [ ] Configure cron job to run `analyze-trends` every **6 hours**
  - File: `supabase/config.toml` — add cron schedule
  - **SQL for pg_cron** (run as migration):
```sql
-- Enable pg_cron extension (if not enabled)
select cron.schedule(
  'analyze-trends-every-6h',
  '0 */6 * * *',
  $$
    select net.http_post(
      url := current_setting('app.edge_function_url') || '/analyze-trends',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```
  - Alternative: Call via Supabase `pg_net` or set up external cron (e.g. cron-job.org)

---

## PHASE 3 — Dashboard (Core Product) [~]

> Reference: `app-flow-pages-and-roles.md` → Dashboard section
> Files: `src/pages/Dashboard.tsx`, `src/components/dashboard/`

### 3.1 Dashboard Layout ✅

- [x] `DashboardNavbar` with logo, user status, Pro badge, sign-in CTA
- [x] `FiltersBar` with time filter (Hoy / Mañana / 3 días)
- [x] `MarketTabs` (Popular, Over 2.5, BTTS, etc.)
- [x] `PatternTable` with mobile card + desktop row layout
- [x] `BetSlip` sidebar (desktop) + bottom sheet (mobile)
- [x] Premium overlay with blur + upgrade CTA
- [x] Loading + error + empty states

---

### 3.2 Filters (Functional) [ ]

Currently filters are **UI-only** — they don't filter the actual data.

- [ ] **Time filter** — filter `opportunities` by `next_match_time` date
  - Hoy: `next_match_time` between `startOfDay(today)` and `endOfDay(today)`
  - Mañana: same for tomorrow
  - 3 días: next 3 days range
- [ ] **Market tab** — filter by `market` column (already partially working via mock)
  - Fix `useFootballData` to pass market filter to DB query OR filter client-side from full dataset
- [ ] **League filter** — dropdown with top 11 leagues
- [ ] **Context filter** — General / Home / Away (maps to `context` column)
- [ ] **Minimum repetition** — slider (min hits/sample %)
- [ ] **Odds range** — min/max odds slider

**Implementation approach** (client-side filtering from full dataset):
```typescript
// In useFootballData.ts — fetch all, filter in useMemo in Dashboard.tsx
const filteredPatterns = useMemo(() => {
  let result = apiPatterns;

  // Time filter
  if (activeTime === "Hoy") {
    const todayStr = new Date().toISOString().split("T")[0];
    result = result.filter((p) => p.matchTime?.startsWith(todayStr) ?? true);
  }
  // ... etc

  // Market tab
  if (activeTab !== "Popular") {
    result = result.filter((p) => p.market.includes(activeTab));
  }

  return result;
}, [apiPatterns, activeTime, activeTab]);
```

---

### 3.3 PatternTable Improvements [ ]

- [ ] Add **empty state** when no patterns match filters
  - Copy: "No hay patrones fuertes con estos filtros. Prueba ampliar el rango de cuotas."
- [ ] Make each row **clickable** → navigates to `/opportunity/:id`
- [ ] Add **Flame icon** for `is_hot` rows
- [ ] Add subtle **hover lift** animation (150ms ease-out)
- [ ] Fix "Cargar más" button — currently non-functional (connect pagination or remove)
- [ ] Show **league flag/icon** next to league name (optional enhancement)

**Empty state component:**
```tsx
const EmptyState = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
    <div className="text-4xl opacity-20">⚽</div>
    <p className="text-sm font-medium text-foreground">
      No hay patrones fuertes con estos filtros.
    </p>
    <p className="text-xs text-muted-foreground">
      Prueba ampliar el rango de cuotas o cambiar la muestra.
    </p>
  </div>
);
```

---

### 3.4 Odds Format Toggle [ ]

- [x] `OddsContext` exists with `formatOdds` function
- [ ] Add **toggle switch** in `DashboardNavbar` or `FiltersBar` for Decimal / American
- [ ] Persist preference to `localStorage`

```tsx
// OddsContext already exports formatOdds — just need the UI toggle
// Add to DashboardNavbar or FiltersBar:
<button onClick={toggleFormat} className="text-xs text-muted-foreground hover:text-foreground">
  {format === "decimal" ? "Decimal" : "Americano"}
</button>
```

---

## PHASE 4 — Opportunity Detail Page [ ]

> Reference: `app-flow-pages-and-roles.md` → Opportunity Detail Page
> Files: `src/pages/OpportunityDetail.tsx` (to create)

### 4.1 Route Setup [ ]

- [ ] Add route `/opportunity/:id` to `src/App.tsx`
- [ ] Create `src/pages/OpportunityDetail.tsx`
- [ ] Make PatternTable rows clickable → `navigate('/opportunity/' + p.id)`

---

### 4.2 Detail Page Sections [ ]

- [ ] **Pattern Summary** — headline with team name + market + repetition
  - Example: "Real Madrid marcó Over 2.5 en 19 de los últimos 20 partidos"
- [ ] **Sample Breakdown** — table with last 5 / 10 / 15 / 20 hit rates
- [ ] **Home vs Away Split** — two stat bars
- [ ] **Trend Visualization** — simple bar chart (recharts) showing last 20 matches
- [ ] **Available Odds** — show Bet365 odds for this market
- [ ] **Add to Slip** CTA button

**Page layout sketch:**
```
┌─────────────────────────────────────┐
│ ← Back                              │
│                                     │
│ [GOLES] Real Madrid                 │
│ Over 2.5 en 19 / 20 partidos       │  ← H2 bold
│ 📅 vs Atletico · Hoy 21:00          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Sample     Hit   Rate    Heat   │ │
│ │ Last 5     5/5   100%    🔥🔥   │ │
│ │ Last 10    9/10   90%    🔥     │ │
│ │ Last 15   13/15   87%    🔥     │ │
│ │ Last 20   19/20   95%    🔥🔥   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Local vs Visitante                  │
│ [████████░░] Casa: 85%              │
│ [██████░░░░] Fuera: 73%             │
│                                     │
│ Cuota Bet365: 1.85                  │
│ [+ Agregar al Slip]                 │
└─────────────────────────────────────┘
```

**Data fetch:**
```typescript
// src/pages/OpportunityDetail.tsx
const { data: opp } = useQuery({
  queryKey: ["opportunity", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
});

// For home/away split, query matches_history for the team
const { data: history } = useQuery({
  queryKey: ["team-history", opp?.team_id],
  enabled: !!opp?.team_id,
  queryFn: async () => {
    const { data } = await supabase
      .from("matches_history")
      .select("*")
      .or(`home_team_id.eq.${opp.team_id},away_team_id.eq.${opp.team_id}`)
      .order("match_date", { ascending: false })
      .limit(20);
    return data;
  },
});
```

---

## PHASE 5 — Freemium Paywall [ ]

> Reference: `masterplan.md` → Freemium Model
> `app-flow-pages-and-roles.md` → Paywall Flow

### 5.1 Current State [~]

- [x] Free users see 3 visible rows
- [x] Blur overlay with upgrade CTA in dashboard
- [x] `isPremium` flag in `AuthContext` from `subscriptions` table

### 5.2 Tasks [ ]

- [ ] Show **exact count** of locked patterns in overlay
  - "Desbloquea 24 patrones premium detectados hoy"
  - Currently hardcoded — fetch count from DB
- [ ] **Blur individual rows** below the 3rd instead of full overlay
- [ ] Lock filters for free users (show them but disable advanced ones)
- [ ] Lock opportunity detail page for free users → redirect to pricing
- [ ] Lock slip builder for free users

**Dynamic locked count:**
```typescript
// In Dashboard.tsx
const lockedCount = Math.max(0, filteredPatterns.length - 3);

// In overlay:
<p>Desbloquea {lockedCount} patrones premium detectados hoy.</p>
```

---

## PHASE 6 — Slip Builder [ ]

> Reference: `masterplan.md` → Slip Builder
> Files: `src/components/dashboard/BetSlip.tsx`

### 6.1 Current State [~]

- [x] `BetSlip` component exists
- [x] Desktop sidebar + mobile bottom sheet
- [x] Add/remove picks from dashboard
- [ ] Combined odds calculation
- [ ] Stake input → payout calculation
- [ ] Decimal / American odds format toggle

**Payout calculation logic:**
```typescript
// Combined odds = product of all individual odds
const combinedOdds = selections.reduce((acc, s) => acc * s.odds, 1);
const payout = stake * combinedOdds;

// Format
const formatted = combinedOdds.toFixed(2);
const payoutFormatted = payout.toFixed(2);
```

**BetSlip enhancements needed (`src/components/dashboard/BetSlip.tsx`):**
- [ ] Stake input (number field, `min=1`)
- [ ] Display combined odds
- [ ] Display potential payout
- [ ] Empty state: "Agrega tendencias para calcular cuotas combinadas"
- [ ] Max 8 picks limit with toast warning

---

## PHASE 7 — Favorites [ ]

> Reference: `app-flow-pages-and-roles.md` → Favorites Page
> Files: `src/pages/Favorites.tsx` (to create)

### 7.1 Setup [ ]

- [ ] Create `favorites` table (SQL in Phase 1.2 above)
- [ ] Create `src/pages/Favorites.tsx`
- [ ] Add route `/favorites` to `src/App.tsx`
- [ ] Add link to `DashboardNavbar`
- [ ] Add ⭐ button to PatternTable rows (premium only)

**useFavorites hook:**
```typescript
// src/hooks/useFavorites.ts
export function useFavorites() {
  const { user } = useAuth();

  const toggleFavorite = async (teamId: number, teamName: string, leagueId: number, leagueName: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .maybeSingle();

    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id, team_id: teamId, team_name: teamName,
        league_id: leagueId, league_name: leagueName,
      });
    }
  };

  const { data: favorites } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user!.id);
      return data;
    },
  });

  return { favorites, toggleFavorite };
}
```

---

## PHASE 8 — Landing Page [~]

> Reference: `masterplan.md` → Landing Page
> Files: `src/pages/Index.tsx`, `src/components/landing/`

### 8.1 Existing Sections [~]

- [x] `HeroSection` — headline, CTA
- [x] `MiniDashboard` — dashboard preview
- [x] `HowItWorks` — 3 steps
- [x] `PremiumBenefits` — features list
- [x] `CTASection` — final conversion CTA
- [x] `Footer`
- [x] `Navbar`

### 8.2 Remaining Tasks [ ]

- [ ] Verify SEO: single H1, meta description < 160 chars, canonical tag
- [ ] Add `og:image` for social sharing
- [ ] **Hero**: ensure CTA goes to `/auth` (not just "Try Free")
- [ ] **MiniDashboard**: show blurred rows (3 visible, rest blurred) with real opportunity data
- [ ] Add **social proof** section: "X patterns detected today" (pull from DB)
- [ ] Optimize hero image (`src/assets/hero-stadium.jpg`) — lazy load, compress

**Dynamic social proof:**
```typescript
// In HeroSection or a new component
const { count } = useQuery({
  queryKey: ["opp-count"],
  queryFn: async () => {
    const { count } = await supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .gt("expires_at", new Date().toISOString());
    return count ?? 0;
  },
});

// Display: "{count} patrones detectados hoy"
```

---

## PHASE 9 — Pricing Page [~]

> Files: `src/pages/Pricing.tsx`

- [x] Pricing page exists
- [ ] Confirm Hotmart webhook is correctly updating `subscriptions` table
  - File: `supabase/functions/hotmart-webhook/index.ts`
- [ ] Show **current plan** for logged-in users (free vs pro)
- [ ] Add **FAQ section** (gambling disclaimer, refund policy)
- [ ] Add legal disclaimer: "Tiplives no acepta apuestas. Solo muestra tendencias estadísticas."

---

## PHASE 10 — Profile / Account Page [ ]

> Files: `src/pages/Profile.tsx`

- [ ] Show subscription status (free / pro + expiry date)
- [ ] Display name editing
- [ ] Avatar upload (Supabase Storage)
- [ ] Sign out button
- [ ] Link to billing / cancel subscription

**Avatar upload snippet:**
```typescript
const handleAvatarUpload = async (file: File) => {
  const ext = file.name.split(".").pop();
  const path = `avatars/${user!.id}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) return toast.error("Error al subir imagen");
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user!.id);
};
```

---

## PHASE 11 — Performance & Quality [ ]

### 11.1 Frontend

- [ ] Add `React.memo` to `PatternTable` rows (prevent re-renders)
- [ ] Lazy load `OpportunityDetail` and `Favorites` pages
- [ ] Add `@tanstack/react-query` for all DB fetches (replace raw `useEffect` in `useFootballData`)
- [ ] Fix `useFootballData` timeout — currently 8s, reduce to 5s for better UX

**Lazy loading routes (`src/App.tsx`):**
```tsx
const OpportunityDetail = React.lazy(() => import("./pages/OpportunityDetail"));
const Favorites = React.lazy(() => import("./pages/Favorites"));

// Wrap with Suspense in route definition
<Route path="/opportunity/:id" element={
  <Suspense fallback={<Loader2 className="animate-spin" />}>
    <OpportunityDetail />
  </Suspense>
} />
```

---

### 11.2 Backend

- [ ] Add **index** on `opportunities(expires_at, strength)` for faster dashboard queries
- [ ] Add **index** on `matches_history(home_team_id, match_date)` and `(away_team_id, match_date)`
- [ ] Set `expires_at` logic — currently 25h, should align with next analysis run

**DB indexes SQL:**
```sql
create index if not exists idx_opportunities_active 
  on public.opportunities (expires_at desc, strength desc);

create index if not exists idx_matches_history_home 
  on public.matches_history (home_team_id, match_date desc);

create index if not exists idx_matches_history_away 
  on public.matches_history (away_team_id, match_date desc);
```

---

## PHASE 12 — Design QA [ ]

> Reference: `design-guidelines.md` → Technical QA Checklist

- [ ] Typography scale follows spec (Inter, correct sizes)
- [ ] JetBrains Mono / IBM Plex Mono for odds and repetition numbers
- [ ] 8pt spacing system throughout
- [ ] WCAG AA contrast on all text (especially muted on dark bg)
- [ ] Hover transitions at 150–200ms
- [ ] Drawer open/close at 200–250ms
- [ ] All icon buttons have `aria-label`
- [ ] One H1 per page
- [ ] Mobile card layout shows: pattern + repetition + odds (min info)
- [ ] Focus ring visible on dark backgrounds

---

## PHASE 13 — v1 Stretch Goals [ ]

These are out of scope for MVP but planned for v1:

- [ ] **Alerts** — notify users when a new strong trend appears for a favorite team
- [ ] **Trend History** — chart showing how a pattern has evolved over time
- [ ] **Head-to-head context** — show H2H record between the two upcoming teams
- [ ] **First half goal** market analysis
- [ ] **AI Trend Explanation** — "Why is this trend strong?" powered by Lovable AI (Gemini)

**AI Explanation sketch:**
```typescript
// supabase/functions/explain-trend/index.ts
const prompt = `
You are a football analyst. Explain in 2-3 calm, concise sentences why this betting trend is statistically significant:
Team: ${opp.team_name}
Market: ${opp.market}
Pattern: ${opp.description}
Recent form: ${opp.hits} hits in last ${opp.sample} matches (${Math.round(opp.hits/opp.sample*100)}%)
`;

// Use Lovable AI (google/gemini-2.5-flash — no API key needed)
const response = await fetch("https://ai.lovable.dev/v1/chat", {
  method: "POST",
  headers: { "Authorization": `Bearer ${LOVABLE_AI_KEY}` },
  body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] })
});
```

---

## Immediate Next Steps (Priority Order)

1. **[ ] Fix filters** — connect time + market filters to actual data (Phase 3.2)
2. **[ ] Fix odds parsing** — debug why defaults are being used instead of real Bet365 odds (Phase 2.2)
3. **[ ] Build Opportunity Detail page** — core feature for user retention (Phase 4)
4. **[ ] Complete BetSlip** — add stake + payout calculation (Phase 6)
5. **[ ] Add favorites** — requires DB migration + new page (Phase 7)
6. **[ ] Scheduled cron** — automate `analyze-trends` every 6h (Phase 2.5)
7. **[ ] Password reset** — auth UX completeness (Phase 1.3)
8. **[ ] DB indexes** — performance (Phase 11.2)

---

## API Credit Budget

| Action | Requests | Frequency |
|---|---|---|
| Date fetches (9 days) | 9 | Per run |
| Odds fetches (top 15 matches) | ≤15 | Per run |
| **Total per run** | **≤24** | — |
| Runs per day (6h interval) | 4 | Daily |
| **Total per day** | **≤96** | — |
| Monthly (30 days) | **≤2,880** | — |

> RapidAPI Pro plan: ensure your plan covers ~3,000 requests/month minimum.

---

## Files Reference Map

| Feature | Files |
|---|---|
| Auth | `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx` |
| Dashboard | `src/pages/Dashboard.tsx`, `src/components/dashboard/` |
| Data hook | `src/hooks/useFootballData.ts` |
| Trend engine | `supabase/functions/analyze-trends/index.ts` |
| Webhook (Hotmart) | `supabase/functions/hotmart-webhook/index.ts` |
| Design tokens | `src/index.css`, `tailwind.config.ts` |
| DB types | `src/integrations/supabase/types.ts` (auto-generated, do NOT edit) |
| Mock data | `src/data/mockPatterns.ts` |
| Routing | `src/App.tsx` |
| Odds context | `src/contexts/OddsContext.tsx` |
