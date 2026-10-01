# Review of Gaming M&A and Financial Performance

Reviewed 1 October 2026. Repository snapshot: `8ba7b066ae3de88e58c29269ee6537f3d144604e`.

## Assessment

The stored before/after calculations reproduce, but the original paper is not fully correct in its factual details or interpretation. It is a useful descriptive case study, not evidence that the acquisitions caused performance changes or that the market predicted acquisition failure. The revised paper corrects this distinction and adds timing sensitivities. It compiles successfully in the native LaTeX editor.

## Findings and changes

| Finding | Evidence and correction |
| --- | --- |
| Playdemic announcement mistaken for closing | [EA's SEC filing](https://www.sec.gov/Archives/edgar/data/712515/000071251521000138/ea-20210920.htm) records completion on 20 September 2021; June 23 was the agreement date. Corrected the paper to February–September 2021. The deals CSV now records the corrected closing date. |
| EA baseline includes acquired operations | [EA's announcement](https://news.ea.com/press-releases/press-releases-details/2021/Electronic-Arts-and-Codemasters-Establish-a-New-Global-Powerhouse-for-Racing-Videogames--Entertainment/default.aspx) establishes Codemasters completion on 18 February 2021, within FY2021. The main table retains the original results explicitly as a legacy comparison; the revision adds FY2018–20 as a baseline wholly before the programme. |
| Timing changes the magnitude | Independently calculated EA operating-margin decline: 2.14 percentage points with FY2019–21 baseline, 5.23 points with FY2018–20. The clean-baseline annualised revenue ratio is 7.50%, using a five-year midpoint gap. FY2018 EA OCF is missing, so a complete clean-baseline OCF comparison is unavailable. |
| Causal claims exceed the design | Removed assertions that acquisitions delivered growth, that payment method explains outcomes, and that the market's scepticism was proved correct. No non-acquirer benchmark, combined acquirer–target baseline or counterfactual is estimated. |
| Cash-flow measure mischaracterised | Clarified that statement-of-cash-flows OCF divided by year-end book assets is not a replication of the Healy–Palepu–Ruback design. Its acquisition accounting, denominator, working-capital effects and benchmarking differ. |
| Nazara margin is a different measure | Separated its EBITDA-style margin from the US companies' operating margins. A cross-company margin ranking would require harmonised definitions. Nazara also was not listed in the 2019 acquisition period. |
| Impairment attribution too strong | [Take-Two's FY2025 annual report](https://ir.take2games.com/static-files/1e8d3004-75ab-48d7-b705-7b44fe45694e) confirms $2,342.1m and $3,545.2m impairments but describes one reporting unit. The revision avoids equating the entire $5,887.3m with a transaction-specific Zynga loss. |
| “Revenue CAGR” label ambiguous | Defined the actual formula: annualised ratio of three-year revenue averages using midpoint-year distance. It is not endpoint CAGR or organic growth. |
| Returns and adjustments need qualifications | Explained year-end denominator effects, shrinking equity, missing impairment entries treated as zero, and why adding back goodwill impairment does not establish acquisition success. |
| Statistical statement too broad | Restricted the 0.125 minimum p-value claim to exact two-sided sign/signed-rank tests with four non-zero paired observations. Four cases do not make every conceivable statistical test mathematically impossible. |
| Reproducibility incomplete | Added a snapshot identifier, independent audit and machine-readable results. The original repository does not archive source contexts and extraction rules per value, so a complete primary-source data certification is still outstanding. |

## What was verified

The independent standard-library audit recomputes all 108 stored pre/post fields, including their missing-value states, from the repository's financial CSV. Differences are within the stored four-decimal rounding tolerance. All baseline window selections contain three observations. This verifies consistency of the supplied data and calculations; it does not certify every input against audited filings.

Primary-source spot checks support the corrected EA dates, Take-Two impairment totals, Take-Two FY2026 revenue and operating loss, and Unity FY2023–25 revenue and operating losses. The latter can be checked in [Unity's FY2025 10-K](https://www.sec.gov/Archives/edgar/data/1810806/000181080626000011/unity-20251231.htm) and [Take-Two's FY2026 release](https://www.take2games.com/ir/news/take-two-interactive-software-inc-reports-results-fourth-2). These checks do not substitute for a full filing reconciliation.

The original full analysis script could not run here because matplotlib is unavailable. Its core calculations were independently reproduced without third-party packages. No packages were installed. This report covers the initial paper review. A later frontend refinement is documented in DESIGN.md and includes browser checks and export tests.

## Deliverables and remaining limits

`revised-paper.tex` is a standalone editable revision with embedded references and numerical tables. It removes external chart and journal-class dependencies so the native editor can compile it. The original repository charts remain available in GitHub; they have not been regenerated or embedded in this revision. Journal-specific formatting can be restored after the author chooses a submission venue.

`verified-calculations.json` records baseline and sensitivity calculations. `analysis/reproduce-audit.py`, `data/financials.csv`, `data/deals.csv` and `data/pre_post.csv` support reproduction with `python3 analysis/reproduce-audit.py`. Financial inputs and comparison windows preserve the reviewed snapshot; the deals file corrects Playdemic’s closing date and the programme description. These metadata corrections do not change the stored ratios.

Before a claim of full correctness or publication readiness, reconcile every financial input to a dated filing and context, replace secondary deal references with company disclosures, validate market-return data, and have the author confirm affiliation, authorship and declarations. No source numbers were silently replaced or invented. This review accompanies the repository revision.
