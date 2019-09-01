const util = require('util');
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;
import fileHelper, { WriteFileOptionsType } from '../file';
import * as dateUtils from '../date';
import utils from '../common';

export const logSignature = 'LogService=>';

interface LoggableType {
  logSignature?: string;
  funcSignature?: string;
}

interface WriteCustomJsonOptionsType {
  path?: string;
  addFolder?: string;
}
interface ReportingVoiceValue {
  default: boolean;
  [funcSignature: string]: boolean;
}

interface ReportVoiceMap {
  [logSignature: string]: ReportingVoiceValue;
}

interface ConfigurableLogServiceOptions {
  errorPath?: string;
  loggingPath?: string;
  defaultReportVoice?: boolean;
  reportVoice?: ReportVoiceMap;
  prettyFormat?: boolean;
}

class LogService {
  logSignature: string = logSignature;
  errorPath: string = 'logging/';
  loggingPath: string = 'logging/';
  defaultReportVoice: boolean = true;
  reportVoice: ReportVoiceMap = {
    [logSignature]: { default: false },
  };
  prettyFormat: boolean = false;

  configure = (options: ConfigurableLogServiceOptions = {}) => {
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
    if (options.prettyFormat !== undefined) {
      this.prettyFormat = options.prettyFormat;
    }
  };

  setReportingVoice = (key: string, value: any) => {
    this.reportVoice[key] = value;
  };

  outputMethod = (...args: any[]) => {
    console.log(...args);
  };

  report = (target: LoggableType, ...args: any[]) => {
    if (this.allowedToLog(target)) {
      this.outputMethod(target.logSignature, ...args);
    }
  };

  allowedToLog = (target: LoggableType) => {
    const { logSignature, funcSignature } = target;
    if (logSignature == null) {
      console.log('allowedToLog:: check -> target.logSignature: ');
      console.trace('logSignature was null or undefined | ' + logSignature);
      return false;
    }
    if (this.reportVoice[logSignature] == null) {
      this.reportVoice[logSignature] = { default: this.defaultReportVoice };
      console.log(
        'allowedToLog:: has turned logging by default for this signature: ' +
          target.logSignature +
          ' as : ' +
          this.defaultReportVoice,
      );
    }
    const voice = this.reportVoice[logSignature];
    if (funcSignature === undefined) {
      return voice.default;
    }
    if (voice[funcSignature] !== undefined) {
      return voice[funcSignature];
    }
    return voice.default;
  };

  log = (...args: any[]) => {
    this.outputMethod(...args);
  };

  writeCustomJson = (
    filename: string,
    data: any,
    options: WriteCustomJsonOptionsType = {},
    writeOptions: WriteFileOptionsType = {},
  ) => {
    try {
      let folderPath;
      if (options.path === undefined) {
        const folder = dateUtils.getAusTimestamp(Date.now(), 'YYYY-MM-DD');
        folderPath = `${this.loggingPath}${folder}`;
        if (options.addFolder != null) {
          folderPath += '/' + options.addFolder;
        }
      } else {
        folderPath = options.path;
      }
      const obj = { timestamp: dateUtils.getAusTimestamp(Date.now()), data };
      fileHelper.assertDirExists(folderPath);
      fileHelper.writeContinuousJson(`${folderPath}/${filename}.json`, obj, {
        prettyFormat: this.prettyFormat,
        ...writeOptions,
      });
    } catch (error) {
      this.outputMethod(error);
    }
  };

  logban = (src: LoggableType, ...args: any[]) => {
    try {
      this.report({ funcSignature: 'logban', ...src }, { func: `LogService=>logban::` });
      this.writeCustomJson(`logban`, { data: args });
    } catch (error) {
      this.outputMethod(error);
    }
  };

  writelog = (src: LoggableType, ...args: any[]) => {
    try {
      this.report({ funcSignature: 'writelog', ...src }, { func: `LogService=>writelog::` });
      this.writeCustomJson(`logservice`, { src, data: args });
    } catch (error) {
      this.outputMethod(error);
    }
  };

  error = (src: LoggableType, error: any, ...args: any[]) => {
    try {
      this.report(src, { funcSignature: 'error' }, { func: `LogService=>error::` });
      this.writeCustomJson(
        `errors`,
        { src, errorMsg: error.toString(), data: args, error },
        {
          path: `${this.errorPath}logger/${dateUtils.getAusTimestamp(Date.now(), 'YYYY-MM-DD')}`,
        },
      );
    } catch (error) {
      // this.outputMethod(error);
    }
  };
}
const logger = new LogService();
export default logger;
