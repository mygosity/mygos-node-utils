import logger from '../logger';
import { prefillDefaultOptions } from '../common';
import * as utils from '../common';
import fileManager from '../file/manager';
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

let BASEPATH = __dirname;

function WriteFileOptions() {
  this.relativePath = true;
  this.append = true;
  this.overwrite = false;
  this.nextFileName = false;
  this.autoCreatePath = true;
  this.jsonParse = false;
  this.jsonStringify = false;
  this.jsonWrapper = '[';
  this.prepend = undefined;
  this.sizeLimit = 5; //megabytes
  this.checkFileSize = true;
}
const defaultWriteFileOptions = new WriteFileOptions();

function ReadFileOptions() {
  this.relativePath = true;
  this.jsonParse = true;
}
const defaultReadFileOptions = new ReadFileOptions();
const logSignature = 'fileHelper=>';
class FileHelper {
  constructor() {
    this.logSignature = logSignature;
  }

  setBasePath = (path) => {
    BASEPATH = path;
  };

  findLatestFile = (baseDir, filename) => {
    //index all files recursively from the dir
    const [base, ext] = _splitInReverseByCondition(filename, (i) => i === '.');
    const files = fs.readdirSync(baseDir);
    const fileCollection = [];
    const directories = [];
    const _latestFileSearcher = (base, baseDir, directories, fileCollection) => {
      return (currentFileName) => {
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

  getLatestFilePath = (filepath) => {
    filepath = this.getResolvedPath(filepath);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const [dir, file] = splitFolderAndFile(filepath);
    const files = fs.readdirSync(dir);
    const fileMap = {};
    files.map((filename) => (fileMap[filename] = fs.statSync(dir + filename)));
    const { prevFileName, nextFileName } = _getNextFileName(file, fileMap, dir, {
      checkFileSize: false,
    });
    // console.log({ fileMap, nextFileName, prevFileName });
    const latestFilepath = dir + prevFileName;
    return latestFilepath;
  };

  getFileDirectoryStats = (filepath) => {
    filepath = this.getResolvedPath(filepath);
    const [dir] = splitFolderAndFile(filepath);
    const files = fs.readdirSync(dir);
    const fileMap = {};
    files.map((filename) => (fileMap[filename] = fs.statSync(dir + filename)));
    return fileMap;
  };

  getResolvedPath = (relativePath) => {
    return path.resolve(BASEPATH, relativePath);
  };

  assertDirExists = (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (o.relativePath) filepath = this.getResolvedPath(filepath);
    if (o.autoCreatePath && !fs.existsSync(filepath)) {
      mkdirp.sync(filepath);
    }
  };

  fileExists = (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (o.relativePath) filepath = this.getResolvedPath(filepath);
    return fs.existsSync(filepath);
  };

  readFileSync = (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultReadFileOptions);
    if (o.relativePath) filepath = this.getResolvedPath(filepath);
    logger.report(this, 'readFileSync:: fileExists: ' + this.fileExists(filepath, o), filepath, o);
    if (o.jsonParse) return utils.safeJsonParse(fs.readFileSync(filepath));
    return fs.readFileSync(filepath);
  };

  readFile = async (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultReadFileOptions);
    if (o.relativePath) filepath = this.getResolvedPath(filepath);
    logger.report(this, 'readFile:: fileExists: ' + this.fileExists(filepath, o), filepath, o);

    return new Promise((resolve, reject) => {
      fs.readFile(filepath, function(error, data) {
        if (error) {
          logger.error(this, error, {
            src: 'FileHelper=>',
            filepath,
            options,
            data: data.toString(),
          });
          //might not need this option anymore as this function is now wrapped as a promise
          options.onError(error);
          reject(error);
        }
        resolve(o.jsonParse ? utils.safeJsonParse(data) : data);
      });
    });
  };

  writeToFile = async (filepath, data, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (!o.overwrite && o.append && this.fileExists(filepath, o)) {
      return this.appendToFile(filepath, o.jsonStringify ? utils.safeJsonStringify(data) : data, o);
    }
    if (o.relativePath) filepath = this.getResolvedPath(filepath);

    return new Promise((resolve, reject) => {
      if (o.nextFileName && fs.existsSync(filepath)) {
        logger.report(this, 'writeToFile:: getting the next file name!');
        const [dir, file] = _autoParseNextFileName(filepath, o);
        this.promisedWriteToFile(dir + file, data, o, resolve, reject);
      } else if (o.overwrite || (!o.overwrite && !fs.existsSync(filepath))) {
        logger.report(this, 'writeToFile:: attempting to overwrite');
        if (fileManager.tryLock(filepath)) {
          this.promisedWriteToFile(filepath, data, o, resolve, reject);
        } else {
          fileManager.queue(filepath, data, [o, resolve, reject], this.promisedWriteToFile, true);
        }
      } else {
        logger.report(
          this,
          'writeToFile:: safely aborted due to options set: ' + filepath,
          options,
        );
        resolve('writeToFile:: safely aborted due to options set filepath: ' + filepath);
      }
    });
  };

  //TODO:: add size limit check here too
  appendToFile = async (filepath, data, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (!this.fileExists(filepath, o)) {
      this.writeToFile(filepath, data, o);
      return;
    }
    if (o.relativePath) filepath = this.getResolvedPath(filepath);
    if (o.prepend !== undefined) data = o.prepend + data;
    logger.report(this, 'appendToFile:: starting to append: ', filepath);

    return new Promise((resolve, reject) => {
      if (fileManager.tryLock(filepath)) {
        this.promisedAppendToFile(filepath, data, o, resolve, reject);
      }
      fileManager.queue(filepath, data, [o, resolve, reject], this.promisedAppendToFile, true);
    });
  };

  writeContinuousJson = async (filepath, data, options) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (o.relativePath) filepath = this.getResolvedPath(filepath);
    logger.report(this, 'writeContinuousJson:: start', { filepath });
    const jsondata = utils.safeJsonStringify(data, filepath);

    return new Promise((resolve, reject) => {
      if (_isSizeExceeded(filepath, o)) {
        const [dir, file] = _autoParseNextFileName(filepath, o);
        filepath = dir + file;
        logger.report(
          fileHelper,
          'writeContinuousJson:: size limit exceeded, using new file name: ' + filepath,
        );
      }
      if (fileManager.tryLock(filepath)) {
        _writeJsonFile(filepath, jsondata, o, resolve, reject);
      } else {
        //put together the resolve, reject arrays so it will be batched together when resolved/rejected
        const argumentBatcher = (copiedArgs, newArgs) => {
          copiedArgs[1] = copiedArgs[1].concat(newArgs[1]);
          copiedArgs[2] = copiedArgs[2].concat(newArgs[2]);
        };
        fileManager.queue(
          filepath,
          jsondata,
          [o, [resolve], [reject]],
          _writeJsonFile,
          false,
          argumentBatcher,
        );
      }
    });
  };

  promisedWriteToFile = (filepath, data, o, resolve, reject) => {
    fs.writeFile(
      filepath,
      o.jsonStringify ? utils.safeJsonStringify(data, filepath) : data,
      function(error) {
        fileManager.release(filepath);
        if (error) {
          logger.error({ logSignature }, error, {
            src: 'FileHelper|nextFileName',
            funcName: 'writeToFile',
          });
          reject(error);
        }
        const successMsg = 'writeToFile:: completed: ' + filepath;
        logger.report({ logSignature }, successMsg);
        resolve(successMsg);
      },
    );
  };

  promisedAppendToFile = (filepath, data, o, resolve, reject) => {
    fs.appendFile(
      filepath,
      o.jsonStringify ? utils.safeJsonStringify(data, filepath) : data,
      function(error) {
        fileManager.release(filepath);
        if (error) {
          logger.error({ logSignature }, error, { src: 'FileHelper', funcName: 'appendToFile' });
          reject(error);
        }
        const successMsg = 'appendToFile:: completed: ' + filepath;
        logger.report({ logSignature }, successMsg);
        resolve(successMsg);
      },
    );
  };
}
export const fileHelper = new FileHelper();
export default fileHelper;

/********************************************************************
 * public functions for fileHelper
 ********************************************************************/
export function splitFolderAndFile(filepath) {
  logger.report(fileHelper, 'splitFolderAndFile::', filepath);
  let i;
  for (i = filepath.length - 2; i >= 0; --i) {
    if (filepath[i] === '/' || filepath[i] === '\\') {
      break;
    }
  }
  return [filepath.substring(0, i + 1), filepath.substring(i + 1)];
}

/********************************************************************
 * private functions for fileHelper
 ********************************************************************/
const _batchHandlePromise = (cb, ...args) => {
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

const _writeJsonFile = function(filepath, jsondata, options, resolve, reject) {
  const _createJson = function() {
    fs.writeFile(filepath, options.jsonWrapper, function(error) {
      if (error) {
        logger.error(fileHelper, error, {
          src: 'FileHelper_Priv',
          funcName: '_writeJsonFile|_createJson|writeFile',
          filepath,
          jsondata,
          options,
        });
        _batchHandlePromise(reject, error);
      }
      logger.report(fileHelper, '_writeJsonFile:: created stub: ' + filepath);
      fs.appendFile(filepath, jsondata + _getOppositeBracket(options.jsonWrapper), function(error) {
        fileManager.release(filepath);
        if (error) {
          logger.error(fileHelper, error, {
            src: 'fileHelper',
            funcName: '_writeJsonFile|_createJson|appendFile',
            filepath,
            jsondata,
            options,
          });
          _batchHandlePromise(reject, error);
        }
        logger.report(fileHelper, '_writeJsonFile:: appendToFile:: completed : ' + filepath);
        _batchHandlePromise(resolve, '_writeJsonFile:: appendToFile:: completed : ' + filepath);
      });
    });
  };
  //needs to confirm it actually succeeded, a fail callback should be provided
  const onFail = (error, size) => {
    if (error != undefined && size !== 0) {
      fileManager.release(filepath);
      logger.error(fileHelper, error, {
        src: 'FileHelper_Priv',
        funcName: 'onFail',
        size,
        filepath,
        data,
        options,
      });
    } else {
      _createJson();
    }
  };
  if (!fs.existsSync(filepath)) {
    _createJson();
  } else {
    _appendToJsonFile(filepath, ',' + jsondata, onFail, resolve, reject);
  }
};

const _appendToJsonFile = function(filepath, data, onFail, resolve, reject) {
  fs.stat(filepath, function(errorStat, stat) {
    if (errorStat || stat.size === 0) {
      if (errorStat)
        logger.error(fileHelper, errorStat, {
          src: 'FileHelper_Priv',
          funcName: '_appendToJsonFile|stat',
          filepath,
          data,
          stat,
        });
      onFail(errorStat, stat.size);
      return _batchHandlePromise(reject, { errorStat, stat });
    }
    logger.report(fileHelper, '_appendToJsonFile:: pre file stream: ');

    const size = stat.size,
      endBytes = 16,
      fileDescriptor = fs.openSync(filepath, 'r+'),
      streamArgs = { start: size - endBytes >= 0 ? size - endBytes : 0, end: size },
      stream = fs.createReadStream(filepath, streamArgs);

    stream.on('error', function(streamError) {
      logger.report(fileHelper, '_appendToJsonFile:: error stream event:\n', {
        streamError,
        filepath,
        streamArgs,
        size,
      });
      logger.error(fileHelper, streamError, {
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

    stream.on('data', function(dataStream) {
      logger.report(fileHelper, '_appendToJsonFile:: stream.data:');
      const str = dataStream.toString();
      let byteCount = 1,
        dataEnd = '';
      for (let i = str.length - 1; i >= 0; --i, byteCount++) {
        const line = str[i];
        if (line === '}' || line === ']') {
          dataEnd = str.substring(i);
          // logger.report(fileHelper, '_appendToJsonFile:: stream.data: found closing brackets\n', {
          //   byteCount,
          //   dataEnd,
          //   fileDescriptor,
          //   diff: size - byteCount,
          //   size,
          // });
          const buffer = Buffer.from(data + dataEnd);
          fs.write(
            fileDescriptor,
            buffer,
            0,
            buffer.length,
            size - byteCount >= 0 ? size - byteCount : 0,
            function(filewriteError) {
              if (filewriteError) {
                logger.error(fileHelper, filewriteError, {
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
              fs.close(fileDescriptor, function() {
                fileManager.release(filepath);
                logger.report(fileHelper, '_appendToJsonFile:: success: path:\n' + filepath);
                _batchHandlePromise(resolve, '_appendToJsonFile:: success: path:' + filepath);
              });
            },
          );
          stream.close();
          return;
        }
      }
    });
  });
};

function _getOppositeBracket(input) {
  switch (input) {
    case '[':
      return ']';
    case '{':
      return '}';
    default:
      return new Error('_getOppositeBracket:: does not recognize input: ' + input);
  }
}

function _splitInReverseByCondition(filepath, condition, inclusive = false) {
  let i;
  for (i = filepath.length - 1; i >= 0; --i) {
    if (condition(filepath[i])) {
      break;
    }
  }
  return [filepath.substring(0, inclusive ? i + 1 : i), filepath.substring(i + 1)];
}

function _isSizeExceeded(filepath, options) {
  if (!fileHelper.fileExists(filepath)) return false;
  if (options.sizeLimit > -1) {
    const stats = fs.statSync(filepath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
    return fileSizeInMegabytes > options.sizeLimit;
  }
  return false;
}

function _getNextFileName(file, fileMap, dir, options) {
  const [base, ext] = _splitInReverseByCondition(file, (i) => i === '.');
  // console.log(base, ext);
  let [words, numbers] = _splitInReverseByCondition(base, (i) => isNaN(Number(i)), true);
  if (numbers === undefined) {
    numbers = 0;
  }
  let nextFileName = words + numbers + '.' + ext;
  let prevFileName = file;
  const predicate = (nextFileName) => {
    if (options.checkFileSize) {
      return fileMap[nextFileName] && _isSizeExceeded(dir + nextFileName, options);
    }
    return fileMap[nextFileName];
  };
  while (predicate(nextFileName)) {
    numbers++;
    prevFileName = nextFileName;
    nextFileName = words + numbers + '.' + ext;
  }
  return { nextFileName, prevFileName };
}

function _autoParseNextFileName(filepath, options) {
  const [dir, file] = options.relativePath
    ? splitFolderAndFile(fileHelper.getResolvedPath(filepath))
    : splitFolderAndFile(filepath);
  logger.report(fileHelper, '_autoParseNextFileName:: dir, file: ', dir, file);
  const files = fs.readdirSync(dir);
  const fileMap = {};
  files.map((i) => (fileMap[i] = true));
  const { nextFileName } = _getNextFileName(file, fileMap, dir, options);
  logger.report(fileHelper, '_autoParseNextFileName::', dir + nextFileName);
  return [dir, nextFileName];
}

export const _testPath = function(path) {
  logger.report(fileHelper, '_testPath: ' + fileHelper.getResolvedPath(path));
};
