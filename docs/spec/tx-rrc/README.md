# Texas Railroad Commission (RRC) – Production Report (Form PR) EDI

This folder contains authoritative references and working notes for the TX RRC
Production Report (Form PR) electronic file layout used by the WellFlow
Regulatory Reporting module.

Authoritative references:

- Online filing of Production Reports and EDI requirements (includes “PR Record
  Layout”): <https://www.rrc.texas.gov/media/oo2ors1p/edifilingrequirements.pdf>
- RRC Production Reporting – Form PR FAQs:
  <https://www.rrc.texas.gov/about-us/faqs/oil-gas-faq/production-reporting-form-pr-faqs/>

What we implemented (MVP fixed-width generator):

- Fixed-width header/detail/trailer records for Form PR:
  - Header: [HDR:3][STATE:2][FORM:2][ORG:12][PERIOD:6]
  - Detail: [PRD:3][API14:14][PROD:3][UOM:3][VOLUME_IMPLIED_2:12]
  - Trailer: [TRL:3][COUNT:6]
- Product code mapping: OIL→OIL, GAS→GAS, WATER→WTR
- UOM mapping: BBL, MCF (WATER→BBL)
- Volume uses implied 2‑decimal fixed width (no decimal point), zero-padded

Notes:

- The official RRC “PR Record Layout” includes additional fields and
  authoritative enumerations (disposition codes, etc.). As we finalize the exact
  field positions from the PDF, we will update the adapter constants to match
  one-to-one with the handbook and add more validations.
- Export artifacts are persisted in compliance_reports.form_data as base64 for
  UI download.

See pr-record-layout.md in this folder for field-by-field tracking and TODOs.
