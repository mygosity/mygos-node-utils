import WebSocket from 'ws';
import { eventcontrol } from '../../../commands';
import { safeJsonParse } from '../../common/inputhandlers';

import WebsocketClient from './client';

let connection: WebSocket;
class WebsocketClientWrapper {
	logSignature: string;
	identity: string = '';
	client: WebsocketClient | null = null;

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
			}
		);
		this.client.loadWebsocketConnections();
	};

	heartBeat = (): void => {
		connection.send('ping');
	};

	onOpen = (ctx: WebSocket, event: WebSocket.Event): void => {
		connection = ctx;
		connection.send(
			JSON.stringify({
				event: 'origin',
				identity: this.identity,
			})
		);
	};

	onMessage = (ctx: WebSocket | null | undefined, message: WebSocket.MessageEvent): void => {
		let { type, data } = message;
		if (data !== 'pong') {
			const parsedData = safeJsonParse(data);
			if (parsedData?.event) {
				const { event, args } = parsedData;
				eventcontrol.emit(event, ...args);
			}
		} else {
			this.client?.resetKeepAliveTime();
		}
	};
}

export const websocketClientWrapper = new WebsocketClientWrapper();
export default websocketClientWrapper;
