import { epsilon } from '../maths';

/**
 * @param {number} amount the amount in currency expected
 * @param {number} numDecimals the number of decimals expected
 * @return {string} value after formatting with appropriate values
 */
export function priceFormatter(amount: number, numDecimals: number = 2): string | number {
	if (!amount.toFixed || isNaN(amount) || numDecimals < 0) {
		console.log('priceFormatter:: amount is invalid.');
		return amount;
	}
	if (amount < 0) return '-' + priceFormatter(-amount, numDecimals);
	let amountString = amount.toFixed(numDecimals);
	if (amount < 1000 && amount >= 0) return '$' + amountString;
	const commaSymbol = ',';
	const decimalModifier = numDecimals > 0 ? numDecimals + 1 : 0;
	let currentlength = amountString.length - 3 - decimalModifier;
	while (currentlength > 0) {
		amountString = amountString.slice(0, currentlength) + commaSymbol + amountString.slice(currentlength);
		currentlength -= 3;
	}
	return '$' + amountString;
}

export function optionalDecimalFormat(
	value: number,
	maxOptionalDecimals: number = 2,
	roundingType: string = 'round',
): string | number {
	const formatted = value;
	if (maxOptionalDecimals > 0 && formatted % 1 > 0) {
		const decimals = formatted % 1;
		const powerOfTen = Math.pow(10, maxOptionalDecimals);
		let adjustedValue = decimals * powerOfTen;
		if (roundingType !== 'floor') {
			adjustedValue = Math[roundingType](adjustedValue);
		} else {
			adjustedValue = Math[roundingType](adjustedValue + epsilon);
		}
		let relevantDecimals: any = adjustedValue / powerOfTen;
		if (relevantDecimals < 1) {
			relevantDecimals = relevantDecimals.toString().substring(1);
		}
		return formatted - decimals + relevantDecimals;
	}
	return formatted.toFixed ? formatted.toFixed(0) : formatted;
}

export function percentFormatter(value: number): string {
	return `${Math.round(value * 100)}%`;
}

export function percentFormatterOptionalDecimal(value: number, maxOptionalDecimals: number = 2): string {
	return optionalDecimalFormat(value * 100, maxOptionalDecimals) + '%';
}

export function addWhiteSpaces(string: string, digit: number): string {
	const digitMatch = new RegExp('(\\d{' + digit + '})', 'g');
	return string.replace(digitMatch, '$1 ').replace(/(^\s+|\s+$)/, '');
}

export function addDash(string: string, digit: number): string {
	const digitMatch = new RegExp('(\\d{' + digit + '})', 'g');
	return string.replace(digitMatch, '$1-').replace(/([-]+$)/, '');
}

export function normalizeNumber(number: string, numberLength: number): string {
	if (!number) {
		return number;
	}
	const onlyNums = number.replace(/[^\d]/g, '');

	if (onlyNums.length <= numberLength) {
		return onlyNums;
	}
	return onlyNums.slice(0, numberLength);
}

export function getPaddedZeroes(input: number | string, maxPadLength: number = 0) {
	let answer = input.toString(),
		capturedLength = answer.length;
	for (let i = 0; i < maxPadLength - capturedLength; ++i) {
		answer = 0 + answer;
	}
	return answer;
}
