import logger from '../logger';
import { prefillDefaultOptions } from '../common';
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
}
const defaultWriteFileOptions = new WriteFileOptions();

function ReadFileOptions() {
  this.relativePath = true;
  this.jsonParse = true;
}
const defaultReadFileOptions = new ReadFileOptions();

class FileHelper {
  constructor() {
    this.logSignature = 'fileHelper=>';
  }

  setBasePath = (path) => {
    BASEPATH = path;
  };

  getRelativePath = (relativePath) => {
    return path.resolve(BASEPATH, relativePath);
  };

  assertDirExists = (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (o.relativePath) filepath = this.getRelativePath(filepath);
    if (o.autoCreatePath && !fs.existsSync(filepath)) {
      mkdirp.sync(filepath);
    }
  };

  fileExists = (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (o.relativePath) filepath = this.getRelativePath(filepath);
    return fs.existsSync(filepath);
  };

  readFileSync = (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultReadFileOptions);
    if (o.relativePath) filepath = this.getRelativePath(filepath);
    logger.report(this, 'readFileSync:: fileExists: ' + this.fileExists(filepath), filepath, o);
    if (o.jsonParse) return JSON.parse(fs.readFileSync(filepath));
    return fs.readFileSync(filepath);
  };

  readFile = async (filepath, options = {}) => {
    const o = prefillDefaultOptions(options, defaultReadFileOptions);
    if (o.relativePath) filepath = this.getRelativePath(filepath);
    logger.report(this, 'readFile:: fileExists: ' + this.fileExists(filepath), filepath, o);

    return new Promise((resolve, reject) => {
      fs.readFile(filepath, function(error, data) {
        if (error) {
          logger.error(this, error, { src: 'FileHelper=>', filepath, options, data: data.toString() });
          //might not need this option anymore as this function is now wrapped as a promise
          options.onError(error);
          reject(error);
        }
        resolve(o.jsonParse ? JSON.parse(data) : data);
      });
    });
  };

  writeToFile = async (filepath, data, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (!o.overwrite && o.append && this.fileExists(filepath, o)) {
      return this.appendToFile(filepath, o.jsonStringify ? JSON.stringify(data) : data, o);
    }
    if (o.relativePath) filepath = this.getRelativePath(filepath);

    return new Promise((resolve, reject) => {
      if (o.nextFileName && fs.existsSync(filepath)) {
        logger.report(this, 'writeToFile:: getting the next file name!');
        const [dir, file] = o.relativePath ? _splitFolderAndFile(this.getRelativePath(filepath)) : _splitFolderAndFile(filepath);
        logger.report(this, 'writeToFile:: dir, file: ', dir, file);
        const files = fs.readdirSync(dir);
        const fileMap = {};
        files.map((i) => (fileMap[i] = true));
        const newFileName = _getNextFileName(file, fileMap);
        logger.report(this, 'writeToFile::', dir + newFileName);
        this.promisedWriteToFile(dir + newFileName, data, o, resolve, reject);
      } else if (o.overwrite || (!o.overwrite && !fs.existsSync(filepath))) {
        logger.report(this, 'writeToFile:: attempting to overwrite');
        if (fileManager.tryLock(filepath)) {
          this.promisedWriteToFile(filepath, data, o, resolve, reject);
        } else {
          reject('file is locked! cannot write to: ' + filepath);
        }
      } else {
        reject({ msg: 'unexpected writeToFile params: ' + filepath, data, options });
      }
    });
  };

  appendToFile = async (filepath, data, options = {}) => {
    const o = prefillDefaultOptions(options, defaultWriteFileOptions);
    if (!this.fileExists(filepath, o)) {
      this.writeToFile(filepath, data, o);
      return;
    }
    if (o.relativePath) filepath = this.getRelativePath(filepath);
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
    if (o.relativePath) filepath = this.getRelativePath(filepath);
    logger.report(this, 'writeContinuousJson:: start', { filepath });
    const jsondata = JSON.stringify(data);

    return new Promise((resolve, reject) => {
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

  promisedWriteToFile = (filepath, data, o, resolve, reject) => {
    fs.writeFile(filepath, o.jsonStringify ? JSON.stringify(data) : data, function(error) {
      fileManager.release(filepath);
      if (error) {
        logger.error(this, error, { src: 'FileHelper|nextFileName', funcName: 'writeToFile' });
        reject(error);
      }
      const successMsg = 'writeToFile:: completed: ' + filepath;
      logger.log(successMsg);
      resolve(successMsg);
    });
  };

  promisedAppendToFile = (filepath, data, o, resolve, reject) => {
    fs.appendFile(filepath, o.jsonStringify ? JSON.stringify(data) : data, function(error) {
      fileManager.release(filepath);
      if (error) {
        logger.error(this, error, { src: 'FileHelper', funcName: 'appendToFile' });
        reject(error);
      }
      const successMsg = 'appendToFile:: completed: ' + filepath;
      logger.log(successMsg);
      resolve(successMsg);
    });
  };
}
export const fileHelper = new FileHelper();
export default fileHelper;

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
        logger.error(fileHelper, error, { src: 'FileHelper_Priv', funcName: '_writeJsonFile|_createJson|writeFile', filepath, jsondata, options });
        _batchHandlePromise(reject, error);
      }
      logger.report(fileHelper, '_writeJsonFile:: created stub: ' + filepath);
      fs.appendFile(filepath, jsondata + _getOppositeBracket(options.jsonWrapper), function(error) {
        fileManager.release(filepath);
        if (error) {
          logger.error(fileHelper, error, { src: 'fileHelper', funcName: '_writeJsonFile|_createJson|appendFile', filepath, jsondata, options });
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
      logger.error(fileHelper, error, { src: 'FileHelper_Priv', funcName: 'onFail', size, filepath, data, options });
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
      if (errorStat) logger.error(fileHelper, errorStat, { src: 'FileHelper_Priv', funcName: '_appendToJsonFile|stat', filepath, data, stat });
      onFail(errorStat, stat.size);
      return _batchHandlePromise(reject, { errorStat, stat });
    }
    logger.report(fileHelper, '_appendToJsonFile:: pre file stream: ');

    //TODO::implement a size check to see when this sort of thing starts to fail
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
          fs.write(fileDescriptor, buffer, 0, buffer.length, size - byteCount >= 0 ? size - byteCount : 0, function(filewriteError) {
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
          });
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

function _splitFolderAndFile(filepath) {
  logger.report(fileHelper, '_splitFolderAndFile::', filepath);
  let i;
  for (i = filepath.length - 2; i >= 0; --i) {
    if (filepath[i] === '/' || filepath[i] === '\\') {
      break;
    }
  }
  return [filepath.substring(0, i + 1), filepath.substring(i + 1)];
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

function _getNextFileName(file, fileMap) {
  const [base, ext] = _splitInReverseByCondition(file, (i) => i === '.');
  // console.log(base, ext);
  let [words, numbers] = _splitInReverseByCondition(base, (i) => isNaN(Number(i)), true);
  // console.log(words, numbers);
  if (numbers === undefined) {
    numbers = 0;
  }
  let nextFileName = words + numbers + '.' + ext;
  while (fileMap[nextFileName]) {
    numbers++;
    nextFileName = words + numbers + '.' + ext;
  }
  return nextFileName;
}

export const _testPath = function(path) {
  logger.report(fileHelper, '_testPath: ' + fileHelper.getRelativePath(path));
};
