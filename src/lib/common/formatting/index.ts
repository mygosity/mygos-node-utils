export function getFormattedNumber(value: number, maxOptionalDecimals: number = 2): string {
	const copiedValue = value;
	if (maxOptionalDecimals > 0 && copiedValue % 1 > 0) {
		const decimals = copiedValue % 1;
		const powerOfTen = Math.pow(10, maxOptionalDecimals);
		const adjustedValue = Math.round(decimals * powerOfTen + 0.00001);
		const roundedDecimals = adjustedValue / powerOfTen;
		return (copiedValue - decimals + roundedDecimals).toString();
	}
	return copiedValue.toFixed ? copiedValue.toFixed(0) : copiedValue.toString();
}

/**
 * @param {number} amount the amount in currency expected
 * @param {number} numDecimals the number of decimals expected
 * @return {string} value after formatting with appropriate values
 */
export function getFormattedPrice(
	amount: number,
	numDecimals: number = 2,
	shouldLog: boolean = false,
): string | number {
	if (!amount.toFixed || isNaN(amount) || numDecimals < 0) {
		shouldLog && console.log('priceFormatter:: amount is invalid.');
		return amount;
	}
	if (amount < 0) return '-' + getFormattedPrice(-amount, numDecimals);
	let amountString = amount.toFixed(numDecimals);
	if (amount < 1000 && amount >= 0) return '$' + amountString;
	const commaSymbol = ',';
	const decimalModifier = numDecimals > 0 ? numDecimals + 1 : 0;
	let currentlength = amountString.length - 3 - decimalModifier;
	while (currentlength > 0) {
		amountString =
			amountString.slice(0, currentlength) + commaSymbol + amountString.slice(currentlength);
		currentlength -= 3;
	}
	return '$' + amountString;
}

export function getHumanReadableTime(input: number): string {
	let plural = '';
	if (input <= 1000) {
		return input.toFixed(1) + ' milliseconds';
	}
	if (input < 60 * 1000) {
		plural = input / 1000 > 1 ? 's' : '';
		return (input / 1000).toFixed(1) + ' second' + plural;
	}
	if (input < 60 * 60 * 1000) {
		plural = input / 1000 / 60 > 1 ? 's' : '';
		return (input / 1000 / 60).toFixed(1) + ' minute' + plural;
	}
	if (input < 24 * 60 * 60 * 1000) {
		plural = input / 1000 / 60 / 60 > 1 ? 's' : '';
		return (input / 1000 / 60 / 60).toFixed(1) + ' hour' + plural;
	}
	plural = input / 1000 / 60 / 60 / 24 > 1 ? 's' : '';
	return (input / 1000 / 60 / 60 / 24).toFixed(1) + ' day' + plural;
}
