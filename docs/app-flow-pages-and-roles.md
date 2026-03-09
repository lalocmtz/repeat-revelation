# Tiplives — App Flow, Pages, and Roles

This document defines:

- site structure
- page purpose
- user roles
- main user journeys

Everything is optimized for **clarity and fast navigation**.

Goal:

Users should reach the **trend radar in seconds**.

---

# Site Map (Top-Level Pages)

Public pages:

- Landing
- Pricing
- Login
- Signup

Authenticated pages:

- Dashboard
- Opportunity Detail
- Favorites
- Account

Utility components:

- Slip Builder Drawer
- Filters Bar
- Paywall Overlay

---

# Page Purpose

## Landing Page

Purpose:

Explain the value of Tiplives in **under 5 seconds**.

Key elements:

- hero headline
- short explanation
- dashboard preview
- how it works
- pricing preview
- final CTA

Primary action:

**Try Free**

---

## Pricing Page

Purpose:

Explain the freemium model clearly.

Sections:

- premium benefits
- feature comparison
- subscription price
- FAQ

Primary action:

**Upgrade to Premium**

---

## Login Page

Purpose:

Allow existing users to access the dashboard.

Login methods:

- email
- Google OAuth

Secondary actions:

- password reset
- create account

---

## Signup Page

Purpose:

Create new user accounts.

Fields:

- email
- password

Optional:

- Google signup

After signup:

User is redirected to **dashboard**.

---

## Dashboard (Core Product)

Purpose:

Display the **trend radar**.

Users see ranked opportunities immediately.

Layout structure:

Top navigation  
Filters bar  
Opportunity table  
Optional slip builder drawer

Key information per row:

- market
- pattern
- next match
- odds
- repetition strength
- badge
- action buttons

Primary action:

**View Detail**

Secondary action:

**Add to Slip**

---

## Opportunity Detail Page

Purpose:

Provide deeper analysis of a specific trend.

Sections:

Pattern summary

Example:

**Real Madrid Over 2.5 hit in 19 of the last 20 matches**

Sample breakdown:

- last 5
- last 10
- last 15
- last 20

Home vs Away splits

Head-to-head context

Trend visualization

Odds display

Action:

**Add to Slip**

---

## Favorites Page

Purpose:

Allow users to track preferred teams or leagues.

Features:

- favorite teams
- favorite leagues
- quick access to related trends

Future potential:

trend alerts.

---

## Account Page

Purpose:

User account management.

Sections:

Profile info

Subscription status

Billing

Payment method

Cancel subscription

---

# User Roles

Tiplives uses a **simple role model**.

---

## Guest

Not logged in.

Capabilities:

- view landing page
- view pricing
- create account
- login

Restrictions:

- cannot access dashboard

---

## Free User

Logged-in user without subscription.

Capabilities:

- access dashboard
- see **3 visible opportunities**
- view limited trend details

Restrictions:

- premium rows blurred
- limited filters
- no next 3 days matches
- no advanced detail pages

Goal:

Encourage upgrade.

---

## Premium User

Paid subscription.

Capabilities:

- full dashboard
- all markets
- advanced filters
- next 3 days matches
- complete trend analysis
- slip builder
- favorites

Future benefits:

- alerts
- watchlists
- advanced analytics

---

## Admin (Internal Role)

Used by platform operators.

Capabilities:

- monitor system health
- review trends
- manage API connections
- manage subscriptions
- view usage metrics

---

# Primary User Journeys

Each journey must remain **3 steps or less** to reduce cognitive load.

---

## Journey 1 — Discover a Trend

Step 1

User opens dashboard.

Step 2

User scans ranked opportunities.

Step 3

User clicks **View Detail**.

Goal:

Find a strong trend in **under 5 seconds**.

---

## Journey 2 — Research a Pattern

Step 1

User opens opportunity detail.

Step 2

User checks sample breakdown and splits.

Step 3

User decides whether to bet.

Goal:

Understand the trend quickly.

---

## Journey 3 — Build a Bet Slip

Step 1

User clicks **Add to Slip**.

Step 2

Slip drawer opens.

Step 3

User enters stake and sees payout.

Goal:

Simple odds calculation.

---

## Journey 4 — Upgrade to Premium

Step 1

User sees blurred rows in dashboard.

Step 2

User clicks **Unlock Premium**.

Step 3

User completes subscription.

Goal:

Convert free users smoothly.

---

# Paywall Flow

Free users encounter:

Blurred opportunity rows.

Message example:

**Unlock 27 premium patterns detected today.**

CTA:

**Upgrade to Premium**

Clicking CTA opens:

Pricing page or upgrade modal.

---

# Filter Flow

User adjusts filters to refine opportunities.

Example flow:

Step 1

User selects **Next 3 Days**.

Step 2

User sets **Minimum Repetition: 17 / 20**.

Step 3

Dashboard updates instantly.

Goal:

Find strongest trends quickly.

---

# Slip Builder Flow

The slip builder behaves like a **drawer calculator**.

Step 1

User clicks **Add to Slip**.

Step 2

Slip appears on the right side.

Step 3

User enters stake to calculate payout.

Users can remove picks anytime.

---

# Empty States

Examples:

Dashboard empty state:

**No strong trends match these filters. Try widening your odds range.**

Favorites empty state:

**You haven't added any favorite teams yet.**

Slip builder empty state:

**Add trends to calculate combined odds.**

Tone should remain calm and helpful.

---

# Error Handling

Errors should guide users clearly.

Example:

Data loading error:

**We couldn't refresh trends right now. Please try again in a moment.**

Avoid:

- technical jargon
- blaming language
- aggressive alerts

---

# Future Page Expansion

Possible additional pages:

Trend History

Team Trend Page

Alerts Center

Community Picks

AI Trend Explanation

These should follow the same structure:

- fast scanning
- simple hierarchy
- calm interface

---

# Final UX Principle

Every screen must answer the user’s main question instantly:

**“Which patterns are repeating the most right now?”**

If the interface makes the user hesitate or analyze too long, the design should be simplified.
