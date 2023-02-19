import WebSocket from 'ws';
import logger from '../../logger';

import { noop, prefillDefaultOptions } from '../../common/pure/misc';

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
	retryTimeMs?: number;
	minTimeSinceLastUpdate?: number;
	maxTimeSinceLastUpdate?: number;
	autoKeepAliveMaxTime?: number;
	keepAliveTimeInterval?: number;
	autoKeepAliveCallback?: () => void;
	socketargs?: WebSocket.ClientOptions;
}

let instanceCount = 0;
function getDefaultWebsocketClientOptions(): WebsocketClientOptionsType {
	return {
		id: instanceCount++,
		autoRetry: true,
		retryLimit: -1,
		retryTimeMs: 10 * 1000,
		minTimeSinceLastUpdate: 2.5 * 1000,
		maxTimeSinceLastUpdate: 10 * 1000,
		autoKeepAliveMaxTime: 1 * 60 * 1000,
		keepAliveTimeInterval: 1000,
		autoKeepAliveCallback: noop,
		socketargs: undefined,
	};
}

/**
 * This websocket client is for node as it relies on the
 * ws package
 */
export default class WebSocketClient {
	logSignature: string;
	connection: WebSocket | null;
	url: string;

	id?: string | number;
	autoRetry?: boolean;
	retryLimit: number;
	retryTimeMs?: number;
	minTimeSinceLastUpdate: number;
	maxTimeSinceLastUpdate: number;
	autoKeepAliveMaxTime: number;
	keepAliveTimeInterval?: number;
	autoKeepAliveCallback?: () => void;
	socketargs?: WebSocket.ClientOptions;

	retryCount: number;
	forcedClose: any;
	prevEventTime: number;
	keepAliveLoop: ReturnType<typeof setTimeout> | null;
	retryLoop: ReturnType<typeof setInterval> | null;
	lastKeepAliveTime: number | null;

	onmessage: (connection: WebSocket | undefined | null, message: WebSocket.MessageEvent) => void;
	onopen?: (connection: WebSocket, event: WebSocket.Event) => void;
	onerror?: (connection: WebSocket, error: WebSocket.ErrorEvent) => void;
	onclose?: (connection: WebSocket, event: WebSocket.CloseEvent) => void;
	onping?: (connection: WebSocket, data: Buffer) => void;
	onpong?: (connection: WebSocket, data: Buffer) => void;

	constructor(
		url: string,
		onmessage: (connection: WebSocket | undefined | null, message: WebSocket.MessageEvent) => void,
		listeners: ListenersOptionType = {},
		options: WebsocketClientOptionsType = {}
	) {
		this.connection = null;
		this.url = url;
		this.onmessage = onmessage;
		options = prefillDefaultOptions(options, getDefaultWebsocketClientOptions());
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
		this.retryLimit = options.retryLimit as number;
		this.retryTimeMs = options.retryTimeMs;
		this.minTimeSinceLastUpdate = options.minTimeSinceLastUpdate as number;
		this.maxTimeSinceLastUpdate = options.maxTimeSinceLastUpdate as number;
		this.autoKeepAliveMaxTime = options.autoKeepAliveMaxTime as number;
		this.keepAliveTimeInterval = options.keepAliveTimeInterval;
		this.autoKeepAliveCallback = options.autoKeepAliveCallback;
		this.socketargs = options.socketargs;
		this.retryCount = 0;
		this.forcedClose = null;
		this.prevEventTime = 0;
		this.keepAliveLoop = null;
		this.retryLoop = null;
		this.lastKeepAliveTime = null;
	}

	dispose = () => {
		this.connection?.removeAllListeners?.();
		clearInterval(this.keepAliveLoop as ReturnType<typeof setTimeout>);
		clearInterval(this.retryLoop as ReturnType<typeof setTimeout>);
		this.connection = null;
		this.url = '';
		//@ts-ignore
		this.onmessage = undefined;
		this.onopen = undefined;
		this.onerror = undefined;
		this.onclose = undefined;
		this.onping = undefined;
		this.onpong = undefined;
		this.autoRetry = undefined;
		this.keepAliveTimeInterval = undefined;
		this.autoKeepAliveCallback = undefined;
		this.socketargs = undefined;
		this.forcedClose = null;
		this.keepAliveLoop = null;
		this.retryLoop = null;
		this.lastKeepAliveTime = null;
	};

	resetKeepAliveTime = () => {
		this.prevEventTime = Date.now();
	};

	onPing = (data: Buffer): void => {
		if (this.onping !== undefined && this.connection) {
			this.onping(this.connection, data);
		} else {
			this.connection?.pong(data);
		}
	};

	onPong = (data: Buffer): void => {
		if (this.onpong !== undefined && this.connection) {
			this.onpong(this.connection, data);
		}
	};

	//Sec-WebSocket-Protocol request header args
	loadWebsocketConnections = (): void => {
		const logObj = { logSignature: this.logSignature, funcSignature: 'loadWebsocketConnections' };
		if (this.connection != null && (this.connection.OPEN || this.connection.CONNECTING)) {
			console.log('connection already open returning...');
			this.resetIntervals();
			return;
		}
		this.connection = this.socketargs !== undefined ? new WebSocket(this.url, this.socketargs) : new WebSocket(this.url);
		this.prevEventTime = Date.now();

		this.connection.on('pong', this.onPong);

		this.connection.onopen = (event: WebSocket.Event): void => {
			logger.report(logObj, `onopen::}`);
			this.resetIntervals();
			this.retryCount = 0;
			this.retryLoop = null;
			this.forcedClose = null;
			this.startKeepAlive();
			if (this.onopen !== undefined && this.connection) {
				this.onopen(this.connection, event);
			}
		};

		this.connection.onerror = (error: WebSocket.ErrorEvent): void => {
			logger.report(
				logObj,
				`onerror::} error: ${error?.toString?.() ?? ''} message: ${error?.message ?? ''} type: ${error?.type ?? ''} target: ${
					error?.target ?? ''
				}`
			);
			this.startRetrying();
			if (this.onerror !== undefined && this.connection) {
				this.onerror(this.connection, error);
			}
		};

		this.connection.onclose = (event: WebSocket.CloseEvent): void => {
			logger.report(
				logObj,
				`onclose::} event: ${event?.toString?.() ?? ''} code: ${event?.code ?? ''} reason: ${event?.reason ?? ''} target: ${
					event?.target ?? ''
				} type: ${event?.type ?? ''} wasClean: ${event?.wasClean ? 1 : 0}`
			);
			if (this.keepAliveLoop != null) {
				clearInterval(this.keepAliveLoop);
			}
			this.connection = null;
			this.keepAliveLoop = null;
			if (this.forcedClose == null) {
				this.startRetrying();
			}
			if (this.onclose !== undefined && this.connection) {
				this.onclose(this.connection, event);
			}
		};

		this.connection.onmessage = (message: WebSocket.MessageEvent): void => {
			this.prevEventTime = Date.now();
			this.onmessage(this.connection, message);
		};
	};

	forceConnectionClose = (msg?: string): void => {
		const logObj = { logSignature: this.logSignature, funcSignature: 'forceConnectionClose' };
		logger.report(logObj, 'forceConnectionClose::' + msg?.toString?.());
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
		if (this.lastKeepAliveTime == null || currentTime - this.lastKeepAliveTime > this.autoKeepAliveMaxTime) {
			this.handleKeepAlive();
		}
	};

	handleKeepAlive(): void {
		if (this.connection != null && this.connection.readyState === WebSocket.OPEN) {
			this.lastKeepAliveTime = Date.now();
			this.autoKeepAliveCallback?.();
		}
	}

	startKeepAlive = (): void => {
		if (this.autoKeepAliveCallback !== undefined) {
			this.keepAliveLoop = setInterval(this.checkAliveStatus, this.keepAliveTimeInterval);
		}
	};

	startRetrying = (): void => {
		if (this.autoRetry) {
			const logObj = { logSignature: this.logSignature, funcSignature: 'startRetrying' };
			logger.report(logObj, 'startRetrying::');
			this.retryCount = 0;
			if (this.retryLoop == null) {
				this.startServer();
				this.retryLoop = setInterval(this.startServer, this.retryTimeMs);
			}
		}
	};

	startServer = (): void => {
		if (this.retryLimit < 0 || this.retryCount < this.retryLimit) {
			const logObj = { logSignature: this.logSignature, funcSignature: 'startServer' };
			logger.report(logObj, 'startRetrying:: this.retryCount < this.retryLimit: || this.retryLimit < 0');
			this.loadWebsocketConnections();
		} else {
			clearInterval(this.retryLoop as ReturnType<typeof setInterval>);
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
