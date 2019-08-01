import logger from '../logger';

let filelocks = {};
let writequeue = {};
export const signature = { logSignature: '\nFileManager=>' };

class FileManager {
  queue = (filepath, jsondata, options, writeCallback) => {
    // logger.report(signature, 'queue::\n', filepath, jsondata, options, writeCallback, writequeue);
    logger.report(signature, 'queue::\n', filepath);
    if (writequeue[filepath] == null) {
      writequeue[filepath] = [];
    }
    writequeue[filepath].push({
      options,
      jsondata,
      writeCallback,
    });
  };

  releaseQueue(filepath) {
    let copiedData = '',
      writeCallback,
      copiedOptions,
      allNull = true;
    const target = writequeue[filepath];
    for (let i = 0; i < target.length; ++i) {
      if (target[i] != null) {
        allNull = false;
        if (copiedData.length > 0) {
          copiedData += ',';
        }
        copiedData += target[i].jsondata;
        if (writeCallback === undefined) writeCallback = target[i].writeCallback;
        if (copiedOptions === undefined) copiedOptions = { ...target[i].options };
        target[i] = null;
      }
    }
    if (allNull) {
      writequeue[filepath] = [];
    }
    // logger.report(signature, 'releaseQueue::writeCallback:\n', { filepath, copiedOptions, copiedData });
    logger.report(signature, 'releaseQueue::writeCallback:\n', { filepath });
    if (writeCallback && copiedOptions) {
      this.lock(filepath);
      writeCallback(filepath, copiedData, copiedOptions);
    }
  }

  locked = (filepath) => {
    return filelocks[filepath] === true;
  };

  lock = (filepath) => {
    if (filelocks[filepath] === true) {
      logger.report(signature, 'lock: file is already locked:' + filepath);
      return false;
    }
    filelocks[filepath] = true;
    return true;
  };

  release = (filepath) => {
    logger.report(signature, 'release:: released file lock\n');
    filelocks[filepath] = false;
    // logger.report(signature, 'release::\n', filepath, filelocks[filepath], writequeue[filepath]);
    logger.report(signature, 'release::\n', filepath);
    if (writequeue[filepath] !== undefined && writequeue[filepath].length) {
      //release the queue
      this.releaseQueue(filepath);
    }
  };

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
    const copy = (target) => JSON.parse(JSON.stringify(target));
    logger.writelog({ signature, src: copy(this), filelocks: copy(filelocks), writequeue: copy(writequeue) });
  };
}
const fileManager = new FileManager();
export default fileManager;
