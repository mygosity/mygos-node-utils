import moment from 'moment-timezone';
import * as utils from '../common';

export const getDateFormat = (date, formatStr = 'YYYY-MM-DD'): moment => {
  return moment(date).format(formatStr);
};

export const msDifference = (timestamp: number): number => {
  return Date.now() - timestamp;
};

export const timeDifference = (from, to, type = 'days'): moment => {
  const fromTime = moment(from);
  const toTime = to ? moment(to) : moment();
  return fromTime.diff(toTime, type);
};

export const getAusTimestamp = (date, formatStr = 'YYYY-MM-DD HH:mm:ss'): string => {
  return date
    ? moment(date)
        .tz('Australia/Sydney')
        .format(formatStr)
    : moment()
        .tz('Australia/Sydney')
        .format(formatStr);
};

export const wrapWithAusTimeStamp = (
  obj: any,
): { timestamp: number; aussieTime: string; [key: string]: any } => {
  if (!utils.isObject(obj)) {
    if (Array.isArray(obj)) {
      obj = { ...obj };
    } else {
      obj = { key: obj };
    }
  }
  const timestamp = Date.now();
  return {
    timestamp,
    aussieTime: getAusTimestamp(timestamp),
    ...obj,
  };
};

export const updateTimestamp = (obj: any): any => {
  const timestamp = Date.now();
  obj.timestamp = timestamp;
  obj.aussieTime = getAusTimestamp(timestamp);
  return obj;
};
