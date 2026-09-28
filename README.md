# Ownaroo · Australian property investment intelligence

Ownaroo prices, scores and explains **every suburb in Australia** (11,000+) for investors and first-home buyers. It tracks **the market live**: daily home values, every advertised home loan rate, the RBA, building approvals and the news. It also runs a **deal analyser** that already knows the 2026 negative gearing and CGT changes.

Plain HTML/JS with no build step, hosted on Netlify. The data is refreshed every hour by GitHub Actions from public, official sources.

## What's on the site

| Page | What it does |
| --- | --- |
| **Live** `/live` | Day, week, month, quarter, year-to-date and 12-month value moves (Cotality daily index), live estimated medians, a 12-month chart, and week-by-week snapshots |
| **Markets** `/markets` | Capital and regional medians, yields, rents, vacancy and days on market; the RBA cash rate; advertised vs actual lending rates; ABS supply, population, lending and CPI |
| **Suburbs** `/suburbs` | Rank all suburbs by strategy (balanced, growth, cash flow, first home), filter by budget, yield, state and council, map view, CSV export |
| **Suburb pages** `/suburb/wa/morley-6062` | Prices (official or modelled), rents, yield, live moves, Ownaroo Score breakdown, a written investment case (why invest, what to watch, who it suits), a typical-deal verdict, buying costs, building approvals, demographics, nearby suburbs, map and listing links |
| **Postcodes & councils** | `/postcode/6062`, `/council/wa/bayswater` |
| **New builds** `/new-builds` | Monthly approvals by state, new dwellings by council (per resident, apartment share), new-build listings, and why new builds matter after 2026 |
| **Analyse** `/analyse` | Stamp duty for all 8 states (investor, owner-occupier, first home), LMI, land tax, 10-year cash flow, negative gearing with the 2027 cut-off, split CGT with indexation and the 30% minimum, IRR, scenarios, rate stress test and a verdict with reasons |
| **Rates** `/rates` | Every advertised home loan rate from ~90 lenders (Consumer Data Right feeds), filtered by purpose, repayment type, fixed term and LVR |
| **Listings** `/listings` | Live listings via Domain's API, each graded on yield, weekly cost and return |
| **News**, **Weekly report & register**, **Guide**, **Borrowing power**, **Compare**, **Watchlist**, **Methodology** | |

## Data and update schedule

| Source | Used for | Refreshed |
| --- | --- | --- |
| Consumer Data Right product feeds (every bank) | Home loan rates | Hourly |
| Cotality Daily Home Value Index (public ASX feed) | Daily and weekly value moves | Hourly |
| RBA tables A2, F1.1, F5, F6 | Cash rate, lending rates | Hourly |
| RSS from RBA, realestate.com.au, PropTrack, ABC, Guardian, The Conversation and others | Headlines (links only) | Hourly |
| ABS Building Approvals | New dwellings by state, council and SA2 | Hourly check; downloads on each monthly release |
| Valuer-General Victoria, Land Services SA, NSW DCJ | Official suburb sales medians and rents | Monthly check (quarterly data) |
| ABS Census 2016 and 2021, ASGS boundaries | Demographics, geography | Static |
| Cotality HVI, PropTrack, SQM Research | Regional medians, yields, vacancy | Monthly (rolled forward with the index) |
| State revenue offices and the ATO | Duty, land tax, income tax, CGT rules | Reviewed each July (`site/assets/rules.js`) |

Suburbs without official sales data get a calibrated model estimate: an OLS model on 1,291 official medians, anchored to current Cotality regional medians. Held-out median error is 11-12% (VIC, SA) and 19% (NSW). Every figure on the site is labelled *Official* or *Estimate*. See `/methodology`.

## Setup

1. **Netlify**: live at https://keystone-au.netlify.app. To recreate, import this repo. There's no build command; the publish directory is `site`, as set in `netlify.toml`.
2. **Live listings (optional)**: get a free API key at [developer.domain.com.au](https://developer.domain.com.au) and add `DOMAIN_API_KEY` under Netlify → Site configuration → Environment variables.
3. **Site URL for the sitemap**: add a repository variable `SITE_URL` (Settings → Secrets and variables → Actions → Variables) if you use a custom domain.
4. **Registrations** from `/weekly` appear in Netlify → Forms.

## Local development

```bash
node scripts/serve.mjs                    # http://localhost:8788
NODE_USE_ENV_PROXY=1 node scripts/refresh.mjs   # refresh live data (drop the env var outside a proxy)
python3 scripts/abs_approvals.py --force  # building approvals
python3 scripts/fetch_raw.py && python3 scripts/build_suburbs.py   # rebuild suburbs (needs ~700 MB of ABS files)
node --test tests/*.test.mjs              # engine tests: duty, land tax, tax, LMI, negative gearing, CGT
```

## Disclaimer

General information only, not financial, credit, tax or legal advice. Estimates and projections can be wrong. Listing data is © Domain and shown under its API terms. Index data is © Cotality, credited on each page.
