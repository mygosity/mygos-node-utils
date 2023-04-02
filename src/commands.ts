import { paths } from './settings';

import { fileHelper, SafeReadFilePromiseType } from './lib/file';
import { fileManager } from './lib/file/manager';
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

const rl = require('readline');
const readline = rl.createInterface({
	input: process.stdin,
	output: process.stdout,
});

export const eventcontrol = new EventManager();

//@ts-ignore
export const env: EnvInterface = {};
export const reloadConfig = async () => {
	const LOCAL_ENV_PATH = paths.root + '/env/localenv.json';
	const logObj = {
		logSignature: 'commands.ts=>',
		funcSignature: 'reloadConfig',
	};
	const envPromise: SafeReadFilePromiseType = await fileHelper.safeReadFileSync(LOCAL_ENV_PATH, {
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
 * Handle inputs from the command line prompt
 ***************************************************************/
export function startReadingPrompt() {
	async function hotReloadFile(filepath: string): Promise<SafeReadFilePromiseType> {
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

	readline.on('line', async (input: string) => {
		try {
			if (input === '') {
				console.log('hot reloading default file');
				const { data, success } = await hotReloadFile('evalCode/code.js');
				if (success) {
					eval(data.toString());
				}
				return;
			}
			if (input.substring(0, 2) === 'gs') {
				return;
			}
			eval(input);
		} catch (e) {
			console.log(e);
		}
		readline.prompt();
	});
}
