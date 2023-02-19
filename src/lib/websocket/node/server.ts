import http, { ServerResponse } from 'http';
import https, { ServerOptions } from 'https';
import WebSocket, { Server as WebSocketServer } from 'ws';

import logger from '../../logger';
import fileHelper from '../../file';
import * as dateUtils from '../../date';
import { prefillDefaultOptions } from '../../common/pure/misc';
import { safeJsonStringify, splitInReverseByCondition } from '../../common/inputhandlers';

export const logSignature = 'WebSocketServer=>';

export interface ConnectionMap {
	[remoteAddress: string]: {
		timestamp: string;
		aussieTime: string;
		connection?: WebSocket;
	};
}

export interface SinbinMap {
	[key: string]: {
		timestamp?: string;
		aussieTime?: string;
		unbanFrom: number;
	};
}

export interface ExpectedSecureOptions extends ServerOptions {
	key: string;
	cert: string;
}

export interface WebsocketServerOptionsType {
	acceptProtocol?: string;
	originPredicate?: (origin: string, request: http.IncomingMessage) => boolean;
	onAuthRejectHandler?: (request: http.IncomingMessage) => void;
	onconnectAccepted?: (connection: WebSocket, request: http.IncomingMessage) => void;
	onclose?: (connection: WebSocket, request: http.IncomingMessage, reasonCode: number, description: string) => void;
	onerror?: (connection: WebSocket, error: Error) => void;
	onping?: () => void;
	onpong?: () => void;
	onutfmessage?: (connection: WebSocket, data: string) => void;
	onbinarymessage?: (connection: WebSocket, data: Buffer) => void;
	msgHandlers?: {
		onutfmessage?: (connection: WebSocket, data: string) => void;
		onbinarymessage?: (connection: WebSocket, data: Buffer) => void;
	};
	//node only
	autoSinBin?: boolean;
	sinbinFilepath?: string;
}

function WebsocketServerOptions() {
	this.acceptProtocol = null;
	this.originPredicate = (origin: string, request: http.IncomingMessage) => {
		// put logic here to detect whether the specified origin is allowed.
		logger.report({ logSignature, funcSignature: 'WebsocketServerOptions()' }, { src: 'originIsAllowed', origin });
		return true;
	};
	//   this.acceptProtocol = 'echo-protocol';
	this.onconnectAccepted = (connection: WebSocket, request: http.IncomingMessage) => {};
	this.onclose = undefined;
	this.onerror = undefined;
	this.onping = undefined;
	this.onpong = undefined;
	this.onAuthRejectHandler = (request: http.IncomingMessage) => {};
	this.autoSinBin = true;
	this.sinbinFilepath = 'sinbin.json';
}
export const defaultWebsocketServerOptions = new WebsocketServerOptions();

const reqListener = (request: http.IncomingMessage, response: ServerResponse): void => {
	const logObj = { logSignature, funcSignature: 'reqListener' };
	logger.report(logObj, `http.createServer::`);
	response.writeHead(404);
	response.end();
};

export let connections: ConnectionMap = {},
	sinbin: SinbinMap = {};

let _instance: WebSocketServerWrapper = null;

export default class WebSocketServerWrapper {
	logSignature: string;
	server: http.Server | https.Server;
	wsServer: WebSocketServer;
	port: string | number;
	acceptProtocol: string;
	originPredicate: (origin: string, request: http.IncomingMessage) => boolean;
	onconnectAccepted: (connection: WebSocket, request: http.IncomingMessage) => void;
	onclose: (connection: WebSocket, request: http.IncomingMessage, reasonCode: number, description: string) => void;
	onerror: (connection: WebSocket, error: Error) => void;
	onping?: () => void;
	onpong?: () => void;
	onAuthRejectHandler: (request: http.IncomingMessage) => void;
	msgHandlers: {
		utf8?: (connection: WebSocket, data: string) => void;
		binary?: (connection: WebSocket, data: Buffer) => void;
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

		options = prefillDefaultOptions(options, defaultWebsocketServerOptions);
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

	loadSinBin = () => {
		const [dir] = splitInReverseByCondition(this.sinbinFilepath, (i: string) => i === '/' || i === '\\');
		fileHelper.assertDirExists(dir);
		try {
			if (fileHelper.fileExists(this.sinbinFilepath)) {
				sinbin = fileHelper.readFileSync(this.sinbinFilepath);
			}
		} catch (error) {
			const logObj = { logSignature: this.logSignature, funcSignature: 'loadSinBin' };
			logger.error(logObj, error);
		}
	};

	updateSinBin = async (request: http.IncomingMessage, add: boolean = true) => {
		if (this.autoSinBin) {
			if (add) {
				const unbanFrom = Date.now() + 1000 * 3600 * 24;
				sinbin[request.socket.remoteAddress] = {
					unbanFrom,
					aussieTime: dateUtils.getAusTimestamp(unbanFrom),
				};
			} else {
				delete sinbin[request.connection.remoteAddress];
			}
			await fileHelper.writeToFile(this.sinbinFilepath, safeJsonStringify(sinbin), {
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

	init = (httpsOptions: ServerOptions = {}, websocketOptions: any = {}): void => {
		this.server = http.createServer(httpsOptions, reqListener);
		// const logObj = { logSignature: this.logSignature, funcSignature: 'init' };
		// this.server.listen(this.port, (): void => {
		// 	logger.report(logObj, `server.listen:: port ${this.port}`);
		// });
		this.startListening(websocketOptions);
	};

	initSecureSocketService = (httpsOptions: ServerOptions, websocketOptions: any = {}) => {
		this.server = https.createServer(httpsOptions, reqListener);
		const perMessageDeflate = {
			zlibDeflateOptions: {
				// See zlib defaults.
				chunkSize: 1024,
				memLevel: 7,
				level: 3,
			},
			zlibInflateOptions: {
				chunkSize: 10 * 1024,
			},
			// Other options settable:
			clientNoContextTakeover: true, // Defaults to negotiated value.
			serverNoContextTakeover: true, // Defaults to negotiated value.
			serverMaxWindowBits: 10, // Defaults to negotiated value.
			// Below options specified as default values.
			concurrencyLimit: 10, // Limits zlib concurrency for perf.
			threshold: 1024, // Size (in bytes) below which messages
			// should not be compressed.
		};
		this.startListening(websocketOptions);
	};

	startListening = (websocketOptions: any = {}) => {
		if (this.wsServer == null) {
			this.wsServer = new WebSocketServer({
				server: this.server,
				clientTracking: true,
				verifyClient: this.verifyClient,
				...websocketOptions,
			});
		}
		const self = this;
		const logObj = { logSignature: self.logSignature, funcSignature: 'startListening' };
		this.wsServer.on('connection', function (connection: WebSocket, request: http.IncomingMessage) {
			const { remoteAddress } = request.socket;
			self.onconnectAccepted(connection, request);
			if (connections[remoteAddress] === undefined) {
				connections[remoteAddress] = dateUtils.wrapWithAusTimeStamp({
					connection,
				});
			}
			logger.report(logObj, `wsServer.on('request') | Connection accepted | connection.remoteAddress: ${remoteAddress}`);
			connection.on('message', (data: WebSocket.Data): void => {
				if (typeof data === 'string') {
					self.msgHandlers.utf8(connection, data);
				}
			});
			connection.on('ping', (): void => {
				if (self.onping) {
					self.onping();
				} else {
					connection.pong();
				}
			});
			connection.on('pong', (): void => {
				// keep the connection alive by resetting the timer
				if (self.onpong) {
					self.onpong();
				}
			});
			connection.on('close', (reasonCode: number, description: string): void => {
				logger.report(
					logObj,
					`connection.on('close') | Peer ' ${remoteAddress} disconnected, reasonCode: ${
						reasonCode?.toString?.() ?? ''
					}, description: ${description?.toString?.() ?? ''}`
				);
				if (self.onclose !== undefined) {
					self.onclose(connection, request, reasonCode, description);
				}
				delete connections[remoteAddress];
			});
			connection.on('error', (error: Error): void => {
				if (self.onerror !== undefined) {
					self.onerror(connection, error);
				}
				logger.report(logObj, `connection.on('error') | Peer ' ${remoteAddress} disconnected, error: ${error?.toString?.() ?? ''}`);
			});
		});
		this.server.listen(this.port, () => {
			logger.report(logObj, `server.listen:: port ${this.port}`);
		});
	};

	verifyClient = (
		info: { origin: string; secure: boolean; req: http.IncomingMessage },
		callback: (res: boolean, code?: number, message?: string, headers?: http.OutgoingHttpHeaders) => void
	) => {
		const { origin, secure, req } = info;
		const { remoteAddress } = req.connection;
		const logObj = { logSignature: this.logSignature, funcSignature: 'verifyClient' };
		logger.report(logObj, `url: ${req.url}, ip: ${remoteAddress}, secure: ${secure ? 1 : 0}, origin: ${origin?.toString?.() ?? ''}`);
		let sinbinned = false;
		if (sinbin[remoteAddress] !== undefined) {
			if (Date.now() < sinbin[remoteAddress].unbanFrom) {
				this.updateSinBin(req, false);
			} else {
				logger.report(logObj, `originPredicate:: ip was in the sin bin, need to wait! sinbin: ${safeJsonStringify(sinbin)}`);
				sinbinned = true;
			}
		}
		if (sinbinned || !this.originPredicate(origin as string, req)) {
			logger.report(logObj, 'request rejected: ' + remoteAddress);
			if (!sinbinned && this.autoSinBin) {
				this.updateSinBin(req, true);
			}
			// Make sure we only accept requests from an allowed origin
			this.onAuthRejectHandler(req);
			callback(false, 400, 'invalid key | sinbinned');
			// abortHandshake(socket, 400, 'invalid key | sinbinned', request.headers);
			logger.report(logObj, `wsServer.on('request') | !originIsAllowed | Connection from origin ' ${origin} rejected.`);
			return;
		}
		callback(true);
	};
}
