import WebSocket from "ws";
import logger from "../../logger";
import * as utils from "../../common";

let instanceCount = 0;

function WebsocketClientOptions() {
  this.id = instanceCount++;
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
 * This websocket client is for node as it relies on the
 * ws package
 */
export default class WebSocketClient {
  constructor(url, onmessage, listeners = {}, options = {}) {
    this.connection = null;
    this.url = url;
    this.onmessage = onmessage;
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

    options = utils.prefillDefaultOptions(options, defaultWebsocketClientOptions);
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

  //Sec-WebSocket-Protocol request header args
  loadWebsocketConnections = () => {
    this.connection = this.socketargs !== undefined ? new WebSocket(this.url, this.socketargs) : new WebSocket(this.url);
    this.prevEventTime = Date.now();

    this.connection.on("pong", this.onPong);

    this.connection.onopen = event => {
      logger.report(this, "onopen::");
      if (this.retryLoop != null) {
        utils.stopTimer(this.retryLoop);
      }
      this.retryCount = 0;
      this.retryLoop = null;
      this.forcedClose = null;
      this.startKeepAlive();
      if (this.onopen !== undefined) {
        this.onopen(event);
      }
    };

    this.connection.onerror = error => {
      logger.report(this, "onerror:: error:");
      this.startRetrying();
      if (this.onerror !== undefined) {
        this.onerror(error);
      }
    };

    this.connection.onclose = event => {
      logger.report(this, "onclose:: event: ");
      if (this.keepAliveLoop != null) {
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

    this.connection.onmessage = message => {
      this.prevEventTime = Date.now();
      this.onmessage(message);
    };
  };

  forceConnectionClose = msg => {
    logger.report(this, "forceConnectionClose::" + msg);
    this.forcedClose = msg;
    if (this.connection != null) {
      this.connection.close();
    }
  };

  checkAliveStatus = () => {
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
    if (this.lastKeepAliveTime == null || currentTime - this.lastKeepAliveTime > this.autoKeepAliveMaxTime) {
      // logger.report(
      //   this,
      //   'checkAliveStatus:: currentTime - this.lastKeepAliveTime > this.autoKeepAliveMaxTime',
      // );
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
      logger.report(this, "startRetrying::");
      // this.forceConnectionClose('retrying');
      this.retryCount = 0;
      if (this.retryLoop == null) {
        this.startServer();
        this.retryLoop = setInterval(this.startServer, this.retryTimer);
      }
    }
  };

  startServer = () => {
    if (this.retryLimit < 0 || this.retryCount < this.retryLimit) {
      logger.report(this, "startRetrying:: this.retryCount < this.retryLimit: || this.retryLimit < 0");
      this.loadWebsocketConnections();
    } else {
      utils.stopTimer(this.retryLoop);
      this.retryLoop = null;
    }
    this.retryCount++;
  };
}
