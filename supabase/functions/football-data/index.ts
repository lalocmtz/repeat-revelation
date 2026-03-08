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

// Top league IDs for the API
const LEAGUE_IDS: Record<string, number> = {
  "Premier League": 47,
  "La Liga": 87,
  "Serie A": 55,
  "Bundesliga": 35,
  "Ligue 1": 53,
  "Liga MX": 239,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not configured");

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "matches";

    if (action === "matches") {
      // Get live scores (today's matches)
      const data = await rapidApiFetch("/football-get-all-livescores", RAPIDAPI_KEY);
      
      const matches = data?.response?.matches || data?.response?.live || data?.response || [];
      
      return new Response(JSON.stringify({ matches }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "odds") {
      const eventId = url.searchParams.get("eventId");
      if (!eventId) throw new Error("eventId required");

      const data = await rapidApiFetch(
        `/football-get-odds-by-event?eventid=${eventId}`,
        RAPIDAPI_KEY
      );
      return new Response(JSON.stringify({ odds: data?.response || data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "statistics") {
      const eventId = url.searchParams.get("eventId");
      if (!eventId) throw new Error("eventId required");

      const data = await rapidApiFetch(
        `/football-get-statistics-event?eventid=${eventId}`,
        RAPIDAPI_KEY
      );
      return new Response(JSON.stringify({ statistics: data?.response || data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "leagues") {
      const data = await rapidApiFetch("/football-get-all-leagues", RAPIDAPI_KEY);
      return new Response(JSON.stringify({ leagues: data?.response || data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: get upcoming matches for top leagues with odds
    if (action === "dashboard") {
      // Fetch livescores to get today's events
      const liveData = await rapidApiFetch("/football-get-all-livescores", RAPIDAPI_KEY);
      
      // The API returns data in various formats, try to normalize
      let allEvents: any[] = [];
      
      if (liveData?.response?.liveMatches) {
        allEvents = liveData.response.liveMatches;
      } else if (liveData?.response?.stages) {
        for (const stage of liveData.response.stages) {
          if (stage?.events) {
            allEvents.push(...stage.events);
          }
        }
      } else if (Array.isArray(liveData?.response)) {
        allEvents = liveData.response;
      } else if (liveData?.response?.events) {
        allEvents = liveData.response.events;
      }

      // Try to get odds for each event (limit to first 15 to avoid rate limits)
      const eventsWithOdds: any[] = [];
      const eventsToProcess = allEvents.slice(0, 15);

      for (const event of eventsToProcess) {
        const eventId = event?.id || event?.eventId || event?.matchId;
        let odds = null;
        let stats = null;

        if (eventId) {
          try {
            const oddsData = await rapidApiFetch(
              `/football-get-odds-by-event?eventid=${eventId}`,
              RAPIDAPI_KEY
            );
            odds = oddsData?.response || oddsData;
          } catch (e) {
            console.error(`Failed to get odds for event ${eventId}:`, e);
          }

          try {
            const statsData = await rapidApiFetch(
              `/football-get-statistics-event?eventid=${eventId}`,
              RAPIDAPI_KEY
            );
            stats = statsData?.response || statsData;
          } catch (e) {
            console.error(`Failed to get stats for event ${eventId}:`, e);
          }
        }

        eventsWithOdds.push({ ...event, odds, statistics: stats });
      }

      return new Response(
        JSON.stringify({ events: eventsWithOdds, rawEvents: allEvents.length }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
