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

async function rapidApiFetch(path: string, apiKey: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": apiKey,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`RapidAPI error [${res.status}] ${path}:`, text.substring(0, 200));
    throw new Error(`RapidAPI ${res.status}`);
  }
  return res.json();
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
  is_hot: boolean;
  next_match_id: number | null;
  next_match_home: string | null;
  next_match_away: string | null;
  next_match_time: string | null;
  odds: number;
}

function analyzeTeamTrends(stats: TeamStats, upcomingMatches: Map<number, any>, matchOddsMap: Map<number, Record<string, number>>): Opportunity[] {
  const opps: Opportunity[] = [];
  const matches = stats.matches.slice(0, 20);
  if (matches.length < 3) return opps; // Minimum 3 matches

  const nextMatch = upcomingMatches.get(stats.teamId);
  const nextMatchId = nextMatch?.id || null;
  const nextMatchHome = nextMatch?.home?.name || nextMatch?.home?.longName || null;
  const nextMatchAway = nextMatch?.away?.name || nextMatch?.away?.longName || null;
  const nextMatchTime = nextMatch?.status?.utcTime || null;

  // Only generate opportunities for teams with an upcoming match
  if (!nextMatchId) return opps;

  const realOdds = matchOddsMap.get(nextMatchId);

  for (const sampleSize of [3, 5, 10, 15, 20]) {
    const sample = matches.slice(0, sampleSize);
    if (sample.length < sampleSize) continue;

    // Over 2.5 goals
    const over25 = sample.filter((m) => m.totalGoals > 2).length;
    if (over25 >= Math.ceil(sampleSize * 0.7)) {
      opps.push({
        team_id: stats.teamId, team_name: stats.teamName,
        league_id: stats.leagueId, league_name: stats.leagueName,
        pattern_type: "GOLES", market: "Over 2.5",
        description: `Over 2.5 goles en ${over25} de ${sampleSize} partidos`,
        context: "general", hits: over25, sample: sampleSize,
        is_hot: over25 / sampleSize >= 0.85,
        next_match_id: nextMatchId, next_match_home: nextMatchHome,
        next_match_away: nextMatchAway, next_match_time: nextMatchTime,
        odds: realOdds?.over25 || 1.85,
      });
    }

    // Over 1.5 goals
    const over15 = sample.filter((m) => m.totalGoals > 1).length;
    if (over15 >= Math.ceil(sampleSize * 0.8)) {
      opps.push({
        team_id: stats.teamId, team_name: stats.teamName,
        league_id: stats.leagueId, league_name: stats.leagueName,
        pattern_type: "GOLES", market: "Over 1.5",
        description: `Over 1.5 goles en ${over15} de ${sampleSize} partidos`,
        context: "general", hits: over15, sample: sampleSize,
        is_hot: over15 / sampleSize >= 0.9,
        next_match_id: nextMatchId, next_match_home: nextMatchHome,
        next_match_away: nextMatchAway, next_match_time: nextMatchTime,
        odds: realOdds?.over15 || 1.30,
      });
    }

    // BTTS
    const bttsCount = sample.filter((m) => m.btts).length;
    if (bttsCount >= Math.ceil(sampleSize * 0.65)) {
      opps.push({
        team_id: stats.teamId, team_name: stats.teamName,
        league_id: stats.leagueId, league_name: stats.leagueName,
        pattern_type: "BTTS", market: "BTTS",
        description: `BTTS en ${bttsCount} de ${sampleSize} partidos`,
        context: "general", hits: bttsCount, sample: sampleSize,
        is_hot: bttsCount / sampleSize >= 0.8,
        next_match_id: nextMatchId, next_match_home: nextMatchHome,
        next_match_away: nextMatchAway, next_match_time: nextMatchTime,
        odds: realOdds?.btts || 1.72,
      });
    }

    // Home win streak
    const homeMatches = sample.filter((m) => m.isHome);
    if (homeMatches.length >= 3) {
      const homeWins = homeMatches.filter((m) => m.won).length;
      if (homeWins >= Math.ceil(homeMatches.length * 0.75)) {
        opps.push({
          team_id: stats.teamId, team_name: stats.teamName,
          league_id: stats.leagueId, league_name: stats.leagueName,
          pattern_type: "RESULT", market: "Result",
          description: `Victoria local en ${homeWins} de ${homeMatches.length} partidos en casa`,
          context: "home", hits: homeWins, sample: homeMatches.length,
          is_hot: homeWins / homeMatches.length >= 0.85,
          next_match_id: nextMatchId, next_match_home: nextMatchHome,
          next_match_away: nextMatchAway, next_match_time: nextMatchTime,
          odds: realOdds?.homeWin || 1.50,
        });
      }
    }

    // Team scored
    const scoredCount = sample.filter((m) => m.goalsScored > 0).length;
    if (scoredCount >= Math.ceil(sampleSize * 0.75)) {
      opps.push({
        team_id: stats.teamId, team_name: stats.teamName,
        league_id: stats.leagueId, league_name: stats.leagueName,
        pattern_type: "GOLES", market: "Scored",
        description: `${stats.teamName} anotó en ${scoredCount} de ${sampleSize} partidos`,
        context: "general", hits: scoredCount, sample: sampleSize,
        is_hot: scoredCount / sampleSize >= 0.85,
        next_match_id: nextMatchId, next_match_home: nextMatchHome,
        next_match_away: nextMatchAway, next_match_time: nextMatchTime,
        odds: realOdds?.over15 || 1.40,
      });
    }
  }

  // Deduplicate: keep best per market
  const bestByMarket = new Map<string, Opportunity>();
  for (const opp of opps) {
    const key = `${opp.team_id}-${opp.market}-${opp.context}`;
    const existing = bestByMarket.get(key);
    if (!existing || opp.hits / opp.sample > existing.hits / existing.sample) {
      bestByMarket.set(key, opp);
    }
  }

  return Array.from(bestByMarket.values());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Supabase config missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("=== Starting optimized trend analysis ===");

    // Step 1: Fetch only 5 dates (3 past + today + tomorrow) — saves ~13 API calls
    const dates: string[] = [];
    for (let i = 3; i >= -1; i--) {
      dates.push(formatDate(new Date(Date.now() - i * 86400000)));
    }

    console.log(`Fetching matches for ${dates.length} dates (optimized)...`);

    // Fetch all 5 dates in one batch — only 1 batch vs 4 before
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
    console.log(`Total matches: ${allMatches.length}, top leagues: ${topLeagueMatches.length}`);

    // Step 2: Store finished matches in matches_history
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
      home_score: m.home.score || 0,
      away_score: m.away.score || 0,
      match_date: formatDateISO(new Date(m.status.utcTime || m.timeTS)),
      match_time: m.time,
      status: "finished",
    }));

    if (historyRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("matches_history")
        .upsert(historyRows, { onConflict: "id" });
      if (upsertError) console.error("Upsert error:", upsertError);
    }

    console.log(`Stored ${historyRows.length} new matches`);

    // Step 3: Load existing history from DB (reuse what we already have)
    // Only load teams from top leagues
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
      if (histError) throw histError;
      if (!data || data.length === 0) break;
      historyData.push(...data);
      if (data.length < pageSize) break;
      page++;
    }

    console.log(`History rows from top leagues: ${historyData.length}`);

    // Step 4: Build team stats
    const teamStatsMap = new Map<number, TeamStats>();

    for (const match of historyData) {
      for (const side of ["home", "away"] as const) {
        const teamId = side === "home" ? match.home_team_id : match.away_team_id;
        const teamName = side === "home" ? match.home_team_name : match.away_team_name;
        const scored = side === "home" ? match.home_score : match.away_score;
        const conceded = side === "home" ? match.away_score : match.home_score;

        if (!teamStatsMap.has(teamId)) {
          teamStatsMap.set(teamId, {
            teamId, teamName,
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

    for (const stats of teamStatsMap.values()) {
      stats.matches.sort((a, b) => b.date.localeCompare(a.date));
    }

    console.log(`Teams from top leagues: ${teamStatsMap.size}`);

    // Step 5: Build upcoming matches map
    const upcomingMatches = new Map<number, any>();
    const upcoming = topLeagueMatches.filter(
      (m) => !m.status?.finished && !m.status?.cancelled
    );
    console.log(`Upcoming matches (top leagues): ${upcoming.length}`);
    for (const m of upcoming) {
      if (m.home?.id && !upcomingMatches.has(m.home.id)) upcomingMatches.set(m.home.id, m);
      if (m.away?.id && !upcomingMatches.has(m.away.id)) upcomingMatches.set(m.away.id, m);
    }

    // Step 6: Fetch odds only for top 15 upcoming matches (saves ~15+ API calls)
    const matchOddsMap = new Map<number, Record<string, number>>();
    const uniqueUpcomingIds = [...new Set(upcoming.map((m) => m.id).filter(Boolean))].slice(0, 15);
    console.log(`Fetching odds for ${uniqueUpcomingIds.length} matches (max 15)...`);

    if (uniqueUpcomingIds.length > 0) {
      // Fetch odds in one batch of up to 15
      const oddsResults = await Promise.all(
        uniqueUpcomingIds.map((eventId) =>
          rapidApiFetch(`/football-event-odds?eventid=${eventId}`, RAPIDAPI_KEY)
            .then((data) => ({ eventId, data }))
            .catch(() => ({ eventId, data: null }))
        )
      );

      for (const { eventId, data } of oddsResults) {
        if (!data?.response?.odds || !Array.isArray(data.response.odds)) continue;
        const parsed: Record<string, number> = {};

        for (const oddGroup of data.response.odds) {
          if (!oddGroup?.items || !Array.isArray(oddGroup.items)) continue;
          const isBet365 = oddGroup?.bookmakerId === 2;
          const items = oddGroup?.items || [];

          for (const item of items) {
            const marketName = (item?.name || "").toLowerCase();
            const values = item?.values || [];

            if (marketName.includes("over/under") || marketName.includes("total goals")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (isNaN(odd)) continue;
                if (label.includes("over 2.5") && (isBet365 || !parsed["over25"])) parsed["over25"] = odd;
                if (label.includes("over 1.5") && (isBet365 || !parsed["over15"])) parsed["over15"] = odd;
              }
            }
            if (marketName.includes("both teams") || marketName.includes("btts")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (!isNaN(odd) && label.includes("yes") && (isBet365 || !parsed["btts"])) parsed["btts"] = odd;
              }
            }
            if (marketName.includes("full time") || marketName.includes("1x2") || marketName.includes("match result")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (isNaN(odd)) continue;
                if ((label === "1" || label === "home") && (isBet365 || !parsed["homeWin"])) parsed["homeWin"] = odd;
                if ((label === "2" || label === "away") && (isBet365 || !parsed["awayWin"])) parsed["awayWin"] = odd;
              }
            }
          }
        }

        if (Object.keys(parsed).length > 0) {
          matchOddsMap.set(eventId, parsed);
        }
      }
    }

    console.log(`Odds fetched for ${matchOddsMap.size} matches`);

    // Step 7: Analyze trends
    const allOpportunities: Opportunity[] = [];
    for (const stats of teamStatsMap.values()) {
      allOpportunities.push(...analyzeTeamTrends(stats, upcomingMatches, matchOddsMap));
    }

    // Rank by strength
    allOpportunities.sort((a, b) => {
      const diff = b.hits / b.sample - a.hits / a.sample;
      return diff !== 0 ? diff : b.sample - a.sample;
    });

    const topOpps = allOpportunities.slice(0, 100);
    console.log(`Opportunities: ${allOpportunities.length} found, keeping top ${topOpps.length}`);

    // Step 8: Replace opportunities
    await supabase.from("opportunities").delete().gte("id", "00000000-0000-0000-0000-000000000000");

    if (topOpps.length > 0) {
      for (let i = 0; i < topOpps.length; i += 50) {
        const batch = topOpps.slice(i, i + 50);
        const { error: insertError } = await supabase.from("opportunities").insert(batch);
        if (insertError) console.error("Insert error:", insertError);
      }
    }

    const summary = {
      status: "success",
      apiCallsMade: dates.length + uniqueUpcomingIds.length,
      matchesFetched: topLeagueMatches.length,
      matchesStored: historyRows.length,
      historyUsed: historyData.length,
      teamsAnalyzed: teamStatsMap.size,
      opportunitiesFound: allOpportunities.length,
      opportunitiesStored: topOpps.length,
      oddsMatches: matchOddsMap.size,
    };

    console.log("=== Analysis complete ===", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-trends error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
