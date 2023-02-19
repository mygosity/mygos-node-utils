export interface EnvInterface {
	identity: string;
	identityBridge: string;
	environment: string;
	websocketHosts: {
		[key: string]: {
			host: string;
			port: string;
			key: string;
			allowedIdentities: Record<string, { host: string }>;
		};
	};
	encryptionKey: string;
	encryptionSignature: string;
}
