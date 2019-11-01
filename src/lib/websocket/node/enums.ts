export enum CONNECTION_STATES {
	CONNECTING,
	OPEN,
	CLOSING,
	CLOSED,
}

export const CLOSE_REASON_NORMAL = 1000; // The connection has closed after the request was fulfilled.
export const CLOSE_REASON_GOING_AWAY = 1001; // EndpointUnavailable	1001 Indicates an endpoint is being removed. Either the server or client will become unavailable.
export const CLOSE_REASON_PROTOCOL_ERROR = 1002; // The client or server is terminating the connection because of a protocol error.
export const CLOSE_REASON_UNPROCESSABLE_INPUT = 1003; // The client or server is terminating the connection because it cannot accept the data type it received.
export const CLOSE_REASON_RESERVED = 1004; // Reserved value.  Undefined meaning.
export const CLOSE_REASON_NOT_PROVIDED = 1005; // Not to be used on the wire
export const CLOSE_REASON_ABNORMAL = 1006; // Not to be used on the wire
export const CLOSE_REASON_INVALID_DATA = 1007; // The client or server is terminating the connection because it has received data inconsistent with the message type.
export const CLOSE_REASON_POLICY_VIOLATION = 1008; //The connection will be closed because an endpoint has received a message that violates its policy.
export const CLOSE_REASON_MESSAGE_TOO_BIG = 1009; // The client or server is terminating the connection because it has received a message that is too big for it to process.
export const CLOSE_REASON_EXTENSION_REQUIRED = 1010; // The client is terminating the connection because it expected the server to negotiate an extension.
export const CLOSE_REASON_INTERNAL_SERVER_ERROR = 1011; // The connection will be closed by the server because of an error on the server.
export const CLOSE_REASON_TLS_HANDSHAKE_FAILED = 1015; // Not to be used on the wire
