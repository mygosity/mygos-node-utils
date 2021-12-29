import utils from '../index';

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

const shouldSurroundWithQuotes = (type: string): boolean => {
	return type.indexOf(WHITESPACE) !== -1 || !isNaN(Number(type[0]));
};

const printObjectKey = (type: string, optionalTypeDecorator: string) =>
	shouldSurroundWithQuotes(type)
		? `'${type}${optionalTypeDecorator}': `
		: `${type}${optionalTypeDecorator}: `;

const printArrBracketsForEachDepth = (depth: number): string => {
	let a = EMPTY_STRING;
	for (let i = 0; i < depth; ++i) a += ARRAY_BRACKETS;
	return a;
};

const printTabsForEachDepth = (depth: number): string => {
	let answer = EMPTY_STRING;
	for (let i = 0; i < depth; ++i) answer += TAB;
	return answer;
};

const parsedArrayType = (data: any, depth: number = 1, arrayDepth: number = 1): string => {
	let answer = EMPTY_STRING,
		ending = printArrBracketsForEachDepth(arrayDepth) + COMMA;

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
					answer += parsedArrayType(data, depth + 1, arrayDepth + 1);
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
				}
			}
		}
	}
	if (allnull) {
		answer = TYPE_DEFAULT_ANY;
	} else if (!utils.isEmpty(model)) {
		for (let prop in nullableProps) {
			const temp = model[prop];
			delete model[prop];
			model[prop + TYPE_NULLABLE] = temp;
		}
		answer += parsedDataType(null, model, depth - 1);
	}
	answer += ending;
	return answer;
};

const parsedDataType = (type: string, data: any, depth: number = 1): string => {
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
			answer += parsedArrayType(data, depth + 1);
		} else if (utils.isObject(data)) {
			answer += LEFT_BRACE + ENDLINE;
			for (let i = 0; i < depth; ++i) ending += TAB;
			for (let perType in data) {
				answer += parsedDataType(perType, data[perType], depth + 1);
			}
			ending += RIGHT_BRACE;
			if (!fromParsedArrayType) {
				ending += COMMA;
			}
		}
	}
	answer += ending;
	if (!fromParsedArrayType) {
		answer += ENDLINE;
	}
	return answer;
};

export interface ConvertToTypeOptions {
	excludeTypes?: string[];
	headerBlockComment?: string;
}

const defaultConvertToTypeOptions: ConvertToTypeOptions = {
	excludeTypes: [],
	headerBlockComment: EMPTY_STRING,
};

export const prettifyCommentBlock = (input: string[]): string => {
	let answer = `${COMMENT_BLOCK_START}` + COMMENT_BLOCK_NEXT_LINE;
	for (let i = 0; i < input.length; ++i) {
		answer += input[i];
		if (i < input.length - 1) {
			answer += COMMENT_BLOCK_NEXT_LINE;
		}
	}
	return answer + `${ENDLINE}${COMMENT_BLOCK_END}${ENDLINE}`;
};

export const convertToTypeDefinition = (interfaceName: string, data: any, options = {}): string => {
	const { excludeTypes, headerBlockComment } = utils.prefillDefaultOptions(
		options,
		defaultConvertToTypeOptions,
	);
	let answer = headerBlockComment;
	answer += `export interface ${interfaceName} ${LEFT_BRACE}${ENDLINE}`;
	let exclusions = {};
	for (let i = 0; i < excludeTypes.length; ++i) {
		exclusions[excludeTypes[i]] = true;
	}
	for (let type in data) {
		if (!excludeTypes[type]) {
			answer += parsedDataType(type, data[type], 1);
		}
	}
	return answer + RIGHT_BRACE + SEMICOLON;
};
