import * as validator from '../validation';
import logger from '../../logger';
import { Dictionary } from '../../typedefinitions';

export const emptyFunctionCall = (): void => {};

export async function promiseAllObject(
	object: Dictionary<Promise<any>>,
	transformFunction: Function = null,
): Promise<any> {
	for (let key in object) {
		object[key] = transformFunction === null ? await object[key] : transformFunction(await object[key]);
	}
	return object;
}

export function mergeArrayElements(arr1: any[], arr2: any[]): any[] {
	if (arr1.length !== arr2.length) {
		logger.report({ logSignature: 'Utils=>' }, 'mergeArrayElements:: arrays must be same length');
		return;
	}
	const result = [];
	for (let i = 0; i < arr1.length; ++i) {
		result[i] = {
			...arr1[i],
			...arr2[i],
		};
	}
	return result;
}

/**
 * Get the difference between the target and a master list.
 * The return value will be a composition of all values from the target that are not
 * contained in the master list
 * @param {array} arr the source array or list to compare against
 * @param {any} the target as a single element or an array
 * @return {array} the difference
 */
export function arrayDifference(arr: any[], target: any): any[] {
	let comparingArray = Array.isArray(target) ? [...target] : [target];
	for (let i = arr.length - 1; i >= 0; --i) {
		const answer1 = arr[i];
		for (let j = comparingArray.length - 1; j >= 0; --j) {
			const answer2 = comparingArray[j];
			if (answer1 === answer2) {
				comparingArray.splice(j, 1);
				break;
			}
		}
	}
	return comparingArray;
}

/**
 * Get the index at which a condition is met within an array
 * @param {array} arr target array
 * @param {function} condition with which the function returns true to return the index
 * @return {number} index of the first occurrence of the condition
 */
export function arrayIndexOf(arr: any[], condition: Function): number {
	for (let i = 0; i < arr.length; ++i) {
		if (condition(arr[i], i)) {
			return i;
		}
	}
	return -1;
}

export function swapArrayElement(list: any[], fromIndex: number, toIndex: number): void {
	const target = list[fromIndex];
	list[fromIndex] = list[toIndex];
	list[toIndex] = target;
}

export function swapElementToIndex(list: any[], matchCondition: Function, targetIndex: number): any[] {
	const newList = [...list];
	let foundIndex = -1;
	for (let i = 0; i < list.length; ++i) {
		if (matchCondition(list[i], i)) {
			if (targetIndex === i) {
				return newList;
			} else {
				foundIndex = i;
				break;
			}
		}
	}
	if (foundIndex !== -1) {
		swapArrayElement(newList, foundIndex, targetIndex);
	}
	return newList;
}

export function recursiveToString(target: any): any {
	let answer: any = `${target}`;
	if (validator.isObject(target)) {
		answer = {};
		for (let i in target) {
			answer[i] = recursiveToString(target[i]);
		}
	} else if (Array.isArray(target)) {
		answer = [];
		for (let i = 0; i < target.length; ++i) {
			answer[i] = recursiveToString(target[i]);
		}
	}
	return answer;
}

export function deepCloneObject(target: any, dupeChecker: any[] = [], skipCircularRef: boolean): any {
	let clone = Array.isArray(target) ? [] : {};
	if (!dupeChecker.includes(target)) {
		dupeChecker.push(target);
	}
	for (let type in target) {
		if (typeof target[type] !== 'object') {
			clone[type] = target[type];
		} else {
			if (!validator.isClonedIn(target[type], dupeChecker)) {
				dupeChecker.push(target[type]);
				const copy = deepCloneObject(target[type], dupeChecker, skipCircularRef);
				if (copy !== undefined) {
					clone[type] = copy;
				}
			} else {
				clone[type] = !skipCircularRef ? target[type] : type;
			}
		}
	}
	return clone;
}
