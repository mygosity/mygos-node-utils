import express, { RequestHandler, Express, Request, Response, NextFunction } from 'express';
import { noop } from '../common/pure/misc';

const logSignature = 'ServerWrapper=>';

type RouteHandler = (req: Request, res: Response, next: NextFunction) => void;

type RouteHandlerMap = {
	get?: Record<string, RouteHandler>;
	post?: Record<string, RouteHandler>;
};
type ErrorHandlerType = (err: any, req: Request, res: Response, next: NextFunction) => any;

const basicErrorHandler = (error: any, req: Request, res: Response, next: NextFunction): any => {
	console.error(error);
	res.status(500).send('basicErrorHandler:: Something broke!');
};

let _instance: ServerWrapper = null;
export default class ServerWrapper {
	logSignature: string;
	app: Express;
	routeHandlers: RouteHandlerMap;
	errorHandler: ErrorHandlerType;

	constructor(routeHandlers: RouteHandlerMap = {}, errorHandler: ErrorHandlerType = basicErrorHandler) {
		if (_instance != null) {
			throw new Error(`${logSignature} is a singleton, you cannot create another instance`);
		}
		_instance = this;
		this.logSignature = logSignature;
		this.app = express();
		this.routeHandlers = {
			get: {
				'/image': noop as RouteHandler,
				'/files': noop as RouteHandler,
				'/directCode': noop as RouteHandler,
				'/eval': noop as RouteHandler,
				'/evalCodeConfig': noop as RouteHandler,
			},
			post: {
				'/log': noop as RouteHandler,
				'/error': noop as RouteHandler,
			},
		};
		for (let type in routeHandlers) {
			const routeType = routeHandlers[type];
			const currentRouteType = this.routeHandlers[type];
			if (currentRouteType !== undefined) {
				for (let route in routeType) {
					currentRouteType[route] = routeType[route];
				}
			} else {
				this.routeHandlers[type] = routeHandlers[type];
			}
		}
		this.errorHandler = errorHandler;
	}

	init = () => {
		//error handler base
		this.app.use(this.errorHandler);

		this.app.get('/image/*', this.routeHandlers.get['/image']);
		this.app.get('/files/*', this.routeHandlers.get['/files']);
		this.app.get('/directCode/*', this.routeHandlers.get['/directCode']);
		this.app.get('/eval/*', this.routeHandlers.get['/eval']);
		this.app.get('/evalCodeConfig', this.routeHandlers.get['/evalCodeConfig']);

		this.app.post('/log', this.routeHandlers.post['/log']);
		this.app.post('/error', this.routeHandlers.post['/error']);
	};
}
