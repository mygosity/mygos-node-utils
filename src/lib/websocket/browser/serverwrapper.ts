import WebSocketServer from '../node/server';

let ws,
  connections = {};

/**
 * This is a wrapper around the node websocket server to use to host a websocket
 * for a browser connection
 */
class WebsocketWrapper {
  logSignature: string;
  dataHandler: { origin: Function };

  constructor() {
    this.logSignature = 'WebsocketWrapper';
    this.dataHandler = {
      origin: this.registerConnection,
    };
  }

  init = (port) => {
    ws = new WebSocketServer(port, {
      onutfmessage: this.onData,
    });
    ws.init();
  };

  registerConnection = (connection, data) => {
    console.log({
      msg: 'registerConnection::',
      data,
    });
    connections[data.identity] = connection;
  };

  onData = (connection, msg) => {
    if (msg === 'pong') {
      connection.send('pulse');
    } else {
      const data = JSON.parse(msg);
      if (data.event) {
        this.dataHandler[data.event](connection, data);
      } else {
        console.log(data);
      }
    }
  };

  send = (id, event, ...args) => {
    connections[id].send(JSON.stringify({ event, args }));
  };

  sendall = (event, ...args) => {
    const data = JSON.stringify({ event, args });
    console.log(data);
    for (let id in connections) {
      connections[id].send(data);
    }
  };
}

export const websocketWrapper = new WebsocketWrapper();
export default websocketWrapper;
