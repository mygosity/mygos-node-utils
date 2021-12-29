import WebSocket from 'ws';
import logger from '../../logger';
import utils from '../../common';

export interface ListenersOptionType {
	onopen?: (connection: WebSocket, event: WebSocket.Event) => void;
	onerror?: (connection: WebSocket, error: WebSocket.ErrorEvent) => void;
	onclose?: (connection: WebSocket, event: WebSocket.CloseEvent) => void;
	onping?: (connection: WebSocket, data: Buffer) => void;
	onpong?: (connection: WebSocket, data: Buffer) => void;
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
	autoKeepAliveCallback: () => void;
	socketargs: WebSocket.ClientOptions;

	retryCount: number;
	forcedClose: any;
	prevEventTime: number;
	keepAliveLoop: NodeJS.Timeout;
	retryLoop: NodeJS.Timeout;
	lastKeepAliveTime: number;

	onmessage: (connection: WebSocket, message: WebSocket.MessageEvent) => void;
	onopen?: (connection: WebSocket, event: WebSocket.Event) => void;
	onerror?: (connection: WebSocket, error: WebSocket.ErrorEvent) => void;
	onclose?: (connection: WebSocket, event: WebSocket.CloseEvent) => void;
	onping?: (connection: WebSocket, data: Buffer) => void;
	onpong?: (connection: WebSocket, data: Buffer) => void;

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
		this.autoKeepAliveCallback = options.autoKeepAliveCallback;
		this.socketargs = options.socketargs;
		this.retryCount = 0;
		this.forcedClose = null;
		this.prevEventTime = null;
		this.keepAliveLoop = null;
		this.retryLoop = null;
		this.lastKeepAliveTime = null;
	}

	resetKeepAliveTime = () => {
		this.prevEventTime = Date.now();
	};

	onPing = (data: Buffer): void => {
		if (this.onping !== undefined) {
			this.onping(this.connection, data);
		} else {
			this.connection.pong(data);
		}
	};

	onPong = (data: Buffer): void => {
		if (this.onpong !== undefined) {
			this.onpong(this.connection, data);
		}
	};

	//Sec-WebSocket-Protocol request header args
	loadWebsocketConnections = (): void => {
		if (this.connection != null && (this.connection.OPEN || this.connection.CONNECTING)) {
			console.log('connection already open returning...');
			this.resetIntervals();
			return;
		}
		this.connection =
			this.socketargs !== undefined
				? new WebSocket(this.url, this.socketargs)
				: new WebSocket(this.url);
		this.prevEventTime = Date.now();

		this.connection.on('pong', this.onPong);

		this.connection.onopen = (event: WebSocket.Event): void => {
			logger.report(this, 'onopen::');
			this.resetIntervals();
			this.retryCount = 0;
			this.retryLoop = null;
			this.forcedClose = null;
			this.startKeepAlive();
			if (this.onopen !== undefined) {
				this.onopen(this.connection, event);
			}
		};

		this.connection.onerror = (error: WebSocket.ErrorEvent): void => {
			logger.report(this, 'onerror:: error:', error.toString(), error.message);
			// logger.report(this, 'onerror:: error:', event);
			this.startRetrying();
			if (this.onerror !== undefined) {
				this.onerror(this.connection, error);
			}
		};

		this.connection.onclose = (event: WebSocket.CloseEvent): void => {
			logger.report(this, 'onclose:: event: ');
			if (this.keepAliveLoop != null) {
				clearInterval(this.keepAliveLoop);
			}
			this.connection = null;
			this.keepAliveLoop = null;
			if (this.forcedClose == null) {
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
			this.forceConnectionClose('maxTimeSinceLastUpdate exceeded');
			this.startRetrying();
		} else if (msSinceLastUpdate > this.minTimeSinceLastUpdate) {
			this.handleKeepAlive();
		}
		if (
			this.lastKeepAliveTime == null ||
			currentTime - this.lastKeepAliveTime > this.autoKeepAliveMaxTime
		) {
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
			clearInterval(this.retryLoop);
			this.retryLoop = null;
		}
		this.retryCount++;
	};

	resetIntervals(): void {
		if (this.retryLoop != null) {
			clearInterval(this.retryLoop);
		}
		if (this.keepAliveLoop != null) {
			clearInterval(this.keepAliveLoop);
		}
	}
}
