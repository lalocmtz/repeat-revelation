import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Pattern } from "@/data/mockPatterns";

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    "Sassuolo": "SAS", "Tondela": "TON", "Espanyol": "ESP",
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

// ─── Types ──────────────────────────────────────────────────────────────────

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

export type PatternWithDate = Pattern & { matchDateStr: string | null };

export type FetchStatus = "idle" | "loading" | "success" | "empty" | "error";

function opportunityToPattern(row: RawOpportunity): PatternWithDate {
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

// ─── Hook ───────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 15000; // 15 seconds (Supabase can be slow on cold starts)
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

export function useFootballData() {
  const [patterns, setPatterns] = useState<PatternWithDate[]>([]);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;

    if (!isRetry) {
      retryCountRef.current = 0;
    }

    setStatus("loading");
    setError(null);

    console.log(`[useFootballData] Querying opportunities... (attempt ${retryCountRef.current + 1}/${MAX_RETRIES + 1})`);
    const startTime = Date.now();

    try {
      // Create a promise race between the query and a timeout
      const queryPromise = supabase
        .from("opportunities")
        .select("*")
        .order("strength", { ascending: false })
        .limit(300);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("TIMEOUT")), FETCH_TIMEOUT_MS);
      });

      const { data, error: dbError } = await Promise.race([queryPromise, timeoutPromise]);

      if (!mountedRef.current) return;

      const elapsed = Date.now() - startTime;
      console.log(`[useFootballData] Query completed in ${elapsed}ms | rows: ${data?.length ?? 0} | error: ${dbError?.message ?? "none"}`);

      if (dbError) {
        console.error("[useFootballData] DB error:", JSON.stringify(dbError));
        throw new Error(dbError.message || "Error de base de datos");
      }

      if (!data || data.length === 0) {
        console.log("[useFootballData] Empty result — status: empty");
        setPatterns([]);
        setStatus("empty");
        setError(null);
      } else {
        console.log(`[useFootballData] Mapping ${data.length} opportunities to patterns`);
        const mapped = (data as RawOpportunity[]).map(opportunityToPattern);
        setPatterns(mapped);
        setStatus("success");
        setError(null);
      }
    } catch (e: unknown) {
      if (!mountedRef.current) return;

      const elapsed = Date.now() - startTime;
      const errorMsg = e instanceof Error ? e.message : "Error desconocido";
      console.error(`[useFootballData] Error after ${elapsed}ms:`, errorMsg);

      // Retry logic for timeouts and network errors
      const isRetryable = errorMsg === "TIMEOUT" || errorMsg.includes("network") || errorMsg.includes("fetch");
      
      if (isRetryable && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`[useFootballData] Retrying in ${RETRY_DELAY_MS}ms... (retry ${retryCountRef.current}/${MAX_RETRIES})`);
        setTimeout(() => {
          if (mountedRef.current) {
            fetchData(true);
          }
        }, RETRY_DELAY_MS);
        return;
      }

      // Final failure
      setPatterns([]);
      setStatus("error");
      if (errorMsg === "TIMEOUT") {
        setError("La consulta tardó demasiado. Verifica tu conexión e intenta de nuevo.");
      } else {
        setError(errorMsg);
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

  // Derived state for backwards compatibility
  const loading = status === "idle" || status === "loading";

  return { 
    patterns, 
    loading, 
    error, 
    status,
    refetch: () => fetchData(false),
  };
}
