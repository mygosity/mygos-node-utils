import fileHelper, { defaultWriteFileOptions } from './lib/file';
import fileManager from './lib/file/manager';
import { paths } from './settings';
import logger from './lib/logger';
import { startReadingPrompt } from './commands';

logger.configure({
	prettyFormat: true,
	errorPath: paths.error,
	loggingPath: paths.logging,
	reportVoice: {
		[fileHelper.logSignature]: {
			default: true,
			readFileSync: false,
			_appendToJsonFile: false,
			_writeJsonFile: false,
			splitFolderAndFile: false,
			appendToFile: false,
			_promisedAppendToFile: false,
			writeContinuousJson: false,
		},
		[fileManager.logSignature]: { default: false },
	},
	enableAutomaticLogToText: true,
});

fileHelper.setBasePath(paths.root);
defaultWriteFileOptions.prettyFormat = true;

function Main() {
	const logObj = { logSignature: 'ENTRY=>', funcSignature: 'Main' };
	logger.report(logObj, `**************************************************************************************`);
	logger.report(logObj, `starting application`);
	startReadingPrompt();
}
Main();
