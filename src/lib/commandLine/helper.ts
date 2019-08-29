import logger from '../logger';
import * as utils from '../common';

const rl = require('readline');
export const readline = rl.createInterface({ input: process.stdin, output: process.stdout });

export function extractTarget(ref: any, input: string) {
  const methods = input.split('.');
  let target = ref[methods[0]];
  for (let i = 1; i < methods.length; ++i) {
    target = target[methods[i]];
  }
  return target;
}

export function extractArguments(ref: any, input: string) {
  const args: any[] = input.split(',');
  for (let i = 0; i < args.length; ++i) {
    const current = args[i];
    // logger.log("extractArguments:: current: ", current);
    if (current.indexOf('obj::') === 0) {
      const obj = extractTarget(ref, current.substring(5));
      // logger.log("extractArguments:: check obj: ", obj);
      if (obj !== undefined) {
        args[i] = obj;
      }
    } else if (current === 'true' || current === 'false') {
      args[i] = current === 'true';
    } else if (!isNaN(Number(current))) {
      args[i] = current.indexOf('.') === -1 ? parseInt(current) : parseFloat(current);
    } else if (current.indexOf('json::') === 0) {
      const test = utils.safeJsonParse(current.substring(6));
      logger.log('extractArguments:: test: ', test);
    }
  }
  return args;
}
