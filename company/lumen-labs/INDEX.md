# Lumen Labs - Company Context Index

> **This is fictional demo data for Lumen Labs, a made-up B2B SaaS startup. It is read-only and shared across all users. Do not edit it, and never present it as real company data. "Today" in this dataset is 2026-10-12; data runs through 30 Sep 2026 with October partial.**

Lumen Labs sells Lumen Insights (customer-feedback analytics). 40 employees, $80,000 MRR, 28 customers, $6.02M cash, ~20 months runway. Customers are keyed by `customer_id` (CUST-xxxx) and employees by `employee_id` (Exxx) in every file.

## Start here, by bot
| Bot | Questions | Read first |
|---|---|---|
| CFO / Finance | MRR, ARR, churn, cash, runway, burn, budget vs actual, failed payments | `finance/summary.md`, `finance/stripe-export/mrr-by-month.csv`, `failed-payments.csv`, `customers.csv` |
| HR | headcount, org, comp bands, leave, open roles, candidates, policies, onboarding | `hr/bamboohr-export/employees.csv`, `hr/salary-bands.md`, `hr/open-roles.md`, `hr/greenhouse-export/candidates.csv`, `hr/policies/*` |
| Sales | pipeline, forecast, deal status, pricing/discount rules, objections | `sales/hubspot-export/deals.csv`, `sales/q4-forecast.md`, `sales/sales-playbook.md` |
| Customer Success | account health, renewals, escalations, churn reasons | `customer-success/account-health.csv`, `zendesk-export/tickets.csv`, `churn-log.md` |
| Marketing | campaign ROI, signups by channel, positioning, Q4 plan | `marketing/campaigns.csv`, `signups-by-channel.csv`, `brand-and-positioning.md`, `content-calendar-q4.md` |
| Legal | contract renewals, notice deadlines, liability, templates, compliance | `legal/contracts-register.csv`, `legal/compliance-status.md`, `msa-template.md`, `nda-template.md` |
| Assistant / Orchestrator | company background, priorities, cross-functional questions | `company/overview.md`, then the relevant function above |

Cross-functional questions (e.g. "what is the status of Northwind Logistics?") need: Stripe `customers.csv` + `failed-payments.csv`, `account-health.csv`, Zendesk `tickets.csv`, HubSpot `deals.csv` and `contracts-register.csv`, joined by `customer_id`.

## File map
### company/
- `company/overview.md` - what Lumen does, pricing tiers, ICP, founders, funding, org summary, metrics snapshot, Q4 2026 OKRs (all bots)

### finance/ (CFO)
- `finance/stripe-export/mrr-by-month.csv` - Oct 2024-Sep 2026: beginning, new, expansion, contraction, churned, ending MRR, customer counts
- `finance/stripe-export/customers.csv` - every customer ever (28 active, 9 churned): plan, seats, MRR, status, country
- `finance/stripe-export/failed-payments.csv` - failed invoice payments, status and retry dates
- `finance/summary.md` - cash, burn, runway, 6-month P&L, Q3 budget vs actual, collections watch

### hr/ (HR)
- `hr/bamboohr-export/employees.csv` - all 40 employees: title, dept, manager, location, start date, band, salary (USD), leave balance
- `hr/salary-bands.md` - bands L1-L6 with USD ranges and comp rules
- `hr/open-roles.md` - 4 open roles with rationale and pipeline counts
- `hr/greenhouse-export/candidates.csv` - 19 candidates, stages, interviewers
- `hr/policies/employee-handbook.md`, `leave-policy.md`, `remote-work-policy.md` - policies
- `hr/onboarding-checklist.md` - new-hire checklist

### sales/ (Sales)
- `sales/hubspot-export/deals.csv` - 28 deals (open, closed won, closed lost) with ARR, owner, notes
- `sales/sales-playbook.md` - ICP, personas, discovery, objections, discount rules
- `sales/q4-forecast.md` - Q4 bookings forecast, renewals due, scenarios

### customer-success/ (Customer Success)
- `customer-success/account-health.csv` - health score, usage trend, NPS, CSM, renewal date, risk flag for 28 active + 3 Q3 churned accounts
- `customer-success/zendesk-export/tickets.csv` - 36 recent tickets, including open P1 escalations
- `customer-success/churn-log.md` - 2026 churned accounts and reasons

### marketing/ (Marketing)
- `marketing/campaigns.csv` - Q2-Q3 actuals and Q4 budgets: spend, leads, MQLs, SQLs, pipeline
- `marketing/signups-by-channel.csv` - monthly trial signups by channel, Oct 2025-Sep 2026
- `marketing/brand-and-positioning.md` - positioning, pillars, tone, competitors
- `marketing/content-calendar-q4.md` - Q4 plan incl. SSO and Enterprise Readiness launch

### legal/ (Legal)
- `legal/contracts-register.csv` - key customer and vendor contracts: renewal, auto-renew, notice period and deadline, liability cap, SLA
- `legal/msa-template.md`, `legal/nda-template.md` - templates
- `legal/compliance-status.md` - SOC 2 Type II progress, GDPR, India DPDP, HIPAA, open items

## The story in the data (for demo cross-checks)
Q3 2026 churn rose ($8,100 MRR): Redwood Commerce (no SSO), Stratus Cloudworks (Aug 14 outage), Vantage Mobility (champion left). Northwind Logistics (CUST-1021, $7,200 MRR, largest account) is Critical: failed payment, 2 open P1s, low health, renewal 2026-12-15 with a notice deadline of 2026-10-16. Open roles (Senior SRE, CSM) respond to it, and a Q4 SSO/enterprise launch is planned in marketing.
