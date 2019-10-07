import logger from '../logger';
import * as consoleHelper from './helper';
import { Dictionary } from '../typedefinitions';

import rl from 'readline';
const readline = rl.createInterface({ input: process.stdin, output: process.stdout });

let _instance = null;

export default class CommandLine {
	logSignature: string;
	refs: Dictionary<any>;
	config: {
		readingCommands: boolean;
		parser?: Dictionary<any>;
	};
	commandInterceptor?: Function;
	testing?: boolean;

	constructor(keyValueRefs: Dictionary<any>, yourOwnRefsOnly: boolean = false) {
		if (_instance !== null) {
			throw new Error('CommandLine:: THERE CAN ONLY BE ONE, instance exists, this is a singleton');
		}
		_instance = this;
		this.refs = {
			...keyValueRefs,
		};
		this.logSignature = 'CommandLine=>';
		if (!yourOwnRefsOnly) {
			this.refs.consoleHelper = consoleHelper;
			this.refs.logger = logger;
		}
		this.refs.commandLine = _instance;
		this.config = {
			readingCommands: false,
		};
	}

	setCommandInterceptor = (func: Function) => {
		this.commandInterceptor = func;
	};

	setConfig = (prop: string, value: any) => {
		if (prop == undefined) return;
		if (this.config[prop] !== undefined) {
			this.config[prop] = this.config.parser[prop](value);
			logger.report(this, this.config, prop, value);
		}
	};

	commandHandler = async (input: string) => {
		try {
			logger.report(this, `commandLine=> commandHandler:: handling input: ${input}`);
			if (
				this.commandInterceptor == null ||
				(this.commandInterceptor !== undefined && (await this.commandInterceptor(input)) == null)
			) {
				const spaceIndex = input.indexOf(' ');
				const inputFirstParam = spaceIndex !== -1 ? input.substring(0, spaceIndex) : input;
				logger.report(this, `commandLine=> commandHandler::`, inputFirstParam);
				const target = consoleHelper.extractTarget(this.refs, inputFirstParam);
				logger.report(this, `commandLine=> commandHandler:: target: `, target);
				if (target) {
					logger.report(this, `commandLine=> commandHandler:: firing command: spaceIndex: ` + spaceIndex);
					if (spaceIndex !== -1) {
						const wordAfterSpace = input.substring(spaceIndex + 1);
						const args =
							spaceIndex !== -1 ? consoleHelper.extractArguments(this.refs, wordAfterSpace) : null;
						target(...args);
					} else {
						target();
					}
				}
			}
		} catch (error) {
			logger.error(this, error, {
				funcName: 'commandHandler',
				input,
			});
		}
		readline.prompt();
	};

	startListeningForCommands = async (): Promise<string> => {
		try {
			if (this.config.readingCommands) {
				logger.report(this, 'commandLine=> is already reading commands');
				return 'commandLine=> is already reading commands';
			}
			this.config.readingCommands = true;
			logger.report(this, 'startListeningForCommands:: is now reading commands');
			readline.on('line', this._proxyHandler);
			readline.prompt();
		} catch (error) {
			logger.error(this, error, {
				funcName: 'startListeningForCommands',
			});
			return 'commandLine=> failed to startListeningForCommands';
		}
		return 'commandLine=> has started to read commands';
	};

	stopListeningForCommands = () => {
		readline.removeListener('line', this.commandHandler);
		this.config.readingCommands = false;
	};

	_proxyHandler = (input: string) => {
		if (this.testing) {
			this._testHandler(input);
		} else {
			this.commandHandler(input);
		}
	};

	_toggleTestingMode = () => {
		this.testing = !this.testing ? true : false;
		logger.report(this, 'commandLine=> this.testing: ' + this.testing);
	};

	_testHandler = (input) => {
		this.commandHandler(input);
		this.commandHandler(input);
		this.commandHandler(input);
		this.commandHandler(input);
		this.commandHandler(input);
		this.commandHandler(input);
	};
}
