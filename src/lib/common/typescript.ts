import * as utils from '../common';
import { KeyValuePair } from '../typedefinitions';

const tab = '\t',
  endline = '\n',
  semicolon = ';';

const shouldSurroundWithQuotes = (type) => {
  return type.indexOf(' ') !== -1 || !isNaN(Number(type[0]));
};

const parsedArrayType = (data: any, depth: number = 1) => {
  let answer = '',
    ending = '';

  let model = {},
    nullableProps = {};
  let allnull = true;
  for (let i = 0; i < data.length; ++i) {
    const current = data[i];
    if (current == null) {
      continue;
    } else {
      allnull = false;
      if (Array.isArray(current)) {
        answer += '[\n';
        for (let i = 0; i < depth; ++i) ending += tab;
        answer += parsedArrayType(data, depth + 1);
        ending += '],';
      } else if (utils.isObject(current)) {
        for (let prop in current) {
          model[prop] = current[prop];
        }
        if (i !== 0) {
          for (let modelProp in model) {
            if (current[modelProp] === undefined) {
              nullableProps[modelProp] = true;
            }
          }
        }
      } else {
        const currentDataType = typeof current;
        answer += currentDataType.toString() + '[]' + semicolon;
        break;
      }
    }
  }
  if (allnull) {
    answer += 'any';
  } else if (!utils.isEmpty(model)) {
    for (let prop in nullableProps) {
      const temp = model[prop];
      delete model[prop];
      model[prop + '?'] = temp;
    }
    answer += parsedDataType(null, model, depth);
  }
  answer += ending;
  return answer;
};

const parsedDataType = (type: string, data: any, depth: number = 1) => {
  let answer = '',
    ending = '';
  for (let i = 0; i < depth; ++i) answer += tab;
  const nullableType = data == null ? '?' : '';
  if (type != null) {
    answer += shouldSurroundWithQuotes(type) ? `'${type}${nullableType}': ` : `${type}${nullableType}: `;
  }
  const currentDataType = typeof data;
  if (currentDataType !== 'object') {
    answer += currentDataType.toString() + semicolon;
  } else {
    if (data == null) {
      answer += 'any;';
    } else if (Array.isArray(data)) {
      const nextData = data[0];
      if (typeof nextData === 'object') {
        answer += '[\n';
        for (let i = 0; i < depth; ++i) ending += tab;
      }
      answer += parsedArrayType(data, depth + 1);
      if (typeof data[0] === 'object') {
        ending += '],';
      }
    } else if (utils.isObject(data)) {
      answer += '{\n';
      for (let i = 0; i < depth; ++i) ending += tab;
      for (let perType in data) {
        answer += parsedDataType(perType, data[perType], depth + 1);
      }
      ending += '},';
    }
  }
  answer += ending + endline;
  return answer;
};

export const convertToTypeDefinition = (interfaceName: string, data: KeyValuePair<any>) => {
  let answer = `export interface ${interfaceName} {\n`;
  let exclusions = {
    timestamp: true,
    aussieTime: true,
  };
  for (let type in data) {
    if (!exclusions[type]) {
      answer += parsedDataType(type, data[type], 1);
    }
  }
  return answer + '};';
};
