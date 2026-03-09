import { useState, useEffect, useCallback, useRef } from "react";
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

function getMatchDateStr(utcTime: string | null): string | null {
  if (!utcTime) return null;
  try {
    return new Date(utcTime).toISOString().split("T")[0];
  } catch {
    return null;
  }
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

// Map DB market string → market tags for tab filtering
function mapMarketTags(market: string): string[] {
  const tags: string[] = ["Popular"];
  const m = market.toLowerCase().trim();
  if (m.includes("over 2.5")) tags.push("Over 2.5");
  if (m.includes("over 1.5") || m.includes("scored")) tags.push("Over 1.5");
  if (m.includes("btts")) tags.push("BTTS");
  if (m.includes("corner")) tags.push("Corners");
  if (m.includes("card") || m.includes("booking")) tags.push("Cards");
  return tags;
}

export interface RawOpportunity {
  id: string;
  team_name: string;
  league_name: string;
  description: string;
  pattern_type: string;
  market: string;
  context: string | null;
  hits: number;
  sample: number;
  is_hot: boolean | null;
  next_match_home: string | null;
  next_match_away: string | null;
  next_match_time: string | null;
  next_match_id: number | null;
  odds: number | null;
  strength: number | null;
  league_id: number;
  team_id: number;
}

function opportunityToPattern(row: RawOpportunity): Pattern & { matchDateStr: string | null } {
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
    matchDateStr: getMatchDateStr(row.next_match_time),
    odds: Number(row.odds) || 1.85,
    hits: row.hits,
    sample: row.sample,
    hot: !!row.is_hot,
    market: mapMarketTags(row.market),
  };
}

export type PatternWithDate = Pattern & { matchDateStr: string | null };

export function useFootballData() {
  const [patterns, setPatterns] = useState<PatternWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    // Abort controller to cancel in-flight request on unmount
    const controller = new AbortController();

    // 8-second safety timeout
    const safetyTimer = setTimeout(() => {
      console.warn("[useFootballData] 8s safety timeout — aborting & showing empty state");
      controller.abort();
      if (mountedRef.current) {
        setLoading(false);
        setError("La consulta tardó demasiado. Intenta de nuevo.");
      }
    }, 8000);

    try {
      console.log("[useFootballData] Querying opportunities...");

      const { data, error: dbError } = await supabase
        .from("opportunities")
        .select("*")
        .order("strength", { ascending: false })
        .limit(300)
        .abortSignal(controller.signal);

      clearTimeout(safetyTimer);

      if (!mountedRef.current) return;

      console.log(`[useFootballData] Done — rows: ${data?.length ?? 0} | error: ${dbError?.message ?? "none"}`);

      if (dbError) {
        console.error("[useFootballData] DB error:", JSON.stringify(dbError));
        setError(dbError.message || "Error al cargar datos");
        setPatterns([]);
      } else if (!data || data.length === 0) {
        console.warn("[useFootballData] Empty result — showing empty state");
        // Don't show an error — just empty patterns (table will show empty state)
        setPatterns([]);
        setError(null);
      } else {
        console.log(`[useFootballData] Mapping ${data.length} opportunities to patterns`);
        setPatterns((data as RawOpportunity[]).map(opportunityToPattern));
        setError(null);
      }
    } catch (e: unknown) {
      clearTimeout(safetyTimer);
      if (!mountedRef.current) return;

      // AbortError means we already set the timeout error above
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }

      console.error("[useFootballData] Exception:", e);
      setError(e instanceof Error ? e.message : "Error al cargar datos");
      setPatterns([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { patterns, loading, error, refetch: fetchData };
}
