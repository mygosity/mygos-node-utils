const util = require("util");
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;
import fileHelper from "../file";
import * as dateUtils from "../date";

function LogService() {
  this.errorPath = "errorlogs/";
  this.loggingPath = "logging/";

  this.reportVoice = {
    ["LogService=>writelog::"]: true,
    ["LogService=>error::"]: true
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

  this.helpWriteJson = (folderPath, filePath, data) => {
    fileHelper.assertDirExists(folderPath);
    fileHelper.writeContinuousJson(filePath, data);
  };

  this.writelog = (...args) => {
    const data = { timestamp: dateUtils.getAusTimestamp(this.creationTime), args };
    const folder = dateUtils.getDateFormat(this.creationTime);
    const folderPath = `${this.loggingPath}${folder}`;
    const filePath = `${folderPath}/logservice.json`;
    this.report({ logSignature: `LogService=>writelog::` }, filePath);
    this.helpWriteJson(folderPath, filePath, data);
  };

  this.error = (error, ...args) => {
    const errorData = { timestamp: dateUtils.getAusTimestamp(this.creationTime), error: error.toString ? error.toString() : error, args };
    const folder = dateUtils.getDateFormat(this.creationTime);
    const folderPath = `${this.errorPath}${folder}`;
    const filePath = `${folderPath}/errors.json`;
    this.report({ logSignature: `LogService=>error::` }, filePath);
    this.helpWriteJson(folderPath, filePath, errorData);
  };
}
const logger = new LogService();
export default logger;
