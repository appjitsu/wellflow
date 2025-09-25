# PR Record Layout  Field Tracking

Source (RRC official):
<https://www.rrc.texas.gov/media/oo2ors1p/edifilingrequirements.pdf> (see
section: "PR Record Layout")

This document tracks how our implementation aligns to the official field
positions and enumerations. The generator logic lives in:

- apps/api/src/regulatory-reporting/infrastructure/adapters/tx-rrc-pr.adapter.ts

Current implementation (v1):

- Header: [HDR:3][STATE:2][FORM:2][ORG:12][PERIOD:6]
- Detail: [PRD:3][API14:14][PROD:3][UOM:3][VOLUME_IMP2:12]
- Trailer: [TRL:3][COUNT:6]

Mappings:

- product: OIL|GAS|WATER -> OIL|GAS|WTR
- uom: BBL|MCF|BBL_WATER -> BBL|MCF|BBL
- volume: numeric, implied 2 decimals, 12 chars, zero-padded

TODOs to finalize against the handbook:

- Confirm exact header record identity and required operator/agent identifiers
  per the official spec (Agent ID, contact, etc.)
- Add additional detail fields as required by the PR layout (disposition codes
  and others), with fixed positions and authoritative enumerations
- Add strict enumerations and validations per the RRC handbook (dispositions,
  codes)
- Provide golden samples aligned with the official layout for snapshot testing
- Document any conditional logic (oil vs gas fields) if applicable

Validation rules already implemented:

- Period not in the future
- 14-digit API required on every line
- Product UOM compatibility enforced (OIL BBL, GAS MCF, WATER BBL)
- Non-negative volumes

If you have an updated RRC handbook/version, place a copy/reference here and
annotate changes.
