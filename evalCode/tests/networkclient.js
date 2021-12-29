const { eventcontrol, fileHelper, webClient } = globalContext;

function handleNasaApi() {
	const url = 'http://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
	webClient
		.get(url)
		.then((response) => {
			console.log(response.data);
		})
		.catch((e) => {
			console.log(e);
		});
}

function handleHttpRedirect() {
	const url = 'http://amanexplains.com';
	webClient
		.get(url, {}, { parseJsonResponse: false })
		.then((response) => {
			console.log(response.data);
		})
		.catch((e) => {
			console.log(e);
		});
}

function testGetter() {
	const url = 'http://mygoexplains.com';
	webClient
		.get(url, {}, { parseJsonResponse: false })
		.then((response) => {
			console.log(response.data);
		})
		.catch((e) => {
			console.log(e);
		});
}

function testPoster() {
	const url = 'http://localhost:57333/log';
	webClient
		.post(
			url,
			JSON.stringify({
				data: 'hello world',
			}),
			{},
			{ parseJsonResponse: true },
		)
		.then((response) => {
			console.log(response.data);
		})
		.catch((e) => {
			console.log(e);
		});
}

function main() {
	testPoster();
}
main();
