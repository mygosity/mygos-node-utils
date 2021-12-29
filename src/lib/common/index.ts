import * as babel from '@babel/core';
import * as formatters from './formatting';
import * as validator from './validation';
import * as maths from './maths';
import * as inputhandlers from './inputhandlers';
import * as objectarrayutils from './objectarray';
import logger from '../logger';
import { Dictionary } from '../typedefinitions';

/**
 * Auto mutates options and copies any properties from a default options structure
 * Take care not to mutate the returned default here else all defaults will be affected
 * Note: extra properties in the specific object will be retained
  - only default properties are compared for existence and then copied to prevent undefined entries
* @param {object} options custom options
* @param {object} defaultOptions the default options to always have
*/
export function prefillDefaultOptions(
	options: Dictionary<any>,
	defaultOptions: Dictionary<any>,
): Dictionary<any> {
	if (options == null) {
		//take care not to mutate the returned default here else all defaults will be affected
		return defaultOptions;
	} else {
		function copyUndefinedPropsOnly(
			source: Dictionary<any>,
			destination: Dictionary<any> = {},
		): Dictionary<any> {
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
 * Will create a blob and manufacture a click event to force a download for streamed data
 * @param {object} response
 * @param {string} type the header string required to download the file
 * @param {string} filename the filename specified usually in the header
 */
export function downloadFile(response: Dictionary<any>, type: string, filename: string): void {
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

export default {
	prefillDefaultOptions,
	stopTimer,
	downloadFile,
	getStringByteCount,
	getHumanReadableTime,
	...objectarrayutils,
	...inputhandlers,
	...maths,
	...formatters,
	...validator,
};
