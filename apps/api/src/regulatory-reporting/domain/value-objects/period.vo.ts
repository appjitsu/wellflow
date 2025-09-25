export class Period {
  private readonly value: string; // YYYY-MM

  constructor(value: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      throw new Error('Invalid period format, expected YYYY-MM');
    }
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
