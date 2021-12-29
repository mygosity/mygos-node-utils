import WebSocketServer from '../node/server';
import WebSocket from 'ws';

let ws: WebSocketServer,
	connections: { [identity: string]: WebSocket } = {};

interface OriginSignature {
	event: string;
	identity: string;
}

/**
 * This is a wrapper around the node websocket server to use to host a websocket
 * for a browser connection
 */
class WebsocketWrapper {
	logSignature: string;
	dataHandler: { origin: (connection: WebSocket, data: OriginSignature) => void };

	constructor() {
		this.logSignature = 'WebsocketWrapper';
		this.dataHandler = {
			origin: this.registerConnection,
		};
	}

	init = (port: string) => {
		ws = new WebSocketServer(port, {
			onutfmessage: this.onData,
		});
		ws.init();
	};

	registerConnection = (connection: WebSocket, data: OriginSignature) => {
		console.log({
			msg: 'registerConnection::',
			data,
		});
		connections[data.identity] = connection;
	};

	onData = (connection: WebSocket, msg: string) => {
		if (msg === 'ping') {
			connection.send('pong');
		} else {
			const data = JSON.parse(msg);
			if (data.event) {
				this.dataHandler[data.event](connection, data);
			} else {
				console.log(data);
			}
		}
	};

	send = (id: string, event: string, ...args: any[]) => {
		connections[id].send(JSON.stringify({ event, args }));
	};

	sendall = (event: string, ...args: any[]) => {
		const data = JSON.stringify({ event, args });
		console.log(data);
		for (let id in connections) {
			connections[id].send(data);
		}
	};
}

export const websocketWrapper = new WebsocketWrapper();
export default websocketWrapper;
