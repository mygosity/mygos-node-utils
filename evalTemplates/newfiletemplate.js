const {
	dbManager,
	eventcontrol,
	fileHelper,
	webClient,
	hotReloadFile, //
	paths,
	logger,
	dateUtils,
	utils,
	getEnv,
} = globalContext;
const {
	getTranspiledData,
	formattingUtils,
	mathUtils,
	miscUtils,
	validationUtils,
	getErrorCode,
	getFloatInsideString,
	getStringBetweenChars,
	getStringBetweenStrings,
	prettyJson,
	prettyParse,
	prettyWrapWithTimestamp,
	safeJsonParse,
	safeJsonStringify,
	splitInReverseByCondition,
	tryParseFloat,
	tryParseInteger,
} = utils.default;
const {
	getDateFormat,
	msDifference,
	timeDifference,
	getAusTimestamp,
	wrapWithAusTimeStamp,
	updateTimestamp,
	getCurrentMinuteInterval,
	TIME,
} = dateUtils;
const { getFormattedNumber, getFormattedPrice, getHumanReadableTime, getPaddedZeroes } = formattingUtils;
const { approximates, autoWrap, clamp, epsilon, roundToDecimalPlaces } = mathUtils;
const { deepCopy, downloadFile, getParametizedUrl, getStringByteCount, noop, prefillDefaultOptions, retryPromise } = miscUtils;
const { isEmpty, isInvalidNumber, isNumber, isNumberByRegexp, isObject, isObjectEmpty, isObjectOrArray } = validationUtils;

async function loadCodeFile(path) {
	const { data, success } = await hotReloadFile(paths.root + '/' + path);
	if (success) {
		eval(data.toString());
	}
}

const LOG_TAG = 'code.js';

async function main() {
	try {
		console.log(`***************${LOG_TAG}::main()***************`);
		const basePath = 'evalCode/';
		// await loadCodeFile(basePath + 'test.js');
	} catch (e) {
		console.log(e);
	}
}
main();
