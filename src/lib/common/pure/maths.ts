export const epsilon: number = 0.00001;

export function approximates(a: number, b: number, proximity: number = 0): boolean {
	return Math.abs(Math.abs(a) - Math.abs(b)) <= proximity;
}

export function autoWrap(value: number, maxLen: number): number {
	return value >= 0 ? value % maxLen : ((value % maxLen) + maxLen) % maxLen;
}

export function clamp(target: number, options: { min?: number; max?: number } = {}): number {
	if (options.max !== undefined && target > options.max) {
		return options.max;
	}
	if (options.min !== undefined && target < options.min) {
		return options.min;
	}
	return target;
}

export function roundToDecimalPlaces(
	input: number,
	decimalPlaces: number,
	roundingFunction: (input: number) => number = Math.round,
	epsilon: number = 0.00001
) {
	input *= Math.pow(10, decimalPlaces);
	input = roundingFunction(input + epsilon);
	input /= Math.pow(10, decimalPlaces);
	return parseFloat(input.toFixed(decimalPlaces));
}

export function getGeometricSequenceNthTerm(geometricRatio: number, startPrice: number, endPrice: number): number {
	// nthTerm = a * r^(n - 1)
	// endPrice = startPrice * geometricRatio^(n-1)
	// endPrice / startPrice = geometricRatio^(n-1)
	// log(endPrice / startPrice) = log(geometricRatio) * (n - 1)
	// n = log(endPrice / startPrice) / log(geometricRatio) + 1
	return Math.floor(Math.log(endPrice / startPrice) / Math.log(geometricRatio) + 1);
}

export function getGeometricSumWithN(geometricRatio: number, startPrice: number, n: number): number {
	// sum = a * ((1 - r^n) / (1 - r))
	// startPrice * ((1 - geometricRatio^n) / (1 - geometricRatio));
	return startPrice * ((1 - Math.pow(geometricRatio, n)) / (1 - geometricRatio));
}

export function getGeometricSumWithEndPrice(geometricRatio: number, startPrice: number, endPrice: number): number {
	const n = getGeometricSequenceNthTerm(geometricRatio, startPrice, endPrice);
	return getGeometricSumWithN(geometricRatio, startPrice, n);
}

/**
 * Given the minimum transaction cost such as $10 usd for bnb/busd trades, this will return the required BUSD
 * to start trading a grid with a given ratio and starting price to end price
 * @param geometricRatio
 * @param minReqCost
 * @param startPrice
 * @param endPrice
 * @returns
 */
export function getMinSumRequiredForRatio(geometricRatio: number, minReqCost: number, startPrice: number, endPrice: number): number {
	const endPriceConverted = endPrice * (minReqCost / startPrice);
	const minSumRequired = getGeometricSumWithEndPrice(geometricRatio, minReqCost, endPriceConverted);
	return minSumRequired;
}

export function getQuantitiesForGeometricRatio(
	geometricRatio: number,
	minReqCost: number,
	totalInvestment: number,
	startPrice: number,
	endPrice: number
): Array<[number, number, number]> {
	const minSum = getMinSumRequiredForRatio(geometricRatio, minReqCost, startPrice, endPrice);
	if (totalInvestment < minSum) {
		return [];
	}
	const quantities = [];
	const multiplier = totalInvestment / minSum;
	let currCost = minReqCost * multiplier;
	let currPrice = startPrice;
	while (currPrice <= endPrice) {
		const qty = currCost / currPrice;
		// const preciseQuantity; TODO:: implement precision for quantity to get this value to the nearest proper value that's valid
		quantities.push([currPrice, qty, currCost]);
		currPrice *= geometricRatio;
		currCost *= geometricRatio;
	}
	return quantities;
}

export function getRatioFromNTerms(startPrice: number, endPrice: number, n: number): number {
	// endPrice / startPrice = geometricRatio^(n-1)
	return Math.pow(endPrice / startPrice, 1 / (n - 1));
}
