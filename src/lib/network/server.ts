import { Express, Request, Response, NextFunction } from 'express';
import fs from 'fs';

import logger from '../logger';
import fileHelper from '../file';
import { getTranspiledData } from '../common';
import { getAusTimestamp } from '../date';

import { safeJsonParse, splitInReverseByCondition } from '../common/inputhandlers';
import ServerWrapper from './wrapper';
import { paths } from '../../settings';

const logSignature = 'LocalServer=>';
const baseFileservingPath = 'fileserving';
const mime = {
	html: 'text/html',
	txt: 'text/plain',
	css: 'text/css',
	gif: 'image/gif',
	jpg: 'image/jpeg',
	png: 'image/png',
	svg: 'image/svg+xml',
	js: 'application/javascript',
	json: 'application/json',
	zip: 'application/zip',
};

class LocalServer {
	logSignature: string;
	server: ServerWrapper;
	sockets = [];

	asyncStorage: Map<string, string> = new Map();
	//map of user agent ids to a setting config to enable agent id targeting for live reloads etc
	idToSetting: Map<string, Map<string, string>> = new Map();

	constructor() {
		this.logSignature = logSignature;
		this.server = new ServerWrapper({
			get: {
				'/image': this.imageserving,
				'/files': this.fileserving,
				'/directCode': this.handleDirectPayloadFetch,
				'/eval': this.handleFetchCodePayload,
				'/evalCodeConfig': this.handleFetchCodeConfig,
			},
			post: {
				'/log': this.postLog,
				'/error': this.postError,
			},
		});
		this.server.init();
	}

	startServing = (port: number = 57333) => {
		this.service.listen(port, () => {
			logger.report({ logSignature, funcSignature: 'startServing' }, `LocalServer listening on port ${port}...`);
		});
		this.service.on('connection', (socket) => {
			logger.report({ logSignature, funcSignature: 'startServing' }, `Add socket: ${this.sockets.length + 1}`);
			this.sockets.push(socket);
		});
	};

	stopServing = () => {
		this.sockets.forEach((socket, index) => {
			logger.report({ logSignature, funcSignature: 'stopServing' }, `Destroying socket: ${index + 1}`);
			if (socket.destroyed === false) {
				socket.destroy();
			}
		});
	};

	get service(): Express {
		return this.server.app;
	}

	getAsyncStorageMap = () => {
		return this.asyncStorage;
	};

	getIdToSettingsMap = (): Map<string, Map<string, string>> => {
		return this.idToSetting;
	};

	getIdFromRequest = (req: Request): string => {
		const hostIp = req.connection?.remoteAddress ?? 'unknownAddress';
		const userAgent = req.headers['user-agent'] ?? 'unknownAgent';
		const id = hostIp + ' | ' + userAgent;
		return id;
	};

	getMapForRequest = (id: string): Map<string, string> => {
		if (!this.idToSetting.has(id)) this.idToSetting.set(id, new Map());
		return this.idToSetting.get(id);
	};

	updateTargetMap = (id: string, settingName: string, settingValue: string) => {
		if (this.idToSetting.get(id) != null) {
			this.idToSetting.get(id).set(settingName, settingValue);
			console.log(`updateTargetMap:: id = ${id} setting key/value pair -> ${settingName}: ${settingValue}`);
		} else {
			const keys = this.idToSetting.keys();
			let i = 0;
			for (const key of keys) {
				console.log(`\nupdateTargetMap:: ITERATING KEYS\ni:${i++} key=${key}, id=${id}\n`);
				if (key.toLowerCase().indexOf(id) !== -1) {
					console.log(`updateTargetMap:: id = ${key} setting key/value pair -> ${settingName}: ${settingValue}`);
					this.idToSetting.get(key).set(settingName, settingValue);
				}
			}
			if (i === 0) {
				console.log(`updateTargetMap:: could not find id: ${id}`);
			}
		}
	};

	updateAllIdMaps = (settingName: string, settingValue: string) => {
		for (const [id, map] of this.idToSetting) {
			map.set(settingName, settingValue);
		}
	};

	resetAllMapWithId = (target: string) => {
		if (!this.idToSetting.has(target)) return;
		this.idToSetting.get(target).clear();
	};

	resetAllIdMap = () => {
		this.idToSetting.clear();
	};

	handleDirectPayloadFetch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const [base, ext] = splitInReverseByCondition(req.path, (i: string) => i === '.');
		const parsedPath = '/' + req.path.replace('/directCode/', 'evalCode/');
		const finalPath = decodeURI(fileHelper.getResolvedPath(parsedPath));
		logger.report({ logSignature, funcSignature: 'handleDirectPayloadFetch' }, `req.path: ${req.path}, finalPath: ${finalPath}`);
		let code = fileHelper.readFileSync(finalPath, { jsonParse: false, relativePath: false }).toString();
		try {
			code = await getTranspiledData(code);
		} catch (e) {
			console.log('handleDirectPayloadFetch:: failed to transpile', e);
		}
		//@ts-ignore
		if (console.context == null) console.context = {};
		//@ts-ignore
		console.context.localServer = this;
		// console.log('handleDirectPayloadFetch:: codeLen: ' + code.length);
		setTimeout(() => {
			res.set('Content-Type', mime.json);
			res.status(200);
			return res.send(code);
		}, 50);
	};

	handleFetchCodeConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const [base, ext] = splitInReverseByCondition(req.path, (i: string) => i === '.');
		const parsedPath = '/' + req.path.replace('/evalCodeConfig', 'evalCode/fetchPayload/__fetchConfig.json');
		const finalPath = decodeURI(fileHelper.getResolvedPath(parsedPath));
		logger.report({ logSignature, funcSignature: 'fileserving' }, `req.path: ${req.path}, finalPath: ${finalPath}`);

		res.set('Content-Type', mime.json);
		res.status(200);
		const config = fileHelper.readFileSync(finalPath, { jsonParse: true, relativePath: false });
		if (config?.fetchPayloadCodePath) {
			//@ts-ignore
			if (console.context == null) console.context = {};
			//@ts-ignore
			console.context.fetchPayloadCodePath = config.fetchPayloadCodePath;
		}
		res.send({ data: config });
	};

	handleFetchCodePayload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const [base, ext] = splitInReverseByCondition(req.path, (i: string) => i === '.');
		const parsedPath = '/' + req.path.replace('/eval/', 'evalCode/');
		const finalPath = decodeURI(fileHelper.getResolvedPath(parsedPath));
		logger.report({ logSignature, funcSignature: 'fileserving' }, `req.path: ${req.path}, finalPath: ${finalPath}`);
		// console.log('handleFetchCodePayload:: ' + parsedPath + '\nresolved: ' + finalPath);
		const code = fileHelper.readFileSync(finalPath, { jsonParse: false, relativePath: false }).toString();

		//@ts-ignore
		if (console.context == null) console.context = {};
		//@ts-ignore
		console.context.localServer = this;
		// console.log('handleFetchCodePayload:: codeLen: ' + code.length);
		eval(code);
		setTimeout(() => {
			res.set('Content-Type', mime.json);
			res.status(200);
			const id = this.getIdFromRequest(req);
			const map = this.getMapForRequest(id);
			const settingName = 'toggleLiveReloadCode';
			if (map.get(settingName) === '1') {
				console.log(`handleFetchCodePayload::${settingName} was triggered for ${id}: `);
				map.set(settingName, '0');
				const payload = localServer.asyncStorage.get('fetchCodePayload');
				return res.send({ isEvalCode: 1, data: payload });
			}
			if (!map.has(settingName)) map.set(settingName, '0');
			res.send({ data: null });
		}, 50);
	};

	fileserving = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const [base, ext] = splitInReverseByCondition(req.path, (i: string) => i === '.');
		const parsedPath = '/' + req.path.replace('/files/', '');
		const finalPath = decodeURI(fileHelper.getResolvedPath(parsedPath));
		// console.log('fileserving: ' + parsedPath + '\nresolved: ' + finalPath);
		// res.download(fileHelper.getResolvedPath(baseFileservingPath + req.path));
		logger.report({ logSignature, funcSignature: 'fileserving' }, `req.path: ${req.path}, finalPath: ${finalPath}`);
		const s = fs.createReadStream(finalPath);
		s.on('open', function () {
			res.set('Content-Type', mime[ext]);
			s.pipe(res);
		});
		s.on('error', function (error) {
			console.log(error);
			res.set('Content-Type', 'text/plain');
			res.status(404).end('Not found');
		});
	};

	imageserving = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		const [base, ext] = splitInReverseByCondition(req.path, (i: string) => i === '.');
		const finalPath = decodeURI(fileHelper.getResolvedPath(baseFileservingPath + req.path));
		logger.report({ logSignature, funcSignature: 'imageserving' }, `req.path: ${req.path}, finalPath: ${finalPath}`);
		const s = fs.createReadStream(finalPath);
		s.on('open', function () {
			res.set('Content-Type', mime[ext]);
			s.pipe(res);
		});
		s.on('error', function () {
			res.set('Content-Type', 'text/plain');
			res.status(404).end('Not found');
		});
	};

	postLog = async (req: Request, res: Response, next: NextFunction) => {
		let postedData: any = {};
		const logObj = { logSignature, funcSignature: 'postLog' };
		try {
			logger.report(logObj, `req.path: ${req.path}`);
			const bodyStringData = await _processBodyData(req);
			const bodyData = safeJsonParse(bodyStringData);
			postedData = bodyData?.data;
			// console.log(req.body, req.rawHeaders, req.params, { bodyStringData, postedData });
			if (postedData === undefined && bodyStringData !== undefined) {
				postedData = safeJsonParse(bodyStringData);
				if (postedData == null) {
					postedData = { data: bodyStringData.toString() };
				}
			}
			if (postedData !== undefined) {
				const data = { data: postedData, timeReceived: getAusTimestamp(Date.now()) };
				logger.report(logObj, `data pasted in console log`, {
					data,
					header: req.headers,
				});
				logger.record(`${paths.root}/_logging/console_logs_001`, data, {
					autoCreatePath: true,
					sizeLimit: 20,
					relativePath: false,
					prettyFormat: false,
					append: true,
					overwrite: false,
					nextFilePaddedZeroes: 3,
				});
				res.send('post request successfully custom logged');
			} else {
				_sendFailedStatus(res, 404, 'data was empty');
			}
		} catch (error) {
			console.error(error);
			logger.error(logObj, req.body);
			res.send('post request successfully logged as an error due to an unexpected problem');
		}
	};

	postError = (req: Request, res: Response, next: NextFunction): void => {
		const logObj = { logSignature, funcSignature: 'postError' };
		try {
			const jsonobj: any = safeJsonParse(req.body);
			logger.error(logObj, jsonobj);
		} catch (error) {
			console.error(error);
			logger.error(logObj, { error, body: req.body });
		}
		res.send('post request successfully logged an error');
	};
}

async function _processBodyData(req: Request): Promise<any> {
	return new Promise((resolve) => {
		let bodyStr = '';
		req.on('error', function (chunk) {
			resolve(null);
		});
		req.on('data', function (chunk) {
			bodyStr += chunk.toString();
		});
		req.on('end', function () {
			resolve(bodyStr);
		});
	});
}

function _sendFailedStatus(res: Response, code: number, msg: string): void {
	res.status(code);
	res.send(msg);
}

export const localServer = new LocalServer();
export default localServer;
