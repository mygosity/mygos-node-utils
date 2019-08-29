import logger from '../logger';
import * as dateUtils from '../date';
import * as utils from '../common';
import { WebsocketServerOptionsType } from './node/server';
import { KeyValuePair } from '../typedefinitions';

const logSignature = 'WebSocketServer=>';
const WebSocketServer = require('websocket').server;
const http = require('http');

let server,
  wsServer,
  connections = {};

function WebsocketServerOptions() {
  this.originPredicate = (origin) => {
    // put logic here to detect whether the specified origin is allowed.
    logger.report({ logSignature }, { src: 'originIsAllowed', origin });
    return true;
  };
  //   this.acceptProtocol = 'echo-protocol';
  this.onAuthRejectHandler = () => {};
  this.onconnectAccepted = (connection, request) => {};
  this.acceptProtocol = null;
  this.onclose = undefined;
  this.onerror = undefined;
  this.onpong = undefined;
  this.onutfmessage = undefined;
  this.onbinarymessage = undefined;
}
const defaultWebsocketServerOptions = new WebsocketServerOptions();

let _instance: WebSocketServerWrapper = null;
export default class WebSocketServerWrapper {
  logSignature: string;
  port: string;
  originPredicate: Function;
  onconnectAccepted: Function;
  acceptProtocol: string;
  onclose: Function;
  onerror: Function;
  onpong: Function;
  onAuthRejectHandler: Function;
  msgHandlers: {
    utf8?: Function;
    binary?: Function;
  };

  constructor(port: string, options: WebsocketServerOptionsType = {}) {
    if (_instance !== null) {
      throw new Error('WebSocketServerWrapper:: must be a singleton');
    }

    _instance = this;
    this.logSignature = logSignature;
    this.port = port;

    options = utils.prefillDefaultOptions(options, defaultWebsocketServerOptions);
    this.originPredicate = options.originPredicate;
    this.acceptProtocol = options.acceptProtocol;
    this.onconnectAccepted = options.onconnectAccepted;
    this.onclose = options.onclose;
    this.onerror = options.onerror;
    this.onpong = options.onpong;
    this.onAuthRejectHandler = options.onAuthRejectHandler;

    this.msgHandlers = {
      utf8: options.onutfmessage,
      binary: options.onbinarymessage,
    };
    if (options.msgHandlers !== undefined) {
      this.msgHandlers = { ...this.msgHandlers, ...options.msgHandlers };
    }
  }

  getConnections = () => {
    return connections;
  };

  getWebsocketServer = () => {
    return wsServer;
  };

  init = () => {
    server = http.createServer((request, response) => {
      logger.report(
        this,
        dateUtils.wrapWithAusTimeStamp({
          src: `http.createServer::`,
        }),
      );
      response.writeHead(404);
      response.end();
    });

    server.listen(this.port, () => {
      logger.report(
        this,
        dateUtils.wrapWithAusTimeStamp({
          src: `server.listen::`,
          msg: `Server is listening on port ${this.port}`,
        }),
      );
    });

    wsServer = new WebSocketServer({
      httpServer: server,
      // You should not use autoAcceptConnections for production
      // applications, as it defeats all standard cross-origin protection
      // facilities built into the protocol and the browser.  You should
      // *always* verify the connection's origin and decide whether or not
      // to accept it.
      autoAcceptConnections: false,
    });

    wsServer.on('request', (request) => {
      if (!this.originPredicate(request.origin, request)) {
        logger.report(this, 'request rejected: ' + request.remoteAddress);
        // Make sure we only accept requests from an allowed origin
        this.onAuthRejectHandler(request);
        request.reject(401, 'failed to authorize');
        logger.report(
          this,
          dateUtils.wrapWithAusTimeStamp({
            src: `wsServer.on('request') | !originIsAllowed | `,
            msg: ' Connection from origin ' + request.origin + ' rejected.',
          }),
        );
        return;
      }

      const connection = request.accept(this.acceptProtocol, request.origin);

      if (connections[connection.remoteAddress] === undefined) {
        connections[connection.remoteAddress] = dateUtils.wrapWithAusTimeStamp({
          connection,
        });
      }
      this.onconnectAccepted(connection, request);

      logger.report(
        this,
        dateUtils.wrapWithAusTimeStamp({
          src: `wsServer.on('request')`,
          msg: 'Connection accepted | connection.remoteAddress: ' + connection.remoteAddress,
        }),
      );

      connection.on('message', (message: KeyValuePair<any>) => {
        const type = message.type;
        if (this.msgHandlers[type] !== undefined) {
          this.msgHandlers[type](connection, message[type + 'Data']);
        }
      });

      connection.on('ping', () => {
        connection.pong();
      });

      connection.on('pong', () => {
        // keep the connection alive by resetting the timer
        if (this.onpong !== undefined) this.onpong(connection);
      });

      connection.on('close', (reasonCode, description) => {
        logger.report(
          this,
          dateUtils.wrapWithAusTimeStamp({
            src: `connection.on('close')`,
            msg: 'Peer ' + connection.remoteAddress + ' disconnected',
            reasonCode,
            description,
          }),
        );
        if (this.onclose !== undefined) {
          this.onclose(connection, request);
        }
        delete connections[connection.remoteAddress];
      });

      // [ { Error: read ECONNRESET at TCP.onread (net.js:622:25) errno: 'ECONNRESET', code: 'ECONNRESET', syscall: 'read' } ] }
      connection.on('error', (error) => {
        if (this.onerror !== undefined) {
          this.onerror(connection, error);
        }
        logger.report(
          this,
          dateUtils.wrapWithAusTimeStamp({
            src: `connection.on('error')`,
            msg: 'Peer ' + connection.remoteAddress,
            error,
          }),
        );
      });
    });
  };
}
