# IRD Golden Fixtures

These fixtures encode worked examples from IRD's own published guides and calculators. They are the **source of truth** that our calculation modules must match exactly.

## Source-citation rule

Every fixture must have a `source` field that names the IRD guide or calculator and the section/page where the example came from. If you can't cite the source, the fixture doesn't belong here — put it in `test/synthetic/` instead.

## Adding a fixture

1. Find a worked example in an IRD guide (e.g., IR340 §6 example 3, or the IRD PAYE calculator)
2. Encode the inputs and the expected outputs verbatim — to the cent
3. Add the IRD source reference (URL + section)
4. Re-run the test suite — `npm test`

## Annual refresh

Tax bands, KiwiSaver rates, ESCT thresholds, ACC earner caps change each tax year. When IRD publishes new figures (typically March/April):
1. Add new fixtures for the new tax year
2. Update existing fixtures only if IRD restated examples
3. Tax-year-specific code paths in `src/lib/tax/` may need a new branch

See `docs/annual-tax-refresh.md` (issue #36) for the full playbook.

## Layout

```
test/fixtures/ird/
├── payroll/      PAYE, KiwiSaver, ESCT, student loan, ACC earner levy (IR340)
├── income-tax/   GST math, individual + company income tax, provisional tax (IR3, IR4, IR375)
└── withholding/  Schedular WT, depreciation rates (IR335 + IRD asset rate finder)
```
