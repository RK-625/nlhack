# Compliance Status (as of 2026-10-12)

_Fictional demo data. Owner: Lena Fischer, Legal & Compliance Counsel. Vendor and audit contracts: `contracts-register.csv` (V-008 Vanta, V-009 Harbinger Assurance)._

## SOC 2
| Item | Status |
|---|---|
| SOC 2 Type I | Issued 2026-02-10 (no exceptions) |
| SOC 2 Type II | **In progress.** Observation window 2026-04-01 to 2026-12-31 (9 months). Fieldwork Jan 2027; report expected **Feb 2027** |
| Controls automated | 87% of 112 controls monitored in Vanta |
| Open items | (1) Quarterly access review for production: 2 of 3 completed, Q3 due 2026-10-31. (2) Incident-response tabletop after Aug 14 outage: scheduled 2026-10-22. (3) Vendor risk assessments for Datadog and Zendesk: due 2026-11-15. (4) Evidence gap: backup restore test not logged for Q2 |
| Risk | The Aug 14 incident is documented as a reportable event; auditor reviewing RCA and corrective actions. A repeat P1 in the window could generate an exception |

## GDPR (EU/UK customers)
- DPA and SCCs executed with all EU/UK customers (Meridian, Alder & Finch, Orbit, Halcyon, Lattice Robotics, Fjord Commerce).
- Sub-processor list published and customers notified 30 days before changes. Latest change: Datadog added (Aug 2026), notice sent 2026-08-20.
- DSAR handling: 7 requests YTD, all closed within 30 days. DPO function: Lena Fischer (interim).
- Open item: data-residency option (EU region) is on the roadmap for Q1 2027; asked for by Oakhaven Bank and Lattice Robotics.

## India DPDP Act 2023
- Lumen is a data fiduciary for employee data and a data processor for customer data. Consent notices updated for the HR system; grievance officer named (Nisha Verma).
- Open items: DPDP Rules (when finalised) gap assessment due 2026-12-15; cross-border transfer register; breach notification playbook update to include Data Protection Board timing.

## HIPAA
- BAA in place with Brightwave Health. Lumen is not HIPAA-certified; healthcare prospects (Marlow Health) are told this. Documentation request ZD-10500 in progress.

## Security programme highlights
Annual penetration test (last: 2026-06, 0 critical), SSO + MFA for staff, encryption at rest and in transit, quarterly vulnerability scans, background checks at hire.

## Customer-facing gaps
1. **SAML SSO/SCIM:** not yet available; GA planned Nov 2026 (not a contractual commitment unless in the order form - check `contracts-register.csv` and deal notes).
2. SOC 2 Type II report not yet issued (bridge letter available).
3. EU data-residency not yet available.

## Key dates
2026-10-22 incident tabletop | 2026-10-31 Q3 access review | 2026-11-15 vendor assessments | 2026-12-15 DPDP gap assessment | 2026-12-31 SOC 2 window closes | Feb 2027 report.
