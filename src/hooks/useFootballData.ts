import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Pattern } from "@/data/mockPatterns";

interface OpportunityRow {
  id: string;
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
  strength: number;
  next_match_id: number | null;
  next_match_home: string | null;
  next_match_away: string | null;
  next_match_time: string | null;
  odds: number;
  is_hot: boolean;
  computed_at: string;
  expires_at: string;
}

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

function mapMarketTags(row: OpportunityRow): string[] {
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

function opportunityToPattern(row: OpportunityRow): Pattern {
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

    try {
      // Read pre-computed opportunities from the database
      const { data, error: dbError } = await supabase
        .from("opportunities")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("strength", { ascending: false })
        .limit(50);

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        // No opportunities yet — trigger analysis or show message
        setError("No hay oportunidades calculadas aún. El análisis se ejecuta cada 24h.");
        setPatterns([]);
      } else {
        const transformed = (data as unknown as OpportunityRow[]).map(opportunityToPattern);
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
