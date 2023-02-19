//only export functions that no dependencies here
export const noop = (): void => {};

/**************************************************************************************
 * Misc
 **************************************************************************************/
/**
 * Will create a blob and manufacture a click event to force a download for streamed data
 * @param {object} response
 * @param {string} type the header string required to download the file
 * @param {string} filename the filename specified usually in the header
 */
export function downloadFile(response: Record<any, any>, type: string, filename: string): void {
	const data = response.data;
	if (data && (data.size || data.length) > 0) {
		const blob = new Blob([data], {
			type: type ? type : response.headers['content-type'],
		});
		//@ts-ignore
		const URL = window.URL || window.webkitURL;
		const downloadUrl = URL.createObjectURL(blob);
		const downloadLink = document.createElement('a');
		downloadLink.target = '_blank';
		const downloadFileName = filename ? filename : response.headers['content-disposition'].split('=')[1];
		downloadLink.download = downloadFileName.replace(/["\s]?/g, '');
		downloadLink.href = downloadUrl;
		downloadLink.click();
	}
}

export function getParametizedUrl(url: string, paramsObj: Record<string, any>): string {
	let firstParam = true;
	Object.keys(paramsObj).forEach((key: string) => {
		url += (firstParam ? '?' : '&') + key + '=' + paramsObj[key];
		firstParam = false;
	});
	return url;
}

export function deepCopy(input: Record<string, any>): Record<string, any> {
	if (typeof input !== 'object' || input == null) return input;

	function getNextValue(nextTarget: any, nq: Array<[any, any]>, seen: Map<any, any>) {
		const nextType = typeof nextTarget;
		if (nextType !== 'object' || nextTarget == null) {
			if (nextType === 'number' && isNaN(nextTarget)) {
				console.log({ nextTarget, nextType });
				return null;
			}
			if (nextType === 'bigint') {
				return nextTarget.toString();
			}
			return nextTarget;
		}
		if (seen.has(nextTarget)) {
			return seen.get(nextTarget);
		}
		const nextObject = Array.isArray(nextTarget) ? [] : {};
		seen.set(nextTarget, nextObject);
		nq.push([nextObject, nextTarget]);
		return nextObject;
	}

	const output = Array.isArray(input) ? [] : {};
	const seen = new Map();
	seen.set(input, output);

	let q = [[output, input]];
	while (q.length) {
		const nq = [];
		for (const [destination, source] of q) {
			if (Array.isArray(source)) {
				for (const nextTarget of source) {
					const nextValue = getNextValue(nextTarget, nq, seen);
					destination.push(nextValue);
				}
				continue;
			}
			for (const prop in source) {
				const nextTarget = source[prop];
				const nextValue = getNextValue(nextTarget, nq, seen);
				destination[prop] = nextValue;
			}
		}
		q = nq;
	}
	return output;
}

/**
 * Given an options object vs a default object, it will return a new object with default options applied if missing
 */
export function prefillDefaultOptions(options: Record<string, any>, defaultOptions: Record<string, any>): Record<string, any> {
	if (options == null) {
		return deepCopy(defaultOptions);
	}
	const output = deepCopy(options);
	for (let prop in defaultOptions) {
		if (output[prop] === undefined) {
			output[prop] = deepCopy(defaultOptions[prop]);
		}
	}
	return output;
}

export function getStringByteCount(input: string) {
	return encodeURI(input).split(/%..|./).length - 1;
}

interface PromiseOptions {
	retryLimit?: number;
	retryInterval?: number;
	onSuccess?: (result?: any) => void;
	onFailure?: (e: any) => void;
}

export async function retryPromise(
	promiseFunc: (...args: any[]) => Promise<any>,
	args: any[],
	promiseOptions: PromiseOptions
): Promise<any> {
	const options = {
		retryLimit: promiseOptions.retryLimit ?? 0,
		retryInterval: promiseOptions.retryInterval ?? 0,
		onSuccess: promiseOptions.onSuccess ?? noop,
		onFailure: promiseOptions.onFailure ?? noop,
	};
	return new Promise(async (resolve, reject) => {
		let success = false;
		let retVal = null;
		for (let i = -1; i < options.retryLimit || options.retryLimit === 0; ++i) {
			try {
				retVal = await promiseFunc(...args);
				success = true;
				break;
			} catch (e) {
				retVal = e;
				if (options.retryInterval > 0) await new Promise((r) => setTimeout(r, options.retryInterval));
			}
		}

		if (success) {
			resolve(retVal);
			options.onSuccess(retVal);
		} else {
			reject(retVal);
			options.onFailure(retVal);
		}
	});
}
