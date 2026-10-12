# Finance Summary - Lumen Labs (as of 2026-09-30)

_Fictional demo data. Source of truth for figures: `stripe-export/*.csv` (revenue) and this file (cash, P&L, budget). All amounts USD. Revenue recognised is approximated as month-end MRR._

## Position at 30 Sep 2026
| Metric | Value |
|---|---|
| Cash in bank | $6,019,000 |
| Average monthly net burn (Q3 2026) | $295,061 |
| Runway (cash / avg Q3 net burn) | 20.4 months |
| Ending MRR (Sep 2026) | $80,000 (ARR $960,000) |
| Active paying customers | 28 (ARPA $2,857/mo) |
| Series A | $8.0M closed June 2025 (led by a fictional fund, Foundry Peak Ventures); seed $1.5M in 2022 |
| Net revenue retention (TTM) | 97.9% |
| Gross revenue retention (TTM) | 87.4% |
| Q3 churned MRR | $8,100 (Q2: $800) - Redwood Commerce, Stratus Cloudworks, Vantage Mobility |

Burn arithmetic: net burn = cloud COGS + payroll + software + marketing programs + other opex - revenue. Runway = cash / net burn. Payroll is base salary from `hr/bamboohr-export/employees.csv` x 1.15 (benefits, employer taxes), by month of hire; annual base payroll today is $3,050,000 for 40 employees.

## P&L, last 6 months
| Line | 2026-04 | 2026-05 | 2026-06 | 2026-07 | 2026-08 | 2026-09 |
|---|---|---|---|---|---|---|
| Revenue (month-end MRR) | $81,700 | $82,900 | $83,900 | $82,900 | $82,200 | $80,000 |
| Cloud infrastructure (COGS) | -$19,200 | -$19,800 | -$20,500 | -$21,300 | -$26,900 | -$24,100 |
| Gross profit | $62,500 | $63,100 | $63,400 | $61,600 | $55,300 | $55,900 |
| Payroll (loaded) | -$273,508 | -$280,217 | -$282,133 | -$289,800 | -$292,292 | -$292,292 |
| Software & tools | -$12,800 | -$12,900 | -$13,100 | -$13,400 | -$13,600 | -$13,600 |
| Marketing programs | -$18,766 | -$18,766 | -$18,768 | -$21,666 | -$21,666 | -$21,668 |
| Other opex (rent, legal, audit, recruiting) | -$24,000 | -$24,200 | -$24,500 | -$25,000 | -$26,500 | -$26,500 |
| Operating result | -$266,574 | -$272,983 | -$275,101 | -$288,266 | -$298,758 | -$298,160 |
| Net burn (positive = cash out) | $266,574 | $272,983 | $275,101 | $288,266 | $298,758 | $298,160 |
| Cash at month end | $7,452,268 | $7,179,285 | $6,904,184 | $6,615,918 | $6,317,160 | $6,019,000 |
| Gross margin % | 76.5% | 76.1% | 75.6% | 74.3% | 67.3% | 69.9% |

Notes: August cloud cost includes emergency capacity and Datadog expansion after the 2026-08-14 ingestion outage. Marketing programs equal the quarterly totals in `marketing/campaigns.csv` (Q2 $56,300, Q3 $65,000) split evenly by month.

## Budget vs actual, Q3 2026 (Jul-Sep)
| Line | Budget | Actual | Variance |
|---|---|---|---|
| Revenue | $259,800 | $245,100 | -$14,700 unfav |
| Cloud infrastructure | $65,100 | $72,300 | -$7,200 unfav |
| Payroll (loaded) | $900,600 | $874,384 | +$26,216 fav |
| Software & tools | $41,400 | $40,600 | +$800 fav |
| Marketing programs | $65,000 | $65,000 | +$0 fav |
| Other opex | $74,900 | $78,000 | -$3,100 unfav |
| Net burn | $887,200 | $885,184 | +$2,016 fav |

Commentary: revenue missed budget because three mid-market accounts churned in Q3 ($8,100 MRR) while new logos landed late in the quarter. Payroll is under budget as the Senior SRE, CSM and Identity/SSO engineer roles are still open (see `hr/open-roles.md`); cloud ran over budget because of the August incident (emergency capacity and Datadog expansion). Net burn is $885,184 for the quarter vs budget $887,200.

## Receivables and collections watch
- Northwind Logistics: Oct invoice $7,200 failed 4 times (see `stripe-export/failed-payments.csv`, FP-2001), plus a pending SLA credit request (customer asks ~$2,160, finance calc $720). Exposure: $7,200 now, $86,400 ARR at renewal 2026-12-15.
- Drift Media: $500 failed 2026-10-01 (expired card); retry 2026-10-13.
- All other Q3 failures were recovered within 14 days.

## Tracking
- Cash zero date at current burn: about June 2028.
- Fundraising plan: start Series B conversations at ~12 months runway; target ARR milestone $1.5M.
