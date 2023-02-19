const {
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

async function main() {
	try {
		console.log('***************main()***************');
		const basePath = 'evalCode/';

		// await loadCodeFile(basePath + 'filename.js');
	} catch (e) {
		console.log(e);
	}
}
main();
