export const epsilon: number = 0.00001;

export function clamp(target: number, options: { min?: number; max?: number } = {}): number {
  if (options.max !== undefined && target > options.max) {
    return options.max;
  }
  if (options.min !== undefined && target < options.min) {
    return options.min;
  }
  return target;
}

export function round(input: number, decimals: number = 0): number {
  if (decimals === 0) {
    return Math.round(input);
  }
  return Math.round(input * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function autoWrap(value: number, maxLen: number): number {
  return (maxLen + value) % maxLen;
}
