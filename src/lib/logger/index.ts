import util from 'util';
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;
import fileHelper, { WriteFileOptionsType } from '../file';
import * as dateUtils from '../date';

export const logSignature = 'LogService=>';

export interface LoggableType {
	logSignature: string;
	funcSignature: string;
	shouldNotLogToTextFile?: boolean;
}

interface WriteInternalLogOptionsType {
	path?: string;
	addFolder?: string;
}
interface ReportingVoiceValue {
	default: boolean;
	[funcSignature: string]: boolean;
}

interface ReportVoiceMap {
	[logSignature: string]: ReportingVoiceValue;
}

interface ConfigurableLogServiceOptions {
	errorPath?: string;
	loggingPath?: string;
	defaultReportVoice?: boolean;
	reportVoice?: ReportVoiceMap;
	prettyFormat?: boolean;
	enableAutomaticLogToText?: boolean;
}

export class LogService {
	logSignature: string = logSignature;
	errorPath: string = '_logging';
	loggingPath: string = '_logging';
	defaultReportVoice: boolean = true;
	reportVoice: ReportVoiceMap = {
		[logSignature]: { default: false },
	};
	prettyFormat: boolean = false;
	enableAutomaticLogToText: boolean = false;

	configure = (options: ConfigurableLogServiceOptions = {}) => {
		if (options.errorPath !== undefined) {
			this.errorPath = options.errorPath;
		}
		if (options.loggingPath !== undefined) {
			this.loggingPath = options.loggingPath;
		}
		if (options.reportVoice !== undefined) {
			for (let signature in options.reportVoice) {
				this.reportVoice[signature] = options.reportVoice[signature];
			}
		}
		if (options.defaultReportVoice !== undefined) {
			this.defaultReportVoice = options.defaultReportVoice;
		}
		if (options.prettyFormat !== undefined) {
			this.prettyFormat = options.prettyFormat;
		}
		if (options.enableAutomaticLogToText !== undefined) {
			this.enableAutomaticLogToText = options.enableAutomaticLogToText;
		}
	};

	setReportingVoice = (key: string, value: any) => {
		this.reportVoice[key] = value;
	};

	logban = (src: LoggableType, ...args: any[]) => {
		try {
			this.report({ logSignature: this.logSignature, funcSignature: src.funcSignature }, { func: `LogService=>logban::` });
			this.writeInternalLog(`logban`, { data: args });
		} catch (error) {
			this.outputMethod(error);
		}
	};

	writelog = (src: LoggableType, ...args: any[]) => {
		try {
			this.report({ logSignature: this.logSignature, funcSignature: src.funcSignature }, { func: `LogService=>writelog::` });
			this.writeInternalLog(`logservice`, { logSignature: src.logSignature, data: args });
		} catch (error) {
			this.outputMethod(error);
		}
	};

	error = (src: LoggableType, error: any, ...args: any[]) => {
		try {
			this.report(src, { funcSignature: 'error' }, { func: `LogService=>error::` });
			this.writeInternalLog(
				`errors`,
				{ logSignature: src.logSignature, errorMsg: error.toString(), data: args, error },
				{
					path: `${this.errorPath}/logger/${dateUtils.getAusTimestamp(Date.now(), 'YYYY-MM-DD')}`,
				}
			);
		} catch (error) {
			// this.outputMethod(error);
		}
	};

	report = (target: LoggableType, ...args: any[]) => {
		if (this.allowedToLog(target)) {
			const funcSignature = target.funcSignature ? target.funcSignature + '::' : '';
			const logSignature = dateUtils.getAusTimestamp(Date.now()) + '|' + target.logSignature + funcSignature;
			this.outputMethod(logSignature, ...args);
			if (!this.enableAutomaticLogToText || target.shouldNotLogToTextFile === false) return;
			if (args[0] != null && typeof args[0] === 'string') {
				this.recordAsText(logSignature + args[0]);
			}
		}
	};

	/**
	 *
	 * @param filepath string path that does not include the extension (.json) as this is for recording json files
	 * @param data
	 * @param writeOptions
	 */
	record = (filepath: string, data: any, writeOptions: WriteFileOptionsType = {}) => {
		fileHelper.writeContinuousJson(`${filepath}.json`, data, writeOptions);
	};

	recordAsText = (msg: string) => {
		fileHelper.writeToFile(`${this.loggingPath}/logger.txt`, msg, {
			append: true,
			overwrite: false,
			jsonParse: false,
			sizeLimit: 50,
			nextFilePaddedZeroes: 3,
		});
	};

	/******************************************************************************************
	 * Private Methods
	 *****************************************************************************************/
	private outputMethod = (...args: any[]) => {
		console.log(...args);
	};

	private allowedToLog = (target: LoggableType) => {
		const { logSignature, funcSignature } = target;
		if (logSignature == null) {
			console.log('allowedToLog:: check -> target.logSignature: ');
			console.trace('logSignature was null or undefined | ' + logSignature);
			return false;
		}
		this.reportVoice[logSignature] = this.reportVoice[logSignature] || { default: this.defaultReportVoice };
		const voice = this.reportVoice[logSignature];
		if (funcSignature !== undefined && voice[funcSignature] !== undefined) {
			return voice[funcSignature];
		}
		return voice.default;
	};

	private writeInternalLog = (
		filename: string,
		data: any,
		options: WriteInternalLogOptionsType = {},
		writeOptions: WriteFileOptionsType = {}
	) => {
		try {
			let folderPath;
			if (options.path === undefined) {
				const folder = dateUtils.getAusTimestamp(Date.now(), 'YYYY-MM-DD');
				folderPath = `${this.loggingPath}/${folder}`;
				if (options.addFolder != null) {
					folderPath += '/' + options.addFolder;
				}
			} else {
				folderPath = options.path;
			}
			const obj = { timestamp: dateUtils.getAusTimestamp(Date.now()), data };
			fileHelper.assertDirExists(folderPath);
			fileHelper.writeContinuousJson(`${folderPath}/${filename}.json`, obj, {
				prettyFormat: this.prettyFormat,
				...writeOptions,
			});
		} catch (error) {
			this.outputMethod(error);
		}
	};
}
const logger = new LogService();
export default logger;
