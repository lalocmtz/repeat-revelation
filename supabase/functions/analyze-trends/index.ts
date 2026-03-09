import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RAPIDAPI_HOST = "free-api-live-football-data.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// Only fetch odds for major leagues (save API credits)
const ODDS_LEAGUE_IDS = new Set([
  42, 73, 47, 87, 55, 54, 53, 239, 41, 130, 61,
]);

// ─── Logging ───
function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...data }));
}

async function rapidApiFetch(path: string, apiKey: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-rapidapi-host": RAPIDAPI_HOST, "x-rapidapi-key": apiKey },
  });
  if (!res.ok) {
    const text = await res.text();
    log("ERROR", `API ${res.status} ${path}`, { body: text.substring(0, 200) });
    throw new Error(`RapidAPI ${res.status}`);
  }
  return res.json();
}

function fmtDate(date: Date): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function fmtDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Types ───
interface MatchStat {
  matchId: number;
  date: string;
  goalsScored: number;
  goalsConceded: number;
  totalGoals: number;
  isHome: boolean;
  btts: boolean;
  won: boolean;
  lost: boolean;
  drawn: boolean;
}

interface TeamStats {
  teamId: number;
  teamName: string;
  leagueId: number;
  leagueName: string;
  matches: MatchStat[];
}

interface Opportunity {
  team_id: number;
  team_name: string;
  league_id: number;
  league_name: string;
  pattern_type: string;
  market: string;
  description: string;
  context: string;
  hits: number;
  sample: number;
  is_hot: boolean;
  next_match_id: number | null;
  next_match_home: string | null;
  next_match_away: string | null;
  next_match_time: string | null;
  odds: number;
}

// ─── Consecutive streak counter ───
function countStreak(matches: MatchStat[], cond: (m: MatchStat) => boolean): number {
  let c = 0;
  for (const m of matches) {
    if (cond(m)) c++;
    else break;
  }
  return c;
}

// ─── Trend Analysis ───
function analyzeTeam(
  stats: TeamStats,
  nextMatch: any | undefined,
  odds: Record<string, number>
): Opportunity[] {
  const opps: Opportunity[] = [];
  const matches = stats.matches.slice(0, 20);
  if (matches.length < 3 || !nextMatch) return opps;

  const base = {
    team_id: stats.teamId,
    team_name: stats.teamName,
    league_id: stats.leagueId,
    league_name: stats.leagueName,
    next_match_id: nextMatch.id || null,
    next_match_home: nextMatch.home?.longName || nextMatch.home?.name || null,
    next_match_away: nextMatch.away?.longName || nextMatch.away?.name || null,
    next_match_time: nextMatch.status?.utcTime || null,
  };

  // ══════ CONSECUTIVE STREAKS (like the reference) ══════

  const winStreak = countStreak(matches, m => m.won);
  if (winStreak >= 3) {
    opps.push({ ...base, pattern_type: "RESULT", market: "Result",
      description: `${stats.teamName} ha ganado sus últimos ${winStreak} partidos`,
      context: "general", hits: winStreak, sample: winStreak,
      is_hot: winStreak >= 5, odds: odds.homeWin || 1.50 });
  }

  const lossStreak = countStreak(matches, m => m.lost);
  if (lossStreak >= 3) {
    opps.push({ ...base, pattern_type: "RESULT", market: "Result",
      description: `${stats.teamName} ha perdido sus últimos ${lossStreak} partidos`,
      context: "general", hits: lossStreak, sample: lossStreak,
      is_hot: lossStreak >= 5, odds: odds.awayWin || 2.00 });
  }

  const unbeaten = countStreak(matches, m => !m.lost);
  if (unbeaten >= 4) {
    opps.push({ ...base, pattern_type: "RESULT", market: "Result",
      description: `${stats.teamName} invicto en sus últimos ${unbeaten} partidos`,
      context: "general", hits: unbeaten, sample: unbeaten,
      is_hot: unbeaten >= 7, odds: odds.homeWin || 1.60 });
  }

  const o25s = countStreak(matches, m => m.totalGoals > 2);
  if (o25s >= 3) {
    opps.push({ ...base, pattern_type: "GOLES", market: "Over 2.5",
      description: `Over 2.5 goles en los últimos ${o25s} partidos de ${stats.teamName}`,
      context: "general", hits: o25s, sample: o25s,
      is_hot: o25s >= 5, odds: odds.over25 || 1.85 });
  }

  const o15s = countStreak(matches, m => m.totalGoals > 1);
  if (o15s >= 4) {
    opps.push({ ...base, pattern_type: "GOLES", market: "Over 1.5",
      description: `Over 1.5 goles en los últimos ${o15s} partidos de ${stats.teamName}`,
      context: "general", hits: o15s, sample: o15s,
      is_hot: o15s >= 6, odds: odds.over15 || 1.30 });
  }

  const bttss = countStreak(matches, m => m.btts);
  if (bttss >= 3) {
    opps.push({ ...base, pattern_type: "BTTS", market: "BTTS",
      description: `BTTS en los últimos ${bttss} partidos de ${stats.teamName}`,
      context: "general", hits: bttss, sample: bttss,
      is_hot: bttss >= 5, odds: odds.btts || 1.72 });
  }

  const scored = countStreak(matches, m => m.goalsScored > 0);
  if (scored >= 5) {
    opps.push({ ...base, pattern_type: "GOLES", market: "Scored",
      description: `${stats.teamName} ha anotado en sus últimos ${scored} partidos`,
      context: "general", hits: scored, sample: scored,
      is_hot: scored >= 8, odds: odds.over15 || 1.40 });
  }

  const cs = countStreak(matches, m => m.goalsConceded === 0);
  if (cs >= 3) {
    opps.push({ ...base, pattern_type: "GOLES", market: "Clean Sheet",
      description: `Portería a cero en los últimos ${cs} partidos de ${stats.teamName}`,
      context: "general", hits: cs, sample: cs,
      is_hot: cs >= 4, odds: 2.20 });
  }

  // ══════ HOME / AWAY SPECIFIC STREAKS ══════
  const homeM = matches.filter(m => m.isHome);
  const awayM = matches.filter(m => !m.isHome);

  if (homeM.length >= 3) {
    const hw = countStreak(homeM, m => m.won);
    if (hw >= 3) {
      opps.push({ ...base, pattern_type: "RESULT", market: "Result",
        description: `${stats.teamName} ha ganado sus últimos ${hw} partidos en casa`,
        context: "home", hits: hw, sample: hw,
        is_hot: hw >= 5, odds: odds.homeWin || 1.45 });
    }
    const ho25 = countStreak(homeM, m => m.totalGoals > 2);
    if (ho25 >= 3) {
      opps.push({ ...base, pattern_type: "GOLES", market: "Over 2.5",
        description: `Over 2.5 en los últimos ${ho25} partidos en casa de ${stats.teamName}`,
        context: "home", hits: ho25, sample: ho25,
        is_hot: ho25 >= 4, odds: odds.over25 || 1.80 });
    }
    const hl = countStreak(homeM, m => m.lost);
    if (hl >= 3) {
      opps.push({ ...base, pattern_type: "RESULT", market: "Result",
        description: `${stats.teamName} ha perdido sus últimos ${hl} partidos en casa`,
        context: "home", hits: hl, sample: hl,
        is_hot: hl >= 5, odds: odds.awayWin || 1.80 });
    }
  }

  if (awayM.length >= 3) {
    const aw = countStreak(awayM, m => m.won);
    if (aw >= 3) {
      opps.push({ ...base, pattern_type: "RESULT", market: "Result",
        description: `${stats.teamName} ha ganado sus últimos ${aw} partidos fuera`,
        context: "away", hits: aw, sample: aw,
        is_hot: aw >= 4, odds: odds.awayWin || 2.10 });
    }
    const al = countStreak(awayM, m => m.lost);
    if (al >= 3) {
      opps.push({ ...base, pattern_type: "RESULT", market: "Result",
        description: `${stats.teamName} ha perdido sus últimos ${al} partidos fuera`,
        context: "away", hits: al, sample: al,
        is_hot: al >= 5, odds: odds.homeWin || 1.40 });
    }
    const ao25 = countStreak(awayM, m => m.totalGoals > 2);
    if (ao25 >= 3) {
      opps.push({ ...base, pattern_type: "GOLES", market: "Over 2.5",
        description: `Over 2.5 en los últimos ${ao25} partidos fuera de ${stats.teamName}`,
        context: "away", hits: ao25, sample: ao25,
        is_hot: ao25 >= 4, odds: odds.over25 || 1.90 });
    }
    const abtts = countStreak(awayM, m => m.btts);
    if (abtts >= 3) {
      opps.push({ ...base, pattern_type: "BTTS", market: "BTTS",
        description: `BTTS en los últimos ${abtts} partidos fuera de ${stats.teamName}`,
        context: "away", hits: abtts, sample: abtts,
        is_hot: abtts >= 4, odds: odds.btts || 1.80 });
    }
  }

  // ══════ RATIO-BASED (larger samples) ══════
  for (const sz of [5, 10, 15, 20].filter(s => matches.length >= s)) {
    const sample = matches.slice(0, sz);

    const o25 = sample.filter(m => m.totalGoals > 2).length;
    if (o25 / sz >= 0.60) {
      opps.push({ ...base, pattern_type: "GOLES", market: "Over 2.5",
        description: `Over 2.5 goles en ${o25} de ${sz} partidos`,
        context: "general", hits: o25, sample: sz,
        is_hot: o25 / sz >= 0.80, odds: odds.over25 || 1.85 });
    }

    const o15 = sample.filter(m => m.totalGoals > 1).length;
    if (o15 / sz >= 0.70) {
      opps.push({ ...base, pattern_type: "GOLES", market: "Over 1.5",
        description: `Over 1.5 goles en ${o15} de ${sz} partidos`,
        context: "general", hits: o15, sample: sz,
        is_hot: o15 / sz >= 0.85, odds: odds.over15 || 1.30 });
    }

    const bt = sample.filter(m => m.btts).length;
    if (bt / sz >= 0.55) {
      opps.push({ ...base, pattern_type: "BTTS", market: "BTTS",
        description: `BTTS en ${bt} de ${sz} partidos`,
        context: "general", hits: bt, sample: sz,
        is_hot: bt / sz >= 0.75, odds: odds.btts || 1.72 });
    }

    const wins = sample.filter(m => m.won).length;
    if (wins / sz >= 0.60) {
      opps.push({ ...base, pattern_type: "RESULT", market: "Result",
        description: `${stats.teamName} ganó ${wins} de ${sz} partidos`,
        context: "general", hits: wins, sample: sz,
        is_hot: wins / sz >= 0.80, odds: odds.homeWin || 1.50 });
    }

    const losses = sample.filter(m => m.lost).length;
    if (losses / sz >= 0.60) {
      opps.push({ ...base, pattern_type: "RESULT", market: "Result",
        description: `${stats.teamName} perdió ${losses} de ${sz} partidos`,
        context: "general", hits: losses, sample: sz,
        is_hot: losses / sz >= 0.80, odds: odds.awayWin || 2.00 });
    }
  }

  // Deduplicate: keep best per market+context
  const best = new Map<string, Opportunity>();
  for (const o of opps) {
    const k = `${o.team_id}-${o.market}-${o.context}`;
    const ex = best.get(k);
    if (!ex || o.hits > ex.hits || (o.hits === ex.hits && o.sample > ex.sample)) {
      best.set(k, o);
    }
  }
  return Array.from(best.values());
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const runId = crypto.randomUUID().slice(0, 8);
  log("INFO", "=== analyze-trends START ===", { runId });

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!RAPIDAPI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing env vars");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── 1. Generate date range: 20 days back + 3 forward ───
    const dates: string[] = [];
    for (let i = 20; i >= -3; i--) {
      dates.push(fmtDate(new Date(Date.now() - i * 86400000)));
    }

    // ─── 2. Fetch league names + all matches in batches ───
    const leagueNames = new Map<number, string>();
    try {
      const ldata = await rapidApiFetch("/football-get-all-leagues", RAPIDAPI_KEY);
      for (const l of ldata?.response?.leagues || []) {
        if (l.id && (l.name || l.localizedName)) {
          leagueNames.set(l.id, l.name || l.localizedName);
        }
      }
    } catch { /* non-critical */ }
    log("INFO", "League names loaded", { runId, count: leagueNames.size });

    const allMatches: any[] = [];
    const BATCH = 8;
    for (let i = 0; i < dates.length; i += BATCH) {
      const batch = dates.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(d =>
          rapidApiFetch(`/football-get-matches-by-date?date=${d}`, RAPIDAPI_KEY)
            .then(r => r?.response?.matches || [])
            .catch(() => [])
        )
      );
      allMatches.push(...results.flat());
    }

    const valid = allMatches.filter(m => !m.status?.cancelled);
    const finished = valid.filter(m => m.status?.finished && m.home?.score !== undefined);
    const upcoming = valid.filter(m => !m.status?.finished);

    log("INFO", "Matches fetched", {
      runId, total: allMatches.length, valid: valid.length,
      finished: finished.length, upcoming: upcoming.length,
    });

    // ─── 3. Store ALL finished matches (no league filter) ───
    const historyRows = finished
      .filter((m: any) => m.home?.id && m.away?.id)
      .map((m: any) => ({
        id: m.id,
        league_id: m.leagueId,
        league_name: leagueNames.get(m.leagueId) || `League ${m.leagueId}`,
        home_team_id: m.home.id,
        home_team_name: m.home.longName || m.home.name || `Team ${m.home.id}`,
        away_team_id: m.away.id,
        away_team_name: m.away.longName || m.away.name || `Team ${m.away.id}`,
        home_score: m.home.score ?? 0,
        away_score: m.away.score ?? 0,
        match_date: fmtDateISO(new Date(m.status?.utcTime || m.timeTS || Date.now())),
        match_time: m.time || null,
        status: "finished",
      }));

    if (historyRows.length > 0) {
      for (let i = 0; i < historyRows.length; i += 500) {
        const batch = historyRows.slice(i, i + 500);
        const { error } = await supabase.from("matches_history").upsert(batch, { onConflict: "id" });
        if (error) log("WARN", "Upsert err", { runId, error: error.message, batch: i });
      }
    }
    log("INFO", "History stored", { runId, count: historyRows.length });

    // ─── 4. Load ALL history from DB (NO league filter) ───
    let historyData: any[] = [];
    let page = 0;
    while (true) {
      const { data, error } = await supabase
        .from("matches_history")
        .select("*")
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (error) { log("ERROR", "History query err", { runId, error: error.message }); break; }
      if (!data || data.length === 0) break;
      historyData.push(...data);
      if (data.length < 1000) break;
      page++;
    }
    log("INFO", "History loaded", { runId, rows: historyData.length });

    // ─── 5. Build team stats for ALL teams ───
    const teamMap = new Map<number, TeamStats>();
    for (const m of historyData) {
      for (const side of ["home", "away"] as const) {
        const tid = side === "home" ? m.home_team_id : m.away_team_id;
        const tname = side === "home" ? m.home_team_name : m.away_team_name;
        const scored = side === "home" ? (m.home_score ?? 0) : (m.away_score ?? 0);
        const conceded = side === "home" ? (m.away_score ?? 0) : (m.home_score ?? 0);

        if (!teamMap.has(tid)) {
          teamMap.set(tid, {
            teamId: tid, teamName: tname,
            leagueId: m.league_id,
            leagueName: leagueNames.get(m.league_id) || m.league_name || `League ${m.league_id}`,
            matches: [],
          });
        }
        teamMap.get(tid)!.matches.push({
          matchId: m.id, date: m.match_date,
          goalsScored: scored, goalsConceded: conceded,
          totalGoals: scored + conceded,
          isHome: side === "home",
          btts: scored > 0 && conceded > 0,
          won: scored > conceded, lost: scored < conceded, drawn: scored === conceded,
        });
      }
    }
    for (const s of teamMap.values()) {
      s.matches.sort((a, b) => b.date.localeCompare(a.date));
    }
    log("INFO", "Teams built", { runId, teams: teamMap.size });

    // ─── 6. Map ALL upcoming matches (NO league filter) ───
    const upMap = new Map<number, any>();
    for (const m of upcoming) {
      if (m.home?.id && !upMap.has(m.home.id)) upMap.set(m.home.id, m);
      if (m.away?.id && !upMap.has(m.away.id)) upMap.set(m.away.id, m);
    }
    log("INFO", "Upcoming mapped", { runId, matches: upcoming.length, teams: upMap.size });

    // ─── 7. Fetch odds for major-league upcoming only ───
    const oddsMap = new Map<number, Record<string, number>>();
    const oddsIds = [...new Set(
      upcoming.filter(m => ODDS_LEAGUE_IDS.has(m.leagueId)).map(m => m.id).filter(Boolean)
    )].slice(0, 20);

    if (oddsIds.length > 0) {
      const oddsResults = await Promise.all(
        oddsIds.map(eid =>
          rapidApiFetch(`/football-event-odds?eventid=${eid}`, RAPIDAPI_KEY)
            .then(d => ({ eid, d })).catch(() => ({ eid, d: null }))
        )
      );
      for (const { eid, d } of oddsResults) {
        if (!d?.response?.odds || !Array.isArray(d.response.odds)) continue;
        const p: Record<string, number> = {};
        for (const g of d.response.odds) {
          if (!g?.items || !Array.isArray(g.items)) continue;
          const b365 = g?.bookmakerId === 2;
          for (const item of g.items) {
            const n = (item?.name || "").toLowerCase();
            const vals = item?.values || [];
            if (n.includes("over/under") || n.includes("total goals")) {
              for (const v of vals) {
                const l = (v?.name || "").toLowerCase();
                const o = parseFloat(v?.odd);
                if (isNaN(o)) continue;
                if (l.includes("over 2.5") && (b365 || !p.over25)) p.over25 = o;
                if (l.includes("over 1.5") && (b365 || !p.over15)) p.over15 = o;
              }
            }
            if (n.includes("both teams") || n.includes("btts")) {
              for (const v of vals) {
                const o = parseFloat(v?.odd);
                if (!isNaN(o) && (v?.name || "").toLowerCase().includes("yes")) p.btts = o;
              }
            }
            if (n.includes("full time") || n.includes("1x2") || n.includes("match result")) {
              for (const v of vals) {
                const l = (v?.name || "").toLowerCase();
                const o = parseFloat(v?.odd);
                if (isNaN(o)) continue;
                if ((l === "1" || l === "home") && (b365 || !p.homeWin)) p.homeWin = o;
                if ((l === "2" || l === "away") && (b365 || !p.awayWin)) p.awayWin = o;
              }
            }
          }
        }
        if (Object.keys(p).length > 0) oddsMap.set(eid, p);
      }
      log("INFO", "Odds fetched", { runId, requested: oddsIds.length, success: oddsMap.size });
    }

    // ─── 8. Analyze ALL teams ───
    const allOpps: Opportunity[] = [];
    let teamsWithOpps = 0;
    for (const stats of teamMap.values()) {
      const nm = upMap.get(stats.teamId);
      const o = nm ? (oddsMap.get(nm.id) || {}) : {};
      const to = analyzeTeam(stats, nm, o);
      if (to.length > 0) { teamsWithOpps++; allOpps.push(...to); }
    }

    log("INFO", "Analysis done", {
      runId, teams: teamMap.size, teamsWithUpcoming: upMap.size,
      teamsWithOpps, totalOpps: allOpps.length,
    });

    // ─── 9. Rank by hits desc, insert top 300 ───
    allOpps.sort((a, b) => b.hits !== a.hits ? b.hits - a.hits : b.sample - a.sample);
    const top = allOpps.slice(0, 300);

    // Delete existing
    await supabase.from("opportunities").delete().gte("id", "00000000-0000-0000-0000-000000000000");

    let inserted = 0;
    for (let i = 0; i < top.length; i += 50) {
      const batch = top.slice(i, i + 50);
      const { error } = await supabase.from("opportunities").insert(batch);
      if (error) {
        log("ERROR", "Insert err", { runId, error: error.message, batch: i });
      } else {
        inserted += batch.length;
      }
    }

    const summary = {
      runId, status: "success",
      matchesFetched: allMatches.length,
      matchesStored: historyRows.length,
      historyUsed: historyData.length,
      teamsAnalyzed: teamMap.size,
      teamsWithUpcoming: upMap.size,
      teamsWithOpps,
      oppsFound: allOpps.length,
      oppsStored: inserted,
    };
    log("INFO", "=== analyze-trends DONE ===", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log("ERROR", "FAILED", { runId, error: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown", runId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
