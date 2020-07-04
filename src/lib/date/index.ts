import moment from 'moment-timezone';
import utils from '../common';
import { AcceptableDateFormat } from '../typedefinitions';

export const getDateFormat = (
	date: AcceptableDateFormat,
	formatStr: string = 'YYYY-MM-DD',
): string => {
	return moment(date).format(formatStr);
};

export const msDifference = (timestamp: number): number => {
	return Date.now() - timestamp;
};

export const timeDifference = (
	from: number,
	to: AcceptableDateFormat,
	type: moment.unitOfTime.Diff = 'days',
): number => {
	const fromTime = moment(from);
	const toTime = to ? moment(to) : moment();
	return fromTime.diff(toTime, type);
};

export const getAusTimestamp = (
	date: AcceptableDateFormat,
	formatStr: string = 'YYYY-MM-DD HH:mm:ss.SSS',
): string => {
	return date
		? moment(date)
				.tz('Australia/Sydney')
				.format(formatStr)
		: moment()
				.tz('Australia/Sydney')
				.format(formatStr);
};

export const wrapWithAusTimeStamp = (obj: any, key?: string): any => {
	if (!utils.isObject(obj)) {
		if (Array.isArray(obj)) {
			obj = key !== undefined ? { [key]: [...obj] } : { data: [...obj] };
		} else {
			obj = { [key]: obj };
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
