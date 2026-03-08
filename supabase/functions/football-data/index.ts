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

    // Discovery: try multiple endpoint patterns to find what works
    if (action === "discover") {
      const endpoints = [
        "/football-get-all-leagues",
        "/football-get-all-livescores",
        "/football-current-live",
        "/football-livescores",
        "/football-live-scores",
        "/football-fixtures",
        "/football-get-fixtures",
        "/football-matches",
        "/football-get-matches",
        "/football-today",
        "/football-players-search?search=messi",
        "/football-get-all-fixtures",
        "/football-get-events",
        "/football-league-list",
        "/football-get-all-events",
      ];

      const results: Record<string, any> = {};

      for (const ep of endpoints) {
        try {
          const data = await rapidApiFetch(ep, RAPIDAPI_KEY);
          results[ep] = { status: "ok", keys: Object.keys(data || {}), preview: JSON.stringify(data).substring(0, 300) };
          // Stop after finding 3 working endpoints to save quota
          if (Object.values(results).filter((r: any) => r.status === "ok").length >= 3) break;
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
