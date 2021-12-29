import { FileHelper, SafeReadFilePromiseType, WriteFileOptionsType } from './lib/file';
const fileHelper: FileHelper = require('./lib/file').default;

const rl = require('readline');
const readline = rl.createInterface({ input: process.stdin, output: process.stdout });

import { eventcontrol } from 'eventcontrol';

const globalContext = {
	eventcontrol,
	fileHelper,
};

/***************************************************************
 * Command Class to hold all refs required or redirect requests
 ***************************************************************/
let _evalFunction = null,
	_evalContext = null;

export function useSmartEvaluator(handler: (input: string) => Promise<void> = inputHandler) {
	_evalFunction = evaluator;
	_evalContext = commander;
	readline.on('line', handler);
}

export async function hotreloadFile(filepath: string): Promise<SafeReadFilePromiseType> {
	return await fileHelper.safeReadFileSync('evalCode/code.js', { jsonParse: false });
}

let inputHandler = async (input: string) => {
	try {
		if (input === '') {
			console.log('hot reloading default file');
			const { data, success } = await fileHelper.safeReadFileSync('/evalCode/code.js', {
				jsonParse: false,
			});
			if (success) {
				await _evalFunction.call(_evalContext, data.toString());
			}
		} else {
			await _evalFunction.call(_evalContext, input);
		}
	} catch (error) {
		console.log(error);
	}
	readline.prompt();
};

async function evaluator(input: string) {
	eval(input);
}

class Commander {
	constructor() {}
}
export const commander = new Commander();
export default commander;

/*************************************************************
 * Command intercept
 *************************************************************/
export async function commandInterceptor(input: string) {
	if (input === 'start') {
		console.log('do something cool here');
	} else {
		await inputHandler(input);
	}
}
