export function isNumberByRegexp(stringInput: string): boolean {
	return /^\d+\.{0,1}\d+$/.test(stringInput);
}

export function isEmpty(target: any): boolean {
	if (isObject(target)) {
		return isObjectEmpty(target);
	}
	if (Array.isArray(target) || target.length !== undefined) {
		return target.length === 0;
	}
	return false;
}

export function isInvalidNumber(data: any): boolean {
	if (data == null || data === '' || Array.isArray(data)) {
		return true;
	}
	if (isNaN(Number(data))) {
		return true;
	}
	return false;
}

export function isNumber(input: string): boolean {
	return !isNaN(Number(input));
}

export function isObject(target: any): boolean {
	const type = typeof target;
	return type === 'object' && !Array.isArray(target) && target != null;
}

export function isObjectEmpty(target: any): boolean {
	return Object.entries(target).length === 0 && target.constructor === Object;
}
