const util = require('util');
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;
import fileHelper from '../file';
import * as dateUtils from '../date';

function LogService() {
  this.errorPath = 'errorlogs/';
  this.loggingPath = 'logging/';

  this.reportVoice = {
    ['LogService=>writelog::']: true,
    ['LogService=>error::']: true,
  };

  this.configure = (options = {}) => {
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
  };

  this.setReportingVoice = (key, value) => {
    this.reportVoice[key] = value;
  };

  this.outputMethod = (...args) => {
    console.log(...args);
  };

  this.report = (target, ...args) => {
    if (this.reportVoice[target.logSignature] !== false) {
      this.outputMethod(target.logSignature, ...args);
    }
  };

  this.log = (...args) => {
    this.outputMethod(...args);
  };

  this.writelog = (src, ...args) => {
    try {
      const data = { timestamp: dateUtils.getAusTimestamp(this.creationTime), src: src ? src : 'unknown=>', args };
      const folder = dateUtils.getDateFormat(this.creationTime);
      const folderPath = `${this.loggingPath}${folder}`;
      const filePath = `${folderPath}/logservice.json`;
      this.report(src && src.logSignature ? src : { logSignature: 'unknown=>' }, { func: `LogService=>writelog::` }, filePath);
      fileHelper.assertDirExists(folderPath);
      fileHelper.writeContinuousJson(filePath, data);
    } catch (error) {
      this.outputMethod(error);
    }
  };

  this.error = (src, error, ...args) => {
    try {
      const errorMsg = error ? error.toString() : 'unknown::';
      const data = { timestamp: dateUtils.getAusTimestamp(this.creationTime), src: src ? src : 'unknown=>', error: errorMsg, args };
      const folder = dateUtils.getDateFormat(this.creationTime);
      const folderPath = `${this.errorPath}${folder}`;
      const filePath = `${folderPath}/errors.json`;
      this.report(src && src.logSignature ? src : { logSignature: 'unknown=>' }, { func: `LogService=>error::` }, filePath);
      fileHelper.assertDirExists(folderPath);
      fileHelper.writeContinuousJson(filePath, data);
    } catch (error) {
      this.outputMethod(error);
    }
  };
}
const logger = new LogService();
export default logger;
