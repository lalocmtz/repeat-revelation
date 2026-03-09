import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RAPIDAPI_HOST = "free-api-live-football-data.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// ─── Top leagues only (saves API calls) ───
const TOP_LEAGUE_IDS = new Set([
  42,   // Champions League
  73,   // Europa League
  47,   // Premier League
  87,   // La Liga
  55,   // Serie A
  54,   // Bundesliga
  53,   // Ligue 1
  239,  // Liga MX
  41,   // MLS
  130,  // Eredivisie
  61,   // Liga Portugal
]);

const LEAGUE_NAMES: Record<number, string> = {
  42: "Champions League", 73: "Europa League", 47: "Premier League",
  87: "La Liga", 55: "Serie A", 54: "Bundesliga", 53: "Ligue 1",
  239: "Liga MX", 41: "MLS", 130: "Eredivisie", 61: "Liga Portugal",
};

// ─── Structured Logging ───
function log(level: "INFO" | "WARN" | "ERROR", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logObj = { timestamp, level, message, ...data };
  console.log(JSON.stringify(logObj));
}

async function rapidApiFetch(path: string, apiKey: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": apiKey,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      log("ERROR", `RapidAPI error [${res.status}] ${path}`, { response: text.substring(0, 200) });
      throw new Error(`RapidAPI ${res.status}`);
    }
    return res.json();
  } catch (e) {
    log("ERROR", `RapidAPI fetch failed: ${path}`, { error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Trend Analysis Logic ───

interface TeamStats {
  teamId: number;
  teamName: string;
  leagueId: number;
  leagueName: string;
  matches: {
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
  }[];
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
  strength: number; // Computed as hits/sample * 100
  is_hot: boolean;
  next_match_id: number | null;
  next_match_home: string | null;
  next_match_away: string | null;
  next_match_time: string | null;
  odds: number;
}

function analyzeTeamTrends(
  stats: TeamStats, 
  upcomingMatches: Map<number, any>, 
  matchOddsMap: Map<number, Record<string, number>>
): Opportunity[] {
  const opps: Opportunity[] = [];
  const matches = stats.matches.slice(0, 20);
  
  // Minimum 3 matches required for any analysis
  if (matches.length < 3) return opps;

  const nextMatch = upcomingMatches.get(stats.teamId);
  const nextMatchId = nextMatch?.id || null;
  const nextMatchHome = nextMatch?.home?.name || nextMatch?.home?.longName || null;
  const nextMatchAway = nextMatch?.away?.name || nextMatch?.away?.longName || null;
  const nextMatchTime = nextMatch?.status?.utcTime || null;

  // Only generate opportunities for teams with an upcoming match
  if (!nextMatchId) return opps;

  const realOdds = matchOddsMap.get(nextMatchId) || {};

  const baseFields = {
    team_id: stats.teamId,
    team_name: stats.teamName,
    league_id: stats.leagueId,
    league_name: stats.leagueName,
    next_match_id: nextMatchId,
    next_match_home: nextMatchHome,
    next_match_away: nextMatchAway,
    next_match_time: nextMatchTime,
  };

  // ─── Sample sizes to analyze ───
  // Use smaller samples (3, 5) if we don't have enough matches
  const sampleSizes = [3, 5, 10, 15, 20].filter(s => matches.length >= s);

  for (const sampleSize of sampleSizes) {
    const sample = matches.slice(0, sampleSize);

    // ─── Over 2.5 goals ───
    const over25 = sample.filter((m) => m.totalGoals > 2).length;
    const over25Ratio = over25 / sampleSize;
    if (over25Ratio >= 0.65) { // Lowered threshold from 0.70
      opps.push({
        ...baseFields,
        pattern_type: "GOLES",
        market: "Over 2.5",
        description: `Over 2.5 goles en ${over25} de ${sampleSize} partidos`,
        context: "general",
        hits: over25,
        sample: sampleSize,
        strength: Math.round(over25Ratio * 100),
        is_hot: over25Ratio >= 0.85,
        odds: realOdds.over25 || 1.85,
      });
    }

    // ─── Over 1.5 goals ───
    const over15 = sample.filter((m) => m.totalGoals > 1).length;
    const over15Ratio = over15 / sampleSize;
    if (over15Ratio >= 0.75) { // Lowered threshold from 0.80
      opps.push({
        ...baseFields,
        pattern_type: "GOLES",
        market: "Over 1.5",
        description: `Over 1.5 goles en ${over15} de ${sampleSize} partidos`,
        context: "general",
        hits: over15,
        sample: sampleSize,
        strength: Math.round(over15Ratio * 100),
        is_hot: over15Ratio >= 0.90,
        odds: realOdds.over15 || 1.30,
      });
    }

    // ─── BTTS (Both Teams To Score) ───
    const bttsCount = sample.filter((m) => m.btts).length;
    const bttsRatio = bttsCount / sampleSize;
    if (bttsRatio >= 0.60) { // Lowered threshold from 0.65
      opps.push({
        ...baseFields,
        pattern_type: "BTTS",
        market: "BTTS",
        description: `BTTS en ${bttsCount} de ${sampleSize} partidos`,
        context: "general",
        hits: bttsCount,
        sample: sampleSize,
        strength: Math.round(bttsRatio * 100),
        is_hot: bttsRatio >= 0.80,
        odds: realOdds.btts || 1.72,
      });
    }

    // ─── Team scored (goal in match) ───
    const scoredCount = sample.filter((m) => m.goalsScored > 0).length;
    const scoredRatio = scoredCount / sampleSize;
    if (scoredRatio >= 0.70) { // Lowered threshold from 0.75
      opps.push({
        ...baseFields,
        pattern_type: "GOLES",
        market: "Scored",
        description: `${stats.teamName} anotó en ${scoredCount} de ${sampleSize} partidos`,
        context: "general",
        hits: scoredCount,
        sample: sampleSize,
        strength: Math.round(scoredRatio * 100),
        is_hot: scoredRatio >= 0.85,
        odds: realOdds.over15 || 1.40,
      });
    }

    // ─── Home win streak ───
    const homeMatches = sample.filter((m) => m.isHome);
    if (homeMatches.length >= 3) {
      const homeWins = homeMatches.filter((m) => m.won).length;
      const homeWinRatio = homeWins / homeMatches.length;
      if (homeWinRatio >= 0.70) { // Lowered threshold from 0.75
        opps.push({
          ...baseFields,
          pattern_type: "RESULT",
          market: "Result",
          description: `Victoria local en ${homeWins} de ${homeMatches.length} partidos en casa`,
          context: "home",
          hits: homeWins,
          sample: homeMatches.length,
          strength: Math.round(homeWinRatio * 100),
          is_hot: homeWinRatio >= 0.85,
          odds: realOdds.homeWin || 1.50,
        });
      }
    }

    // ─── Away win streak ───
    const awayMatches = sample.filter((m) => !m.isHome);
    if (awayMatches.length >= 3) {
      const awayWins = awayMatches.filter((m) => m.won).length;
      const awayWinRatio = awayWins / awayMatches.length;
      if (awayWinRatio >= 0.60) { // Lower threshold for away wins (harder to achieve)
        opps.push({
          ...baseFields,
          pattern_type: "RESULT",
          market: "Result",
          description: `Victoria visitante en ${awayWins} de ${awayMatches.length} partidos fuera`,
          context: "away",
          hits: awayWins,
          sample: awayMatches.length,
          strength: Math.round(awayWinRatio * 100),
          is_hot: awayWinRatio >= 0.75,
          odds: realOdds.awayWin || 2.10,
        });
      }
    }

    // ─── Unbeaten streak (won or drawn) ───
    const unbeatenCount = sample.filter((m) => !m.lost).length;
    const unbeatenRatio = unbeatenCount / sampleSize;
    if (unbeatenRatio >= 0.70 && sampleSize >= 5) {
      opps.push({
        ...baseFields,
        pattern_type: "RESULT",
        market: "Result",
        description: `${stats.teamName} invicto en ${unbeatenCount} de ${sampleSize} partidos`,
        context: "general",
        hits: unbeatenCount,
        sample: sampleSize,
        strength: Math.round(unbeatenRatio * 100),
        is_hot: unbeatenRatio >= 0.85,
        odds: realOdds.homeWin || 1.60,
      });
    }

    // ─── Clean sheet streak ───
    const cleanSheets = sample.filter((m) => m.goalsConceded === 0).length;
    const cleanSheetRatio = cleanSheets / sampleSize;
    if (cleanSheetRatio >= 0.40 && sampleSize >= 5) {
      opps.push({
        ...baseFields,
        pattern_type: "GOLES",
        market: "Clean Sheet",
        description: `Portería a cero en ${cleanSheets} de ${sampleSize} partidos`,
        context: "general",
        hits: cleanSheets,
        sample: sampleSize,
        strength: Math.round(cleanSheetRatio * 100),
        is_hot: cleanSheetRatio >= 0.60,
        odds: 2.20,
      });
    }
  }

  // Deduplicate: keep best per market
  const bestByMarket = new Map<string, Opportunity>();
  for (const opp of opps) {
    const key = `${opp.team_id}-${opp.market}-${opp.context}`;
    const existing = bestByMarket.get(key);
    // Prefer higher strength, then larger sample
    if (!existing || 
        opp.strength > existing.strength || 
        (opp.strength === existing.strength && opp.sample > existing.sample)) {
      bestByMarket.set(key, opp);
    }
  }

  return Array.from(bestByMarket.values());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const runId = crypto.randomUUID().slice(0, 8);
  log("INFO", "=== Starting trend analysis ===", { runId });

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAPIDAPI_KEY) {
      log("ERROR", "RAPIDAPI_KEY not configured", { runId });
      throw new Error("RAPIDAPI_KEY not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      log("ERROR", "Supabase config missing", { runId });
      throw new Error("Supabase config missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── Step 1: Fetch matches for multiple days ───
    // 10 days back + today + 2 days forward = 13 dates (more historical data)
    const dates: string[] = [];
    for (let i = 10; i >= -2; i--) {
      dates.push(formatDate(new Date(Date.now() - i * 86400000)));
    }

    log("INFO", `Fetching matches for ${dates.length} dates`, { runId, dates: dates.slice(0, 3).join(", ") + "..." });

    const allMatches: any[] = [];
    const batchResults = await Promise.all(
      dates.map((d) =>
        rapidApiFetch(`/football-get-matches-by-date?date=${d}`, RAPIDAPI_KEY)
          .then((data) => data?.response?.matches || [])
          .catch(() => [])
      )
    );
    allMatches.push(...batchResults.flat());

    // Filter to top leagues only
    const topLeagueMatches = allMatches.filter((m) => TOP_LEAGUE_IDS.has(m.leagueId));
    log("INFO", `Matches fetched`, { runId, total: allMatches.length, topLeagues: topLeagueMatches.length });

    // ─── Step 2: Store finished matches in matches_history ───
    const finishedMatches = topLeagueMatches.filter(
      (m) => m.status?.finished && !m.status?.cancelled && m.home?.score !== undefined
    );

    const historyRows = finishedMatches.map((m: any) => ({
      id: m.id,
      league_id: m.leagueId,
      league_name: LEAGUE_NAMES[m.leagueId as number] || `League ${m.leagueId}`,
      home_team_id: m.home.id,
      home_team_name: m.home.longName || m.home.name,
      away_team_id: m.away.id,
      away_team_name: m.away.longName || m.away.name,
      home_score: m.home.score ?? 0,
      away_score: m.away.score ?? 0,
      match_date: formatDateISO(new Date(m.status.utcTime || m.timeTS)),
      match_time: m.time,
      status: "finished",
      total_goals: (m.home.score ?? 0) + (m.away.score ?? 0),
      btts: (m.home.score ?? 0) > 0 && (m.away.score ?? 0) > 0,
    }));

    if (historyRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("matches_history")
        .upsert(historyRows, { onConflict: "id" });
      if (upsertError) {
        log("WARN", "Upsert error", { runId, error: upsertError.message });
      }
    }

    log("INFO", `Stored finished matches`, { runId, count: historyRows.length });

    // ─── Step 3: Load existing history from DB ───
    const topLeagueIds = [...TOP_LEAGUE_IDS];
    let historyData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error: histError } = await supabase
        .from("matches_history")
        .select("*")
        .in("league_id", topLeagueIds)
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (histError) {
        log("ERROR", "History query error", { runId, error: histError.message });
        throw histError;
      }
      if (!data || data.length === 0) break;
      historyData.push(...data);
      if (data.length < pageSize) break;
      page++;
    }

    log("INFO", `History loaded from DB`, { runId, rows: historyData.length });

    // ─── Step 4: Build team stats ───
    const teamStatsMap = new Map<number, TeamStats>();

    for (const match of historyData) {
      for (const side of ["home", "away"] as const) {
        const teamId = side === "home" ? match.home_team_id : match.away_team_id;
        const teamName = side === "home" ? match.home_team_name : match.away_team_name;
        const scored = side === "home" ? (match.home_score ?? 0) : (match.away_score ?? 0);
        const conceded = side === "home" ? (match.away_score ?? 0) : (match.home_score ?? 0);

        if (!teamStatsMap.has(teamId)) {
          teamStatsMap.set(teamId, {
            teamId,
            teamName,
            leagueId: match.league_id,
            leagueName: match.league_name || LEAGUE_NAMES[match.league_id] || `League ${match.league_id}`,
            matches: [],
          });
        }
        teamStatsMap.get(teamId)!.matches.push({
          matchId: match.id,
          date: match.match_date,
          goalsScored: scored,
          goalsConceded: conceded,
          totalGoals: scored + conceded,
          isHome: side === "home",
          btts: scored > 0 && conceded > 0,
          won: scored > conceded,
          lost: scored < conceded,
          drawn: scored === conceded,
        });
      }
    }

    // Sort matches by date descending for each team
    for (const stats of teamStatsMap.values()) {
      stats.matches.sort((a, b) => b.date.localeCompare(a.date));
    }

    log("INFO", `Team stats built`, { runId, teams: teamStatsMap.size });

    // ─── Step 5: Build upcoming matches map ───
    const upcomingMatches = new Map<number, any>();
    const upcoming = topLeagueMatches.filter(
      (m) => !m.status?.finished && !m.status?.cancelled
    );
    
    for (const m of upcoming) {
      if (m.home?.id && !upcomingMatches.has(m.home.id)) upcomingMatches.set(m.home.id, m);
      if (m.away?.id && !upcomingMatches.has(m.away.id)) upcomingMatches.set(m.away.id, m);
    }

    log("INFO", `Upcoming matches mapped`, { runId, matches: upcoming.length, teamsWithMatch: upcomingMatches.size });

    // ─── Step 6: Fetch odds for upcoming matches ───
    const matchOddsMap = new Map<number, Record<string, number>>();
    const uniqueUpcomingIds = [...new Set(upcoming.map((m) => m.id).filter(Boolean))].slice(0, 20);

    if (uniqueUpcomingIds.length > 0) {
      log("INFO", `Fetching odds for ${uniqueUpcomingIds.length} matches`, { runId });
      
      const oddsResults = await Promise.all(
        uniqueUpcomingIds.map((eventId) =>
          rapidApiFetch(`/football-event-odds?eventid=${eventId}`, RAPIDAPI_KEY)
            .then((data) => ({ eventId, data }))
            .catch(() => ({ eventId, data: null }))
        )
      );

      let oddsSuccessCount = 0;
      for (const { eventId, data } of oddsResults) {
        if (!data?.response?.odds || !Array.isArray(data.response.odds)) continue;
        const parsed: Record<string, number> = {};

        for (const oddGroup of data.response.odds) {
          if (!oddGroup?.items || !Array.isArray(oddGroup.items)) continue;
          const isBet365 = oddGroup?.bookmakerId === 2;

          for (const item of oddGroup.items) {
            const marketName = (item?.name || "").toLowerCase();
            const values = item?.values || [];

            if (marketName.includes("over/under") || marketName.includes("total goals")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (isNaN(odd)) continue;
                if (label.includes("over 2.5") && (isBet365 || !parsed.over25)) parsed.over25 = odd;
                if (label.includes("over 1.5") && (isBet365 || !parsed.over15)) parsed.over15 = odd;
              }
            }
            if (marketName.includes("both teams") || marketName.includes("btts")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (!isNaN(odd) && label.includes("yes") && (isBet365 || !parsed.btts)) parsed.btts = odd;
              }
            }
            if (marketName.includes("full time") || marketName.includes("1x2") || marketName.includes("match result")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (isNaN(odd)) continue;
                if ((label === "1" || label === "home") && (isBet365 || !parsed.homeWin)) parsed.homeWin = odd;
                if ((label === "2" || label === "away") && (isBet365 || !parsed.awayWin)) parsed.awayWin = odd;
              }
            }
          }
        }

        if (Object.keys(parsed).length > 0) {
          matchOddsMap.set(eventId, parsed);
          oddsSuccessCount++;
        }
      }

      log("INFO", `Odds fetched`, { runId, requested: uniqueUpcomingIds.length, success: oddsSuccessCount });
    }

    // ─── Step 7: Analyze trends for all teams ───
    const allOpportunities: Opportunity[] = [];
    let teamsWithOpportunities = 0;
    
    for (const stats of teamStatsMap.values()) {
      const teamOpps = analyzeTeamTrends(stats, upcomingMatches, matchOddsMap);
      if (teamOpps.length > 0) {
        teamsWithOpportunities++;
        allOpportunities.push(...teamOpps);
      }
    }

    log("INFO", `Trends analyzed`, { 
      runId, 
      teamsAnalyzed: teamStatsMap.size,
      teamsWithOpportunities,
      totalOpportunities: allOpportunities.length 
    });

    // ─── Step 8: Rank by strength, then sample size ───
    allOpportunities.sort((a, b) => {
      const strengthDiff = b.strength - a.strength;
      return strengthDiff !== 0 ? strengthDiff : b.sample - a.sample;
    });

    const topOpps = allOpportunities.slice(0, 150); // Keep more opportunities

    // ─── Step 9: Replace opportunities in DB ───
    // Delete all existing opportunities
    const { error: deleteError } = await supabase
      .from("opportunities")
      .delete()
      .gte("id", "00000000-0000-0000-0000-000000000000");
    
    if (deleteError) {
      log("WARN", "Delete error", { runId, error: deleteError.message });
    }

    // Insert new opportunities in batches
    let insertedCount = 0;
    if (topOpps.length > 0) {
      for (let i = 0; i < topOpps.length; i += 50) {
        const batch = topOpps.slice(i, i + 50);
        const { error: insertError } = await supabase.from("opportunities").insert(batch);
        if (insertError) {
          log("ERROR", "Insert error", { runId, error: insertError.message, batch: i });
        } else {
          insertedCount += batch.length;
        }
      }
    }

    const summary = {
      runId,
      status: "success",
      apiCalls: dates.length + uniqueUpcomingIds.length,
      matchesFetched: topLeagueMatches.length,
      matchesStored: historyRows.length,
      historyUsed: historyData.length,
      teamsAnalyzed: teamStatsMap.size,
      teamsWithUpcoming: upcomingMatches.size,
      opportunitiesFound: allOpportunities.length,
      opportunitiesStored: insertedCount,
      oddsMatches: matchOddsMap.size,
    };

    log("INFO", "=== Analysis complete ===", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log("ERROR", "analyze-trends failed", { runId, error: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", runId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
