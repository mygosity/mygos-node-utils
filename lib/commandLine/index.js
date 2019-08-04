import logger from '../logger';
import * as consoleHelper from './helper';

let _instance = null;
let _prevTimestamp = Date.now();

export default class CommandLine {
  constructor(keyValueRefs, yourOwnRefsOnly = false) {
    if (_instance !== null) {
      throw new Error('CommandLine:: THERE CAN ONLY BE ONE, instance exists, this is a singleton');
    }
    _instance = this;
    this.refs = {
      ...keyValueRefs,
    };
    if (!yourOwnRefsOnly) {
      this.refs.consoleHelper = consoleHelper;
      this.refs.logger = logger;
    }
    this.refs.commandLine = _instance;
    this.config = {
      pollLog: true,
      readingCommands: false,
      offcommand: false,
      pollInterval: 5000,
      parser: {
        pollLog: (value) => (value == 'true' ? true : false),
        readingCommands: (value) => (value == 'true' ? true : false),
        offcommand: (value) => (value == 'true' ? true : false),
        pollInterval: (value) => parseInt(value),
      },
    };
  }

  beginAutoPolling = () => {
    this.loop = setTimeout(this.poll, this.getInterval());
  };

  poll = () => {
    const delta = Date.now() - _prevTimestamp;
    _prevTimestamp = Date.now();
    if (this.config.pollLog) {
      logger.log(`${delta}ms`);
    }
    //poll start looping forever
    eventcontrol.emit(eventTypes.PRINT_AVERAGE_PRICE);
    this.loop = setTimeout(this.poll, this.getInterval());
  };

  setConfig = (prop, value) => {
    if (prop == undefined) return;
    if (this.config[prop] !== undefined) {
      this.config[prop] = this.config.parser[prop](value);
      logger.log(this.config, prop, value);
    }
  };

  getInterval = () => {
    return this.config.pollInterval;
  };

  commandHandler = (input) => {
    try {
      if (this.config.pollLog) {
        this.config.pollLog = false;
      }
      logger.log(`commandLine=> commandHandler:: handling input: ${input}`);
      // if (input === 'exit') {
      //   this.stopListeningForCommands();
      // }
      const spaceIndex = input.indexOf(' ');
      const inputFirstParam = spaceIndex !== -1 ? input.substring(0, spaceIndex) : input;
      logger.log(`commandLine=> commandHandler::`, inputFirstParam);
      const target = consoleHelper.extractTarget(this.refs, inputFirstParam);
      logger.log(`commandLine=> commandHandler:: target: `, target);
      if (target) {
        logger.log(`commandLine=> commandHandler:: firing command: spaceIndex: ` + spaceIndex);
        if (spaceIndex !== -1) {
          const wordAfterSpace = input.substring(spaceIndex + 1);
          const args = spaceIndex !== -1 ? consoleHelper.extractArguments(this.refs, wordAfterSpace) : null;
          target(...args);
        } else {
          target();
        }
      }
    } catch (error) {
      logger.error(this, error, { funcName: 'commandHandler', input });
    }
    consoleHelper.readline.prompt();
  };

  startListeningForCommands = async () => {
    try {
      if (this.config.readingCommands) {
        logger.log('commandLine=> is already reading commands');
        return 'commandLine=> is already reading commands';
      }
      this.config.readingCommands = true;
      logger.log('startListeningForCommands:: is now reading commands');
      consoleHelper.readline.on('line', this._proxyHandler);
      consoleHelper.readline.prompt();
    } catch (error) {
      logger.error(this, error, { funcName: 'startListeningForCommands' });
      return 'commandLine=> failed to startListeningForCommands';
    }
    return 'commandLine=> has started to read commands';
  };

  stopListeningForCommands = () => {
    consoleHelper.readline.removeListener('line', this.commandHandler);
    this.config.readingCommands = false;
  };

  _proxyHandler = (input) => {
    if (this.testing) {
      this._testHandler(input);
    } else {
      this.commandHandler(input);
    }
  };

  _toggleTestingMode = () => {
    this.testing = !this.testing ? true : false;
    logger.log('commandLine=> this.testing: ' + this.testing);
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
