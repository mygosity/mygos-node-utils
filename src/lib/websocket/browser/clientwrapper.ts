import { eventcontrol } from 'eventcontrol';

import WebsocketClient from './client';

let connection: WebSocket;
class WebsocketClientWrapper {
	logSignature: string;
	identity: string;
	client: WebsocketClient;

	constructor() {
		this.logSignature = 'WebsocketClientWrapper=>';
	}

	init = (baseUrl: string, identity: string): void => {
		this.identity = identity;
		this.client = new WebsocketClient(
			baseUrl,
			this.onMessage,
			{
				onopen: this.onOpen,
			},
			{
				autoKeepAliveCallback: this.heartBeat,
			},
		);
		this.client.loadWebsocketConnections();
	};

	heartBeat = (): void => {
		connection.send('ping');
	};

	onOpen = (ctx: WebSocket, event: Event): void => {
		connection = ctx;
		connection.send(
			JSON.stringify({
				event: 'origin',
				identity: this.identity,
			}),
		);
	};

	onMessage = (ctx: WebSocket, message: MessageEvent): void => {
		let { type, data } = message;
		if (data !== 'pong') {
			data = JSON.parse(data);
			if (data.event !== undefined) {
				const { event, args } = data;
				eventcontrol.emit(event, ...args);
			}
		} else {
			this.client.resetKeepAliveTime();
		}
	};
}

export const websocketClientWrapper = new WebsocketClientWrapper();
export default websocketClientWrapper;
