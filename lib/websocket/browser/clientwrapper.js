import eventcontrol from "eventcontrol";

import WebsocketClient from "./client";

let connection;
class WebsocketClientWrapper {
  constructor() {
    this.logSignature = "WebsocketClientWrapper=>";
  }

  init = (baseUrl, identity) => {
    this.identity = identity;
    this.client = new WebsocketClient(
      baseUrl,
      this.onMessage,
      {
        onopen: this.onOpen
      },
      {
        autoKeepAliveCallback: this.heartBeat
      }
    );
    this.client.loadWebsocketConnections();
  };

  heartBeat = () => {
    connection.send("pong");
  };

  onOpen = (event, ctx) => {
    connection = ctx;
    connection.send(
      JSON.stringify({
        event: "origin",
        identity: this.identity
      })
    );
  };

  onMessage = event => {
    // eslint-disable-next-line
    let { type, data } = event;
    if (data !== "pulse") {
      data = JSON.parse(data);
      if (data.event !== undefined) {
        const { event, args } = data;
        eventcontrol.emit(event, ...args);
      }
    }
  };
}

export const websocketClientWrapper = new WebsocketClientWrapper();
export default websocketClientWrapper;
