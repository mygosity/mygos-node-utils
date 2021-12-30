import logger from '../logger';

let filelocks: { [key: string]: any } = {};
let writequeue: { [key: string]: any } = {};

export class FileManager {
	logSignature: string;

	constructor() {
		this.logSignature = 'FileManager=>';
	}

	/**
	 * Queue data to a filepath registration so that it gets written when the lock is released
	 * Use the option writeImmediately to write the data without collating it with other data
	 * @param {string} filepath
	 * @param {any} data
	 * @param {array} arguments
	 * @param {function} writeCallback
	 * @param {boolean} writeImmediately use false to write a batch of data together (use only with the same callback/options)
	 * @param {object} argResolver an object that contains methods to handle the accumulation of arguments batched together
	 */
	queue = (
		filepath: string,
		data: any,
		args: any[],
		writeCallback: (filepath: string, copiedData: any, ...copiedArgs: any[]) => void,
		writeImmediately: boolean = true,
		argResolver: (currentArgs: any[], newlyAddedArgs: any[]) => void = undefined,
	) => {
		logger.report(this, 'queue::', filepath);
		if (writequeue[filepath] == null) {
			writequeue[filepath] = [];
		}
		writequeue[filepath].push({
			data,
			args: Array.isArray(args) ? args : [args],
			writeCallback,
			writeImmediately,
			argResolver,
		});
	};

	/**
	 * This batches data together and comma separates them and then
	 * encloses it with the callback issued for it
	 * @param {string} filepath
	 */
	releaseQueue(filepath: string) {
		let copiedData: string = '',
			writeCallback: (filepath: string, copiedData: any, ...copiedArgs: any[]) => void,
			copiedArgs: any[],
			allNull: boolean = true;

		const target = writequeue[filepath];

		for (let i = 0; i < target.length; ++i) {
			if (target[i] != null) {
				if (copiedData.length > 0 && target[i].writeImmediately) {
					//next file needs to be written alone because of the flag writeImmediately
					break;
				}
				allNull = false;
				if (writeCallback === undefined) {
					writeCallback = target[i].writeCallback;
				} else if (writeCallback !== target[i].writeCallback) {
					logger.report(
						this,
						'releaseQueue:: detected a different writeCallback:: this should not be batched',
					);
				}
				if (copiedArgs === undefined) {
					copiedArgs = target[i].args;
				}
				if (target[i].argResolver !== undefined) {
					target[i].argResolver(copiedArgs, target[i].args);
				}
				if (copiedData.length > 0) {
					copiedData += ',';
				}
				copiedData += target[i].data;
				target[i] = null;
			}
		}
		if (allNull) writequeue[filepath] = [];
		if (writeCallback) {
			logger.report(this, 'releaseQueue::writeCallback: filepath\n', { filepath });
			this.tryLock(filepath);
			if (copiedArgs === undefined) copiedArgs = [];
			writeCallback(filepath, copiedData, ...copiedArgs);
		}
	}

	locked = (filepath: string): boolean => {
		return filelocks[filepath] === true;
	};

	/**
	 * Used to lock a file if possible, if successful lock returns true,
	 * else the file is already locked and you should pursue a different path
	 * @param { string } filepath file path to check if locked
	 * @return { boolean } true if file was locked successfully, false if already locked
	 */
	tryLock = (filepath: string): boolean => {
		if (filelocks[filepath] === true) {
			logger.report(this, { reason: 'lock: file is already locked:' + filepath, filelocks });
			return false;
		}
		filelocks[filepath] = true;
		return true;
	};

	release = (filepath: string) => {
		filelocks[filepath] = false;
		logger.report(this, 'release:: released file lock path :', filepath);
		if (writequeue[filepath] !== undefined && writequeue[filepath].length) {
			this.releaseQueue(filepath);
		}
	};

	/**
	 * Debug functions listed below
	 */
	__logStatus = () => {
		console.log('logStatus:: filelocks');
		for (let i in filelocks) {
			console.log('filelocks:' + i, filelocks[i]);
		}
		for (let i in writequeue) {
			for (let j in writequeue[i]) {
				console.log('logStatus:: path: ', i, j, writequeue[i][j]);
			}
		}
	};

	__status = () => {
		this.__logStatus();
		logger.writelog(this, { src: this, filelocks, writequeue });
	};
}
const fileManager = new FileManager();
export default fileManager;
