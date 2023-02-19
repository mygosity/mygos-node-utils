import { paths } from './settings';

import { FileHelper, SafeReadFilePromiseType } from './lib/file';
import { FileManager } from './lib/file/manager';
import { EventManager } from './lib/eventmanager';
import { webClient } from './lib/network/client';
import * as utils from './lib/common';
import * as dateUtils from './lib/date';

import { EnvInterface } from './types/env';

import logger from './lib/logger';
import axios from 'axios';
import localServer from './lib/network/server';

export enum Events {
	WebsocketConnected,
}
const fileHelper: FileHelper = require('./lib/file').default;
const fileManager: FileManager = require('./lib/file/manager').default;

const rl = require('readline');
const readline = rl.createInterface({
	input: process.stdin,
	output: process.stdout,
});

export const eventcontrol = new EventManager();

//@ts-ignore
export const env: EnvInterface = {};
export const reloadConfig = async () => {
	const logObj = {
		logSignature: 'commands.ts=>',
		funcSignature: 'reloadConfig',
	};
	const envPromise: SafeReadFilePromiseType = await fileHelper.safeReadFileSync(paths.root + '/env/.env.json', {
		jsonParse: true,
		relativePath: false,
	});
	if (envPromise.success && envPromise.data != null) {
		for (const key in envPromise.data) {
			env[key] = envPromise.data[key];
		}
		logger.report(logObj, `success`);
		initializePostConfigLoad();
	} else {
		logger.report(logObj, `failed envPromise.error: ${envPromise.error?.toString?.() ?? ''}`);
	}
};
reloadConfig();

// put all init calls within this block that don't require hitting an API but just need to use the env.json
function initializePostConfigLoad() {
	localServer.startServing(57333);
}

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

export async function hotReloadFile(filepath: string): Promise<SafeReadFilePromiseType> {
	return await fileHelper.safeReadFileSync(filepath, { jsonParse: false });
}

const globalContext = {
	axios,
	eventcontrol,
	fileHelper,
	fileManager,
	webClient,
	paths,
	hotReloadFile,
	logger,
	utils,
	dateUtils,
	getEnv: () => env,
};

let inputHandler = async (input: string) => {
	try {
		if (input === '') {
			console.log('hot reloading default file');
			const { data, success } = await hotReloadFile('evalCode/code.js');
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
	try {
		if (input.substring(0, 2) === 'gs') {
		} //
		else {
			await inputHandler(input);
		}
	} catch (e) {
		console.log(e);
	}
}
