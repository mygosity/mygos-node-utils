//@ts-nocheck
//remove the no check comment in an actual react native project as this code will throw TS errors anywhere else

interface BrowserListenerOptions {
	onopen?: (connection?: WebSocket) => void;
	onerror?: (connection?: WebSocket, event?: WebSocketErrorEvent) => void;
	onclose?: (connection?: WebSocket, event?: WebSocketCloseEvent) => void;
	onping?: (connection?: WebSocket) => void;
	onpong?: (connection?: WebSocket) => void;
}

export interface WebsocketClientOptionsType {
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

export class WebsocketManager {
	logSignature: string;
	connection?: WebSocket;
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
	keepAliveLoop: ReturnType<typeof setTimeout> | null;
	retryLoop: ReturnType<typeof setTimeout> | null;
	lastKeepAliveTime: number;

	onmessage: (connection?: WebSocket, message?: WebSocketMessageEvent) => void;
	onopen?: (connection?: WebSocket) => void;
	onerror?: (connection?: WebSocket, event?: WebSocketErrorEvent) => void;
	onclose?: (connection?: WebSocket, event?: WebSocketCloseEvent) => void;
	onping?: (connection?: WebSocket) => void;
	onpong?: (connection?: WebSocket) => void;

	constructor(
		url: string,
		onmessage: (connection?: WebSocket, message?: WebSocketMessageEvent) => void,
		listeners: BrowserListenerOptions = {},
		options: WebsocketClientOptionsType = {}
	) {
		this.url = url;
		this.onmessage = onmessage;
		this.logSignature = `WebSocketClient=>`;

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

		this.autoRetry = options.autoRetry ?? true;
		this.retryLimit = options.retryLimit ?? -1;
		this.retryTimer = options.retryTimer ?? 10 * 1000;
		this.minTimeSinceLastUpdate = options.minTimeSinceLastUpdate ?? 2.5 * 1000;
		this.maxTimeSinceLastUpdate = options.maxTimeSinceLastUpdate ?? 10 * 1000;
		this.autoKeepAliveMaxTime = options.autoKeepAliveMaxTime ?? 1 * 60 * 1000;
		this.keepAliveTimeInterval = options.keepAliveTimeInterval ?? 1000;
		this.resetKeepAliveTimeOnPong = options.resetKeepAliveTimeOnPong ?? false;
		this.autoKeepAliveCallback =
			options.autoKeepAliveCallback ??
			(() => {
				/**no op*/
			});
		this.socketargs = options.socketargs;

		this.retryCount = 0;
		this.forcedClose = undefined;
		this.prevEventTime = 0;
		this.keepAliveLoop = null;
		this.retryLoop = null;
		this.lastKeepAliveTime = 0;
	}

	onPing = () => {
		if (this.onping !== undefined) {
			this.onping(this.connection);
		}
	};

	onPong = () => {
		if (this.onpong !== undefined) {
			this.onpong(this.connection);
		}
		if (this.resetKeepAliveTimeOnPong) {
			this.prevEventTime = Date.now();
		}
	};

	loadWebsocketConnections = () => {
		if (this.connection != null && (WebSocket.OPEN || WebSocket.CONNECTING)) {
			console.log('connection already open returning...');
			this.resetIntervals();
			return;
		}

		if (this.socketargs !== undefined) {
			this.connection = new WebSocket(this.url, this.socketargs);
		} else {
			this.connection = new WebSocket(this.url);
		}
		this.prevEventTime = Date.now();

		this.connection.onopen = () => {
			this.resetIntervals();
			this.retryCount = 0;
			this.retryLoop = null;
			this.forcedClose = undefined;
			this.startKeepAlive();
			if (this.onopen !== undefined) {
				this.onopen(this.connection);
			}
		};

		this.connection.onerror = (event: WebSocketErrorEvent) => {
			this.startRetrying();
			if (this.onerror !== undefined) {
				this.onerror(this.connection, event);
			}
		};

		this.connection.onclose = (event: WebSocketCloseEvent) => {
			if (this.keepAliveLoop != null) {
				clearInterval(this.keepAliveLoop);
			}
			this.connection = undefined;
			this.keepAliveLoop = null;
			if (this.forcedClose == null) {
				//restart the connection since we didn't force it to close
				this.startRetrying();
			}
			if (this.onclose !== undefined) {
				this.onclose(this.connection, event);
			}
		};

		this.connection.onmessage = (message: WebSocketMessageEvent) => {
			this.prevEventTime = Date.now();
			this.onmessage(this.connection, message);
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
		//@ts-ignore
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
			clearInterval(this.retryLoop as ReturnType<typeof setTimeout>);
			this.retryLoop = null;
		}
		this.retryCount++;
	};

	resetIntervals() {
		if (this.retryLoop != null) {
			clearInterval(this.retryLoop);
		}
		if (this.keepAliveLoop != null) {
			clearInterval(this.keepAliveLoop);
		}
	}
}
