import logger from '../logger';
import * as utils from '../common';
import { KeyValuePair } from '../typedefinitions';
import rl from 'readline';

export const readline = rl.createInterface({ input: process.stdin, output: process.stdout });

function stripSingleQuotes(input: string): string {
  let first = 0,
    last = input.length;
  for (let i = 0; i < input.length; ++i) {
    const char = input[i];
    if (first === 0) {
      if (char === `'`) {
        first = i + 1;
      }
    } else {
      if (char === `'`) {
        last = i;
        break;
      }
    }
  }
  return input.substring(first, last);
}

function trimLeadingWhiteSpace(input: string): string {
  let i = 0;
  for (i = 0; i < input.length; ++i) {
    if (input[i] !== ' ') {
      break;
    }
  }
  return input.substring(i);
}

function primitiveParse(input: string): any {
  if (isBooleanSyntax(input)) {
    return input === 'true';
  } else if (utils.isNumber(input)) {
    return input.indexOf('.') === -1 ? parseInt(input) : parseFloat(input);
  }
  return stripSingleQuotes(input);
}

export function parseInputAsJsonObject(ref: KeyValuePair<any>, input: string, currentObject: any): any {
  if (input.length === 0) {
    return currentObject;
  }
  let answer = {};
  const args = input.split(',');
  for (let i = 0; i < args.length; ++i) {
    let [key, value] = args[i].split(':');
    key = trimLeadingWhiteSpace(key);
    value = trimLeadingWhiteSpace(value);
    let keyObj = extractTarget(ref, key);
    if (keyObj === undefined) keyObj = primitiveParse(key);
    let valueObj = extractTarget(ref, value);
    if (valueObj === undefined) valueObj = primitiveParse(value);
    answer[keyObj] = valueObj;
  }
  return answer;
}

export function parseInputAsJsonArray(ref: KeyValuePair<any>, input: string, currentObject: any): any {
  if (input.length === 0) {
    return currentObject;
  }
  let answer = '';
  const args = input.split(',');
  for (let i = 0; i < args.length; ++i) {
    answer += `"${args[i]}"`;
    if (i < args.length - 1) {
      answer += ',';
    }
  }
  return answer;
}

export function parseInputToReference(ref: KeyValuePair<any>, input: string): any {
  let answer = null;
  if (input.length <= 1) {
    return '';
  }
  const isArray = input[0] === '[' && input[input.length - 1] === ']';
  const isObject = input[0] === '{' && input[input.length - 1] === '}';
  if (isObject) {
    answer = parseInputAsJsonObject(ref, input.substring(1, input.length - 1), {});
  } else if (isArray) {
    answer = parseInputAsJsonArray(ref, input.substring(1, input.length - 1), []);
  }
  return answer;
}

export function isBooleanSyntax(input: string): boolean {
  return input === 'true' || input === 'false';
}

export function isQuotedSyntax(input: string): boolean {
  if (input.length <= 1) {
    return false;
  }
  const firstChar = input[0];
  const lastChar = input[input.length - 1];
  if (
    (firstChar === `'` && lastChar === `'`) ||
    (firstChar === '`' && lastChar === '`') ||
    (firstChar === '"' && lastChar === '"')
  ) {
    return true;
  }
  return false;
}

export function extractTarget(ref: KeyValuePair<any>, input: string): any {
  const methods = input.split('.');
  let target = ref[methods[0]];
  if (target === undefined) return undefined;
  for (let i = 1; i < methods.length; ++i) {
    target = target[methods[i]];
  }
  return target;
}

function smartSplitArgument(input: string): string[] {
  let answer = [];
  let bracketStack = [];
  let currentSplitIndex = 0;
  let i: number;
  for (i = 0; i < input.length; ++i) {
    const current = input[i];
    if (bracketStack.length === 0) {
      if (current === ',') {
        answer.push(input.substring(currentSplitIndex, i));
        currentSplitIndex = i + 1;
      } else {
        switch (current) {
          case '{':
            bracketStack.push('}');
            break;
          case '[':
            bracketStack.push(']');
            break;
        }
      }
    } else {
      switch (current) {
        case '{':
          bracketStack.push('}');
          break;
        case '[':
          bracketStack.push(']');
          break;
        case '}':
        case ']': {
          if (bracketStack[bracketStack.length - 1] === current) {
            bracketStack.pop();
            break;
          }
        }
      }
    }
  }
  answer.push(input.substring(currentSplitIndex, i));
  return answer;
}

export function extractArguments(ref: KeyValuePair<any>, input: string) {
  const args: any[] = smartSplitArgument(input);
  console.log({ args });
  for (let i = 0; i < args.length; ++i) {
    const current = args[i];
    if (current === 'null') {
      args[i] = null;
    } else if (current === 'undefined') {
      args[i] = undefined;
    } else {
      let parseAsString = isQuotedSyntax(current);
      if (!parseAsString) {
        const obj = extractTarget(ref, current);
        if (obj !== undefined) {
          args[i] = obj;
        } else {
          parseAsString = true;
        }
      }
      if (parseAsString) {
        const parsedInputAttempt = parseInputToReference(ref, current);
        console.log({
          parsedInputAttempt,
        });
        if (parsedInputAttempt !== null) {
          args[i] = parsedInputAttempt;
        } else {
          args[i] = primitiveParse(current);
        }
      }
    }
  }
  return args;
}
