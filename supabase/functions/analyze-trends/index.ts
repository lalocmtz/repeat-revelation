import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RAPIDAPI_HOST = "free-api-live-football-data.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

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
  const matches = stats.matches.slice(0, 20); // Last 20 matches
  if (matches.length < 3) return opps;

  // Find next match for this team
  const nextMatch = upcomingMatches.get(stats.teamId);
  const nextMatchId = nextMatch?.id || null;
  const nextMatchHome = nextMatch?.home?.name || nextMatch?.home?.longName || null;
  const nextMatchAway = nextMatch?.away?.name || nextMatch?.away?.longName || null;
  const nextMatchTime = nextMatch?.status?.utcTime || null;

  // Get real odds for this team's next match
  const realOdds = nextMatchId ? matchOddsMap.get(nextMatchId) : undefined;

  // Analyze across sample sizes: 3, 5, 10, 15, 20
  for (const sampleSize of [3, 5, 10, 15, 20]) {
    const sample = matches.slice(0, sampleSize);
    if (sample.length < sampleSize) continue;

    // Over 2.5 goals
    const over25 = sample.filter((m) => m.totalGoals > 2).length;
    if (over25 >= Math.ceil(sampleSize * 0.7)) {
      opps.push({
        team_id: stats.teamId,
        team_name: stats.teamName,
        league_id: stats.leagueId,
        league_name: stats.leagueName,
        pattern_type: "GOLES",
        market: "Over 2.5",
        description: `Over 2.5 goles en ${over25} de ${sampleSize} partidos`,
        context: "general",
        hits: over25,
        sample: sampleSize,
        is_hot: over25 / sampleSize >= 0.85,
        next_match_id: nextMatchId,
        next_match_home: nextMatchHome,
        next_match_away: nextMatchAway,
        next_match_time: nextMatchTime,
        odds: realOdds?.over25 || 1.85,
      });
    }

    // Over 1.5 goals
    const over15 = sample.filter((m) => m.totalGoals > 1).length;
    if (over15 >= Math.ceil(sampleSize * 0.8)) {
      opps.push({
        team_id: stats.teamId,
        team_name: stats.teamName,
        league_id: stats.leagueId,
        league_name: stats.leagueName,
        pattern_type: "GOLES",
        market: "Over 1.5",
        description: `Over 1.5 goles en ${over15} de ${sampleSize} partidos`,
        context: "general",
        hits: over15,
        sample: sampleSize,
        is_hot: over15 / sampleSize >= 0.9,
        next_match_id: nextMatchId,
        next_match_home: nextMatchHome,
        next_match_away: nextMatchAway,
        next_match_time: nextMatchTime,
        odds: 1.30,
      });
    }

    // BTTS
    const bttsCount = sample.filter((m) => m.btts).length;
    if (bttsCount >= Math.ceil(sampleSize * 0.65)) {
      opps.push({
        team_id: stats.teamId,
        team_name: stats.teamName,
        league_id: stats.leagueId,
        league_name: stats.leagueName,
        pattern_type: "BTTS",
        market: "BTTS",
        description: `BTTS en ${bttsCount} de ${sampleSize} partidos`,
        context: "general",
        hits: bttsCount,
        sample: sampleSize,
        is_hot: bttsCount / sampleSize >= 0.8,
        next_match_id: nextMatchId,
        next_match_home: nextMatchHome,
        next_match_away: nextMatchAway,
        next_match_time: nextMatchTime,
        odds: 1.72,
      });
    }

    // Win streak (home context)
    const homeMatches = sample.filter((m) => m.isHome);
    if (homeMatches.length >= 2) {
      const homeWins = homeMatches.filter((m) => m.won).length;
      if (homeWins >= Math.ceil(homeMatches.length * 0.75)) {
        opps.push({
          team_id: stats.teamId,
          team_name: stats.teamName,
          league_id: stats.leagueId,
          league_name: stats.leagueName,
          pattern_type: "RESULT",
          market: "Result",
          description: `Victoria local en ${homeWins} de ${homeMatches.length} partidos en casa`,
          context: "home",
          hits: homeWins,
          sample: homeMatches.length,
          is_hot: homeWins / homeMatches.length >= 0.85,
          next_match_id: nextMatchId,
          next_match_home: nextMatchHome,
          next_match_away: nextMatchAway,
          next_match_time: nextMatchTime,
          odds: 1.50,
        });
      }
    }

    // Team scored first half goal (proxy for "first half goal" market)
    const scoredFirstHalf = sample.filter((m) => m.goalsScored > 0).length;
    if (scoredFirstHalf >= Math.ceil(sampleSize * 0.75)) {
      opps.push({
        team_id: stats.teamId,
        team_name: stats.teamName,
        league_id: stats.leagueId,
        league_name: stats.leagueName,
        pattern_type: "GOLES",
        market: "Scored",
        description: `${stats.teamName} anotó en ${scoredFirstHalf} de ${sampleSize} partidos`,
        context: "general",
        hits: scoredFirstHalf,
        sample: sampleSize,
        is_hot: scoredFirstHalf / sampleSize >= 0.85,
        next_match_id: nextMatchId,
        next_match_home: nextMatchHome,
        next_match_away: nextMatchAway,
        next_match_time: nextMatchTime,
        odds: 1.40,
      });
    }
  }

  // Deduplicate: keep only the best (highest strength) per market for this team
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

    console.log("=== Starting trend analysis ===");

    // Step 1: Fetch matches for the last 14 days + upcoming 3 days
    const dates: string[] = [];
    for (let i = 14; i >= -3; i--) {
      dates.push(formatDate(new Date(Date.now() - i * 86400000)));
    }

    // Fetch leagues for name mapping
    // Fallback league names for common leagues
    const FALLBACK_LEAGUES: Record<number, string> = {
      42: "Champions League", 73: "Europa League", 47: "Premier League",
      87: "La Liga", 55: "Serie A", 54: "Bundesliga", 53: "Ligue 1",
      239: "Liga MX", 41: "MLS", 130: "Eredivisie", 61: "Liga Portugal",
      264: "Jupiler Pro League", 253: "Czech Liga", 308: "Saudi Pro League",
      908818: "Championship", 915412: "Icelandic League", 913550: "MLS",
    };

    const leaguesData = await rapidApiFetch("/football-get-all-leagues", RAPIDAPI_KEY)
      .then((data) => {
        const map: Record<number, string> = { ...FALLBACK_LEAGUES };
        for (const l of data?.response?.leagues || []) {
          map[l.id] = l.name || l.localizedName || map[l.id] || `League ${l.id}`;
        }
        return map;
      })
      .catch(() => ({ ...FALLBACK_LEAGUES } as Record<number, string>));

    // Update league names in matches_history for entries missing them
    if (Object.keys(leaguesData).length > Object.keys(FALLBACK_LEAGUES).length) {
      for (const [lid, lname] of Object.entries(leaguesData)) {
        await supabase
          .from("matches_history")
          .update({ league_name: lname })
          .eq("league_id", Number(lid))
          .is("league_name", null);
      }
    }

    console.log(`Fetching matches for ${dates.length} dates...`);

    // Fetch in batches of 5 to avoid rate limits
    const allMatches: any[] = [];
    for (let i = 0; i < dates.length; i += 5) {
      const batch = dates.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map((d) =>
          rapidApiFetch(`/football-get-matches-by-date?date=${d}`, RAPIDAPI_KEY)
            .then((data) => data?.response?.matches || [])
            .catch(() => [])
        )
      );
      allMatches.push(...batchResults.flat());
      // Small delay between batches
      if (i + 5 < dates.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`Total matches fetched: ${allMatches.length}`);

    // Step 2: Store finished matches in matches_history
    const finishedMatches = allMatches.filter(
      (m) => m.status?.finished && !m.status?.cancelled && m.home?.score !== undefined
    );

    console.log(`Finished matches to store: ${finishedMatches.length}`);

    // Batch upsert into matches_history
    const historyRows = finishedMatches.map((m: any) => ({
      id: m.id,
      league_id: m.leagueId,
      league_name: leaguesData[m.leagueId] || null,
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

    // Upsert in batches of 100
    for (let i = 0; i < historyRows.length; i += 100) {
      const batch = historyRows.slice(i, i + 100);
      const { error: upsertError } = await supabase
        .from("matches_history")
        .upsert(batch, { onConflict: "id" });
      if (upsertError) {
        console.error("Upsert error:", upsertError);
      }
    }

    console.log(`Stored ${historyRows.length} matches in history`);

    // Step 3: Build team stats from matches_history (paginate to get all rows)
    let historyData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error: histError } = await supabase
        .from("matches_history")
        .select("*")
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (histError) throw histError;
      if (!data || data.length === 0) break;
      historyData.push(...data);
      if (data.length < pageSize) break;
      page++;
    }

    console.log(`History rows loaded: ${historyData.length}`);

    // Group by team
    const teamStatsMap = new Map<number, TeamStats>();

    for (const match of historyData || []) {
      // Home team
      if (!teamStatsMap.has(match.home_team_id)) {
        teamStatsMap.set(match.home_team_id, {
          teamId: match.home_team_id,
          teamName: match.home_team_name,
          leagueId: match.league_id,
          leagueName: match.league_name || leaguesData[match.league_id] || `League ${match.league_id}`,
          matches: [],
        });
      }
      teamStatsMap.get(match.home_team_id)!.matches.push({
        matchId: match.id,
        date: match.match_date,
        goalsScored: match.home_score,
        goalsConceded: match.away_score,
        totalGoals: match.home_score + match.away_score,
        isHome: true,
        btts: match.home_score > 0 && match.away_score > 0,
        won: match.home_score > match.away_score,
        lost: match.home_score < match.away_score,
        drawn: match.home_score === match.away_score,
      });

      // Away team
      if (!teamStatsMap.has(match.away_team_id)) {
        teamStatsMap.set(match.away_team_id, {
          teamId: match.away_team_id,
          teamName: match.away_team_name,
          leagueId: match.league_id,
          leagueName: match.league_name || `League ${match.league_id}`,
          matches: [],
        });
      }
      teamStatsMap.get(match.away_team_id)!.matches.push({
        matchId: match.id,
        date: match.match_date,
        goalsScored: match.away_score,
        goalsConceded: match.home_score,
        totalGoals: match.home_score + match.away_score,
        isHome: false,
        btts: match.home_score > 0 && match.away_score > 0,
        won: match.away_score > match.home_score,
        lost: match.away_score < match.home_score,
        drawn: match.home_score === match.away_score,
      });
    }

    // Sort each team's matches by date desc
    for (const stats of teamStatsMap.values()) {
      stats.matches.sort((a, b) => b.date.localeCompare(a.date));
    }

    console.log(`Teams analyzed: ${teamStatsMap.size}`);
    // Log sample team stats for debugging
    let debugTeam: TeamStats | null = null;
    for (const stats of teamStatsMap.values()) {
      if (stats.matches.length >= 5) { debugTeam = stats; break; }
    }
    if (debugTeam) {
      console.log(`Debug team: ${debugTeam.teamName} (${debugTeam.matches.length} matches)`);
      const over25 = debugTeam.matches.slice(0, 5).filter(m => m.totalGoals > 2).length;
      console.log(`  Over 2.5 in last 5: ${over25}/5`);
    }

    // Step 4: Build upcoming matches map (team -> next match)
    const upcomingMatches = new Map<number, any>();
    const upcoming = allMatches.filter(
      (m) => !m.status?.finished && !m.status?.cancelled
    );
    console.log(`Upcoming matches for next-match linking: ${upcoming.length}`);
    for (const m of upcoming) {
      if (!upcomingMatches.has(m.home?.id)) upcomingMatches.set(m.home?.id, m);
      if (!upcomingMatches.has(m.away?.id)) upcomingMatches.set(m.away?.id, m);
    }

    // Step 4b: Fetch real odds from bet365 for upcoming matches
    // Map: matchId -> { over25, over15, btts, homeWin, ... }
    const matchOddsMap = new Map<number, Record<string, number>>();
    const uniqueMatchIds = [...new Set(upcoming.map((m) => m.id).filter(Boolean))];
    console.log(`Fetching odds for ${uniqueMatchIds.length} upcoming matches...`);

    // Fetch odds in batches of 10
    for (let i = 0; i < uniqueMatchIds.length; i += 10) {
      const batch = uniqueMatchIds.slice(i, i + 10);
      const oddsResults = await Promise.all(
        batch.map((eventId) =>
          rapidApiFetch(`/football-event-odds?eventid=${eventId}`, RAPIDAPI_KEY)
            .then((data) => ({ eventId, data }))
            .catch(() => ({ eventId, data: null }))
        )
      );

      for (const { eventId, data } of oddsResults) {
        if (!data?.response?.odds) continue;
        const parsed: Record<string, number> = {};

        for (const oddGroup of data.response.odds) {
          const bookmakerId = oddGroup?.bookmakerId;
          // Prefer bet365 (bookmakerId 2) but accept any
          const isBet365 = bookmakerId === 2;
          const items = oddGroup?.items || [];

          for (const item of items) {
            const marketName = (item?.name || "").toLowerCase();
            const values = item?.values || [];

            // Over/Under goals
            if (marketName.includes("over/under") || marketName.includes("total goals")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (isNaN(odd)) continue;
                if (label.includes("over 2.5") && (isBet365 || !parsed["over25"])) parsed["over25"] = odd;
                if (label.includes("over 1.5") && (isBet365 || !parsed["over15"])) parsed["over15"] = odd;
                if (label.includes("over 3.5") && (isBet365 || !parsed["over35"])) parsed["over35"] = odd;
              }
            }
            // BTTS
            if (marketName.includes("both teams") || marketName.includes("btts")) {
              for (const v of values) {
                const label = (v?.name || "").toLowerCase();
                const odd = parseFloat(v?.odd);
                if (isNaN(odd)) continue;
                if ((label === "yes" || label.includes("yes")) && (isBet365 || !parsed["btts"])) parsed["btts"] = odd;
              }
            }
            // Match result (1X2)
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

      if (i + 10 < uniqueMatchIds.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`Odds fetched for ${matchOddsMap.size} matches`);

    // Step 5: Analyze trends for each team
    const allOpportunities: Opportunity[] = [];
    for (const stats of teamStatsMap.values()) {
      const teamOpps = analyzeTeamTrends(stats, upcomingMatches);
      allOpportunities.push(...teamOpps);
    }

    // Step 6: Rank by strength (hits/sample) and take top 100
    allOpportunities.sort((a, b) => {
      const strengthA = a.hits / a.sample;
      const strengthB = b.hits / b.sample;
      if (strengthB !== strengthA) return strengthB - strengthA;
      return b.sample - a.sample; // Prefer larger sample
    });

    const topOpps = allOpportunities.slice(0, 100);

    console.log(`Total opportunities found: ${allOpportunities.length}, keeping top ${topOpps.length}`);

    // Step 7: Clear old opportunities and insert new ones
    await supabase
      .from("opportunities")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // Delete all current opportunities (full refresh)
    await supabase.from("opportunities").delete().gte("id", "00000000-0000-0000-0000-000000000000");

    // Insert new opportunities in batches
    for (let i = 0; i < topOpps.length; i += 50) {
      const batch = topOpps.slice(i, i + 50);
      const { error: insertError } = await supabase
        .from("opportunities")
        .insert(batch);
      if (insertError) {
        console.error("Insert opportunities error:", insertError);
      }
    }

    console.log(`=== Trend analysis complete. ${topOpps.length} opportunities stored ===`);

    return new Response(
      JSON.stringify({
        status: "success",
        matchesFetched: allMatches.length,
        matchesStored: historyRows.length,
        teamsAnalyzed: teamStatsMap.size,
        opportunitiesFound: allOpportunities.length,
        opportunitiesStored: topOpps.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-trends error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
