import { DoubleEndedQueue } from './double_ended_queue';

//######################### Generic PriorityQueue #########################
export function PriorityQueue(compare) {
	this.list = [];
	this.compare = compare;
}

PriorityQueue.prototype.front = function () {
	return this.list[0];
};

PriorityQueue.prototype.getParentIndex = function (i) {
	return Math.floor((i - 1) / 2);
};

PriorityQueue.prototype.swap = function (i, j) {
	const tmp = this.list[i];
	this.list[i] = this.list[j];
	this.list[j] = tmp;
};

PriorityQueue.prototype._internalGetNextIndexAfterSwap = function (i, direction = 'u') {
	const leftIndex = i * 2 + 1;
	const rightIndex = i * 2 + 2;
	if (
		this.compare(this.list[leftIndex], this.list[rightIndex]) < 0 &&
		this.compare(this.list[leftIndex], this.list[i]) < 0
	) {
		this.swap(i, leftIndex);
		return direction === 'u' ? this.getParentIndex(i) : leftIndex;
	} else if (this.compare(this.list[rightIndex], this.list[i]) < 0) {
		this.swap(i, rightIndex);
		return direction === 'u' ? this.getParentIndex(i) : rightIndex;
	}
	return direction === 'u' ? -1 : this.list.length;
};

PriorityQueue.prototype.enqueue = function (element, priority) {
	const data = { element, priority };
	this.list.push(data);
	let i = this.getParentIndex(this.list.length - 1);
	while (i >= 0) {
		i = this._internalGetNextIndexAfterSwap(i, 'u');
	}
};

PriorityQueue.prototype.dequeue = function () {
	this.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	let i = 0;
	while (i < this.list.length) {
		i = this._internalGetNextIndexAfterSwap(i, 'd');
	}
	return dequeued;
};

PriorityQueue.prototype.size = function () {
	return this.list.length;
};

PriorityQueue.prototype.clear = function () {
	this.list = [];
};

PriorityQueue.prototype.print = function () {
	console.log(this.list);
};

//######################### MinPriorityQueue #########################
export function GMinPriorityQueue(options = null) {
	if (options?.compare) {
		this.isLeftSideHigherPriority = options.compare;
	}
	if (options?.priority) {
		this.extractPriority = options.priority;
	}
}
GMinPriorityQueue.prototype = new PriorityQueue(
	(a, b) => (a?.priority ?? Infinity) - (b?.priority ?? Infinity),
);

//######################### MaxPriorityQueue #########################
export function GMaxPriorityQueue(options = null) {
	if (options?.compare) {
		this.isLeftSideHigherPriority = options.compare;
	}
	if (options?.priority) {
		this.extractPriority = options.priority;
	}
}
GMaxPriorityQueue.prototype = new PriorityQueue(
	(a, b) => (b?.priority ?? -Infinity) - (a?.priority ?? -Infinity),
);

//######################### MinPriorityQueue #########################

export function MinPriorityQueue(options?: { compare: (x: any, y: any) => number }) {
	this.list = [];
	if (options?.compare) {
		this.compare = options.compare; //TODO:: implement compare option later
	}
}

MinPriorityQueue.prototype.front = function () {
	return this.list[0];
};

MinPriorityQueue.prototype.size = function () {
	return this.list.length;
};

MinPriorityQueue.prototype.getParentIndex = function (i) {
	return (i - 1) >> 1;
};

MinPriorityQueue.prototype.swap = function (i, j) {
	const tmp = this.list[i];
	this.list[i] = this.list[j];
	this.list[j] = tmp;
};

MinPriorityQueue.prototype._internalGetNextIndexAfterSwap = function (i, direction = 'u') {
	const root = this.list[i].priority;
	const leftIndex = i * 2 + 1;
	const left = this.list[leftIndex]?.priority ?? Infinity;
	const rightIndex = i * 2 + 2;
	const right = this.list[rightIndex]?.priority ?? Infinity;
	if (left < root && left < right) {
		this.swap(i, leftIndex);
		return direction === 'u' ? this.getParentIndex(i) : leftIndex;
	} else if (right < root) {
		this.swap(i, rightIndex);
		return direction === 'u' ? this.getParentIndex(i) : rightIndex;
	}
	return direction === 'u' ? -1 : this.list.length;
};

MinPriorityQueue.prototype.enqueue = function (element, priority) {
	const data = { element, priority };
	this.list.push(data);
	let i = this.getParentIndex(this.list.length - 1);
	while (i >= 0) {
		i = this._internalGetNextIndexAfterSwap(i, 'u');
	}
};

MinPriorityQueue.prototype.dequeue = function () {
	this.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	let i = 0;
	while (i < this.list.length) {
		i = this._internalGetNextIndexAfterSwap(i, 'd');
	}
	return dequeued;
};

MinPriorityQueue.prototype.print = function () {
	console.log(this.list);
};

//######################### MaxPriorityQueue #########################
export function MaxPriorityQueue(options?: { compare: (x: any, y: any) => number }) {
	this.list = [];
	if (options?.compare) {
		this.compare = options.compare;
	}
}

MaxPriorityQueue.prototype.front = function () {
	return this.list[0];
};

MaxPriorityQueue.prototype.size = function () {
	return this.list.length;
};

MaxPriorityQueue.prototype.getParentIndex = function (i) {
	return Math.floor((i - 1) / 2);
};

MaxPriorityQueue.prototype.swap = function (i, j) {
	const tmp = this.list[i];
	this.list[i] = this.list[j];
	this.list[j] = tmp;
};

MaxPriorityQueue.prototype._internalGetNextIndexAfterSwap = function (i, direction = 'u') {
	const root = this.list[i].priority;
	const leftIndex = i * 2 + 1;
	const left = this.list[leftIndex]?.priority ?? -Infinity;
	const rightIndex = i * 2 + 2;
	const right = this.list[rightIndex]?.priority ?? -Infinity;
	if (left > root && left > right) {
		this.swap(i, leftIndex);
		return direction === 'u' ? this.getParentIndex(i) : leftIndex;
	} else if (right > root) {
		this.swap(i, rightIndex);
		return direction === 'u' ? this.getParentIndex(i) : rightIndex;
	}
	return direction === 'u' ? -1 : this.list.length;
};

MaxPriorityQueue.prototype.enqueue = function (element, priority) {
	const data = { element, priority };
	this.list[this.list.length] = data;
	let i = this.getParentIndex(this.list.length - 1);
	while (i >= 0) {
		i = this._internalGetNextIndexAfterSwap(i, 'u');
	}
};

MaxPriorityQueue.prototype.dequeue = function () {
	this.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	let i = 0;
	while (i < this.list.length) {
		i = this._internalGetNextIndexAfterSwap(i, 'd');
	}
	return dequeued;
};

MaxPriorityQueue.prototype.print = function () {
	console.log(this.list);
};

//######################### Max Priority Queue with double ended queues #########################

export function MaxPriorityQueueWithDequeue(capacity: number = 16) {
	this.list = new DoubleEndedQueue(capacity);
}

MaxPriorityQueueWithDequeue.prototype.front = function (): { element: any; priority: number } {
	return this.list.front();
};

MaxPriorityQueueWithDequeue.prototype.getParentIndex = function (i: number) {
	return Math.floor((i - 1) / 2);
};

MaxPriorityQueueWithDequeue.prototype._internalGetNextIndexAfterSwap = function (
	i,
	direction = 'u',
) {
	const root = this.list.getElementAt(i).priority;
	const leftIndex = i * 2 + 1;
	const left = this.list.getElementAt(leftIndex)?.priority ?? -Infinity;
	const rightIndex = i * 2 + 2;
	const right = this.list.getElementAt(rightIndex)?.priority ?? -Infinity;
	if (left > root && left > right) {
		this.list.swap(i, leftIndex);
		return direction === 'u' ? this.getParentIndex(i) : leftIndex;
	} else if (right > root) {
		this.list.swap(i, rightIndex);
		return direction === 'u' ? this.getParentIndex(i) : rightIndex;
	}
	return direction === 'u' ? -1 : this.list.length;
};

MaxPriorityQueueWithDequeue.prototype.enqueue = function (element: any, priority: number) {
	const data = { element, priority };
	this.list.push(data);
	let i = this.getParentIndex(this.list.length - 1);
	while (i >= 0) {
		i = this._internalGetNextIndexAfterSwap(i, 'u');
	}
};

MaxPriorityQueueWithDequeue.prototype.dequeue = function () {
	this.list.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	let i = 0;
	while (i < this.list.length) {
		i = this._internalGetNextIndexAfterSwap(i, 'd');
	}
	return dequeued;
};

MaxPriorityQueueWithDequeue.prototype.print = function () {
	this.list.print();
};

//######################### Min Priority Queue with double ended queues #########################

export function MinPriorityQueueWithDequeue(capacity: number = 16) {
	this.list = new DoubleEndedQueue(capacity);
}

MinPriorityQueueWithDequeue.prototype.front = function (): { element: any; priority: number } {
	return this.list.front();
};

MinPriorityQueueWithDequeue.prototype.getParentIndex = function (i: number) {
	return Math.floor((i - 1) / 2);
};

MinPriorityQueueWithDequeue.prototype._internalGetNextIndexAfterSwap = function (
	i,
	direction = 'u',
) {
	const root = this.list.getElementAt(i).priority;
	const leftIndex = i * 2 + 1;
	const left = this.list.getElementAt(leftIndex)?.priority ?? Infinity;
	const rightIndex = i * 2 + 2;
	const right = this.list.getElementAt(rightIndex)?.priority ?? Infinity;
	if (left < root && left < right) {
		this.list.swap(i, leftIndex);
		return direction === 'u' ? this.getParentIndex(i) : leftIndex;
	} else if (right < root) {
		this.list.swap(i, rightIndex);
		return direction === 'u' ? this.getParentIndex(i) : rightIndex;
	}
	return direction === 'u' ? -1 : this.list.length;
};

MinPriorityQueueWithDequeue.prototype.enqueue = function (element: any, priority: number) {
	const data = { element, priority };
	this.list.push(data);
	let i = this.getParentIndex(this.list.length - 1);
	while (i >= 0) {
		i = this._internalGetNextIndexAfterSwap(i, 'u');
	}
};

MinPriorityQueueWithDequeue.prototype.dequeue = function () {
	this.list.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	let i = 0;
	while (i < this.list.length) {
		i = this._internalGetNextIndexAfterSwap(i, 'd');
	}
	return dequeued;
};

MinPriorityQueueWithDequeue.prototype.print = function () {
	this.list.print();
};

//######################### Generic Priority Queue with double ended queues #########################

export function PriorityQueueWithDeque(
	isLeftSideHigherPriority: (a: number, b: number) => number,
	extractPriority: (a: any) => number = (a) => a.priority,
	capacity = 16,
) {
	this.list = new DoubleEndedQueue(capacity);
	this.isLeftSideHigherPriority = isLeftSideHigherPriority;
	this.extractPriority = extractPriority;
}

PriorityQueueWithDeque.prototype.front = function (): { element: any; priority: number } {
	return this.list.front();
};

PriorityQueueWithDeque.prototype.getParentIndex = function (i: number) {
	return Math.floor((i - 1) / 2);
};

PriorityQueueWithDeque.prototype._internalGetNextIndexAfterSwap = function (i, direction = 'u') {
	const root =
		this.list.getElementAt(i) != null ? this.extractPriority(this.list.getElementAt(i)) : null;

	const leftIndex = i * 2 + 1;

	const left =
		this.list.getElementAt(leftIndex) != null
			? this.extractPriority(this.list.getElementAt(leftIndex))
			: null;

	const rightIndex = i * 2 + 2;
	const right =
		this.list.getElementAt(rightIndex) != null
			? this.extractPriority(this.list.getElementAt(rightIndex))
			: null;

	if (
		left != null &&
		(right == null || this.isLeftSideHigherPriority(left, right) < 0) &&
		this.isLeftSideHigherPriority(left, root) < 0
	) {
		this.list.swap(i, i * 2 + 1);
		return direction === 'u' ? this.getParentIndex(i) : i * 2 + 1;
	} else if (right != null && this.isLeftSideHigherPriority(right, root) < 0) {
		this.list.swap(i, i * 2 + 2);
		return direction === 'u' ? this.getParentIndex(i) : i * 2 + 2;
	}
	return direction === 'u' ? -1 : this.list.length;
};

PriorityQueueWithDeque.prototype.enqueue = function (element: any, priority: number) {
	const data = { element, priority };
	this.list.push(data);
	let i = this.getParentIndex(this.list.length - 1);
	while (i >= 0) {
		i = this._internalGetNextIndexAfterSwap(i, 'u');
	}
};

PriorityQueueWithDeque.prototype.dequeue = function () {
	this.list.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	let i = 0;
	while (i < this.list.length) {
		i = this._internalGetNextIndexAfterSwap(i, 'd');
	}
	return dequeued;
};

//######################### Generic Priority Queue with double ended queues with an alternate sorting up / down method #########################

export function AltPriorityQueueWithDeque(
	swapPredicate: (a: number, b: number) => boolean,
	capacity = 16,
) {
	this.list = new DoubleEndedQueue(capacity);
	this.swapPredicate = swapPredicate;
}

AltPriorityQueueWithDeque.prototype.front = function (): { element: any; priority: number } {
	return this.list.front();
};

AltPriorityQueueWithDeque.prototype.getParentIndex = function (i: number) {
	return Math.floor((i - 1) / 2);
};

AltPriorityQueueWithDeque.prototype.sortUpwards = function (current: number) {
	const maxSize = this.list.length;
	while (current >= 0) {
		let left = current * 2 + 1;
		let right = current * 2 + 2;

		const leftPriority = this.list.getElementAt(left)?.priority ?? null;
		const rightPriority = this.list.getElementAt(right)?.priority ?? null;
		const currentPriority = this.list.getElementAt(current)?.priority ?? null;

		let swapped = false;
		if (right < maxSize && this.swapPredicate(rightPriority, currentPriority)) {
			this.list.swap(current, right);
			swapped = true;
		}
		if (left < maxSize && this.swapPredicate(leftPriority, currentPriority)) {
			this.list.swap(current, left);
			swapped = true;
		}
		if (!swapped) break;
		current = this.getParentIndex(current);
	}
};

AltPriorityQueueWithDeque.prototype.sortDownwards = function (current: number) {
	const maxSize = this.list.length;
	while (current < maxSize) {
		let left = current * 2 + 1;
		let right = current * 2 + 2;

		const leftPriority = this.list.getElementAt(left)?.priority ?? null;
		const rightPriority = this.list.getElementAt(right)?.priority ?? null;
		const currentPriority = this.list.getElementAt(current)?.priority ?? null;

		if (
			right < maxSize &&
			this.swapPredicate(rightPriority, currentPriority) &&
			this.swapPredicate(rightPriority, leftPriority)
		) {
			this.list.swap(current, right);
			current = right;
			continue;
		} else if (left < maxSize && this.swapPredicate(leftPriority, currentPriority)) {
			this.list.swap(current, left);
			current = left;
			continue;
		}
		break;
	}
};

AltPriorityQueueWithDeque.prototype.enqueue = function (element: any, priority: number) {
	const data = { element, priority };
	this.list.push(data);
	this.sortUpwards(this.getParentIndex(this.list.length - 1));
};

AltPriorityQueueWithDeque.prototype.dequeue = function () {
	this.list.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	this.sortDownwards(0);
	return dequeued;
};

//######################### Generic Priority Queue alternate version using two optional params #########################
export function GALTPriorityQueue(isLeftSideHigherPriority, extractPriority) {
	this.list = [];
	this.isLeftSideHigherPriority = isLeftSideHigherPriority;
	this.extractPriority = extractPriority;
}

GALTPriorityQueue.prototype.front = function () {
	return this.list[0];
};

GALTPriorityQueue.prototype.getParentIndex = function (i) {
	return Math.floor((i - 1) / 2);
};

GALTPriorityQueue.prototype.swap = function (i, j) {
	const tmp = this.list[i];
	this.list[i] = this.list[j];
	this.list[j] = tmp;
};

GALTPriorityQueue.prototype._internalGetNextIndexAfterSwap = function (i, direction = 'u') {
	const rootPriority = this.extractPriority(this.list[i]);

	const leftPriority =
		this.list[i * 2 + 1] != null ? this.extractPriority(this.list[i * 2 + 1]) : null;
	const rightPriority =
		this.list[i * 2 + 2] != null ? this.extractPriority(this.list[i * 2 + 2]) : null;

	if (
		leftPriority != null &&
		(rightPriority == null || this.isLeftSideHigherPriority(leftPriority, rightPriority) < 0) &&
		this.isLeftSideHigherPriority(leftPriority, rootPriority) < 0
	) {
		this.swap(i, i * 2 + 1);
		return direction === 'u' ? this.getParentIndex(i) : i * 2 + 1;
	} else if (
		rightPriority != null &&
		this.isLeftSideHigherPriority(rightPriority, rootPriority) < 0
	) {
		this.swap(i, i * 2 + 2);
		return direction === 'u' ? this.getParentIndex(i) : i * 2 + 2;
	}
	return direction === 'u' ? -1 : this.list.length;
};

GALTPriorityQueue.prototype.enqueue = function (element, priority) {
	const data = { element, priority };
	this.list.push(data);
	let i = this.getParentIndex(this.list.length - 1);
	while (i >= 0) {
		i = this._internalGetNextIndexAfterSwap(i, 'u');
	}
};

GALTPriorityQueue.prototype.dequeue = function () {
	this.swap(0, this.list.length - 1);
	const dequeued = this.list.pop();
	let i = 0;
	while (i < this.list.length) {
		i = this._internalGetNextIndexAfterSwap(i, 'd');
	}
	return dequeued;
};

GALTPriorityQueue.prototype.size = function () {
	return this.list.length;
};

GALTPriorityQueue.prototype.print = function () {
	console.log(this.list);
};
