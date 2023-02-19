import { DoubleEndedQueue } from './double_ended_queue';

const nodesToAdd = [
	0, //
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
];

function printDq(dq) {
	console.log(`printDq::`);
	dq.print();
	console.log(`size of front pushed dq: ${dq.length}`);
	console.log(`capacity of front pushed dq: ${dq.capacity}`);
	console.log(`front of front pushed dq: ${dq.front()}`);
	console.log(`back of front pushed dq: ${dq.back()}`);
}

function printTestList(list) {
	console.log(`printTestList::`);
	console.log(list);
}

function printAndCompare(dq, list) {
	console.log('');
	console.log(`********************** logging results:: start **********************`);
	printDq(dq);
	console.log(``);
	printTestList(list);
	console.log(`********************** logging results:: end   **********************`);
	console.log('');
}

function testBackPush() {
	// const dq = new DoubleEndedQueue(nodesToAdd.length);
	const dq = new DoubleEndedQueue();
	nodesToAdd.forEach((el) => {
		console.log(`push dq adding element: ${el}`);
		dq.push(el);
	});
	// dq.shift();
	// dq.shift();
	// dq.shift();
	// dq.push(6);
	// dq.push(7);
	// dq.push(8);
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.unshift(2);
	// dq.unshift(1);
	// dq.unshift(0);
	// dq.push(99);
	// dq.push(98);
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.pop();
	// dq.unshift(99);
	// dq.pop();
	printDq(dq);
}

function testFrontPush() {
	const dq = new DoubleEndedQueue();
	nodesToAdd.forEach((el) => {
		console.log(`unshift dq adding element: ${el}`);
		dq.unshift(el);
	});
	printDq(dq);

	dq.shift();
	printDq(dq);

	dq.pop();
	printDq(dq);

	while (dq.length) {
		dq.pop();
		dq.print();
	}

	nodesToAdd.forEach((el) => {
		console.log(`unshift dq adding element: ${el}`);
		dq.unshift(el);
	});
	nodesToAdd.forEach((el) => {
		console.log(`unshift dq adding element: ${el}`);
		dq.unshift(el + 10);
	});
	printDq(dq);
}

function debugFrontPush() {
	const dq = new DoubleEndedQueue();
	nodesToAdd.forEach((el, i) => {
		console.log(
			`unshift dq adding element: ${el} - calc: ${Math.floor(dq.length / 10) * 10 + el}`,
		);
		dq.unshift(el + Math.floor(dq.length / 10) * 10);
	});
	printDq(dq);
	while (dq.length > 1) {
		dq.pop();
	}
	printDq(dq);

	dq.pop();
	printDq(dq);

	for (let k = 0; k < 10; ++k) {
		nodesToAdd.forEach((el, i) => {
			console.log(
				`unshift dq adding element: ${el} - calc: ${Math.floor(dq.length / 10) * 10 + el}`,
			);
			dq.unshift(el + Math.floor(dq.length / 10) * 10);
		});
	}
	printDq(dq);
	while (dq.length > 0) {
		dq.shift();
	}
	printDq(dq);
}

function standardPushTest() {
	const dq = new DoubleEndedQueue(4);
	dq.push(0);
	dq.push(1);
	dq.push(2);
	dq.push(3);
	dq.push(4);
	dq.unshift(-1);
	dq.unshift(-2);
	dq.unshift(-3);
	dq.push(-4);
	while (dq.length > 0) {
		dq.pop();
	}
	dq.push(0);
	dq.push(1);
	dq.push(2);
	dq.push(3);
	dq.push(4);
	dq.unshift(-1);
	dq.unshift(-2);
	dq.unshift(-3);
	dq.push(5);
	dq.push(6);
	dq.push(7);
	dq.push(8);
	dq.push(9);
	dq.push(10);
	dq.push(11);
	dq.push(12);
	dq.push(13);
	printDq(dq);
}

function spliceTest(dq) {
	// printDq(dq);

	// for (let i = 0; i < 100; ++i) {
	// 	dq.push(0);
	// 	dq.push(1);
	// 	dq.push(2);
	// 	dq.push(3);
	// 	dq.push(4);
	// 	printDq(dq);

	// 	dq.shift();
	// 	dq.shift();
	// 	dq.shift();
	// 	dq.shift();
	// 	dq.shift();
	// 	printDq(dq);
	// }

	const testElements = [
		0, //
		1,
		2,
		3,
		4,
	];
	let testList = [];

	for (let i = 0; i < testElements.length; ++i) {
		dq.push(testElements[i]);
		testList.push(testElements[i]);
	}
	printAndCompare(dq, testList);

	let splicedDq = dq.splice(0, 1);
	let splicedTest = testList.splice(0, 1);
	console.log({ splicedDq, splicedTest });
	printAndCompare(dq, testList);
}

export function testDoubleEndedQueue() {
	const dq = new DoubleEndedQueue(4);
	// standardPushTest();
	spliceTest(dq);
	// spliceTest(dq);

	// console.log({
	// 	front: dq.front(),
	// 	back: dq.back(),
	// 	tail: dq.tail,
	// 	head: dq.head,
	// });
	// testBackPush();
	// testFrontPush();
	// debugFrontPush();
}
