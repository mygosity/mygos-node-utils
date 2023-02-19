import {
	MaxPriorityQueue,
	MaxPriorityQueueWithDequeue,
	MinPriorityQueue,
	MinPriorityQueueWithDequeue,
	PriorityQueue,
	PriorityQueueWithDeque,
} from './priority_queue';

function unitTest(queue, listname) {
	const isMinType = listname.toLowerCase().includes('min');
	const elementsToAdd = [
		[0, 1],
		[1, 2],
		[2, 50],
		[3, 100],
		[4, 101],
		[5, 2000],
		[6, 41],
		[7, -1],
		[8, 0],
		[9, -20],
		[10, -10],
	];
	let next = 1;
	while (next < elementsToAdd.length) {
		const sortedList = [];
		for (let i = 0; i < next; ++i) {
			const [element, priority] = elementsToAdd[i];
			sortedList.push([element, priority]);
			queue.enqueue(element, priority);
		}
		if (isMinType) {
			sortedList.sort((x, y) => x[1] - y[1]);
		} else {
			sortedList.sort((x, y) => y[1] - x[1]);
		}
		let foundError = false;
		let k = 0;
		while (queue.front()) {
			const front = sortedList[k];
			const queueFront = queue.front();
			if (!(queueFront.priority === front[1] && queueFront.element === front[0])) {
				queue.print();
				console.log(`mismatch discovered`, {
					listname,
					m: isMinType,
					sorted: sortedList.slice(k),
				});
				console.log('');
				foundError = true;
			}
			queue.dequeue();
			k++;
		}
		for (let i = 0; i < next; ++i) {
			const [element, priority] = elementsToAdd[i];
			queue.enqueue(element, priority);
		}
		k = 0;
		while (queue.front()) {
			const front = sortedList[k];
			const queueFront = queue.front();
			if (!(queueFront.priority === front[1] && queueFront.element === front[0])) {
				queue.print();
				console.log(`mismatch discovered`, {
					listname,
					m: isMinType,
					sorted: sortedList.slice(k),
				});
				console.log('');
				foundError = true;
			}
			queue.dequeue();
			k++;
		}
		if (foundError) {
			console.log('');
			console.log('next set', { listname, next });
			console.log('');
		}
		next++;
	}
}

export function testPriorityQueueHeap() {
	const lists = [
		// [new MinPriorityQueueWithDequeue(), 'MinPriorityQueueHeapWithDequeue'],
		[new MinPriorityQueue(), 'MinPriorityQueue'],
		[
			new PriorityQueue((a, b) => (a?.priority ?? Infinity) - (b?.priority ?? Infinity)),
			'Generic Priority Queue as min queue',
		],
		[new MaxPriorityQueue(), 'MaxPriorityQueue'],
		[
			new PriorityQueue((a, b) => (b?.priority ?? -Infinity) - (a?.priority ?? -Infinity)),
			'Generic Priority Queue as max queue',
		],
	];
	lists.forEach(([list, listname]) => {
		console.log('listname: ' + listname);
		unitTest(list, listname);
		list.enqueue(1, 1);
		list.enqueue(1, 2);
		list.enqueue(1, 4);
		list.enqueue(1, 3);
		list.enqueue(1, 5);
		list.enqueue(1, 99);
		list.enqueue(1, 98);
		list.enqueue(1, 5);
		list.enqueue(1, 5);
		list.dequeue();
		list.dequeue();
		list.dequeue();
		list.dequeue();
		list.dequeue();
		list.dequeue();
		list.dequeue();
		list.dequeue();
		list.dequeue();
		list.print();
	});
}
