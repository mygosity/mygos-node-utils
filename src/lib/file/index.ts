import logger, { LoggableType } from '../logger';
import fileManager from '../file/manager';
import fs, { Stats } from 'fs';
import mkdirp from 'mkdirp';
import { prettyJson, safeJsonParse, safeJsonStringify, splitInReverseByCondition, tryParseFloat } from '../common/inputhandlers';
import { prefillDefaultOptions } from '../common/pure/misc';
import { getHumanReadableTime, getPaddedZeroes } from '../common/pure/formatting';

export interface ReadFileOptionsType {
	relativePath?: boolean;
	jsonParse?: boolean;
	onError?: Function;
}

export interface SafeReadFilePromiseType {
	data: any;
	success: boolean;
	error?: any;
}

export interface WriteFileOptionsType extends ReadFileOptionsType {
	append?: boolean;
	overwrite?: boolean;
	nextFileName?: boolean;
	nextFilePaddedZeroes?: number;
	autoCreatePath?: boolean;
	jsonStringify?: boolean;
	jsonWrapper?: string;
	prepend?: string;
	sizeLimit?: number;
	checkFileSize?: boolean;
	prettyFormat?: boolean;
}

let basepath: string = __dirname;

function WriteFileOptions() {
	this.relativePath = true;
	this.append = true;
	this.overwrite = false;
	this.nextFileName = false;
	this.nextFilePaddedZeroes = 3;
	this.autoCreatePath = true;
	this.jsonParse = true;
	this.jsonStringify = true;
	this.jsonWrapper = '[';
	this.prepend = undefined;
	this.sizeLimit = 5; //megabytes
	this.checkFileSize = true;
	this.prettyFormat = false;
}
export const defaultWriteFileOptions: WriteFileOptionsType = new WriteFileOptions();
export const overwriteFileOptions = { append: false, overwrite: true };
export const appendFileOptions = { append: true, overwrite: false };

function ReadFileOptions() {
	this.relativePath = true;
	this.jsonParse = true;
}

const defaultReadFileOptions = new ReadFileOptions();
const logSignature = 'fileHelper=>';

export class FileHelper {
	logSignature: string;

	constructor() {
		this.logSignature = logSignature;
	}

	setBasePath = (path: string): void => {
		basepath = path + (path[path.length - 1] !== '/' ? '/' : '');
	};

	findLatestFile = (baseDir: string, filename: string): string => {
		//index all files recursively from the dir
		const [base, ext] = splitInReverseByCondition(filename, (i) => i === '.');
		const files = fs.readdirSync(baseDir);
		const fileCollection = [];
		const directories = [];
		const _latestFileSearcher = (base: string, baseDir: string, directories: any[], fileCollection: any[]) => {
			return (currentFileName: string) => {
				const stats = fs.statSync(baseDir + currentFileName);
				if (stats.isDirectory()) {
					directories.push({ path: baseDir + currentFileName, stats });
					directories.sort((a, b) => {
						return b.stats.mtime - a.stats.mtime;
					});
				} else {
					if (currentFileName.indexOf(base) !== -1) {
						fileCollection.push({
							path: baseDir + currentFileName,
							stats,
						});
						fileCollection.sort((a, b) => {
							return b.stats.mtime - a.stats.mtime;
						});
					}
				}
			};
		};
		files.map(_latestFileSearcher(base, baseDir, directories, fileCollection));
		while (directories.length) {
			const currentDir = directories.pop();
			const files = fs.readdirSync(currentDir.path);
			files.map(_latestFileSearcher(base, currentDir.path + '/', directories, fileCollection));
		}
		return fileCollection.length ? fileCollection[0].path : null;
	};

	getFilesAndDirectories(
		baseDir: string,
		filePredicate: (filename: string, stats: fs.Stats, path: string) => boolean = () => true,
		dirPredicate: (filename: string, stats: fs.Stats, path: string) => boolean = () => true
	): {
		files: { path: string; stats: Stats; name: string }[];
		directories: { path: string; stats: Stats; name: string }[];
	} {
		const fileCollection = [];
		const directories = [{ path: baseDir, stats: fs.statSync(baseDir), name: baseDir }];
		function filterFoldersAndFiles(targetPath) {
			const files = fs.readdirSync(targetPath);
			for (let i = 0; i < files.length; ++i) {
				const currentFileName = files[i];
				const stats = fs.statSync(targetPath + currentFileName);
				if (stats.isDirectory()) {
					if (dirPredicate(currentFileName, stats, targetPath + currentFileName + '/')) {
						directories.push({
							path: targetPath + currentFileName + '/',
							stats,
							name: currentFileName,
						});
					}
				} else {
					if (filePredicate(currentFileName, stats, targetPath + currentFileName)) {
						fileCollection.push({
							path: targetPath + currentFileName,
							stats,
							name: currentFileName,
						});
					}
				}
			}
		}
		for (let i = 0; i < directories.length; ++i) {
			const currentDirectory = directories[i];
			filterFoldersAndFiles(currentDirectory.path);
		}
		return {
			files: fileCollection,
			directories,
		};
	}

	getLatestFilePath = (filepath: string): string => {
		filepath = this.getResolvedPath(filepath);
		if (!fs.existsSync(filepath)) {
			return null;
		}
		const [dir, file] = this.splitFolderAndFile(filepath);
		const files = fs.readdirSync(dir);
		const fileMap = {};
		files.map((filename) => (fileMap[filename] = fs.statSync(dir + filename)));
		const { prevFileName, nextFileName } = _getNextFileName(file, fileMap, dir, {
			checkFileSize: false,
		});
		const latestFilepath = dir + prevFileName;
		logger.report(
			{ logSignature: this.logSignature, funcSignature: 'getLatestFilePath' },
			{ latestFilepath, prevFileName, nextFileName }
		);
		return latestFilepath;
	};

	getFileDirectoryStats = (filepath: string): any => {
		filepath = this.getResolvedPath(filepath);
		const [dir] = this.splitFolderAndFile(filepath);
		const files = fs.readdirSync(dir);
		const fileMap = {};
		files.map((filename) => (fileMap[filename] = fs.statSync(dir + filename)));
		return fileMap;
	};

	getResolvedPath = (relativePath: string): string => {
		if (relativePath.indexOf(basepath) === 0) return relativePath;
		return basepath + relativePath;
	};

	fileExists = (filepath: string, options: ReadFileOptionsType = {}): boolean => {
		const o = prefillDefaultOptions(options, defaultWriteFileOptions);
		if (o.relativePath) filepath = this.getResolvedPath(filepath);
		return fs.existsSync(filepath);
	};

	isFileStatModifiedSince = (
		fileStat: Stats,
		withinTimeMs: number,
		options: {
			relativePath?: boolean;
			shouldLog?: boolean;
			shouldLogOnFalseOnly?: boolean;
			shouldIncludeFileStats?: boolean;
		} = {}
	): boolean => {
		const timeSinceModifiedMs = Date.now() - fileStat.mtimeMs;
		const isFileModdedInTime = timeSinceModifiedMs <= withinTimeMs;
		if (options.shouldLog || (options.shouldLogOnFalseOnly && !isFileModdedInTime)) {
			console.log('isFileStatModifiedSince::', {
				inTime: isFileModdedInTime,
				modded: getHumanReadableTime(timeSinceModifiedMs) + ' ago',
				withinTime: getHumanReadableTime(withinTimeMs),
				...(options.shouldIncludeFileStats ? { stats: fileStat } : {}),
			});
		}
		return isFileModdedInTime;
	};

	isFileModifiedSince = (
		filepath: string,
		withinTimeMs: number,
		options: {
			relativePath?: boolean;
			shouldLog?: boolean;
			shouldLogOnFalseOnly?: boolean;
			shouldIncludeFileStats?: boolean;
		} = {}
	): boolean => {
		if (options.relativePath) filepath = this.getResolvedPath(filepath);
		return this.isFileStatModifiedSince(fs.statSync(filepath), withinTimeMs, options);
	};

	safeReadFileSync = (filepath: string, options: ReadFileOptionsType = {}): Promise<SafeReadFilePromiseType> => {
		return new Promise((resolve) => {
			try {
				const data = this.readFileSync(filepath, options);
				resolve({ data, success: true });
			} catch (error) {
				resolve({ success: false, error, data: null });
			}
		});
	};

	readFileSync = (filepath: string, options: ReadFileOptionsType = {}): any => {
		const logObj: LoggableType = { logSignature: this.logSignature, funcSignature: 'readFileSync', shouldNotLogToTextFile: false };
		const o = prefillDefaultOptions(options, defaultReadFileOptions);
		if (o.relativePath) filepath = this.getResolvedPath(filepath);
		logger.report(logObj, `readFileSync:: fileExists: ${this.fileExists(filepath, o)} filepath: ${filepath}`, o);
		if (o.jsonParse) return safeJsonParse(fs.readFileSync(filepath));
		return fs.readFileSync(filepath);
	};

	readFile = async (filepath: string, options: ReadFileOptionsType = {}): Promise<any> => {
		const logObj: LoggableType = { logSignature: this.logSignature, funcSignature: 'readFile', shouldNotLogToTextFile: false };
		const o = prefillDefaultOptions(options, defaultReadFileOptions);
		if (o.relativePath) filepath = this.getResolvedPath(filepath);
		logger.report(logObj, `readFile:: fileExists: ${this.fileExists(filepath, o)} filepath: ${filepath}`, o);

		return new Promise((resolve, reject) => {
			fs.readFile(filepath, function (error, data) {
				if (error) {
					logger.error(logObj, error, {
						src: 'FileHelper=>',
						filepath,
						options,
						data: data.toString(),
					});
					//might not need this option anymore as this function is now wrapped as a promise
					options.onError(error);
					reject(error);
				}
				resolve(o.jsonParse ? safeJsonParse(data) : data);
			});
		});
	};

	writeToFile = async (filepath: string, data: any, options: WriteFileOptionsType = {}): Promise<any> => {
		const logObj: LoggableType = { logSignature: this.logSignature, funcSignature: 'writeToFile', shouldNotLogToTextFile: false };
		const o = prefillDefaultOptions(options, defaultWriteFileOptions);
		if (!o.overwrite && o.append && this.fileExists(filepath, o)) {
			return this.appendToFile(filepath, data, o);
		}
		if (o.relativePath) filepath = this.getResolvedPath(filepath);
		if (o.autoCreatePath) {
			const [dir] = this.splitFolderAndFile(filepath);
			this.assertDirExists(dir);
		}
		return new Promise((resolve, reject) => {
			if (o.nextFileName && fs.existsSync(filepath)) {
				const [dir, file] = _autoParseNextFileName(filepath, o);
				logger.report(logObj, `writeToFile:: getting the next file name: ${file}`);
				_promisedWriteToFile(dir + file, data, o, resolve, reject);
			} else if (o.overwrite || (!o.overwrite && !fs.existsSync(filepath))) {
				logger.report(logObj, `writeToFile:: attempting to overwrite ${filepath}`);
				if (fileManager.tryLock(filepath)) {
					_promisedWriteToFile(filepath, data, o, resolve, reject);
				} else {
					fileManager.queue(filepath, data, [o, resolve, reject], _promisedWriteToFile, true);
				}
			} else {
				logger.report(logObj, `writeToFile:: safely aborted due to options set: ${filepath}`, options);
				resolve('writeToFile:: safely aborted due to options set filepath: ' + filepath);
			}
		});
	};

	//TODO:: add size limit check here too
	appendToFile = async (filepath: string, data: any, options: WriteFileOptionsType = {}): Promise<any> => {
		const logObj: LoggableType = { logSignature: this.logSignature, funcSignature: 'appendToFile', shouldNotLogToTextFile: false };
		const o = prefillDefaultOptions(options, defaultWriteFileOptions);
		if (!this.fileExists(filepath, o)) {
			this.writeToFile(filepath, data, o);
			return;
		}
		if (o.relativePath) filepath = this.getResolvedPath(filepath);
		if (o.prepend !== undefined) data = o.prepend + data;
		logger.report(logObj, 'appendToFile:: starting to append: ' + filepath);

		return new Promise((resolve, reject) => {
			if (fileManager.tryLock(filepath)) {
				return _promisedAppendToFile(filepath, data, o, resolve, reject);
			}
			fileManager.queue(filepath, data, [o, resolve, reject], _promisedAppendToFile, true);
		});
	};

	writeContinuousJson = async (filepath: string, data: any, options: WriteFileOptionsType): Promise<any> => {
		const logObj: LoggableType = {
			logSignature: this.logSignature,
			funcSignature: 'writeContinuousJson',
			shouldNotLogToTextFile: false,
		};
		const o = prefillDefaultOptions(options, defaultWriteFileOptions);
		filepath = this.getResolvedPath(filepath);
		logger.report(logObj, `writeContinuousJson:: start ${filepath}`);

		const jsondata = o.jsonStringify ? (o.prettyFormat ? prettyJson(data) : safeJsonStringify(data, filepath)) : data;

		if (o.autoCreatePath) {
			const [dir] = this.splitFolderAndFile(filepath);
			this.assertDirExists(dir);
		}

		return new Promise((resolve, reject) => {
			if (_isSizeExceeded(filepath, o)) {
				const [dir, file] = _autoParseNextFileName(filepath, o);
				filepath = dir + file;
				logger.report(logObj, `writeContinuousJson:: size limit exceeded, using new file name: ${filepath}`);
			}
			if (fileManager.tryLock(filepath)) {
				_writeJsonFile(filepath, jsondata, o, resolve, reject);
			} else {
				//put together the resolve, reject arrays so it will be batched together when resolved/rejected
				const argumentBatcher = (copiedArgs, newArgs) => {
					copiedArgs[1] = copiedArgs[1].concat(newArgs[1]);
					copiedArgs[2] = copiedArgs[2].concat(newArgs[2]);
				};
				fileManager.queue(filepath, jsondata, [o, [resolve], [reject]], _writeJsonFile, false, argumentBatcher);
			}
		});
	};

	/********************************************************************
	 * public functions for fileHelper
	 ********************************************************************/
	assertDirExists = (filepath: string): void => {
		if (!fs.existsSync(filepath)) {
			mkdirp.sync(filepath);
		}
	};

	splitFolderAndFile = (filepath: string): [string, string] => {
		if (filepath.length === 0) return ['', ''];
		const logObj: LoggableType = {
			logSignature: this.logSignature,
			funcSignature: 'splitFolderAndFile',
			shouldNotLogToTextFile: false,
		};
		logger.report(logObj, 'splitFolderAndFile::', filepath);
		let i = 0;
		for (i = filepath.length - 2; i >= 0; --i) {
			if (filepath[i] === '/' || filepath[i] === '\\') {
				break;
			}
		}
		i = Math.max(i, 0);
		return [filepath.substring(0, i + 1), filepath.substring(i + 1)];
	};
}
export const fileHelper = new FileHelper();
export default fileHelper;

/********************************************************************
 * private functions for fileHelper
 ********************************************************************/
const _batchHandlePromise = (cb: Function, ...args: any[]): void => {
	if (cb === undefined) {
		console.log('promise reply undefined!');
		return;
	}
	if (Array.isArray(cb)) {
		for (let i = 0; i < cb.length; ++i) {
			cb[i](...args);
		}
	} else {
		cb(...args);
	}
};

const _promisedWriteToFile = (filepath: string, data: any, o: WriteFileOptionsType, resolve: Function, reject: Function): void => {
	const logObj: LoggableType = { logSignature, funcSignature: '_promisedWriteToFile', shouldNotLogToTextFile: false };
	const writtenData = o.jsonStringify ? (o.prettyFormat ? prettyJson(data) : safeJsonStringify(data, filepath)) : data;
	fs.writeFile(filepath, writtenData, function (error) {
		fileManager.release(filepath);
		if (error) {
			logger.error(logObj, error, {
				src: 'FileHelper|nextFileName',
				funcName: 'writeToFile',
			});
			return reject(error);
		}
		const successMsg = 'writeToFile:: completed: ' + filepath;
		logger.report(logObj, successMsg);
		resolve(successMsg);
	});
};

const _promisedAppendToFile = (filepath: string, data: any, o: WriteFileOptionsType, resolve: Function, reject: Function): void => {
	const logObj: LoggableType = { logSignature, funcSignature: '_promisedAppendToFile', shouldNotLogToTextFile: false };
	const writtenData = o.jsonStringify ? (o.prettyFormat ? prettyJson(data) : safeJsonStringify(data, filepath)) : data;
	fs.appendFile(filepath, writtenData, function (error) {
		fileManager.release(filepath);
		if (error) {
			logger.error(logObj, error, {
				src: 'FileHelper',
				funcName: 'appendToFile',
			});
			return reject(error);
		}
		const successMsg = '_promisedAppendToFile:: completed: ' + filepath;
		logger.report(logObj, successMsg);
		resolve(successMsg);
	});
};

const _writeJsonFile = function (
	filepath: string,
	jsondata: string,
	options: WriteFileOptionsType,
	resolve: Function,
	reject: Function
): void {
	const logObj: LoggableType = { logSignature, funcSignature: '_writeJsonFile', shouldNotLogToTextFile: false };
	const _createJson = function () {
		fs.writeFile(filepath, options.jsonWrapper, function (error) {
			if (error) {
				logger.error(logObj, error, {
					src: 'FileHelper_Priv',
					funcName: '_writeJsonFile|_createJson|writeFile',
					filepath,
					jsondata,
					options,
				});
				fileManager.release(filepath);
				return _batchHandlePromise(reject, error);
			}
			logger.report(logObj, '_writeJsonFile:: created stub: ' + filepath);
			fs.appendFile(filepath, jsondata + _getOppositeBracket(options.jsonWrapper), function (error) {
				fileManager.release(filepath);
				if (error) {
					logger.error(logObj, error, {
						src: 'fileHelper',
						funcName: '_writeJsonFile|_createJson|appendFile',
						filepath,
						jsondata,
						options,
					});
					return _batchHandlePromise(reject, error);
				}
				logger.report(logObj, '_writeJsonFile:: appendToFile:: completed : ' + filepath);
				_batchHandlePromise(resolve, '_writeJsonFile:: appendToFile:: completed : ' + filepath);
			});
		});
	};
	//needs to confirm it actually succeeded, a fail callback should be provided
	const onFail = (error: any, size: any) => {
		if (error != undefined && size !== 0) {
			fileManager.release(filepath);
			logger.error(logObj, error, {
				src: 'FileHelper_Priv',
				funcName: 'onFail',
				size,
				filepath,
				options,
			});
			return;
		}
		_createJson();
	};
	if (!fs.existsSync(filepath) || fs.statSync(filepath).size === 0 || options.overwrite) {
		_createJson();
	} else {
		_appendToJsonFile(filepath, ',' + jsondata, onFail, resolve, reject);
	}
};

const _appendToJsonFile = function (filepath: string, data: any, onFail: Function, resolve: Function, reject: Function): void {
	const logObj: LoggableType = { logSignature, funcSignature: '_appendToJsonFile', shouldNotLogToTextFile: false };
	fs.stat(filepath, function (errorStat, stat) {
		if (errorStat) {
			logger.report(logObj, '_appendToJsonFile:: pre file stream:', { errorStat });
			if (errorStat) {
				logger.error(logObj, errorStat, {
					src: 'FileHelper_Priv',
					funcName: '_appendToJsonFile|stat',
					filepath,
					data,
					stat,
				});
			}
			onFail(errorStat, stat.size);
			return _batchHandlePromise(reject, { errorStat, stat });
		}

		const size = stat.size,
			endBytes = 16,
			fileDescriptor = fs.openSync(filepath, 'r+'),
			streamArgs = {
				start: size - endBytes >= 0 ? size - endBytes : 0,
				end: size,
			},
			stream = fs.createReadStream(filepath, streamArgs);
		logger.report(logObj, '_appendToJsonFile:: pre file stream:', { streamArgs });

		stream.on('error', function (streamError) {
			logger.report(logObj, '_appendToJsonFile:: error stream event:\n', {
				streamError,
				filepath,
				streamArgs,
				size,
			});
			logger.error(logObj, streamError, {
				src: 'FileHelper_Priv',
				funcName: '_appendToJsonFile|on("error"',
				filepath,
				data,
				stat,
				streamArgs,
				size,
			});
			onFail(streamError);
			_batchHandlePromise(reject, streamError);
		});

		stream.on('data', function (dataStream) {
			logger.report(logObj, '_appendToJsonFile:: stream.data:');
			const str = dataStream.toString();
			let byteCount = 1,
				dataEnd = '';
			for (let i = str.length - 1; i >= 0; --i, byteCount++) {
				const line = str[i];
				if (line === '}' || line === ']') {
					dataEnd = str.substring(i);
					const buffer = Buffer.from(data + dataEnd);
					fs.write(
						fileDescriptor,
						buffer,
						0,
						buffer.length,
						size - byteCount >= 0 ? size - byteCount : 0,
						function (filewriteError) {
							if (filewriteError) {
								logger.error(logObj, filewriteError, {
									src: 'FileHelper_Priv',
									funcName: '_appendToJsonFile|on("data")|write',
									filepath,
									data,
									stat,
									streamArgs,
									size,
									fileDescriptor,
									buffer,
								});
								onFail(filewriteError);
								return _batchHandlePromise(reject, filewriteError);
							}
							fs.close(fileDescriptor, function () {
								fileManager.release(filepath);
								logger.report(logObj, '_appendToJsonFile:: success: path:\n' + filepath);
								_batchHandlePromise(resolve, '_appendToJsonFile:: success: path:' + filepath);
							});
						}
					);
					stream.close();
					return;
				}
			}
		});
	});
};

function _getOppositeBracket(input: string): string | Error {
	switch (input) {
		case '[':
			return ']';
		case '{':
			return '}';
		default:
			return new Error('_getOppositeBracket:: does not recognize input: ' + input);
	}
}

function _isSizeExceeded(filepath: string, options: WriteFileOptionsType): boolean {
	if (!fileHelper.fileExists(filepath)) return false;
	if (options.sizeLimit > -1) {
		const stats = fs.statSync(filepath);
		const fileSizeInBytes = stats.size;
		const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
		return fileSizeInMegabytes > options.sizeLimit;
	}
	return false;
}

function _createNextFilename(options: WriteFileOptionsType, words: string, count: number, ext: string): string {
	return words + getPaddedZeroes(count, options.nextFilePaddedZeroes) + '.' + ext;
}

function _getNextFileName(
	file: string,
	fileMap: any,
	dir: string,
	options: WriteFileOptionsType
): { nextFileName: string; prevFileName: string } {
	const [base, ext] = splitInReverseByCondition(file, (i: string) => i === '.');
	const [words, numbers] = splitInReverseByCondition(base, (i: string) => isNaN(Number(i)), true);
	let count: number = tryParseFloat(numbers, 0);
	let nextFileName = _createNextFilename(options, words, count, ext);
	let prevFileName = nextFileName;
	const predicate = (nextFileName: string): boolean => {
		if (options.checkFileSize) {
			return fileMap[nextFileName] && _isSizeExceeded(dir + nextFileName, options);
		}
		return fileMap[nextFileName] !== undefined;
	};
	while (predicate(nextFileName)) {
		count++;
		prevFileName = nextFileName;
		nextFileName = _createNextFilename(options, words, count, ext);
	}
	return { nextFileName, prevFileName };
}

function _autoParseNextFileName(filepath: string, options: WriteFileOptionsType): string[] {
	const logObj: LoggableType = { logSignature, funcSignature: '_autoParseNextFileName', shouldNotLogToTextFile: false };
	const [dir, file] = options.relativePath
		? fileHelper.splitFolderAndFile(fileHelper.getResolvedPath(filepath))
		: fileHelper.splitFolderAndFile(filepath);
	logger.report(logObj, '_autoParseNextFileName:: dir, file: ', dir, file);
	const files = fs.readdirSync(dir);
	const fileMap = {};
	files.map((i) => (fileMap[i] = true));
	const { nextFileName } = _getNextFileName(file, fileMap, dir, options);
	logger.report(logObj, '_autoParseNextFileName::', dir + nextFileName);
	return [dir, nextFileName];
}

export const _testPath = function (path: string): void {
	const logObj: LoggableType = { logSignature, funcSignature: '_testPath', shouldNotLogToTextFile: false };
	logger.report(logObj, '_testPath: ' + fileHelper.getResolvedPath(path));
};
