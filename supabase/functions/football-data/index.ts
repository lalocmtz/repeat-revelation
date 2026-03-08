import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    console.error(`RapidAPI error [${res.status}] ${path}:`, text);
    throw new Error(`RapidAPI ${res.status}`);
  }
  return res.json();
}

// Format date as YYYYMMDD
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// Top league IDs (from fotmob)
const TOP_LEAGUE_IDS = new Set([
  42,  // Champions League
  73,  // Europa League
  47,  // Premier League
  87,  // La Liga
  55,  // Serie A
  54,  // Bundesliga (was 35, fotmob uses 54)
  53,  // Ligue 1
  239, // Liga MX
  41,  // MLS
  130, // Eredivisie
  61,  // Liga Portugal
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "dashboard";

    // Get matches for a specific date (YYYYMMDD)
    if (action === "matches") {
      const date = url.searchParams.get("date") || formatDate(new Date());
      const data = await rapidApiFetch(
        `/football-get-matches-by-date?date=${date}`,
        RAPIDAPI_KEY
      );
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get odds for a specific event
    if (action === "odds") {
      const eventId = url.searchParams.get("eventId");
      if (!eventId) throw new Error("eventId required");
      const data = await rapidApiFetch(
        `/football-event-odds?eventid=${eventId}`,
        RAPIDAPI_KEY
      );
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all leagues
    if (action === "leagues") {
      const data = await rapidApiFetch("/football-get-all-leagues", RAPIDAPI_KEY);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dashboard: get today's matches from top leagues + odds for a subset
    if (action === "dashboard") {
      const today = formatDate(new Date());
      const tomorrow = formatDate(new Date(Date.now() + 86400000));
      const dayAfter = formatDate(new Date(Date.now() + 2 * 86400000));

      const dateParam = url.searchParams.get("period") || "today";

      let dates: string[];
      if (dateParam === "tomorrow") {
        dates = [tomorrow];
      } else if (dateParam === "3days") {
        dates = [today, tomorrow, dayAfter];
      } else {
        dates = [today];
      }

      // Fetch matches for all requested dates in parallel
      const matchPromises = dates.map((d) =>
        rapidApiFetch(`/football-get-matches-by-date?date=${d}`, RAPIDAPI_KEY)
          .then((data) => data?.response?.matches || [])
          .catch((e) => {
            console.error(`Failed to fetch matches for ${d}:`, e);
            return [];
          })
      );
      const matchArrays = await Promise.all(matchPromises);
      let allMatches = matchArrays.flat();

      // Filter out cancelled matches
      const validMatches = allMatches.filter((m: any) => !m.status?.cancelled);
      
      // Separate upcoming vs finished
      const upcoming = validMatches.filter((m: any) => !m.status?.finished);
      const finished = validMatches.filter((m: any) => m.status?.finished);
      
      // Prefer upcoming, fallback to recent finished
      const pool = upcoming.length > 0 ? upcoming : finished.slice(-30);
      
      // Try top leagues first
      const topLeagueMatches = pool.filter((m: any) => TOP_LEAGUE_IDS.has(m.leagueId));
      const matchesToUse = topLeagueMatches.length >= 5 
        ? topLeagueMatches.slice(0, 30) 
        : pool.slice(0, 30);

      // Fetch odds for up to 10 matches in parallel (to avoid rate limits)
      const matchesForOdds = matchesToUse.slice(0, 10);
      const oddsPromises = matchesForOdds.map((m: any) =>
        rapidApiFetch(`/football-event-odds?eventid=${m.id}`, RAPIDAPI_KEY)
          .then((data) => ({ matchId: m.id, odds: data?.response?.odds || null }))
          .catch(() => ({ matchId: m.id, odds: null }))
      );
      const oddsResults = await Promise.all(oddsPromises);
      const oddsMap = new Map(oddsResults.map((o) => [o.matchId, o.odds]));

      // Combine matches with odds
      const enrichedMatches = matchesToUse.map((m: any) => ({
        ...m,
        oddsData: oddsMap.get(m.id) || null,
      }));

      return new Response(
        JSON.stringify({
          status: "success",
          matches: enrichedMatches,
          totalMatches: allMatches.length,
          topLeagueMatches: topLeagueMatches.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("football-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
