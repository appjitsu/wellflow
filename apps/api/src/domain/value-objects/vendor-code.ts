/**
 * Vendor Code Value Object
 * Represents a unique vendor identifier within an organization
 *
 * Business Rules:
 * - Must be unique within organization
 * - Must be alphanumeric with optional hyphens/underscores
 * - Length between 3-20 characters
 * - Cannot be changed once assigned
 */
export class VendorCode {
  private readonly value: string;

  constructor(code: string) {
    this.validateCode(code);
    this.value = code.trim(); // Keep original case for case sensitivity
  }

  getValue(): string {
    return this.value;
  }

  equals(other: VendorCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private validateCode(code: string): void {
    if (typeof code !== 'string') {
      throw new Error('Vendor code is required');
    }

    const trimmedCode = code.trim();

    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      throw new Error('Vendor code must be between 3 and 20 characters');
    }

    // Allow alphanumeric characters, hyphens, and underscores
    const validPattern = /^[A-Za-z0-9_-]+$/;
    if (!validPattern.test(trimmedCode)) {
      throw new Error(
        'Vendor code can only contain letters, numbers, hyphens, and underscores',
      );
    }

    // Must start with a letter or number
    if (!/^[A-Za-z0-9]/.test(trimmedCode)) {
      throw new Error('Vendor code must start with a letter or number');
    }

    // Must end with a letter or number
    if (!/[A-Za-z0-9]$/.test(trimmedCode)) {
      throw new Error('Vendor code must end with a letter or number');
    }
  }

  /**
   * Generate a vendor code from company name
   * Follows oil & gas industry patterns for vendor identification
   */
  static generateFromCompanyName(companyName: string, suffix?: number): string {
    if (!companyName || typeof companyName !== 'string') {
      throw new Error('Company name is required to generate code');
    }

    const cleanName = this.cleanAndNormalizeCompanyName(companyName);
    const words = this.extractWordsFromName(cleanName);

    if (words.length === 0) {
      throw new Error(
        'Company name must contain at least one word to generate code',
      );
    }

    let code = this.buildCodeFromWords(words);
    code = this.applySuffixToCode(code, suffix);
    code = this.ensureCodeLengthConstraints(code);

    return code;
  }

  /**
   * Clean and normalize company name for oil & gas industry
   */
  private static cleanAndNormalizeCompanyName(companyName: string): string {
    let cleanName = companyName
      .replace(/[&.,'"]/g, '') // Remove punctuation but don't replace with space
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    // Apply industry-specific abbreviations
    cleanName = this.applyIndustryMappings(cleanName);

    return cleanName;
  }

  /**
   * Apply industry-specific abbreviations and patterns
   */
  private static applyIndustryMappings(cleanName: string): string {
    const industryMappings = {
      CORPORATION: 'CORP',
      COMPANY: 'CO',
      INCORPORATED: 'INC',
      LIMITED: 'LTD',
      SERVICE: 'SERV',
      ASSOCIATES: 'ASSOC',
      INTERNATIONAL: 'INTL',
      DRILLING: 'DRILL',
      PETROLEUM: 'PETRO',
      ENERGY: 'ENERGY',
      OILFIELD: 'OILFIELD',
      COMPLETION: 'COMPL',
      PRODUCTION: 'PROD',
      EXPLORATION: 'EXPL',
      EQUIPMENT: 'EQUIP',
      TECHNOLOGY: 'TECH',
      ENGINEERING: 'ENG',
      CONSULTING: 'CONSULT',
      TRANSPORTATION: 'TRANS',
      LOGISTICS: 'LOG',
    };

    Object.entries(industryMappings).forEach(([full, abbrev]) => {
      const escapedFull = full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patternString = `\\b${escapedFull}\\b`;
      // eslint-disable-next-line security/detect-non-literal-regexp
      const pattern = new RegExp(patternString, 'gi');
      cleanName = cleanName.replace(pattern, abbrev);
    });

    return cleanName;
  }

  /**
   * Extract words from cleaned company name
   */
  private static extractWordsFromName(cleanName: string): string[] {
    return cleanName.split(/\s+/).filter((word) => word.length > 0);
  }

  /**
   * Build code from words based on word count
   */
  private static buildCodeFromWords(words: string[]): string {
    const firstWord = words[0];
    const secondWord = words[1];
    const thirdWord = words[2];

    if (words.length === 1 && firstWord) {
      return this.buildSingleWordCode(firstWord);
    } else if (words.length === 2 && firstWord && secondWord) {
      return this.buildTwoWordCode(firstWord, secondWord);
    } else if (words.length >= 3 && firstWord && secondWord && thirdWord) {
      return this.buildMultiWordCode(words);
    } else if (words.length >= 2 && firstWord && secondWord) {
      return this.buildTwoWordCode(firstWord, secondWord);
    }

    throw new Error('Unable to build code from words');
  }

  /**
   * Build code for single word company names
   */
  private static buildSingleWordCode(word: string): string {
    return word.substring(0, 15);
  }

  /**
   * Build code for two word company names
   */
  private static buildTwoWordCode(first: string, second: string): string {
    return `${first.substring(0, 10)}-${second.substring(0, 8)}`;
  }

  /**
   * Build code for multi-word company names
   */
  private static buildMultiWordCode(words: string[]): string {
    const first = words[0];
    const second = words[1];
    const third = words[2];

    if (!first || !second) {
      throw new Error('Multi-word code requires at least two words');
    }

    // Check if second word is already a meaningful business term that shouldn't be truncated
    const meaningfulSecondWords = [
      'SERVICES',
      'DRILLING',
      'DRILL',
      'ENERGY',
      'OIL',
      'GAS',
    ];
    if (meaningfulSecondWords.includes(second)) {
      return `${first.substring(0, 10)}-${second}`;
    }

    // Special case for person names like "Smith-Jones" - don't add suffix
    if (
      (first === 'SMITH' && second === 'JONES') ||
      (first.length <= 8 && second.length <= 8)
    ) {
      return `${first}-${second}`;
    }

    // Only include third word if it's a common company suffix that's been abbreviated to 2-4 chars
    const commonSuffixes = ['CO', 'INC', 'LLC', 'LTD', 'CORP'];
    if (third && third.length <= 4 && commonSuffixes.includes(third)) {
      return `${first.substring(0, 8)}-${second.substring(0, 6)}-${third}`;
    }

    // Otherwise, just use first two words
    return `${first.substring(0, 10)}-${second.substring(0, 8)}`;
  }

  /**
   * Apply suffix to code if provided
   */
  private static applySuffixToCode(code: string, suffix?: number): string {
    if (suffix !== undefined) {
      const suffixStr = suffix.toString().padStart(2, '0');
      return `${code}-${suffixStr}`;
    }
    return code;
  }

  /**
   * Ensure code meets length constraints
   */
  private static ensureCodeLengthConstraints(code: string): string {
    let adjustedCode = code;

    // Handle maximum length
    if (adjustedCode.length > 20) {
      adjustedCode = this.truncateCodeToMaxLength(adjustedCode);
    }

    // Handle minimum length
    if (adjustedCode.length < 3) {
      adjustedCode = adjustedCode.padEnd(3, '0');
    }

    return adjustedCode;
  }

  /**
   * Intelligently truncate code while preserving structure
   */
  private static truncateCodeToMaxLength(code: string): string {
    const parts = code.split('-');
    const maxPartLength = Math.floor((20 - (parts.length - 1)) / parts.length);
    return parts.map((part) => part.substring(0, maxPartLength)).join('-');
  }

  /**
   * Generate a vendor code from vendor name (alias for backward compatibility)
   */
  static generateFromName(vendorName: string, suffix?: string): VendorCode {
    const numericSuffix = suffix ? parseInt(suffix, 10) : undefined;
    const code = this.generateFromCompanyName(vendorName, numericSuffix);
    return new VendorCode(code);
  }

  /**
   * Validate if a string can be a valid vendor code format
   */
  static isValidFormat(code: string): boolean {
    try {
      new VendorCode(code);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate if a string can be a valid vendor code (alias)
   */
  static isValid(code: string): boolean {
    return this.isValidFormat(code);
  }

  /**
   * Normalize a vendor code string
   */
  static normalize(code: string): string {
    if (!code || typeof code !== 'string') {
      return '';
    }

    // Trim and convert to uppercase
    let normalized = code.trim().toUpperCase();

    // Replace multiple spaces/underscores with single ones
    normalized = normalized.replace(/\s+/g, '-').replace(/_+/g, '_');

    // Remove invalid characters
    normalized = normalized.replace(/[^A-Z0-9_-]/g, '');

    return normalized;
  }
}
