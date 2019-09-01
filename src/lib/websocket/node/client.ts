import WebSocket from 'ws';
import logger from '../../logger';
import * as utils from '../../common';

export interface ListenersOptionType {
  onopen?: (connection: WebSocket, event: WebSocket.OpenEvent) => void;
  onerror?: (connection: WebSocket, error: WebSocket.ErrorEvent) => void;
  onclose?: (connection: WebSocket, event: WebSocket.CloseEvent) => void;
  onping?: (connection: WebSocket) => void;
  onpong?: (connection: WebSocket) => void;
}

export interface WebsocketClientOptionsType {
  id?: string | number;
  autoRetry?: boolean;
  retryLimit?: number;
  retryTimer?: number;
  minTimeSinceLastUpdate?: number;
  maxTimeSinceLastUpdate?: number;
  autoKeepAliveMaxTime?: number;
  keepAliveTimeInterval?: number;
  resetKeepAliveTimeOnPong?: boolean;
  autoKeepAliveCallback?: () => void;
  socketargs?: WebSocket.ClientOptions;
}

let instanceCount = 0;

function WebsocketClientOptions() {
  this.id = instanceCount++;
  this.autoRetry = true;
  this.retryLimit = -1;
  this.retryTimer = 10 * 1000;
  this.minTimeSinceLastUpdate = 2.5 * 1000;
  this.maxTimeSinceLastUpdate = 10 * 1000;
  this.autoKeepAliveMaxTime = 1 * 60 * 1000;
  this.keepAliveTimeInterval = 1000;
  this.autoKeepAliveCallback = undefined;
  this.resetKeepAliveTimeOnPong = undefined;
  this.socketargs = undefined;
}
const defaultWebsocketClientOptions = new WebsocketClientOptions();

/**
 * This websocket client is for node as it relies on the
 * ws package
 */
export default class WebSocketClient {
  logSignature: string;
  connection: WebSocket;
  url: string;

  autoRetry: boolean;
  retryLimit: number;
  retryTimer: number;
  minTimeSinceLastUpdate: number;
  maxTimeSinceLastUpdate: number;
  autoKeepAliveMaxTime: number;
  keepAliveTimeInterval: number;
  resetKeepAliveTimeOnPong: boolean;
  autoKeepAliveCallback: () => void;
  socketargs: WebSocket.ClientOptions;

  retryCount: number;
  forcedClose: any;
  prevEventTime: number;
  keepAliveLoop: NodeJS.Timeout | number;
  retryLoop: NodeJS.Timeout | number;
  lastKeepAliveTime: number;

  onmessage: (connection: WebSocket, message: WebSocket.MessageEvent) => void;
  onopen?: (connection: WebSocket, event: WebSocket.OpenEvent) => void;
  onerror?: (connection: WebSocket, error: WebSocket.ErrorEvent) => void;
  onclose?: (connection: WebSocket, event: WebSocket.CloseEvent) => void;
  onping?: (connection: WebSocket) => void;
  onpong?: (connection: WebSocket) => void;

  constructor(
    url: string,
    onmessage: (connection: WebSocket, message: WebSocket.MessageEvent) => void,
    listeners: ListenersOptionType = {},
    options: WebsocketClientOptionsType = {},
  ) {
    this.connection = null;
    this.url = url;
    this.onmessage = onmessage;
    options = utils.prefillDefaultOptions(options, defaultWebsocketClientOptions);
    this.logSignature = `WebSocketClient${options.id}=>`;

    //optional
    if (listeners.onopen != null) {
      this.onopen = listeners.onopen;
    }

    if (listeners.onerror != null) {
      this.onerror = listeners.onerror;
    }

    if (listeners.onclose != null) {
      this.onclose = listeners.onclose;
    }

    if (listeners.onping != null) {
      this.onping = listeners.onping;
    }

    if (listeners.onpong != null) {
      this.onpong = listeners.onpong;
    }

    this.autoRetry = options.autoRetry;
    this.retryLimit = options.retryLimit;
    this.retryTimer = options.retryTimer;
    this.minTimeSinceLastUpdate = options.minTimeSinceLastUpdate;
    this.maxTimeSinceLastUpdate = options.maxTimeSinceLastUpdate;
    this.autoKeepAliveMaxTime = options.autoKeepAliveMaxTime;
    this.keepAliveTimeInterval = options.keepAliveTimeInterval;
    this.resetKeepAliveTimeOnPong = options.resetKeepAliveTimeOnPong;
    this.autoKeepAliveCallback = options.autoKeepAliveCallback;
    this.socketargs = options.socketargs;
    this.retryCount = 0;
    this.forcedClose = null;
    this.prevEventTime = null;
    this.keepAliveLoop = null;
    this.retryLoop = null;
    this.lastKeepAliveTime = null;
  }

  onPing = (): void => {
    if (this.onping !== undefined) {
      this.onping(this.connection);
    } else {
      this.connection.pong();
    }
  };

  onPong = (): void => {
    if (this.onpong !== undefined) {
      this.onpong(this.connection);
    }
    if (this.resetKeepAliveTimeOnPong) {
      this.prevEventTime = Date.now();
    }
  };

  //Sec-WebSocket-Protocol request header args
  loadWebsocketConnections = (): void => {
    this.connection =
      this.socketargs !== undefined
        ? new WebSocket(this.url, this.socketargs)
        : new WebSocket(this.url);
    this.prevEventTime = Date.now();

    this.connection.on('pong', this.onPong);

    this.connection.onopen = (event: WebSocket.OpenEvent): void => {
      logger.report(this, 'onopen::');
      if (this.retryLoop != null) {
        utils.stopTimer(this.retryLoop);
      }
      this.retryCount = 0;
      this.retryLoop = null;
      this.forcedClose = null;
      this.startKeepAlive();
      if (this.onopen !== undefined) {
        this.onopen(this.connection, event);
      }
    };

    this.connection.onerror = (error: WebSocket.ErrorEvent): void => {
      logger.report(this, 'onerror:: error:');
      // logger.report(this, 'onerror:: error:', event);
      this.startRetrying();
      if (this.onerror !== undefined) {
        this.onerror(this.connection, error);
      }
    };

    this.connection.onclose = (event: WebSocket.CloseEvent): void => {
      logger.report(this, 'onclose:: event: ');
      // logger.report(this, 'onclose:: event: ', event);
      if (this.keepAliveLoop != null) {
        // @ts-ignore
        clearInterval(this.keepAliveLoop);
      }
      this.connection = null;
      this.keepAliveLoop = null;
      if (this.forcedClose == null) {
        //restart the connection since we didn't force it to close
        this.startRetrying();
      }
      if (this.onclose !== undefined) {
        this.onclose(this.connection, event);
      }
    };

    this.connection.onmessage = (message: WebSocket.MessageEvent): void => {
      this.prevEventTime = Date.now();
      this.onmessage(this.connection, message);
    };
  };

  forceConnectionClose = (msg?: string): void => {
    logger.report(this, 'forceConnectionClose::' + msg);
    this.forcedClose = msg;
    if (this.connection != null) {
      this.connection.close();
    }
  };

  checkAliveStatus = (): void => {
    const currentTime = Date.now();
    const msSinceLastUpdate = currentTime - this.prevEventTime;
    if (msSinceLastUpdate > this.maxTimeSinceLastUpdate) {
      // logger.report(this, 'checkAliveStatus:: msSinceLastUpdate > this.maxTimeSinceLastUpdate');
      this.forceConnectionClose();
      this.startRetrying();
    } else if (msSinceLastUpdate > this.minTimeSinceLastUpdate) {
      // logger.report(this, 'checkAliveStatus:: msSinceLastUpdate > this.minTimeSinceLastUpdate');
      this.handleKeepAlive();
    }
    if (
      this.lastKeepAliveTime == null ||
      currentTime - this.lastKeepAliveTime > this.autoKeepAliveMaxTime
    ) {
      // logger.report(
      //   this,
      //   'checkAliveStatus:: currentTime - this.lastKeepAliveTime > this.autoKeepAliveMaxTime',
      // );
      this.handleKeepAlive();
    }
  };

  handleKeepAlive(): void {
    if (this.connection != null && this.connection.readyState === WebSocket.OPEN) {
      this.lastKeepAliveTime = Date.now();
      this.autoKeepAliveCallback();
    }
  }

  startKeepAlive = (): void => {
    if (this.autoKeepAliveCallback !== undefined) {
      this.keepAliveLoop = setInterval(this.checkAliveStatus, this.keepAliveTimeInterval);
    }
  };

  startRetrying = (): void => {
    if (this.autoRetry) {
      logger.report(this, 'startRetrying::');
      // this.forceConnectionClose('retrying');
      this.retryCount = 0;
      if (this.retryLoop == null) {
        this.startServer();
        this.retryLoop = setInterval(this.startServer, this.retryTimer);
      }
    }
  };

  startServer = (): void => {
    if (this.retryLimit < 0 || this.retryCount < this.retryLimit) {
      logger.report(
        this,
        'startRetrying:: this.retryCount < this.retryLimit: || this.retryLimit < 0',
      );
      this.loadWebsocketConnections();
    } else {
      utils.stopTimer(this.retryLoop);
      this.retryLoop = null;
    }
    this.retryCount++;
  };
}
