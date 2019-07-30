const util = require('util');
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;
import * as fileHelper from '../file';
import * as dateUtils from '../date';

const helpWriteJson = (folderPath, filePath, errorData) => {
  fileHelper.assertDirExists(folderPath);
  fileHelper.writeContinuousJson(filePath, errorData);
};

function LogService() {
  this.errorPath = './errorlogs/';
  this.loggingPath = './logging/';
  this.configure = (options = {}) => {
    if (options.errorPath !== undefined) {
      this.errorPath = options.errorPath;
    }
    if (options.loggingPath !== undefined) {
      this.loggingPath = options.loggingPath;
    }
  };
  this.outputMethod = (...args) => {
    console.log(...args);
  };
  this.report = (target, ...args) => {
    this.outputMethod(target.logSignature, ...args);
  };
  this.log = (...args) => {
    this.outputMethod(...args);
  };
  this.writelog = (...args) => {
    const data = { timestamp: dateUtils.getAusTimestamp(this.creationTime), args };
    const folder = dateUtils.getDateFormat(this.creationTime);
    const folderPath = `${this.loggingPath}${folder}`;
    const filePath = `${folderPath}/logservice.json`;
    this.outputMethod(`LogService=>writelog:: ${filePath}`, data);
    helpWriteJson(folderPath, filePath, data);
  };
  this.error = (error, ...args) => {
    const errorData = { timestamp: dateUtils.getAusTimestamp(this.creationTime), error: error.toString ? error.toString() : error, args };
    const folder = dateUtils.getDateFormat(this.creationTime);
    const folderPath = `${this.errorPath}${folder}`;
    const filePath = `${folderPath}/errors.json`;
    this.outputMethod(`LogService=>error:: ${filePath}`, error);
    helpWriteJson(folderPath, filePath, errorData);
  };
}
const logger = new LogService();
export default logger;
