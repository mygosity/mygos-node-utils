import prettier from 'prettier';
import * as dateUtils from '../date';
import logger from '../logger';
import { KeyValuePair } from '../typedefinitions';

export const epsilon: number = 0.00001;

export function tryParseNumber(input: string, defaultValue: any = null): any {
  if (invalidNumber(input)) {
    return defaultValue;
  }
  try {
    return input.indexOf('.') === -1 ? parseInt(input) : parseFloat(input);
  } catch (error) {
    return defaultValue;
  }
}

export function isNumber(input: string): boolean {
  return !isNaN(Number(input));
}

export function invalidNumber(data: any): boolean {
  if (data == null || Array.isArray(data)) {
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

export function prettyParse(data: any, parser: string): string {
  return prettier.format(data, { parser });
}

export function prettyJson(data: any, stringify: boolean = true): string {
  const pack = stringify ? safeJsonStringify({ ...data }) : { ...data };
  return prettier.format(pack, { parser: 'json' });
}

export function prettyWrapWithTimestamp(data: any, stringify: boolean = true): string {
  let pack: any = dateUtils.wrapWithAusTimeStamp({ ...data });
  if (stringify) {
    pack = safeJsonStringify(pack);
  }
  return prettier.format(pack, { parser: 'json' });
}

export function circularStringify(o: any): string {
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

export function splitInReverseByCondition(
  filepath: string,
  condition: Function,
  inclusive: boolean = false,
): string[] {
  let i: number;
  for (i = filepath.length - 1; i >= 0; --i) {
    if (condition(filepath[i])) {
      break;
    }
  }
  return [filepath.substring(0, inclusive ? i + 1 : i), filepath.substring(i + 1)];
}

export async function promiseAllObject(object: KeyValuePair<Promise<any>>): Promise<any> {
  for (let key in object) {
    object[key] = await object[key];
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
 * Auto mutates options and copies any properties from a default options structure
 * Take care not to mutate the returned default here else all defaults will be affected
 * Note: extra properties in the specific object will be retained
  - only default properties are compared for existence and then copied to prevent undefined entries
* @param {object} options custom options
* @param {object} defaultOptions the default options to always have
*/
export function prefillDefaultOptions(
  options: KeyValuePair<any>,
  defaultOptions: KeyValuePair<any>,
): KeyValuePair<any> {
  if (options === null || options === undefined) {
    //take care not to mutate the returned default here else all defaults will be affected
    return defaultOptions;
  } else {
    for (let prop in defaultOptions) {
      if (options[prop] === undefined) {
        options[prop] = defaultOptions[prop];
      }
    }
  }
  return options;
}

/**
 * Use this to stop a timer you've defined
 * I've found that .stop() is required, without it, setTimeout seems to keep calling
 * @param {NodeJS.Timeout} timeoutCall the function reference to stop
 */
export function stopTimer(timeoutCall: NodeJS.Timeout | any): void {
  if (timeoutCall) {
    if (timeoutCall.stop) {
      timeoutCall.stop();
    }
    clearTimeout(timeoutCall);
  }
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

export function swapElementToIndex(
  list: any[],
  matchCondition: Function,
  targetIndex: number,
): any[] {
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

/**
 * Will create a blob and manufacture a click event to force a download for streamed data
 * @param {object} response
 * @param {string} type the header string required to download the file
 * @param {string} filename the filename specified usually in the header
 */
export function downloadFile(response: KeyValuePair<any>, type: string, filename: string): void {
  const data = response.data;
  try {
    if (data && (data.size || data.length) > 0) {
      const blob = new Blob([data], {
        type: type ? type : response.headers['content-type'],
      });
      //@ts-ignore
      const URL = window.URL || window.webkitURL;
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.target = '_blank';
      const downloadFileName = filename
        ? filename
        : response.headers['content-disposition'].split('=')[1];
      downloadLink.download = downloadFileName.replace(/["\s]?/g, '');
      downloadLink.href = downloadUrl;
      downloadLink.click();
    }
  } catch (e) {
    logger.log(e.message);
  }
}

export function isObject(target: any): boolean {
  const type = typeof target;
  return type === 'object' && !Array.isArray(target);
}

export function recursiveToString(target: any): any {
  let answer: any = `${target}`;
  if (isObject(target)) {
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

export function deepCloneObject(
  target: any,
  dupeChecker: any[] = [],
  skipCircularRef: boolean,
): any {
  let clone = Array.isArray(target) ? [] : {};
  if (!dupeChecker.includes(target)) {
    dupeChecker.push(target);
  }
  for (let type in target) {
    if (typeof target[type] !== 'object') {
      clone[type] = target[type];
    } else {
      if (!isClonedIn(target[type], dupeChecker)) {
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

/**
 * @param {number} amount the amount in currency expected
 * @param {number} numDecimals the number of decimals expected
 * @return {string} value after formatting with appropriate values
 */
export function priceFormatter(amount: number, numDecimals: number = 2): string | number {
  if (!amount.toFixed || isNaN(amount) || numDecimals < 0) {
    logger.log('priceFormatter:: amount is invalid.');
    return amount;
  }
  if (amount < 0) return '-' + priceFormatter(-amount, numDecimals);
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

export function percentFormatterOptionalDecimal(
  value: number,
  maxOptionalDecimals: number = 2,
): string {
  return optionalDecimalFormat(value * 100, maxOptionalDecimals) + '%';
}

export function addWhiteSpaces(string, digit): string {
  const digitMatch = new RegExp('(\\d{' + digit + '})', 'g');
  return string.replace(digitMatch, '$1 ').replace(/(^\s+|\s+$)/, '');
}

export function addDash(string, digit): string {
  const digitMatch = new RegExp('(\\d{' + digit + '})', 'g');
  return string.replace(digitMatch, '$1-').replace(/([-]+$)/, '');
}

export function normalizeNumber(number, numberLength): string {
  if (!number) {
    return number;
  }
  const onlyNums = number.replace(/[^\d]/g, '');

  if (onlyNums.length <= numberLength) {
    return onlyNums;
  }
  return onlyNums.slice(0, numberLength);
}

export const emptyFunctionCall = (): void => {};
