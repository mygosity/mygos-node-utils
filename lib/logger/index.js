const util = require('util');
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;
import fileHelper from '../file';
import * as dateUtils from '../date';
import * as utils from '../common';

function LogService() {
  this.errorPath = 'errorlogs/';
  this.loggingPath = 'logging/';
  this.defaultReportVoice = false;

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
    if (options.defaultReportVoice !== undefined) {
      this.defaultReportVoice = options.defaultReportVoice;
    }
  };

  this.setReportingVoice = (key, value) => {
    this.reportVoice[key] = value;
  };

  this.outputMethod = (...args) => {
    console.log(...args);
  };

  this.report = (target, ...args) => {
    if (this.allowedToLog(target)) {
      this.outputMethod(target.logSignature, ...args);
    }
  };

  this.allowedToLog = (target) => {
    if (target.logSignature == null) {
      console.log('allowedToLog:: check -> target.logSignature: ' + target.logSignature);
      return false;
    }
    if (this.reportVoice[target.logSignature] == null) {
      this.reportVoice[target.logSignature] = this.defaultReportVoice;
      console.log('allowedToLog:: has turned logging by default for this signature: ' + target.logSignature + ' as : ' + this.defaultReportVoice);
    }
    const voice = this.reportVoice[target.logSignature];
    if (voice === true) {
      return true;
    }
    if (utils.isObject(voice)) {
      if (target.srcSignature != null && voice[target.srcSignature]) {
        return true;
      }
    }
    return false;
  };

  this.log = (...args) => {
    this.outputMethod(...args);
  };

  this.writeCustomJson = (filename, data, options = {}) => {
    try {
      let folderPath;
      if (options.path === undefined) {
        const folder = dateUtils.getDateFormat(dateUtils.getCreationTime());
        folderPath = `${this.loggingPath}${folder}`;
        if (options.addfolder !== undefined) {
          folderPath += '/' + options.addFolder;
        }
      } else {
        folderPath = options.path;
      }
      const obj = { timestamp: dateUtils.getAusTimestamp(dateUtils.getCreationTime()), data };
      fileHelper.assertDirExists(folderPath);
      fileHelper.writeContinuousJson(`${folderPath}/${filename}.json`, obj);
    } catch (error) {
      this.outputMethod(error);
    }
  };

  this.logban = (src, ...args) => {
    try {
      this.report({ srcSignature: 'logban', ...src }, { func: `LogService=>logban::` });
      this.writeCustomJson(`logban`, { data: args });
    } catch (error) {
      this.outputMethod(error);
    }
  };

  this.writelog = (src, ...args) => {
    try {
      this.report({ srcSignature: 'writelog', ...src }, { func: `LogService=>writelog::` });
      this.writeCustomJson(`logservice`, { src, data: args });
    } catch (error) {
      this.outputMethod(error);
    }
  };

  this.error = (src, error, ...args) => {
    try {
      const errorMsg = error ? error.toString() : 'unknown::';
      this.report({ srcSignature: 'error', ...src }, { errorMsg, func: `LogService=>error::` });
      this.writeCustomJson(
        `errors`,
        { src, errorMsg, data: args },
        { path: `${this.errorPath}${dateUtils.getDateFormat(dateUtils.getCreationTime())}` },
      );
    } catch (error) {
      this.outputMethod(error);
    }
  };
}
const logger = new LogService();
export default logger;
