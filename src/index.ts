/**
 * THIS IS A DUMMY FILE TO SHOW HOW TO USE THE UTILITIES
 * REPLACE AND DO WHAT YOU WANT WITH IT
 */
export const paths = {
	root: require('path').resolve(__dirname, '../'),
	logging: 'logging/',
	error: 'errorlogs/',
};

import fileHelper, { defaultWriteFileOptions } from './lib/file';
import fileManager from './lib/file/manager';
import logger from './lib/logger';
logger.configure({
	prettyFormat: true,
	errorPath: paths.error,
	loggingPath: paths.logging,
	reportVoice: {
		[fileHelper.logSignature]: { default: true },
		[fileManager.logSignature]: { default: true },
	},
});
fileHelper.setBasePath(paths.root);
defaultWriteFileOptions.prettyFormat = true;
import * as commands from './commands';

function Main() {
	logger.log('Main:: starting application');
	commands.useSmartEvaluator(commands.commandInterceptor);
}
Main();
