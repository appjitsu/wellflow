export type Align = 'left' | 'right';

export type FieldType = 'literal' | 'alnum' | 'digits' | 'enum' | 'implied2';

export interface FieldDef {
  name: string;
  length: number;
  type: FieldType;
  value?: string; // for literal
  pad?: Align; // default left
  padChar?: string; // default ' '
  enum?: string[];
}

export interface RecordLayout {
  name: string;
  fields: FieldDef[];
}

// Spec lock and immutability (do not change without explicit unlock)
export interface PrSpecLock {
  locked: true;
  sourceUrl: string;
  sourcePdf: string;
  sourceDate: string; // YYYY-MM-DD
  version: string; // e.g., 'locked-2022-08-17'
}

export const PR_SPEC_LOCK: PrSpecLock = {
  locked: true,
  sourceUrl:
    'https://www.rrc.texas.gov/oil-and-gas/forms/production-reporting/',
  sourcePdf:
    'https://www.rrc.texas.gov/media/oo2ors1p/edifilingrequirements.pdf',
  sourceDate: '2022-08-17',
  version: 'locked-2022-08-17',
};

// Deep freeze to prevent runtime mutation of the spec while locked
function deepFreeze<T>(obj: T): Readonly<T> {
  if (!obj || typeof obj !== 'object') {
    return obj as Readonly<T>;
  }

  Object.freeze(obj);
  for (const value of Object.values(obj as Record<string, unknown>)) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as T);
    }
  }
  return obj as Readonly<T>;
}

// Authoritative-style header
export const HEADER_AUTHORITATIVE: RecordLayout = {
  name: 'HEADER',
  fields: [
    { name: 'record_type', length: 3, type: 'literal', value: 'HDR' },
    { name: 'state', length: 2, type: 'literal', value: 'TX' },
    { name: 'form', length: 2, type: 'literal', value: 'PR' },
    {
      name: 'operator_number',
      length: 6,
      type: 'digits',
      pad: 'left',
      padChar: '0',
    },
    { name: 'agent_id', length: 10, type: 'alnum', pad: 'right', padChar: ' ' },
    {
      name: 'period_yyyymm',
      length: 6,
      type: 'digits',
      pad: 'left',
      padChar: '0',
    },
  ],
};

// Legacy header preserved for backward compatibility when operator/agent are not configured
export const HEADER_LEGACY: RecordLayout = {
  name: 'HEADER_LEGACY',
  fields: [
    { name: 'record_type', length: 3, type: 'literal', value: 'HDR' },
    { name: 'state', length: 2, type: 'literal', value: 'TX' },
    { name: 'form', length: 2, type: 'literal', value: 'PR' },
    {
      name: 'organization_id',
      length: 12,
      type: 'alnum',
      pad: 'left',
      padChar: ' ',
    },
    {
      name: 'period_yyyymm',
      length: 6,
      type: 'digits',
      pad: 'left',
      padChar: '0',
    },
  ],
};

export const DETAIL: RecordLayout = {
  name: 'DETAIL',
  fields: [
    { name: 'record_type', length: 3, type: 'literal', value: 'PRD' },
    { name: 'api14', length: 14, type: 'digits', pad: 'left', padChar: '0' },
    { name: 'product', length: 3, type: 'enum', enum: ['OIL', 'GAS', 'WTR'] },
    { name: 'uom', length: 3, type: 'enum', enum: ['BBL', 'MCF'] },
    {
      name: 'volume_implied2',
      length: 12,
      type: 'implied2',
      pad: 'left',
      padChar: '0',
    },
  ],
};

export const TRAILER: RecordLayout = {
  name: 'TRAILER',
  fields: [
    { name: 'record_type', length: 3, type: 'literal', value: 'TRL' },
    {
      name: 'detail_count',
      length: 6,
      type: 'digits',
      pad: 'left',
      padChar: '0',
    },
  ],
};

export const LAYOUT = deepFreeze({
  headerAuthoritative: HEADER_AUTHORITATIVE,
  headerLegacy: HEADER_LEGACY,
  detail: DETAIL,
  trailer: TRAILER,
} as const);
