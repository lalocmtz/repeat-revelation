import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Pattern } from "@/data/mockPatterns";

function getTeamAbbr(name: string): string {
  if (!name) return "???";
  const abbrs: Record<string, string> = {
    "Manchester United": "MUN", "Manchester City": "MCI", "Liverpool": "LIV",
    "Arsenal": "ARS", "Chelsea": "CHE", "Tottenham": "TOT", "Tottenham Hotspur": "TOT",
    "Real Madrid": "RMA", "Barcelona": "BAR", "Atletico Madrid": "ATM",
    "Bayern Munich": "BAY", "Bayern München": "BAY", "Borussia Dortmund": "DOR",
    "Inter Milan": "INT", "AC Milan": "MIL", "Juventus": "JUV", "Napoli": "NAP",
    "PSG": "PSG", "Paris Saint-Germain": "PSG",
    "Santos Laguna": "SAN", "Club America": "AME", "Cruz Azul": "CAZ",
    "Monterrey": "MTY", "Tigres UANL": "TIG",
  };
  return abbrs[name] || name.substring(0, 3).toUpperCase();
}

function getMatchTime(utcTime: string | null): string {
  if (!utcTime) return "TBD";
  try {
    const d = new Date(utcTime);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch {
    return "TBD";
  }
}

function mapTypeColor(type: string): string {
  switch (type) {
    case "CORNERS": return "bg-warning";
    case "CARDS": return "bg-yellow-500";
    case "RESULT": return "bg-blue-500";
    default: return "bg-primary";
  }
}

function mapMarketTags(row: { market: string }): string[] {
  const tags = ["Popular"];
  if (row.market === "Over 2.5") tags.push("Over 2.5");
  if (row.market === "Over 1.5") tags.push("Over 1.5");
  if (row.market === "BTTS") tags.push("BTTS");
  if (row.market === "Corners") tags.push("Corners");
  if (row.market === "Cards") tags.push("Cards");
  if (row.market === "Result") tags.push("Result");
  if (row.market === "Scored") tags.push("Over 1.5");
  return tags;
}

function opportunityToPattern(row: any): Pattern {
  const patternType = (["GOLES", "BTTS", "CORNERS", "RESULT", "CARDS"].includes(row.pattern_type)
    ? row.pattern_type
    : "GOLES") as Pattern["type"];

  return {
    id: row.id,
    league: row.league_name,
    team: row.team_name,
    description: row.description,
    type: patternType,
    typeColor: mapTypeColor(patternType),
    nextMatch: {
      home: getTeamAbbr(row.next_match_home || row.team_name),
      away: getTeamAbbr(row.next_match_away || "OPP"),
    },
    matchTime: getMatchTime(row.next_match_time),
    odds: Number(row.odds) || 1.85,
    hits: row.hits,
    sample: row.sample,
    hot: row.is_hot,
    market: mapMarketTags(row),
  };
}

export function useFootballData() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Timeout after 8 seconds
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const { data, error: dbError } = await supabase
        .from("opportunities")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("strength", { ascending: false })
        .limit(50)
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        setError("No hay oportunidades calculadas aún. El análisis se ejecuta cada 24h.");
        setPatterns([]);
      } else {
        setPatterns(data.map(opportunityToPattern));
      }
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("La consulta tardó demasiado. Intenta de nuevo.");
      } else {
        console.error("useFootballData error:", e);
        setError(e instanceof Error ? e.message : "Error al cargar datos");
      }
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
