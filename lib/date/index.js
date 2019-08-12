import moment from 'moment-timezone';

export const getNonce = () => {
  return moment().format('x');
};

export const getCreationTime = () => {
  return moment();
};

export const getDateFormat = (date, formatStr = 'YYYY-MM-DD') => {
  return moment(date).format(formatStr);
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

//converting unix time to iso string
//var s = new Date(1331209044000).toISOString();
