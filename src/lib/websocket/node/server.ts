import logger from '../../logger';
import fileHelper from '../../file';
import * as dateUtils from '../../date';
import utils from '../../common';
import { server as WebSocketServer, connection, request, IMessage } from 'websocket';
import http, { IncomingMessage, ServerResponse } from 'http';
import https, { ServerOptions } from 'https';

export const logSignature = 'WebSocketServer=>';

export interface ConnectionMap {
  [remoteAddress: string]: {
    timestamp: number;
    aussieTime: string;
    connection: connection;
  };
}

export interface SinbinMap {
  [key: string]: {
    unbanFrom: number;
    ausTime: string;
  };
}

export interface ExpectedSecureOptions extends ServerOptions {
  key: string;
  cert: string;
}

export interface WebsocketServerOptionsType {
  acceptProtocol?: string;
  originPredicate?: (origin: string, request: request) => boolean;
  onAuthRejectHandler?: (request: request) => void;
  onconnectAccepted?: (connection: connection, request: request) => void;
  onclose?: (
    connection: connection,
    request: request,
    reasonCode: number,
    description: string,
  ) => void;
  onerror?: (connection: connection, error: Error) => void;
  onping?: () => void;
  onpong?: () => void;
  onutfmessage?: (connection: connection, data: string) => void;
  onbinarymessage?: (connection: connection, data: Buffer) => void;
  msgHandlers?: {
    onutfmessage?: (connection: connection, data: string) => void;
    onbinarymessage?: (connection: connection, data: Buffer) => void;
  };
  //node only
  autoSinBin?: boolean;
  sinbinFilepath?: string;
}

function WebsocketServerOptions() {
  this.acceptProtocol = null;
  this.originPredicate = (origin: string, request: request) => {
    // put logic here to detect whether the specified origin is allowed.
    logger.report({ logSignature }, { src: 'originIsAllowed', origin });
    return true;
  };
  //   this.acceptProtocol = 'echo-protocol';
  this.onconnectAccepted = (connection: connection, request: request) => {};
  this.onclose = undefined;
  this.onerror = undefined;
  this.onping = undefined;
  this.onpong = undefined;
  this.onAuthRejectHandler = (request: request) => {};
  this.autoSinBin = true;
  this.sinbinFilepath = 'sinbin.json';
}
export const defaultWebsocketServerOptions = new WebsocketServerOptions();

const reqListener = (request: IncomingMessage, response: ServerResponse): void => {
  logger.report(
    { logSignature },
    dateUtils.wrapWithAusTimeStamp({
      src: `http.createServer::`,
    }),
  );
  response.writeHead(404);
  response.end();
};

export let connections: ConnectionMap = {},
  sinbin: SinbinMap = {};

let _instance: WebSocketServerWrapper = null;

export default class WebSocketServerWrapper {
  logSignature: string;
  server: http.Server;
  wsServer: WebSocketServer;
  port: string | number;
  acceptProtocol: string;
  originPredicate: (origin: string, request: request) => boolean;
  onconnectAccepted: (connection: connection, request: request) => void;
  onclose: (
    connection: connection,
    request: request,
    reasonCode: number,
    description: string,
  ) => void;
  onerror: (connection: connection, error: Error) => void;
  onping?: () => void;
  onpong?: () => void;
  onAuthRejectHandler: (request: request) => void;
  msgHandlers: {
    utf8?: (connection: connection, data: string) => void;
    binary?: (connection: connection, data: Buffer) => void;
  };
  autoSinBin: boolean;
  sinbinFilepath: string;

  constructor(port: string | number, options: WebsocketServerOptionsType = {}) {
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
    this.onAuthRejectHandler = options.onAuthRejectHandler;
    this.sinbinFilepath = options.sinbinFilepath;

    if (options.autoSinBin) {
      this.autoSinBin = true;
      this.loadSinBin();
    }

    this.msgHandlers = {
      utf8: options.onutfmessage,
      binary: options.onbinarymessage,
    };
    if (options.msgHandlers !== undefined) {
      this.msgHandlers = { ...this.msgHandlers, ...options.msgHandlers };
    }
  }

  loadSinBin = (): void => {
    const [dir] = utils.splitInReverseByCondition(
      this.sinbinFilepath,
      (i: string) => i === '/' || i === '\\',
    );
    fileHelper.assertDirExists(dir);
    try {
      if (fileHelper.fileExists(this.sinbinFilepath)) {
        sinbin = fileHelper.readFileSync(this.sinbinFilepath);
      }
    } catch (error) {
      logger.error(this, error);
    }
  };

  updateSinBin = async (request: request, add: boolean = true): Promise<any> => {
    if (this.autoSinBin) {
      if (add) {
        const unbanFrom = Date.now() + 1000 * 3600 * 24;
        sinbin[request.remoteAddress] = {
          unbanFrom,
          ausTime: dateUtils.getAusTimestamp(unbanFrom),
        };
      } else {
        delete sinbin[request.remoteAddress];
      }
      await fileHelper.writeToFile(this.sinbinFilepath, utils.safeJsonStringify(sinbin), {
        overwrite: true,
        append: false,
      });
    }
  };

  getConnections = (): ConnectionMap => {
    return connections;
  };

  getWebsocketServer = (): WebSocketServer => {
    return this.wsServer;
  };

  initSecureSocketService = (httpsOptions: ExpectedSecureOptions): void => {
    const secureServer = https.createServer(httpsOptions, reqListener);
    secureServer.listen(this.port, () => {
      logger.report(
        this,
        dateUtils.wrapWithAusTimeStamp({
          src: `server.listen::`,
          msg: `Server is listening on port ${this.port}`,
        }),
      );
    });
    this.wsServer = new WebSocketServer({
      httpServer: secureServer,
      autoAcceptConnections: false,
    });
    this.startListening();
  };

  init = (): void => {
    this.server = http.createServer(reqListener);
    this.server.listen(this.port, (): void => {
      logger.report(
        this,
        dateUtils.wrapWithAusTimeStamp({
          src: `server.listen::`,
          msg: `Server is listening on port ${this.port}`,
        }),
      );
    });

    this.wsServer = new WebSocketServer({
      httpServer: this.server,
      autoAcceptConnections: false,
    });
    this.startListening();
  };

  startListening = (): void => {
    this.wsServer.on('request', (request: request): void => {
      let sinbinned = false;
      if (sinbin[request.remoteAddress] !== undefined) {
        if (Date.now() < sinbin[request.remoteAddress].unbanFrom) {
          this.updateSinBin(request, false);
        } else {
          logger.report(this, {
            msg: 'originPredicate:: ip was in the sin bin, need to wait!',
            sinbin,
          });
          sinbinned = true;
        }
      }
      if (sinbinned || !this.originPredicate(request.origin, request)) {
        logger.report(this, 'request rejected: ' + request.remoteAddress);
        if (!sinbinned && this.autoSinBin) {
          this.updateSinBin(request, true);
        }
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
        // @ts-ignore
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

      connection.on('message', (message: IMessage): void => {
        const type = message.type;
        if (this.msgHandlers[type] !== undefined) {
          this.msgHandlers[type](connection, message[type + 'Data']);
        }
      });

      connection.on('ping', (): void => {
        if (this.onping) {
          this.onping();
        } else {
          // @ts-ignore
          connection.pong();
        }
      });

      connection.on('pong', (): void => {
        // keep the connection alive by resetting the timer
        if (this.onpong) {
          this.onpong();
        }
      });

      connection.on('close', (reasonCode: number, description: string): void => {
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
          this.onclose(connection, request, reasonCode, description);
        }
        delete connections[connection.remoteAddress];
      });

      // [ { Error: read ECONNRESET at TCP.onread (net.js:622:25) errno: 'ECONNRESET', code: 'ECONNRESET', syscall: 'read' } ] }
      connection.on('error', (error: Error): void => {
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
