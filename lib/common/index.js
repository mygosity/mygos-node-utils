import logger from '../logger';

export const epsilon = 0.00001;

export const clamp = (target, options = {}) => {
  if (options.max !== undefined && target > options.max) {
    return options.max;
  }
  if (options.min !== undefined && target < options.min) {
    return options.min;
  }
  return target;
};

export const round = (input, decimals = 0) => {
  if (decimals === 0) {
    return Math.round(input);
  }
  return Math.round(input * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const autoWrap = (value, maxLen) => {
  return (maxLen + value) % maxLen;
};

export function isObjectEmpty(target) {
  return Object.entries(target).length === 0 && target.constructor === Object;
}

export async function promiseAllObject(object) {
  for (let key in object) {
    object[key] = await object[key];
  }
  return object;
}

export function mergeArrayElements(arr1, arr2) {
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
export function prefillDefaultOptions(options, defaultOptions) {
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
 * @param {function} timeoutCall the function reference to stop
 */
export function stopTimer(timeoutCall) {
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
export function arrayDifference(arr, target) {
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
export function arrayIndexOf(arr, condition) {
  for (let i = 0; i < arr.length; ++i) {
    if (condition(arr[i], i)) {
      return i;
    }
  }
  return -1;
}

export const swapArrayElement = (list, fromIndex, toIndex) => {
  const target = list[fromIndex];
  list[fromIndex] = list[toIndex];
  list[toIndex] = target;
};

export const swapElementToIndex = (list, matchCondition, targetIndex) => {
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
};

/**
 * Will create a blob and manufacture a click event to force a download for streamed data
 * @param {object} response
 * @param {string} type the header string required to download the file
 * @param {string} filename the filename specified usually in the header
 */
export function downloadFile(response, type, filename) {
  const data = response.data;
  try {
    if (data && (data.size || data.length) > 0) {
      const blob = new Blob([data], {
        type: type ? type : response.headers['content-type'],
      });
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
    //eslint-disable-next-line
    logger.log(e.message);
  }
}

export function isObject(target) {
  const type = typeof target;
  return type === 'object' && !Array.isArray(target);
}

export const recursiveToString = (target) => {
  let answer = `${target}`;
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
};

export function isObjectClonedShallow(target, source) {
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

export function isClonedIn(target, sources) {
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

export function deepCloneObject(target, dupeChecker = [], skipCircularRef) {
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
export const priceFormatter = (amount, numDecimals = 2) => {
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
};

export const optionalDecimalFormat = (value, maxOptionalDecimals = 2, roundingType = 'round') => {
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
    let relevantDecimals = adjustedValue / powerOfTen;
    if (relevantDecimals < 1) {
      relevantDecimals = relevantDecimals.toString().substring(1);
    }
    return formatted - decimals + relevantDecimals;
  }
  return formatted.toFixed ? formatted.toFixed(0) : formatted;
};

export const percentFormatter = (value) => `${Math.round(value * 100)}%`;

export const percentFormatterOptionalDecimal = (value, maxOptionalDecimals = 2) => {
  return optionalDecimalFormat(value * 100, maxOptionalDecimals) + '%';
};

export function addWhiteSpaces(string, digit) {
  const digitMatch = new RegExp('(\\d{' + digit + '})', 'g');
  return string.replace(digitMatch, '$1 ').replace(/(^\s+|\s+$)/, '');
}

export function addDash(string, digit) {
  const digitMatch = new RegExp('(\\d{' + digit + '})', 'g');
  return string.replace(digitMatch, '$1-').replace(/([-]+$)/, '');
}

export function normalizeNumber(number, numberLength) {
  if (!number) {
    return number;
  }
  const onlyNums = number.replace(/[^\d]/g, '');

  if (onlyNums.length <= numberLength) {
    return onlyNums;
  }
  return onlyNums.slice(0, numberLength);
}

export const emptyFunctionCall = () => {};

export const stringify = (o) => {
  let cache = [];
  JSON.stringify(o, function(key, value) {
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
};
