import * as babel from '@babel/core';
import * as formatters from './formatting';
import * as validator from './validation';
import * as maths from './maths';
import * as inputhandlers from './inputhandlers';
import logger from '../logger';

/**
 * Will create a blob and manufacture a click event to force a download for streamed data
 * @param {object} response
 * @param {string} type the header string required to download the file
 * @param {string} filename the filename specified usually in the header
 */
export function downloadFile(
	response: { [key: string]: any },
	type: string,
	filename: string,
): void {
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
		logger.error({ logSignature: 'commonutils=>', funcSignature: 'downloadFile' }, e);
	}
}

export function getObjectParamsFromUrl(
	url: string,
	autoConvertNumbers: boolean = false,
): { [key: string]: string | number } {
	const paramsObj = {};

	const stringParams = url.substring(url.indexOf('?') + 1).split('&');
	for (const section of stringParams) {
		const [key, value] = section.split('=');
		paramsObj[key] =
			autoConvertNumbers && validator.isNumberByRegexp(value) ? parseFloat(value) : value;
	}
	return paramsObj;
}

export function getParametizedUrl(url: string, paramsObj: { [key: string]: any }): string {
	let firstParam = true;
	Object.keys(paramsObj).forEach((key: string) => {
		url += (firstParam ? '?' : '&') + key + '=' + paramsObj[key];
		firstParam = false;
	});
	return url;
}

export function getStringByteCount(input: string) {
	return encodeURI(input).split(/%..|./).length - 1;
}

export async function getTranspiledData(
	data: string,
	options: babel.TransformOptions = {},
): Promise<string> {
	return new Promise((resolve, reject) => {
		babel.transform(
			data,
			{
				filename: '*.tsx',
				plugins: [
					'@babel/plugin-transform-react-jsx',
					'@babel/plugin-proposal-class-properties',
				],
				presets: ['@babel/preset-typescript'],
				overrides: [
					{
						sourceType: 'script', //prevents this from being transpiled to void 0 or undefined
					},
				],
				comments: false,
				...options,
			},
			function (error: Error, result: babel.BabelFileResult) {
				if (error) {
					console.log(error);
					return reject(error);
				}
				resolve(result.code);
			},
		);
	});
}

export const noop = (): void => {};

/**
 * Auto mutates options and copies any properties from a default options structure
 * Take care not to mutate the returned default here else all defaults will be affected
 * Note: extra properties in the specific object will be retained
  - only default properties are compared for existence and then copied to prevent undefined entries
* @param {object} options custom options
* @param {object} defaultOptions the default options to always have
*/
export function prefillDefaultOptions(
	options: { [key: string]: any },
	defaultOptions: { [key: string]: any },
): { [key: string]: any } {
	if (options == null) {
		//take care not to mutate the returned default here else all defaults will be affected
		return defaultOptions;
	} else {
		function copyUndefinedPropsOnly(
			source: { [key: string]: any },
			destination: { [key: string]: any } = {},
		): { [key: string]: any } {
			for (let prop in source) {
				if (destination[prop] === undefined) {
					destination[prop] = source[prop];
				} else {
					if (validator.isObject(source[prop])) {
						destination[prop] = copyUndefinedPropsOnly(source[prop], destination[prop]);
					}
				}
			}
			return destination;
		}
		options = copyUndefinedPropsOnly(defaultOptions, options);
	}
	return options;
}

export default {
	downloadFile,
	getObjectParamsFromUrl,
	getParametizedUrl,
	getStringByteCount,
	getTranspiledData,
	noop,
	prefillDefaultOptions,
	...inputhandlers,
	...maths,
	...formatters,
	...validator,
};
