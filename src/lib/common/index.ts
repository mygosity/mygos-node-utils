import * as babel from '@babel/core';
import * as inputhandlers from './inputhandlers';
import * as formattingUtils from './pure/formatting';
import * as mathUtils from './pure/maths';
import * as miscUtils from './pure/misc';
import * as validationUtils from './pure/validation';

export async function getTranspiledData(data: string, options: { [key: string]: any } = {}): Promise<string> {
	return new Promise((resolve, reject) => {
		babel.transform(
			data,
			{
				filename: '*.tsx',
				plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-proposal-class-properties'],
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
			}
		);
	});
}

export default {
	getTranspiledData,
	formattingUtils,
	mathUtils,
	miscUtils,
	validationUtils,
	...inputhandlers,
};
