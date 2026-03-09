import { useState, useEffect, useCallback, useRef } from "react";
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

// ─── Direct REST fetch (bypasses Supabase JS client) ────────────────────────

async function fetchOpportunitiesREST(signal: AbortSignal): Promise<RawOpportunity[]> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.log("[useFootballData] ENV check — URL:", url ? `${url.substring(0, 30)}...` : "MISSING", "| Key:", key ? `${key.substring(0, 20)}...` : "MISSING");

  if (!url || !key) {
    throw new Error("Supabase configuration missing");
  }

  const endpoint = `${url}/rest/v1/opportunities?select=*&order=strength.desc.nullslast&limit=300`;

  console.log("[useFootballData] Fetching:", endpoint.substring(0, 80) + "...");

  const response = await fetch(endpoint, {
    signal,
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  console.log("[useFootballData] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const body = await response.text();
    console.error("[useFootballData] Error body:", body);
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  const data = await response.json();
  console.log("[useFootballData] Parsed rows:", data?.length ?? 0);
  return data as RawOpportunity[];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 20000; // 20 seconds
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

    const attempt = retryCountRef.current + 1;
    console.log(`[useFootballData] Starting fetch (attempt ${attempt}/${MAX_RETRIES + 1})`);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[useFootballData] Aborting fetch after ${FETCH_TIMEOUT_MS}ms`);
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const data = await fetchOpportunitiesREST(controller.signal);
      clearTimeout(timeoutId);

      if (!mountedRef.current) return;

      const elapsed = Date.now() - startTime;
      console.log(`[useFootballData] Success in ${elapsed}ms — ${data.length} rows`);

      if (data.length === 0) {
        setPatterns([]);
        setStatus("empty");
        setError(null);
      } else {
        const mapped = data.map(opportunityToPattern);
        setPatterns(mapped);
        setStatus("success");
        setError(null);
      }
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if (!mountedRef.current) return;

      const elapsed = Date.now() - startTime;
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      const errorMsg = isAbort ? "TIMEOUT" : (e instanceof Error ? e.message : "Error desconocido");
      console.error(`[useFootballData] Error after ${elapsed}ms:`, errorMsg);

      // Retry on timeout/network errors
      const isRetryable = isAbort || errorMsg.includes("network") || errorMsg.includes("fetch") || errorMsg.includes("Failed to fetch");

      if (isRetryable && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`[useFootballData] Retrying in ${RETRY_DELAY_MS}ms... (retry ${retryCountRef.current}/${MAX_RETRIES})`);
        setTimeout(() => {
          if (mountedRef.current) fetchData(true);
        }, RETRY_DELAY_MS);
        return;
      }

      setPatterns([]);
      setStatus("error");
      setError(isAbort
        ? "La consulta tardó demasiado. Verifica tu conexión e intenta de nuevo."
        : errorMsg
      );
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const loading = status === "idle" || status === "loading";

  return {
    patterns,
    loading,
    error,
    status,
    refetch: () => fetchData(false),
  };
}
