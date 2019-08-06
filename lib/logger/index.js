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

  this.writeCustomJson = (filename, data, options = {}) => {
    try {
      let folderPath;
      if (options.path === undefined) {
        const folder = dateUtils.getDateFormat(this.creationTime);
        folderPath = `${this.loggingPath}${folder}`;
        if (options.addfolder !== undefined) {
          folderPath += '/' + options.addFolder;
        }
      } else {
        folderPath = options.path;
      }
      const obj = { timestamp: dateUtils.getAusTimestamp(this.creationTime), data };
      fileHelper.assertDirExists(folderPath);
      fileHelper.writeContinuousJson(`${folderPath}/${filename}.json`, obj);
    } catch (error) {
      this.outputMethod(error);
    }
  };

  this.logban = (src, ...args) => {
    try {
      this.report(src, { func: `LogService=>logban::` });
      this.writeCustomJson(`logban`, { data: args });
    } catch (error) {
      this.outputMethod(error);
    }
  };

  this.writelog = (src, ...args) => {
    try {
      this.report(src, { func: `LogService=>writelog::` });
      this.writeCustomJson(`logservice`, { src, data: args });
    } catch (error) {
      this.outputMethod(error);
    }
  };

  this.error = (src, error, ...args) => {
    try {
      const errorMsg = error ? error.toString() : 'unknown::';
      this.report(src, { errorMsg, func: `LogService=>error::` });
      this.writeCustomJson(`errors`, { src, errorMsg, data: args }, { path: `${this.errorPath}${dateUtils.getDateFormat(this.creationTime)}` });
    } catch (error) {
      this.outputMethod(error);
    }
  };
}
const logger = new LogService();
export default logger;
