/**
 * THIS IS A DUMMY FILE TO SHOW HOW TO USE THE UTILITIES
 * REPLACE AND DO WHAT YOU WANT WITH IT
 */
export const paths = {
  root: require("path").resolve(__dirname, "./"),
  logging: "logging/",
  error: "errorlogs/"
};

import fileHelper from "./lib/file";
import fileManager from "./lib/file/manager";
import logger from "./lib/logger";
logger.configure({
  errorPath: paths.error,
  loggingPath: paths.logging,
  reportVoice: {
    [fileHelper.logSignature]: true,
    [fileManager.logSignature]: true
  }
});
fileHelper.setBasePath(paths.root);

import CommandLine from "./lib/commandLine";
import * as utils from "./lib/common";

const commandLine = new CommandLine({
  console: console,
  utils,
  fileHelper,
  fileManager,
  logger
});
const interceptor = input => {
  if (input === "something") {
    //do something
    console.log("interceptor::", input);
    //return something other than null / undefined to prevent further execution
    return 1;
  }
};

function Main() {
  logger.log("Main:: starting application");
  commandLine.startListeningForCommands();
}
Main();
