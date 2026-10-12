# Lumen Labs - Company Overview

_Fictional demo data (as of 2026-10-12). Figures reconcile with the CSV exports in this folder._

## What Lumen does
Lumen Labs sells **Lumen Insights**, a customer-feedback and product-insights analytics platform for product teams. It ingests feedback from support tickets, app-store reviews, surveys, NPS, call transcripts and in-product events, clusters it into themes with ML, and links themes to usage and revenue so teams can prioritise the roadmap. Integrations: Intercom, Zendesk, Salesforce, Jira, Slack, Segment-style event streams and a webhook/SDK ingestion API.

- Founded 2022 in Bengaluru by **Aarav Menon (CEO)** and **Priya Raman (CTO)**. HQ Bengaluru; remote staff in the US and EU.
- Funding: $1.5M seed (2022); **$8.0M Series A (June 2025)** led by Foundry Peak Ventures (fictional).
- Customers: 28 active paying accounts, mostly mid-market product organisations (fintech, mobility, health, retail, logistics) in the US, UK, EU, India and APAC.

## Pricing tiers (monthly, USD)
| Tier | Price | Notes |
|---|---|---|
| Starter | from $450 incl. 7 seats, +$50 per extra seat | 3 integrations, 12-month history |
| Growth | $60 per seat, min $1,500 | All integrations, theme clustering, API |
| Business | $55 per seat, min $3,500 | Roles & permissions, revenue linking, priority support |
| Enterprise | custom, min $7,000 | 99.9% uptime SLA, dedicated CSM, security review support. **SAML SSO/SCIM: GA planned Nov 2026** |

Annual contracts are standard; monthly billing by card or ACH. Discount rules are in `sales/sales-playbook.md`.

## Ideal customer profile
Product orgs of 8-150 PMs/designers/CS staff at B2B software or digital-product companies with 100-2,000 employees, drowning in unstructured feedback and needing security assurances (SSO, SOC 2) as they move upmarket.

## Key metrics snapshot (Sep 2026)
| Metric | Value |
|---|---|
| MRR / ARR | $80,000 / $960,000 |
| Active customers | 28 (ARPA $2,857/mo) |
| Peak MRR | $83,900 (Jun 2026); Q3 net change -$3,900 |
| Q3 churned MRR | $8,100 (3 mid-market logos) vs $800 in Q2 |
| NRR / GRR (TTM) | 97.9% / 87.4% |
| Cash / avg Q3 net burn / runway | $6,019,000 / $295,061 / 20.4 months |
| Headcount | **40** (29 India, 6 US, 5 EU) |

Headcount by department: Engineering 15, Sales 6, Customer Success 5, Marketing 4, Product 4, People & Ops 2, Finance 2, Executive 1, Legal 1.

## Org chart summary
CEO Aarav Menon directs: CTO Priya Raman (Engineering: managers Arjun Pillai - Platform, Divya Krishnan - Product), VP Sales Sofia Alvarez, Head of Customer Success Rohan Kapoor, Head of People & Ops Nisha Verma, Head of Marketing Marcus Chen, Head of Finance Ananya Rao, Head of Product Vikram Shah, Legal & Compliance Counsel Lena Fischer. Full reporting lines: `hr/bamboohr-export/employees.csv`.

## Q3 2026 in brief
- **Aug 14 ingestion outage** (7h 40m of degraded ingestion, DB failover failure) triggered SLA credits and escalations.
- Three mid-market churns: Redwood Commerce (no SAML SSO), Stratus Cloudworks (Aug outage), Vantage Mobility (champion left). See `customer-success/churn-log.md`.
- **Northwind Logistics** ($7,200 MRR, largest account) is at risk: 2 open P1s, a failed payment, SLA credit dispute and a renewal on 2026-12-15 with a 60-day notice deadline of 2026-10-16.

## Q4 2026 priorities / OKRs
1. **Retention:** Hold Q4 renewals ($310,800 ARR due; $154,800 at-risk or critical). KR: 0 churn among Critical/At-risk accounts; GRR back to >=90%.
2. **Reliability:** Zero P1 incidents >2h; hire Senior SRE (R-101); publish status page SLA reporting. KR: ingestion uptime >=99.95%.
3. **Enterprise readiness:** Ship SAML SSO + SCIM (Nov 2026); finish SOC 2 Type II observation (report Feb 2027). KR: close Crestline Biotech and Ironbridge Capital.
4. **Growth:** $240k new+expansion ARR booked in Q4; exit year at >= $95k MRR.
5. **Team and cash:** Fill 4 open roles (SRE, CSM, Identity/SSO engineer, Enterprise AE); keep runway >= 18 months.
