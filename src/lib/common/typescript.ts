import { prefillDefaultOptions } from '../common';
import { isEmpty, isObject } from '../common/validation';
import { Dictionary } from '../typedefinitions';

const TAB = '\t',
	ENDLINE = '\n',
	SEMICOLON = ';',
	COMMA = ',',
	WHITESPACE = ' ',
	EMPTY_STRING = '';

const ARRAY_BRACKETS = '[]',
	LEFT_BRACE = '{',
	RIGHT_BRACE = '}';

const COMMENT_BLOCK_START = `/**`,
	COMMENT_BLOCK_NEXT_LINE = `${ENDLINE}*${TAB}`,
	COMMENT_BLOCK_END = `*/`;

const TYPE_OBJECT = 'object',
	TYPE_NULLABLE = '?',
	TYPE_DEFAULT_ANY = 'any';

function removeAllWhiteSpaces(input: string): string {
	let answer = '';
	for (let i = 0; i < input.length; ++i) {
		if (input[i] !== WHITESPACE) {
			answer += input[i];
		}
	}
	return answer;
}

export function capitalizeInterfaceName(input: string): string {
	let answer = input.charAt(0).toUpperCase() + removeAllWhiteSpaces(input.substring(1));
	return answer;
}

function shouldSurroundWithQuotes(type: string): boolean {
	return type.indexOf(WHITESPACE) !== -1 || !isNaN(Number(type[0]));
}

function printObjectKey(type: string, optionalTypeDecorator: string) {
	return shouldSurroundWithQuotes(type)
		? `'${type}${optionalTypeDecorator}': `
		: `${type}${optionalTypeDecorator}: `;
}

function printArrBracketsForEachDepth(depth: number): string {
	let a = EMPTY_STRING;
	for (let i = 0; i < depth; ++i) a += ARRAY_BRACKETS;
	return a;
}

function printTabsForEachDepth(depth: number): string {
	let answer = EMPTY_STRING;
	for (let i = 0; i < depth; ++i) answer += TAB;
	return answer;
}

function parsedArrayType(
	type: string,
	data: any,
	optionalData: any,
	depth: number = 1,
	arrayDepth: number = 1,
	singleProperty: boolean = false,
): string {
	let answer = EMPTY_STRING,
		ending = !singleProperty
			? printArrBracketsForEachDepth(arrayDepth) + COMMA
			: printArrBracketsForEachDepth(arrayDepth);

	let model = {},
		nullableProps = {};
	let allnull = true;
	for (let i = 0; i < data.length; ++i) {
		const current = data[i];
		const currentDataType = typeof current;
		if (currentDataType !== TYPE_OBJECT) {
			allnull = false;
			answer = currentDataType.toString();
			break;
		} else {
			//current can be an object and be null
			if (current == null) {
				continue;
			} else {
				allnull = false;
				if (Array.isArray(current)) {
					answer += parsedArrayType(type, data, optionalData, depth + 1, arrayDepth + 1);
				} else if (isObject(current)) {
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
				}
			}
		}
	}
	if (allnull) {
		answer = TYPE_DEFAULT_ANY;
	} else if (!isEmpty(model)) {
		for (let prop in nullableProps) {
			const temp = model[prop];
			delete model[prop];
			model[prop + TYPE_NULLABLE] = temp;
		}
		if (optionalData.queuedInterfaces === null && type !== null) {
			answer += parsedDataType(null, model, optionalData, depth - 1);
		} else {
			answer += capitalizeInterfaceName(type) + optionalData.defaultInterfaceNameEnding;
			optionalData.queuedInterfaces[answer] = model;
		}
	}
	answer += ending;
	return answer;
}

function parsedObjectType(
	type: string,
	fromParsedArrayType: boolean,
	data: any,
	optionalData: ParseOptions,
	depth: number,
) {
	let answer = '';
	let ending = '';
	if (optionalData.queuedInterfaces !== null && type !== null) {
		answer = capitalizeInterfaceName(type) + optionalData.defaultInterfaceNameEnding;
		optionalData.queuedInterfaces[answer] = data;
	} else {
		answer = LEFT_BRACE + ENDLINE;
		for (let i = 0; i < depth; ++i) ending += TAB;
		for (let perType in data) {
			answer += parsedDataType(perType, data[perType], optionalData, depth + 1);
		}
		ending += RIGHT_BRACE;
	}
	if (!fromParsedArrayType) {
		ending += COMMA;
	}
	return [answer, ending];
}

function parsedDataType(type: string, data: any, optionalData: any, depth: number = 1): string {
	let answer = EMPTY_STRING,
		ending = EMPTY_STRING;

	const optionalTypeDecorator = data == null ? TYPE_NULLABLE : EMPTY_STRING,
		fromParsedArrayType = type == null;

	if (!fromParsedArrayType) {
		answer += printTabsForEachDepth(depth);
		answer += printObjectKey(type, optionalTypeDecorator);
	}

	const currentDataType = typeof data;
	if (currentDataType !== TYPE_OBJECT) {
		answer += currentDataType.toString() + SEMICOLON;
	} else {
		//data can be an object and be null
		if (data == null) {
			answer += TYPE_DEFAULT_ANY + SEMICOLON;
		} else if (Array.isArray(data)) {
			answer += parsedArrayType(type, data, optionalData, depth + 1);
		} else if (isObject(data)) {
			const [first, last] = parsedObjectType(
				type,
				fromParsedArrayType,
				data,
				optionalData,
				depth,
			);
			answer += first;
			ending += last;
		}
	}
	answer += ending;
	if (!fromParsedArrayType) {
		answer += ENDLINE;
	}
	return answer;
}

interface ParseOptions {
	queuedInterfaces: Dictionary<any>;
	defaultInterfaceNameEnding: string;
}

export interface ConvertToTypeOptions {
	excludeTypes?: string[]; // list of all interface properties to exclude from mapping
	autoInnerInterface?: boolean; // automatically create interfaces if a property is another object construct
	maxAutoInnerInterfaceDepth?: number; // specify the depth at which to automatically create interfaces inside an object (1 is 1 past the root)
	defaultInterfaceNameEnding?: string; // the string to append to automatic interface names
	defaultExport?: boolean; // default choice to export
	autoExportMap?: { [interfaceName: string]: boolean }; // map of all interface names and choice to export
	headerCommentMap?: { [interfaceName: string]: string }; // custom comments mapped to interface names in a dictionary
}

const defaultConvertToTypeOptions: ConvertToTypeOptions = {
	excludeTypes: [],
	autoInnerInterface: false,
	maxAutoInnerInterfaceDepth: -1,
	defaultExport: true,
	autoExportMap: null,
	headerCommentMap: null,
	defaultInterfaceNameEnding: 'Type',
};

export function prettifyCommentBlock(input: string[]): string {
	let answer = `${COMMENT_BLOCK_START}` + COMMENT_BLOCK_NEXT_LINE;
	for (let i = 0; i < input.length; ++i) {
		answer += input[i];
		if (i < input.length - 1) {
			answer += COMMENT_BLOCK_NEXT_LINE;
		}
	}
	return answer + `${ENDLINE}${COMMENT_BLOCK_END}${ENDLINE}`;
}

export function convertToTypeDefinition(
	interfaceName: string,
	data: any,
	options: ConvertToTypeOptions = {},
	recursionDepth: number = 1,
): string {
	options = prefillDefaultOptions(options, defaultConvertToTypeOptions);

	let answer = '';
	if (options.headerCommentMap != null && options.headerCommentMap[interfaceName] !== undefined) {
		answer += options.headerCommentMap[interfaceName];
	}
	let exportString = options.defaultExport ? 'export ' : '';
	if (options.autoExportMap != null && options.autoExportMap[interfaceName] !== undefined) {
		exportString = options.autoExportMap[interfaceName] ? 'export ' : '';
	}

	let exclusions: Dictionary<boolean> = {};
	for (let i = 0; i < options.excludeTypes.length; ++i) {
		exclusions[options.excludeTypes[i]] = true;
	}

	const shouldCreateInterface =
		(options.maxAutoInnerInterfaceDepth === -1 ||
			options.maxAutoInnerInterfaceDepth >= recursionDepth) &&
		options.autoInnerInterface;

	const queuedInterfaces: Dictionary<any> = shouldCreateInterface ? {} : null;
	const parseOptions: ParseOptions = {
		queuedInterfaces,
		defaultInterfaceNameEnding: options.defaultInterfaceNameEnding,
	};

	let fromArray = false;
	if (Array.isArray(data)) {
		fromArray = true;
		answer += `${exportString}type ${interfaceName} = `;
		answer += parsedArrayType(interfaceName, data, parseOptions, 1, 1, true);
	} else {
		answer += `${exportString}interface ${interfaceName} ${LEFT_BRACE}${ENDLINE}`;
		for (let type in data) {
			if (!exclusions[type]) {
				const currentData = data[type];
				answer += parsedDataType(type, currentData, parseOptions, 1);
			}
		}
	}
	answer = !fromArray
		? answer + RIGHT_BRACE + SEMICOLON + ENDLINE + ENDLINE
		: answer + SEMICOLON + ENDLINE + ENDLINE;
	if (parseOptions.queuedInterfaces !== null) {
		answer += recursivelyHandleQueuedInterfaces(
			parseOptions.queuedInterfaces,
			options,
			recursionDepth + 1,
		);
	}
	return answer;
}

function recursivelyHandleQueuedInterfaces(
	queuedInterfaces: Dictionary<any>,
	options: ConvertToTypeOptions,
	recursionDepth: number,
): string {
	let answer = '';
	for (let type in queuedInterfaces) {
		answer += convertToTypeDefinition(type, queuedInterfaces[type], options, recursionDepth);
	}
	return answer;
}
