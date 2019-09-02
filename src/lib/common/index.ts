import * as formatters from './formatting';
import * as validator from './validation';
import * as maths from './maths';
import * as inputhandlers from './inputhandlers';
import * as objectarrayutils from './objectarray';
import logger from '../logger';
import { Dictionary } from '../typedefinitions';

/**
 * Auto mutates options and copies any properties from a default options structure
 * Take care not to mutate the returned default here else all defaults will be affected
 * Note: extra properties in the specific object will be retained
  - only default properties are compared for existence and then copied to prevent undefined entries
* @param {object} options custom options
* @param {object} defaultOptions the default options to always have
*/
export function prefillDefaultOptions(options: Dictionary<any>, defaultOptions: Dictionary<any>): Dictionary<any> {
  if (options === null || options === undefined) {
    //take care not to mutate the returned default here else all defaults will be affected
    return defaultOptions;
  } else {
    for (let prop in defaultOptions) {
      if (options[prop] === undefined) {
        options[prop] = defaultOptions[prop];
      }
    }
  }
  return options;
}

/**
 * Use this to stop a timer you've defined
 * I've found that .stop() is required, without it, setTimeout seems to keep calling
 * @param {NodeJS.Timeout} timeoutCall the function reference to stop
 */
export function stopTimer(timeoutCall: NodeJS.Timeout | any): void {
  if (timeoutCall) {
    if (timeoutCall.stop) {
      timeoutCall.stop();
    }
    clearTimeout(timeoutCall);
  }
}

/**
 * Will create a blob and manufacture a click event to force a download for streamed data
 * @param {object} response
 * @param {string} type the header string required to download the file
 * @param {string} filename the filename specified usually in the header
 */
export function downloadFile(response: Dictionary<any>, type: string, filename: string): void {
  const data = response.data;
  try {
    if (data && (data.size || data.length) > 0) {
      const blob = new Blob([data], {
        type: type ? type : response.headers['content-type'],
      });
      //@ts-ignore
      const URL = window.URL || window.webkitURL;
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.target = '_blank';
      const downloadFileName = filename ? filename : response.headers['content-disposition'].split('=')[1];
      downloadLink.download = downloadFileName.replace(/["\s]?/g, '');
      downloadLink.href = downloadUrl;
      downloadLink.click();
    }
  } catch (e) {
    logger.error({ logSignature: 'commonutils=>', funcSignature: 'downloadFile' }, e);
  }
}

export default {
  prefillDefaultOptions,
  stopTimer,
  downloadFile,
  ...objectarrayutils,
  ...inputhandlers,
  ...maths,
  ...formatters,
  ...validator,
};
