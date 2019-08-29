import * as utils from '../../common';
import { ListenersOptionType, WebsocketClientOptionsType } from '../node/client';

function WebsocketClientOptions() {
  this.id = '000';
  this.retryLimit = -1;
  this.retryTimer = 10 * 1000;
  this.minTimeSinceLastUpdate = 2.5 * 1000;
  this.maxTimeSinceLastUpdate = 10 * 1000;
  this.autoRetry = true;
  this.autoKeepAliveMaxTime = 1 * 60 * 1000;
  this.keepAliveTimeInterval = 1000;
  this.autoKeepAliveCallback = undefined;
  this.resetKeepAliveTimeOnPong = undefined;
  this.socketargs = undefined;
}
const defaultWebsocketClientOptions = new WebsocketClientOptions();

/**
 * Websocket client for a browser application
 * This will use an automatic keep alive system by default
 * which must be paied with the server.js located in the same folder
 */
export default class WebSocketClient {
  logSignature: string;
  connection: any;
  url: string;
  autoRetry: boolean;
  retryLimit: number;
  retryTimer: number;

  minTimeSinceLastUpdate: number;
  maxTimeSinceLastUpdate: number;
  autoKeepAliveMaxTime: number;
  keepAliveTimeInterval: number;
  resetKeepAliveTimeOnPong: boolean;
  autoKeepAliveCallback: Function;
  socketargs: any[];

  retryCount: number;
  forcedClose: any;
  prevEventTime: number;
  keepAliveLoop: NodeJS.Timeout | number;
  retryLoop: NodeJS.Timeout | number;
  lastKeepAliveTime: number;

  onmessage: Function;
  onopen?: Function;
  onerror?: Function;
  onclose?: Function;
  onping?: Function;
  onpong?: Function;

  constructor(
    url: string,
    onmessage: Function,
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

  onPing = () => {
    this.connection.pong();
  };

  onPong = () => {
    if (this.onpong !== undefined) {
      this.onpong();
    }
    if (this.resetKeepAliveTimeOnPong) {
      this.prevEventTime = Date.now();
    }
  };

  loadWebsocketConnections = () => {
    this.connection =
      this.socketargs !== undefined ? new WebSocket(this.url, this.socketargs) : new WebSocket(this.url);
    this.prevEventTime = Date.now();

    this.connection.onopen = (event) => {
      if (this.retryLoop != null) {
        utils.stopTimer(this.retryLoop);
      }
      this.retryCount = 0;
      this.retryLoop = null;
      this.forcedClose = null;
      this.startKeepAlive();
      if (this.onopen !== undefined) {
        this.onopen(event, this.connection);
      }
    };

    this.connection.onerror = (error) => {
      this.startRetrying();
      if (this.onerror !== undefined) {
        this.onerror(error);
      }
    };

    this.connection.onclose = (event) => {
      // console.log('onclose:: ');
      // console.trace();
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
        this.onclose(event);
      }
    };

    this.connection.onmessage = (message: any) => {
      this.prevEventTime = Date.now();
      this.onmessage(message);
    };
  };

  forceConnectionClose = (msg?: string) => {
    this.forcedClose = msg;
    if (this.connection != null) {
      this.connection.close();
    }
  };

  checkAliveStatus = () => {
    const currentTime = Date.now();
    const msSinceLastUpdate = currentTime - this.prevEventTime;
    if (msSinceLastUpdate > this.maxTimeSinceLastUpdate) {
      this.forceConnectionClose();
      this.startRetrying();
    } else if (msSinceLastUpdate > this.minTimeSinceLastUpdate) {
      this.handleKeepAlive();
    }
    if (this.lastKeepAliveTime == null || currentTime - this.lastKeepAliveTime > this.autoKeepAliveMaxTime) {
      this.handleKeepAlive();
    }
  };

  handleKeepAlive() {
    if (this.connection != null && this.connection.readyState === WebSocket.OPEN) {
      this.lastKeepAliveTime = Date.now();
      this.autoKeepAliveCallback();
    }
  }

  startKeepAlive = () => {
    if (this.autoKeepAliveCallback !== undefined) {
      this.keepAliveLoop = setInterval(this.checkAliveStatus, this.keepAliveTimeInterval);
    }
  };

  startRetrying = () => {
    if (this.autoRetry) {
      this.retryCount = 0;
      if (this.retryLoop == null) {
        this.startServer();
        this.retryLoop = setInterval(this.startServer, this.retryTimer);
      }
    }
  };

  startServer = () => {
    if (this.retryLimit < 0 || this.retryCount < this.retryLimit) {
      this.loadWebsocketConnections();
    } else {
      utils.stopTimer(this.retryLoop);
      this.retryLoop = null;
    }
    this.retryCount++;
  };
}