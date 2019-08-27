import moment from 'moment-timezone';
import * as utils from '../common';

export const getDateFormat = (date, formatStr = 'YYYY-MM-DD') => {
  return moment(date).format(formatStr);
};

export const msDifference = (timestamp) => {
  return Date.now() - timestamp;
};

export const timeDifference = (from, to, type = 'days') => {
  const fromTime = moment(from);
  const toTime = to ? moment(to) : moment();
  return fromTime.diff(toTime, type);
};

export const getAusTimestamp = (date, formatStr = 'YYYY-MM-DD HH:mm:ss') => {
  return date
    ? moment(date)
        .tz('Australia/Sydney')
        .format(formatStr)
    : moment()
        .tz('Australia/Sydney')
        .format(formatStr);
};

export const wrapWithAusTimeStamp = (obj) => {
  if (!utils.isObject(obj)) {
    if (Array.isArray(obj)) {
      obj = { ...obj };
    } else {
      obj = { key: obj };
    }
  }
  const timestamp = Date.now();
  return {
    ...obj,
    timestamp,
    aussieTime: getAusTimestamp(timestamp),
  };
};

export const updateTimestamp = (obj) => {
  const timestamp = Date.now();
  obj.timestamp = timestamp;
  obj.aussieTime = getAusTimestamp(timestamp);
  return obj;
};
