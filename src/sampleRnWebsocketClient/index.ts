import { eventcontrol } from 'eventcontrol';
import WebsocketClient from './client';

const localhostname = 'localhost';
const websocketPort = 5000;
const baseUrl = `ws://${localhostname}:${websocketPort}`;

//@ts-ignore
let connection: WebSocket;
class WebsocketService {
	logSignature: string;
	identity: string;
	client: WebsocketClient;

	constructor() {
		this.logSignature = 'WebsocketClientWrapper=>';
	}

	init = (): void => {
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
		connection.send('pong');
	};

	//@ts-ignore
	onOpen = (ctx: WebSocket, event: Event): void => {
		connection = ctx;
		//insert custom handshake here
		connection.send(
			JSON.stringify({
				event: 'origin',
				identity: 'woohoo',
			}),
		);
	};

	//@ts-ignore
	onMessage = (ctx: WebSocket, message: MessageEvent): void => {
		let { type, data } = message;
		if (data !== 'pulse') {
			data = JSON.parse(data);
			if (data.event !== undefined) {
				const { event, args } = data;
				eventcontrol.emit(event, ...args);
			}
		}
	};
}

export const websocketService = new WebsocketService();
export default websocketService;
