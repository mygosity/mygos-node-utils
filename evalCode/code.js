const { eventcontrol, fileHelper } = globalContext;

!globalContext.helloWorld &&
	(globalContext.helloWorld = function () {
		console.log('hello world');
	});

!globalContext.test &&
	(globalContext.test = function () {
		console.log('test funky');
	});

!globalContext.test2 &&
	(globalContext.test2 = function () {
		console.log('test funky 2');
	});

!globalContext.test3 &&
	(globalContext.test3 = function () {
		console.log('test funky 3');
	});

function main() {
	eventcontrol.add('hello', globalContext.helloWorld);
	eventcontrol.add('two', globalContext.test);
	eventcontrol.add('two', globalContext.test2);
	eventcontrol.add('two', globalContext.test3);
	eventcontrol.add('two', globalContext.test3);
	eventcontrol.add('two', globalContext.test3);
	eventcontrol.add('two', globalContext.test3);
	eventcontrol.add('two', globalContext.test3);
	console.log(eventcontrol.registeredEvents);
	eventcontrol.remove('hello', globalContext.helloWorld);
	eventcontrol.remove('two', globalContext.test);
	eventcontrol.emit('hello');
	eventcontrol.emit('two');
	console.log(eventcontrol.registeredEvents);
	eventcontrol.dispose();
	console.log(eventcontrol.registeredEvents);
}
main();
