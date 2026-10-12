# Churn Log - 2026

_Fictional demo data. Churned MRR ties to `finance/stripe-export/mrr-by-month.csv` and `customers.csv` (status = churned)._

| Date | Customer (ID) | MRR | Segment | Reason | CSM | Notes |
|---|---|---|---|---|---|---|
| 2026-02-12 | Blue Ox Studio (CUST-1025) | $600 | SMB | Budget cut | Chris Doyle | Media startup reduced tool stack. |
| 2026-05-20 | Ferro Tools (CUST-1028) | $800 | SMB | Low adoption | Chris Doyle | Two failed payments in April before churn. |
| 2026-07-15 | Redwood Commerce (CUST-1020) | $3,100 | Mid-Market | **Missing SAML SSO** | Nandini Rao | Security policy required SSO; asked in Jun (ZD-10012) and Jul (ZD-10133). Renewal deal D-3023 lost. |
| 2026-08-28 | Stratus Cloudworks (CUST-1030) | $2,800 | Mid-Market | **Reliability incident (Aug 14)** | Nandini Rao | Two P1/P2 tickets, credits issued, still left. Had contracted $600 in June. Renewal D-3024 lost. |
| 2026-09-21 | Vantage Mobility (CUST-1032) | $2,200 | Mid-Market | **Champion left** | Chris Doyle | Admin/champion left in Aug (ZD-10301); new head of product kept incumbent tool. Renewal D-3025 lost. |

## Totals
- 2026 YTD churned MRR: $9,500 across 5 logos. Q3: **$8,100 across 3 mid-market logos** (Q2: $800).
- Q3 lost ARR from the three renewals: $97,200. Ending MRR fell from $83,900 (Jun) to $80,000 (Sep).
- TTM GRR 87.4%, NRR 97.9%.

## Themes and lessons
1. **Enterprise-readiness gap:** SSO/SAML was cited in two lost new-logo deals (Granite Bay Analytics, Waverly Systems) in addition to Redwood. Engineering owner: R-103 hire; launch Nov 2026.
2. **Reliability:** the Aug 14 ingestion outage (root cause: failed DB failover and under-provisioned on-call) hit Stratus, Northwind, Tessera and Meridian hardest. Fix list: automated failover tests, status page, Senior SRE hire (R-101).
3. **Single-threaded relationships:** Vantage and others relied on one champion. CSM playbook now requires a second stakeholder per Business/Enterprise account.
4. **Capacity:** two CSMs carry 14 accounts each; open CSM role R-102 (verbal offer to Maya Iyengar).

## Accounts currently at risk
Northwind Logistics (Critical), Meridian Travel and Fjord Commerce (At-risk); details in `account-health.csv`. Northwind's contract has a 60-day non-renewal notice with a deadline of 2026-10-16 and a chronic-SLA termination clause; see `legal/contracts-register.csv`.
