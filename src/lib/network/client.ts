import http from 'http';
import https from 'https';
import { safeJsonParse } from '../common/inputhandlers';

export class WebClient {
	shouldLogResponse: boolean = false;
	shouldLogError: boolean = false;

	private handleResponseCallback(
		resolve: (value: any) => void,
		reject: (reason: any) => void,
		url: URL,
		requestOptions: https.RequestOptions,
		customOptions: { parseJsonResponse: boolean; postData?: string } = {
			parseJsonResponse: true,
		},
	) {
		const request = (url.protocol[4] === 's' ? https : http)
			.request(url, requestOptions, (response: http.IncomingMessage) => {
				let data = '';

				response.setEncoding('utf8');

				response.on('data', (chunk) => {
					data += chunk;
				});

				response.on('end', () => {
					this.shouldLogResponse &&
						console.log('WebClient::handleResponseCallback:: ', {
							status: response.statusCode,
							headers: response.headers,
						});
					if (
						response.statusCode >= 300 &&
						response.statusCode < 400 &&
						response.headers.location
					) {
						const optionsWithUrlParsed = new URL(response.headers.location);
						const headers = {};
						this.shouldLogResponse &&
							console.log('WebClient::handleResponseCallback:: following redirect', {
								optionsWithUrlParsed,
							});
						if (customOptions.parseJsonResponse) {
							headers['Content-Type'] = 'application/json';
						}
						this.handleResponseCallback(
							resolve,
							reject,
							optionsWithUrlParsed,
							requestOptions,
							customOptions,
						);
						return;
					}
					const payload = customOptions.parseJsonResponse ? safeJsonParse(data) : data;
					resolve({
						response,
						data: payload,
					});
				});
			})
			.on('error', (error) => {
				this.shouldLogError &&
					console.log('WebClient::handleResponseCallback:: response.onError::', {
						error,
						requestOptions,
						customOptions,
					});
				reject(error);
			});

		request.on('error', (error) => {
			this.shouldLogError &&
				console.log('WebClient::handleResponseCallback:: request.onError::', {
					error,
					requestOptions,
					customOptions,
				});
			reject(error);
		});

		if (customOptions.postData) {
			request.write(customOptions.postData);
		}
		request.end();
	}

	private handleRequest(
		url: URL,
		requestOptions: https.RequestOptions,
		customOptions: { parseJsonResponse: boolean; postData?: string } = {
			parseJsonResponse: true,
		},
	): Promise<any> {
		return new Promise((resolve, reject) =>
			this.handleResponseCallback(resolve, reject, url, requestOptions, customOptions),
		);
	}

	async get(
		url: string,
		headers: http.OutgoingHttpHeaders = {},
		customOptions: { parseJsonResponse: boolean } = { parseJsonResponse: true },
	): Promise<any> {
		const optionsWithUrlParsed = new URL(url);
		if (customOptions.parseJsonResponse) {
			headers['Content-Type'] = 'application/json';
		}
		return await this.handleRequest(
			optionsWithUrlParsed,
			{ method: 'GET', headers },
			customOptions,
		);
	}

	async post(
		url: string,
		data: string,
		headers: http.OutgoingHttpHeaders = {},
		customOptions: { parseJsonResponse: boolean } = { parseJsonResponse: true },
	): Promise<any> {
		const optionsWithUrlParsed = new URL(url);
		if (customOptions.parseJsonResponse) {
			headers['Content-Type'] = 'application/json';
		}
		headers['Content-Length'] = Buffer.byteLength(data);
		return await this.handleRequest(
			optionsWithUrlParsed,
			{ method: 'POST', headers },
			{ parseJsonResponse: customOptions.parseJsonResponse, postData: data },
		);
	}
}
export const webClient = new WebClient();
