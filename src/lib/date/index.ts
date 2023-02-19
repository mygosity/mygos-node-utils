import moment from 'moment-timezone';
import { isObject } from '../common/pure/validation';
export type AcceptableDateFormat = Date | number | string;

export const getDateFormat = (date: AcceptableDateFormat, formatStr: string = 'YYYY-MM-DD'): string => {
	return moment(date).format(formatStr);
};

export const msDifference = (timestamp: number): number => {
	return Date.now() - timestamp;
};

export const timeDifference = (from: number, to: AcceptableDateFormat, type: string = 'days'): number => {
	const fromTime = moment(from);
	const toTime = to ? moment(to) : moment();
	return fromTime.diff(toTime, type as moment.unitOfTime.Diff);
};

export const getAusTimestamp = (date: AcceptableDateFormat, formatStr: string = 'YYYY-MM-DD HH:mm:ss.SSS'): string => {
	return date ? moment(date).tz('Australia/Sydney').format(formatStr) : moment().tz('Australia/Sydney').format(formatStr);
};

export const wrapWithAusTimeStamp = (obj: any, key?: string): any => {
	if (!isObject(obj)) {
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

export function getCurrentMinuteInterval() {
	return Math.floor(Date.now() / 60000);
}

export const TIME = {
	SECOND: 1000,
	MINUTE: 60000,
	HOUR: 3600000,
	DAY: 86400000,
};
