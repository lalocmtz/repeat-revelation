
-- Table to store historical match results fetched from the API
CREATE TABLE public.matches_history (
  id BIGINT PRIMARY KEY,
  league_id INT NOT NULL,
  league_name TEXT,
  home_team_id INT NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_id INT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  match_date DATE NOT NULL,
  match_time TEXT,
  status TEXT DEFAULT 'scheduled',
  total_goals INT GENERATED ALWAYS AS (home_score + away_score) STORED,
  btts BOOLEAN GENERATED ALWAYS AS (home_score > 0 AND away_score > 0) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast team-based lookups
CREATE INDEX idx_matches_home_team ON public.matches_history(home_team_id, match_date DESC);
CREATE INDEX idx_matches_away_team ON public.matches_history(away_team_id, match_date DESC);
CREATE INDEX idx_matches_league ON public.matches_history(league_id, match_date DESC);
CREATE INDEX idx_matches_date ON public.matches_history(match_date DESC);

-- Table to store pre-computed trend opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INT NOT NULL,
  team_name TEXT NOT NULL,
  league_id INT NOT NULL,
  league_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- GOLES, BTTS, CORNERS, RESULT, CARDS
  market TEXT NOT NULL, -- Over 2.5, Over 1.5, BTTS, etc.
  description TEXT NOT NULL,
  context TEXT DEFAULT 'general', -- general, home, away
  hits INT NOT NULL,
  sample INT NOT NULL,
  strength NUMERIC(4,2) GENERATED ALWAYS AS (CASE WHEN sample > 0 THEN (hits::NUMERIC / sample) * 100 ELSE 0 END) STORED,
  next_match_id BIGINT,
  next_match_home TEXT,
  next_match_away TEXT,
  next_match_time TIMESTAMPTZ,
  odds NUMERIC(5,2) DEFAULT 1.85,
  is_hot BOOLEAN DEFAULT false,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '25 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_opportunities_type ON public.opportunities(pattern_type);
CREATE INDEX idx_opportunities_strength ON public.opportunities(strength DESC);
CREATE INDEX idx_opportunities_expires ON public.opportunities(expires_at);

-- RLS: opportunities are public read-only (dashboard data)
ALTER TABLE public.matches_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Anyone can read opportunities (public dashboard)
CREATE POLICY "Anyone can read opportunities"
  ON public.opportunities FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can read match history (public data)
CREATE POLICY "Anyone can read matches_history"
  ON public.matches_history FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role manages all data (edge functions use service role)
CREATE POLICY "Service role manages matches_history"
  ON public.matches_history FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages opportunities"
  ON public.opportunities FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
