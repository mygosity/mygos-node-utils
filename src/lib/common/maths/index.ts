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
	return value >= 0 ? value % maxLen : ((value % maxLen) + maxLen) % maxLen;
}

export function roundToDecimalPlaces(
	input: number,
	dp: number,
	roundingFunction: (input: number) => number = Math.round,
	epsilon: number = 0,
) {
	input *= Math.pow(10, dp);
	input = roundingFunction(input + epsilon);
	input /= Math.pow(10, dp);
	return input;
}

export function approximates(a: number, b: number, proximity: number = 0): boolean {
	return Math.abs(Math.abs(a) - Math.abs(b)) <= proximity;
}
