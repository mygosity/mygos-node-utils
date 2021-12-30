import * as utils from '../lib/common';

type WebSocket = any;
type MessageEvent = any;

function prefillDefaultOptions(options: any, defaultOptions: any): any {
	if (options === null || options === undefined) {
		//take care not to mutate the returned default here else all defaults will be affected
		return defaultOptions;
	} else {
		for (let prop in defaultOptions) {
			if (options[prop] === undefined) {
				options[prop] = defaultOptions[prop];
			}
		}
	}
	return options;
}

interface BrowserListenerOptions {
	onopen?: (connection: WebSocket, event: Event) => void;
	onerror?: (connection: WebSocket, event: Event) => void;
	onclose?: (connection: WebSocket, event: Event) => void;
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
	socketargs?: any;
}
const defaultWebsocketClientOptions: WebsocketClientOptionsType = {
	id: '000',
	retryLimit: -1,
	retryTimer: 10 * 1000,
	minTimeSinceLastUpdate: 2.5 * 1000,
	maxTimeSinceLastUpdate: 10 * 1000,
	autoRetry: true,
	autoKeepAliveMaxTime: 1 * 60 * 1000,
	keepAliveTimeInterval: 1000,
	autoKeepAliveCallback: undefined,
	resetKeepAliveTimeOnPong: undefined,
	socketargs: undefined,
};

/**
 * Websocket client for a browser application
 * This will use an automatic keep alive system by default
 * which must be paied with the server.js located in the same folder
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
	socketargs: any;

	retryCount: number;
	forcedClose?: string;
	prevEventTime: number;
	keepAliveLoop: NodeJS.Timeout;
	retryLoop: NodeJS.Timeout;
	lastKeepAliveTime: number;

	onmessage: (connection: WebSocket, message: MessageEvent) => void;
	onopen?: (connection: WebSocket, event: Event) => void;
	onerror?: (connection: WebSocket, event: Event) => void;
	onclose?: (connection: WebSocket, event: Event) => void;
	onping?: (connection: WebSocket) => void;
	onpong?: (connection: WebSocket) => void;

	constructor(
		url: string,
		onmessage: (connection: WebSocket, message: MessageEvent) => void,
		listeners: BrowserListenerOptions = {},
		options: WebsocketClientOptionsType = {},
	) {
		this.connection = null;
		this.url = url;
		this.onmessage = onmessage;
		options = prefillDefaultOptions(options, defaultWebsocketClientOptions);
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

	loadWebsocketConnections = (): void => {
		if (this.connection != null && (this.connection.OPEN || this.connection.CONNECTING)) {
			console.log('connection already open returning...');
			this.resetIntervals();
			return;
		}

		if (this.socketargs !== undefined) {
			//@ts-ignore
			this.connection = new WebSocket(this.url, this.socketargs);
		} else {
			//@ts-ignore
			this.connection = new WebSocket(this.url);
		}
		this.prevEventTime = Date.now();

		this.connection.onopen = (event: Event): void => {
			this.resetIntervals();
			this.retryCount = 0;
			this.retryLoop = null;
			this.forcedClose = null;
			this.startKeepAlive();
			if (this.onopen !== undefined) {
				this.onopen(this.connection, event);
			}
		};

		this.connection.onerror = (event: Event): void => {
			this.startRetrying();
			if (this.onerror !== undefined) {
				this.onerror(this.connection, event);
			}
		};

		this.connection.onclose = (event: Event): void => {
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
				this.onclose(this.connection, event);
			}
		};

		this.connection.onmessage = (message: MessageEvent): void => {
			this.prevEventTime = Date.now();
			this.onmessage(this.connection, message);
		};
	};

	forceConnectionClose = (msg?: string): void => {
		this.forcedClose = msg;
		if (this.connection != null) {
			this.connection.close();
		}
	};

	checkAliveStatus = (): void => {
		const currentTime = Date.now();
		const msSinceLastUpdate = currentTime - this.prevEventTime;
		if (msSinceLastUpdate > this.maxTimeSinceLastUpdate) {
			this.forceConnectionClose();
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
		//@ts-ignore
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
			this.retryCount = 0;
			if (this.retryLoop == null) {
				this.startServer();
				this.retryLoop = setInterval(this.startServer, this.retryTimer);
			}
		}
	};

	startServer = (): void => {
		if (this.retryLimit < 0 || this.retryCount < this.retryLimit) {
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
