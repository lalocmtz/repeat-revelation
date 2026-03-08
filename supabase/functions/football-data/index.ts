import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAPIDAPI_HOST = "free-api-live-football-data.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

async function rapidApiFetch(path: string, apiKey: string) {
  const url = `${BASE_URL}${path}`;
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": apiKey,
    },
  });
  const text = await res.text();
  console.log(`Response [${res.status}] for ${path}: ${text.substring(0, 500)}`);
  if (!res.ok) {
    throw new Error(`RapidAPI ${res.status}: ${text.substring(0, 200)}`);
  }
  return JSON.parse(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "discover";

    if (action === "discover") {
      const endpoints = [
        // Try different date formats for matches-by-date
        "/football-get-matches-by-date?date=20260308",
        "/football-get-matches-by-date?date=2026-3-8",
        "/football-get-matches-by-date?date=03/08/2026",
        // Try league-based endpoints  
        "/football-get-all-league-matches?leagueid=47",
        "/football-get-league-events?leagueid=47",
        "/football-get-fixtures-list?leagueid=47",
        // Odds endpoints
        "/football-get-all-odds?eventid=12345",
        "/football-event-odds?eventid=12345",
        "/football-get-event-odds?eventid=12345",
        // Stats
        "/football-get-event-statistics?eventid=12345",
        "/football-get-match-statistics?matchid=12345",
        // Team-based
        "/football-get-team-info?teamid=8456",
        "/football-get-team-statistics?teamid=8456",
        "/football-team-detail?teamid=8456",
      ];

      const results: Record<string, any> = {};

      for (const ep of endpoints) {
        try {
          const data = await rapidApiFetch(ep, RAPIDAPI_KEY);
          results[ep] = { status: "ok", keys: Object.keys(data || {}), preview: JSON.stringify(data).substring(0, 500) };
        } catch (e) {
          results[ep] = { status: "error", message: e instanceof Error ? e.message : String(e) };
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
