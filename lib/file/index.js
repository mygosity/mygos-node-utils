import logger from '../logger';
import { prefillDefaultOptions } from '../common';
import fileManager from '../file/manager';
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

export const fhSignature = { logSignature: 'fileHelper=>' };

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

export function getRelativePath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

export function assertDirExists(filepath, options = {}) {
  const o = prefillDefaultOptions(options, defaultWriteFileOptions);
  if (o.relativePath) filepath = getRelativePath(filepath);
  if (o.autoCreatePath && !fs.existsSync(filepath)) {
    mkdirp.sync(filepath);
  }
}

export function readFileSync(filepath, options = {}) {
  const o = prefillDefaultOptions(options, defaultReadFileOptions);
  if (o.relativePath) filepath = getRelativePath(filepath);
  logger.report(fhSignature, 'readFileSync:: fileExists: ' + fileExists(filepath), filepath, o);
  if (o.jsonParse) return JSON.parse(fs.readFileSync(filepath));
  return fs.readFileSync(filepath);
}

export const readFile = function(filepath, onReadCallback, options = {}) {
  const o = prefillDefaultOptions(options, defaultReadFileOptions);
  if (o.relativePath) filepath = getRelativePath(filepath);
  logger.report(fhSignature, 'readFile:: fileExists: ' + fileExists(filepath), filepath, o);
  fs.readFile(filepath, function(error, data) {
    if (error) {
      logger.error(error, { src: 'fileHelper=>', filepath, options, data: data.toString() });
      options.onError(error);
    }
    onReadCallback(o.jsonParse ? JSON.parse(data) : data);
  });
};

export function writeToFile(filepath, data, options = {}) {
  const o = prefillDefaultOptions(options, defaultWriteFileOptions);
  if (!o.overwrite && o.append && fileExists(filepath, o)) {
    appendToFile(filepath, o.jsonStringify ? JSON.stringify(data) : data, o);
    return;
  }
  if (o.relativePath) filepath = getRelativePath(filepath);
  // logger.report(fhSignature, 'writeToFile::', filepath, data, options);
  if (o.nextFileName && fs.existsSync(filepath)) {
    logger.report(fhSignature, 'writeToFile:: getting the next file name!');
    const [dir, file] = o.relativePath ? _splitFolderAndFile(getRelativePath(filepath)) : _splitFolderAndFile(filepath);
    logger.report(fhSignature, 'writeToFile:: dir, file: ', dir, file);
    const files = fs.readdirSync(dir);
    const fileMap = {};
    files.map((i) => (fileMap[i] = true));
    const newFileName = _getNextFileName(file, fileMap);
    logger.report(fhSignature, 'writeToFile::', dir + newFileName);
    fs.writeFile(dir + newFileName, o.jsonStringify ? JSON.stringify(data) : data, function(error) {
      if (error) {
        logger.error(error, { src: 'fileHelper', funcName: 'writeToFile' });
        throw error;
      }
      logger.log('writeToFile:: completed');
    });
  } else if (o.overwrite || (!o.overwrite && !fs.existsSync(filepath))) {
    // logger.report(fhSignature, 'writeToFile:: attempting to overwrite!');
    fs.writeFile(filepath, o.jsonStringify ? JSON.stringify(data) : data, function(error) {
      if (error) {
        logger.error(error, { src: 'fileHelper', funcName: 'writeToFile' });
        throw error;
      }
      logger.log('writeToFile:: completed');
    });
  }
}

export function appendToFile(filepath, data, options = {}) {
  const o = prefillDefaultOptions(options, defaultWriteFileOptions);
  if (!fileExists(filepath, o)) {
    writeToFile(filepath, data, o);
    return;
  }
  if (o.relativePath) filepath = getRelativePath(filepath);
  if (o.prepend !== undefined) data = o.prepend + data;
  // logger.report(fhSignature, 'appendToFile::', filepath, data, options);
  fs.appendFile(filepath, o.jsonStringify ? JSON.stringify(data) : data, function(error) {
    if (error) {
      logger.error(error, { src: 'fileHelper', funcName: 'appendToFile' });
      throw error;
    }
    logger.log('appendToFile:: completed');
  });
}

export function fileExists(filepath, options = {}) {
  const o = prefillDefaultOptions(options, defaultWriteFileOptions);
  if (o.relativePath) filepath = getRelativePath(filepath);
  return fs.existsSync(filepath);
}

export const writeContinuousJson = function(filepath, data, options) {
  const o = prefillDefaultOptions(options, defaultWriteFileOptions);
  if (o.relativePath) filepath = getRelativePath(filepath);
  logger.report(fhSignature, 'writeContinuousJson:: start', { nl: '\n', filepath, options });
  const jsondata = JSON.stringify(data);
  if (fileManager.lock(filepath)) {
    _writeJsonFile(filepath, jsondata, o);
  } else {
    fileManager.queue(filepath, jsondata, o, _writeJsonFile);
  }
};

const _writeJsonFile = function(filepath, jsondata, options) {
  const _createJson = function() {
    fs.writeFile(filepath, options.jsonWrapper, function(error) {
      if (error) {
        logger.error(error, { src: 'fileHelper', funcName: '_writeJsonFile|_createJson|writeFile', filepath, jsondata, options });
        throw error;
      }
      logger.report(fhSignature, '_writeJsonFile:: created stub: ' + filepath);
      fs.appendFile(filepath, jsondata + _getOppositeBracket(options.jsonWrapper), function(error) {
        if (error) {
          logger.error(error, { src: 'fileHelper', funcName: '_writeJsonFile|_createJson|appendFile', filepath, jsondata, options });
          throw error;
        }
        logger.report(fhSignature, '_writeJsonFile:: appendToFile:: completed : ' + filepath);
        fileManager.release(filepath);
      });
    });
  };
  //needs to confirm it actually succeeded, a fail callback should be provided
  const onFail = (error, size) => {
    if (error != undefined && size !== 0) {
      logger.error(error, { src: 'fileHelper', funcName: 'onFail', size, filepath, data, options });
      fileManager.release(filepath);
    } else {
      _createJson();
    }
  };
  if (!fs.existsSync(filepath)) {
    _createJson();
  } else {
    _appendToJsonFile(filepath, ',' + jsondata, onFail);
  }
};

const _appendToJsonFile = function(
  filepath,
  data,
  onFail = (appendError) => {
    logger.error(appendError, { src: 'fileHelper', funcName: '_appendToJsonFile|onFail', filepath, data });
  },
) {
  fs.stat(filepath, function(errorStat, stat) {
    if (errorStat || stat.size === 0) {
      if (errorStat) logger.error(errorStat, { src: 'fileHelper', funcName: '_appendToJsonFile|stat', filepath, data, stat });
      return onFail(errorStat, stat.size);
    }
    logger.report(fhSignature, '_appendToJsonFile:: pre file stream: ');

    //TODO::implement a size check to see when this sort of thing starts to fail

    const size = stat.size,
      endBytes = 16,
      fileDescriptor = fs.openSync(filepath, 'r+'),
      streamArgs = { start: size - endBytes >= 0 ? size - endBytes : 0, end: size },
      stream = fs.createReadStream(filepath, streamArgs);

    stream.on('error', function(streamError) {
      logger.report(fhSignature, '_appendToJsonFile:: error stream event:\n', {
        streamError,
        filepath,
        streamArgs,
        size,
      });
      logger.error(streamError, { src: 'fileHelper', funcName: '_appendToJsonFile|on("error"', filepath, data, stat, streamArgs, size });
      onFail(streamError);
    });

    stream.on('data', function(dataStream) {
      logger.report(fhSignature, '_appendToJsonFile:: stream.data:');
      const str = dataStream.toString();
      let byteCount = 1,
        dataEnd = '';
      for (let i = str.length - 1; i >= 0; --i, byteCount++) {
        const line = str[i];
        if (line === '}' || line === ']') {
          dataEnd = str.substring(i);
          // logger.report(fhSignature, '_appendToJsonFile:: stream.data: found closing brackets\n', {
          //   byteCount,
          //   dataEnd,
          //   fileDescriptor,
          //   diff: size - byteCount,
          //   size,
          // });
          const buffer = Buffer.from(data + dataEnd);
          fs.write(fileDescriptor, buffer, 0, buffer.length, size - byteCount >= 0 ? size - byteCount : 0, function(filewriteError) {
            if (filewriteError) {
              logger.error(filewriteError, {
                src: 'fileHelper',
                funcName: '_appendToJsonFile|on("data")|write',
                filepath,
                data,
                stat,
                streamArgs,
                size,
                fileDescriptor,
                buffer,
              });
              //TODO|confirm this works...
              return onFail(filewriteError);
            }
            fs.close(fileDescriptor, function() {
              logger.report(fhSignature, '_appendToJsonFile:: success\n');
              fileManager.release(filepath);
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
  logger.report(fhSignature, '_splitFolderAndFile::', filepath);
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
  logger.report(fhSignature, '_testPath: ' + getRelativePath(path));
};
