# Salary Bands

_Fictional demo data. All figures are annual base salary in USD. India-based salaries are paid in INR at a fixed internal rate of INR 84 = USD 1 and shown here in USD-equivalent; US/EU salaries are paid in local currency (USD-equivalent shown). Bands are global and location-agnostic in width; where an employee sits in the band depends on location market data and experience._

| Band | Level | Min (USD) | Max (USD) | Employees today |
|---|---|---|---|---|
| L1 | Associate | $12,000 | $40,000 | 0 |
| L2 | Junior / Early career | $20,000 | $60,000 | 4 |
| L3 | Mid-level | $30,000 | $95,000 | 14 |
| L4 | Senior | $45,000 | $150,000 | 10 |
| L5 | Staff / Manager / Head of function | $70,000 | $190,000 | 9 |
| L6 | VP / C-level | $100,000 | $280,000 | 3 |

## Rules
- Offers must fall inside the band of the role; anything above band max needs CEO + Head of Finance approval.
- Compa-ratio target: 0.9-1.1 of the market midpoint for the location. India and Eastern Europe are benchmarked against local markets; US against national SaaS data.
- Equity: ESOP grants by band (L3: 0.02-0.05%, L4: 0.05-0.15%, L5: 0.15-0.5%, L6: 0.5%+), 4-year vest, 1-year cliff.
- Sales roles carry variable pay on top of base: AE target OTE split 60/40 base/variable. Variable is not shown in `employees.csv`.
- Annual review cycle runs in April; off-cycle adjustments need Head of People approval.
- Currency: `employees.csv` column `base_salary_usd_annual` is USD (or USD-equivalent for INR payroll).
