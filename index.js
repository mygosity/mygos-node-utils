/**
 * THIS IS A DUMMY FILE TO SHOW HOW TO USE THE UTILITIES
 * REPLACE AND DO WHAT YOU WANT WITH IT
 */
import logger from './lib/logger';
logger.configure({
  errorPath: '../../errorlogs/', //relative paths from the folder logger - this will make a new folder in the root
  loggingPath: '../../logging/', //relative paths from the folder logger - this will make a new folder in the root
});
import CommandLine from './lib/commandLine';
import * as fileHelper from './lib/file';
import fileManager from './lib/file/manager';
import * as utils from './lib/common';

const commandLine = new CommandLine({
  console: console,
  utils,
  fileHelper,
  fileManager,
});

function Main() {
  logger.log('Main:: starting application');
  commandLine.startListeningForCommands();
}
Main();
