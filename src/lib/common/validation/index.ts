import { arrayDifference } from '../objectarray';

export function isNumber(input: string): boolean {
	return !isNaN(Number(input));
}

export function invalidNumber(data: any): boolean {
	if (data == null || data === '' || Array.isArray(data)) {
		return true;
	}
	if (isNaN(Number(data))) {
		return true;
	}
	return false;
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

export function isObjectEmpty(target: any): boolean {
	return Object.entries(target).length === 0 && target.constructor === Object;
}

export function isObject(target: any): boolean {
	const type = typeof target;
	return type === 'object' && !Array.isArray(target) && target != null;
}

export function isObjectClonedShallow(target: any, source: any): boolean {
	let isCloned = true;
	for (let prop in source) {
		const sourceType = typeof source[prop];
		const targetType = typeof target[prop];
		if (sourceType !== targetType) {
			return false;
		}
		if (sourceType !== 'object' && sourceType !== 'function') {
			if (target[prop] !== source[prop]) {
				return false;
			}
		}
	}
	return isCloned;
}

export function isClonedIn(target: any, sources: any): boolean {
	if (target == null) {
		return true;
	}
	let isClone = false;
	if (typeof target !== 'object') {
		if (Array.isArray(sources)) {
			for (let i = 0; i < sources.length; ++i) {
				if (target === sources[i]) {
					return true;
				}
			}
		} else {
			for (let i in sources) {
				if (target === sources[i]) {
					return true;
				}
			}
		}
	} else {
		for (let i = 0; i < sources.length; ++i) {
			if (typeof sources[i] === 'object') {
				if (Array.isArray(sources[i])) {
					if (arrayDifference(target, sources[i]).length === 0) {
						return true;
					}
				} else {
					if (isObjectClonedShallow(target, sources[i])) {
						return true;
					}
				}
			}
		}
	}
	return isClone;
}
