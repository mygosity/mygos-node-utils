import * as dateUtils from '../../date';
import prettier, { BuiltInParserName } from 'prettier';
import * as validator from '../validation';

export function tryParseNumber(input: any, defaultValue: any = null): any {
	if (typeof input === 'number') {
		return input;
	}
	if (validator.invalidNumber(input)) {
		return defaultValue;
	}
	try {
		return input.indexOf('.') === -1 ? parseInt(input) : parseFloat(input);
	} catch (error) {
		return defaultValue;
	}
}

export function prettyParse(data: any, parser: BuiltInParserName): string {
	return prettier.format(data, { parser });
}

export function prettyJson(data: any, stringify: boolean = true): string {
	const pack = stringify ? safeJsonStringify(data) : data;
	return prettier.format(pack, { parser: 'json' });
}

export function prettyWrapWithTimestamp(data: any, stringify: boolean = true): string {
	let pack: any = dateUtils.wrapWithAusTimeStamp(data);
	if (stringify) {
		pack = safeJsonStringify(pack);
	}
	return prettier.format(pack, { parser: 'json' });
}

function circularStringify(o: any): string {
	let cache = [];
	const data = JSON.stringify(o, function(key, value) {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) !== -1) {
				// Duplicate reference found, discard key
				return;
			}
			// Store value in our collection
			cache.push(value);
		}
		return value;
	});
	cache = null;
	return data;
}

export function safeJsonStringify(data: any, ...args: any[]): string {
	let answer = null;
	try {
		answer = JSON.stringify(data);
		return answer;
	} catch (error) {
		// console.log('safeJsonStringify failed', ...args);
	}
	if (answer == null) {
		try {
			answer = circularStringify(data);
			return answer;
		} catch (error) {
			console.log('safeJsonStringify failed circular handler', ...args);
		}
	}
	return '{}';
}

function _prepJsonParse(input: string): any {
	// preserve newlines, etc - use valid JSON
	input = input
		.replace(/\\n/g, '\\n')
		.replace(/\\'/g, "\\'")
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f');
	// remove non-printable and other non-valid JSON chars
	input = input.replace(/[\u0000-\u0019]+/g, '');
	return JSON.parse(input);
}

//TODO:: create manual parser to handle really weird characters
export function safeJsonParse(data: any, ...args: any[]): any {
	let answer = null;
	try {
		answer = JSON.parse(data);
		return answer;
	} catch (error) {
		// console.log({ data, args });
		// console.log(error);
	}
	if (answer == null) {
		try {
			answer = _prepJsonParse(data);
			return answer;
		} catch (error2) {
			// console.log(error2);
		}
	}
	return answer;
}

export function splitInReverseByCondition(
	input: string,
	condition: (char: string, index: number) => boolean,
	inclusive: boolean = false,
): string[] {
	let i: number;
	for (i = input.length - 1; i >= 0; --i) {
		if (condition(input[i], i)) {
			break;
		}
	}
	return [input.substring(0, inclusive ? i + 1 : i), input.substring(i + 1)];
}

export function getStringBetweenChars(target: string, start: string, end: string): string {
	let startIndex = -1,
		endIndex = -1;
	for (let i = 0; i < target.length; ++i) {
		if (startIndex === -1) {
			if (target[i] === start) {
				startIndex = i;
			}
		} else if (endIndex === -1) {
			if (target[i] === end) {
				endIndex = i;
				break;
			}
		}
	}
	if (startIndex >= 0 && endIndex >= 0) {
		return target.substring(startIndex + 1, endIndex);
	}
	return '';
}

export function getStringBetweenStrings(target: string, start: string, end: string): string {
	let startIndex = -1,
		endIndex = -1;
	for (let i = 0; i < target.length; ++i) {
		if (startIndex === -1) {
			if (target.substring(i, start.length + i) === start) {
				startIndex = i + start.length;
			}
		} else if (endIndex === -1) {
			if (target.substring(i, end.length + i) === end) {
				endIndex = i;
				break;
			}
		}
	}
	if (startIndex >= 0 && endIndex >= 0) {
		return target.substring(startIndex, endIndex);
	}
	return '';
}

export function getFloatInsideString(target: string, defaultReturn: any = null): any {
	let startIndex = -1;
	for (let i = 0; i < target.length; ++i) {
		if (startIndex === -1) {
			if (!isNaN(Number(target[i]))) {
				startIndex = i;
			}
		} else {
			if (target[i] !== '.' && isNaN(Number(target[i]))) {
				return parseFloat(target.substring(startIndex, i));
			}
		}
	}
	return defaultReturn;
}
