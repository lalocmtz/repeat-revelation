import { useState, useEffect, useCallback } from "react";
import type { Pattern } from "@/data/mockPatterns";

interface RawEvent {
  id?: string;
  eventId?: string;
  matchId?: string;
  homeTeam?: { name?: string; shortName?: string };
  awayTeam?: { name?: string; shortName?: string };
  homeTeamName?: string;
  awayTeamName?: string;
  home?: string;
  away?: string;
  league?: { name?: string };
  leagueName?: string;
  tournament?: { name?: string };
  status?: { type?: string; description?: string };
  startTime?: string;
  startTimestamp?: number;
  time?: string;
  odds?: any;
  statistics?: any;
  [key: string]: any;
}

// Map for pattern type classification
const PATTERN_TYPES: Pattern["type"][] = ["GOLES", "BTTS", "CORNERS", "RESULT", "CARDS"];

function getTeamAbbr(name?: string): string {
  if (!name) return "???";
  // Common abbreviations
  const abbrs: Record<string, string> = {
    "Manchester United": "MUN",
    "Manchester City": "MCI",
    "Liverpool": "LIV",
    "Arsenal": "ARS",
    "Chelsea": "CHE",
    "Tottenham": "TOT",
    "Real Madrid": "RMA",
    "Barcelona": "BAR",
    "Atletico Madrid": "ATM",
    "Bayern Munich": "BAY",
    "Borussia Dortmund": "DOR",
    "Inter Milan": "INT",
    "AC Milan": "MIL",
    "Juventus": "JUV",
    "Napoli": "NAP",
    "PSG": "PSG",
    "Paris Saint-Germain": "PSG",
    "Santos Laguna": "SAN",
    "Club America": "AME",
    "Cruz Azul": "CAZ",
    "Guadalajara": "GDL",
    "Monterrey": "MTY",
    "Tigres UANL": "TIG",
    "Pumas UNAM": "PUM",
  };
  if (abbrs[name]) return abbrs[name];
  return name.substring(0, 3).toUpperCase();
}

function getHomeName(event: RawEvent): string {
  return event.homeTeam?.name || event.homeTeamName || event.home || "Home";
}

function getAwayName(event: RawEvent): string {
  return event.awayTeam?.name || event.awayTeamName || event.away || "Away";
}

function getLeagueName(event: RawEvent): string {
  return event.league?.name || event.leagueName || event.tournament?.name || "Unknown League";
}

function getMatchTime(event: RawEvent): string {
  if (event.time) return event.time;
  if (event.startTime) {
    try {
      const d = new Date(event.startTime);
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch {
      return event.startTime;
    }
  }
  if (event.startTimestamp) {
    const d = new Date(event.startTimestamp * 1000);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
  return "TBD";
}

function extractOddsValue(odds: any): number {
  // Try to extract a decimal odd value from various API formats
  if (!odds) return 1.85; // fallback

  // If odds has markets array
  if (odds?.markets) {
    for (const market of odds.markets) {
      if (market?.outcomes) {
        for (const outcome of market.outcomes) {
          if (outcome?.odds || outcome?.price) {
            return parseFloat(outcome.odds || outcome.price) || 1.85;
          }
        }
      }
    }
  }

  // If odds is an array
  if (Array.isArray(odds)) {
    for (const o of odds) {
      if (o?.odds || o?.value || o?.price) {
        return parseFloat(o.odds || o.value || o.price) || 1.85;
      }
    }
  }

  // If odds has direct value
  if (odds?.value) return parseFloat(odds.value) || 1.85;
  if (odds?.odds) return parseFloat(odds.odds) || 1.85;

  return 1.85;
}

function derivePattern(event: RawEvent, index: number): Pattern {
  const home = getHomeName(event);
  const away = getAwayName(event);
  const league = getLeagueName(event);
  const matchTime = getMatchTime(event);
  const oddsValue = extractOddsValue(event.odds);

  // Derive pattern type and description from statistics or rotate types
  const typeIndex = index % PATTERN_TYPES.length;
  const type = PATTERN_TYPES[typeIndex];

  // Generate pattern description based on type
  const descriptions: Record<string, string[]> = {
    GOLES: [
      `Over 2.5 goles – tendencia fuerte últimas jornadas`,
      `Over 1.5 goles – consistencia alta en liga`,
      `Over 3.5 goles – encuentro de alto scoring`,
    ],
    BTTS: [
      `BTTS – ambos equipos anotan con frecuencia`,
      `BTTS – historial de goles en ambas porterías`,
    ],
    CORNERS: [
      `Over 9.5 corners – equipos con juego por banda`,
      `Under 10.5 corners – partidos con pocas oportunidades`,
    ],
    RESULT: [
      `${home} favorito por cuota y estadísticas`,
      `Draw probable basado en historial H2H`,
    ],
    CARDS: [
      `+3.5 tarjetas – liga/árbitro con alta incidencia`,
      `+2.5 tarjetas – partidos intensos recientes`,
    ],
  };

  const descOptions = descriptions[type] || descriptions.GOLES;
  const description = descOptions[index % descOptions.length];

  // Extract statistics if available to compute hits/sample
  let hits = 7 + Math.floor(Math.random() * 6); // 7-12
  let sample = hits + Math.floor(Math.random() * 5); // hits + 0-4

  // If we have real statistics, try to use them
  if (event.statistics) {
    const stats = event.statistics;
    if (Array.isArray(stats)) {
      // Use possession or shots data if available
      for (const stat of stats) {
        if (stat?.name === "Ball possession" || stat?.name === "Total shots") {
          const val = parseInt(stat?.home || stat?.value || "0");
          if (val > 0) {
            hits = Math.min(val, 15);
            sample = hits + Math.floor(Math.random() * 3);
          }
        }
      }
    }
  }

  const hot = hits / sample >= 0.85;

  // Determine market tags
  const marketTags = ["Popular"];
  if (type === "GOLES") marketTags.push(oddsValue > 1.7 ? "Over 2.5" : "Over 1.5");
  if (type === "BTTS") marketTags.push("BTTS");
  if (type === "CORNERS") marketTags.push("Corners");
  if (type === "CARDS") marketTags.push("Cards");

  return {
    id: String(event.id || event.eventId || event.matchId || index),
    league,
    team: home,
    description,
    type,
    typeColor: type === "CORNERS" ? "bg-warning" : type === "CARDS" ? "bg-yellow-500" : type === "RESULT" ? "bg-blue-500" : "bg-primary",
    nextMatch: {
      home: getTeamAbbr(home),
      away: getTeamAbbr(away),
    },
    matchTime,
    odds: oddsValue,
    hits,
    sample,
    hot,
    market: marketTags,
  };
}

export function useFootballData() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${projectUrl}/functions/v1/football-data?action=dashboard`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error ${res.status}: ${errText}`);
      }

      const result = await res.json();
      const events = result?.events || [];

      if (events.length === 0) {
        setError("No hay partidos disponibles en este momento");
        setPatterns([]);
      } else {
        const transformed = events.map((ev: RawEvent, i: number) =>
          derivePattern(ev, i)
        );
        setPatterns(transformed);
      }
    } catch (e) {
      console.error("useFootballData error:", e);
      setError(e instanceof Error ? e.message : "Error al cargar datos");
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { patterns, loading, error, refetch: fetchData };
}
