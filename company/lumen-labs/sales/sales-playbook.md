# Sales Playbook - Lumen Insights

_Fictional demo data. Owner: Sofia Alvarez, VP Sales. Updated 2026-09-15._

## ICP
B2B software or digital-product companies, 100-2,000 employees, product org of 8-150 people, using 3+ feedback sources (support desk, surveys, app stores, NPS) and no single source of truth. Upmarket segment (Enterprise) needs SAML SSO, SOC 2 and data-residency answers.

## Personas
| Persona | Cares about | Typical objection |
|---|---|---|
| VP/Head of Product (economic buyer) | Roadmap confidence, revenue impact | "We already have spreadsheets + Jira" |
| Product Manager (champion) | Time saved on synthesis | "Will it understand our domain?" |
| Head of CS / Support | Closing the loop, ticket volume | "Another tool to integrate" |
| InfoSec / IT | SSO, SOC 2, data residency, uptime | "No SAML = no go" |
| Finance / Procurement | Price, term, auto-renew | "Need a discount for annual prepay" |

## Discovery questions
1. Where does customer feedback live today, and who reads it?
2. How do you decide what goes on the roadmap? What happened to your last "big bet"?
3. What would a 20% faster synthesis cycle be worth to the team?
4. Who needs to sign off on security? What do they require (SSO, SOC 2, residency)?
5. When does your current tool/contract renew? What is the cost of doing nothing?
6. Who else is evaluating? What would make you choose us?

## Objection handling
- **No SAML SSO today:** be honest; SAML + SCIM is scheduled for GA in Nov 2026 (target date, not a guarantee). Offer a written roadmap clause in the order form (approved only by the VP Sales) and interim security controls (MFA, IP allow-lists). Do not promise a date in the contract beyond Q4 2026.
- **SOC 2:** Type I available; Type II observation window runs to Dec 2026, report expected Feb 2027. Share bridge letter and pen-test summary under NDA.
- **Reliability (post Aug 14 incident):** share the RCA, status page and the remediation plan (reliability hires, failover changes). Offer SLA credits per contract.
- **Price too high:** anchor on revenue-linking use case; propose a smaller Starter/Growth team scope before discounting.
- **Competitor X is cheaper:** compare on integrations, theme accuracy, and revenue-linking; do not disparage.

## Pricing and discount rules
- List: see `company/overview.md`. Annual prepay = 10% max standard discount.
- Up to 10%: AE approval. 11-20%: VP Sales approval. >20% or multi-year price lock: CEO + Head of Finance approval.
- No discounts on Enterprise SLA/security features; concessions should be non-price (extra seats pilot, onboarding hours).
- Renewal uplift: default +5% (capped at 7% by most MSAs); drop the uplift only for Critical/At-risk accounts with VP Sales approval.
- Payment: net-15 monthly by card/ACH; net-30 annual invoice. Payment terms longer than net-30 need Finance approval.
- Order forms and MSA redlines go through Legal (Lena Fischer) before signature.

## Process and stages
Qualified (BANT + pain) -> Demo -> Proposal -> Negotiation -> Contracting -> Closed Won/Lost. Forecast categories: Commit (>=80%), Best Case, Pipeline. Log notes and next step in HubSpot within 24 hours of each call.

## Expansion and renewal motions
- Start renewal motions 120 days before term end with the CSM; confirm notice deadlines from `legal/contracts-register.csv`.
- For at-risk renewals, AE + CSM + exec sponsor (Rohan Kapoor) form a joint plan; check Zendesk escalations and Stripe payment status before every call.
