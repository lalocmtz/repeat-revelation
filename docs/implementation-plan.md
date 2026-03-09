# Tiplives — Implementation Plan

Goal: build a **clear, fast football trend radar** with minimal complexity.

This plan breaks development into **small, mindless steps** so nothing requires heavy thinking.

---

# Build Sequence (Step-by-Step)

## Phase 1 — Project Setup

### Step 1: Create Project Repository

Tasks:

- create Git repository
- define project structure
- setup environment variables

Folders:

/frontend  
/backend  
/database  
/scripts

---

### Step 2: Setup Frontend Environment

Install stack:

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Tasks:

- configure Tailwind
- configure global styles
- create layout container
- create component folder

---

### Step 3: Setup Backend Environment

Configure backend on **Lovable Cloud**.

Tasks:

- create server project
- configure API routes
- configure cron jobs
- configure environment variables

Required API keys:

- API-Football
- Odds API (optional)

---

### Step 4: Database Setup

Create PostgreSQL database.

Tables:

Users  
Teams  
Leagues  
Matches  
Odds  
Trends  
Opportunities  
Favorites  
Subscriptions

Key relationships:

Match → Teams  
Opportunity → Match  
Opportunity → Trend

---

# Phase 2 — Data Pipeline

This is the **core intelligence of Tiplives**.

---

## Step 5: Fetch Football Data

Create scheduled job.

Runs every:

**6 hours**

Endpoints needed:

- fixtures (next 3 days)
- historical matches
- teams
- leagues

Store normalized data in database.

---

## Step 6: Fetch Odds Data

Optional but recommended.

Retrieve:

- pre-match odds
- main markets

Markets:

Over 1.5  
Over 2.5  
BTTS  
First Half Goal

Store in **Odds table**.

---

## Step 7: Normalize Data

Create normalization service.

Tasks:

- unify team names
- normalize league IDs
- convert timezones
- standardize odds format

This prevents inconsistent trend analysis.

---

# Phase 3 — Trend Detection Engine

The **core algorithm** scans historical results.

---

## Step 8: Build Trend Analyzer

For every upcoming match:

Analyze both teams:

- last 5 matches
- last 10 matches
- last 15 matches
- last 20 matches

Calculate patterns such as:

Over 2.5 Goals  
BTTS  
First Half Goal  
Winning Streak  
Unbeaten Streak

---

## Step 9: Generate Trend Objects

Example output:
