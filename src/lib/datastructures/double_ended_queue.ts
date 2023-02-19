export function DoubleEndedQueue(capacity = 4) {
	this.capacity = capacity;
	this.list = new Array(capacity);
	this.length = 0;
	this.head = 0;
	this.tail = this.list.length - 1;
}

DoubleEndedQueue.prototype.handleExceededSize = function () {
	this.capacity = this.capacity * 2;
	const newList = new Array(this.capacity);
	const startIndex = this.head;
	for (let i = 0; i < this.list.length; ++i) {
		const index = (i + startIndex) % this.list.length;
		newList[i] = this.list[index];
	}
	this.head = 0;
	this.tail = this.length - 1;
	this.list = newList;
};

DoubleEndedQueue.prototype.push = function (element) {
	if (this.length === this.capacity) this.handleExceededSize();
	this.tail = (this.tail + 1) % this.list.length;
	this.list[this.tail] = element;
	++this.length;
};

DoubleEndedQueue.prototype.unshift = function (element) {
	if (this.length === this.capacity) this.handleExceededSize();
	this.head = (this.head - 1 + this.list.length) % this.list.length;
	this.list[this.head] = element;
	++this.length;
};

DoubleEndedQueue.prototype.shift = function () {
	if (this.length === 0) return undefined;
	const droppedElement = this.list[this.head];
	this.list[this.head] = undefined;
	this.head = (this.head + 1) % this.list.length;
	--this.length;
	return droppedElement;
};

DoubleEndedQueue.prototype.pop = function () {
	if (this.length === 0) return undefined;
	const droppedElement = this.list[this.tail];
	this.list[this.tail] = undefined;
	this.tail = (this.tail - 1 + this.list.length) % this.list.length;
	--this.length;
	return droppedElement;
};

DoubleEndedQueue.prototype.front = function () {
	if (this.length === 0) return undefined;
	return this.list[this.head];
};

DoubleEndedQueue.prototype.back = function () {
	if (this.length === 0) return undefined;
	return this.list[this.tail];
};

/***********************************************/
/***************** Extensions ******************/
/***********************************************/
DoubleEndedQueue.prototype._recalculateLength = function () {
	if ((this.head - 1 + this.list.length) % this.list.length === this.tail) {
		return 0;
	}
	const size = (this.tail - this.head + 1 + this.list.length) % this.list.length;
	// console.log(`_recalculateLength:: ${size}`, { head: this.head, tail: this.tail });
	return size;
};

DoubleEndedQueue.prototype.slice = function (startIndex, endIndex, capacity) {
	if (startIndex === undefined || this.length === 0 || startIndex >= this.length) {
		return new DoubleEndedQueue();
	}

	endIndex = endIndex && endIndex > this.length ? this.length : endIndex ?? this.length;
	const length = endIndex - startIndex;
	if (capacity === undefined) capacity = length;
	// console.log({ capacity, startIndex, endIndex, length });
	const slice = new DoubleEndedQueue(Math.max(capacity, 4));

	for (let i = 0; i < length; ++i) {
		const ni = (i + startIndex + this.head) % this.list.length;
		slice.push(this.list[ni]);
	}
	return slice;
};

DoubleEndedQueue.prototype.splice = function (startIndex, numToErase, ...elementsToAdd) {
	const maxNumToErase = (this.tail + this.list.length - startIndex + 1) % this.list.length;
	const numToAdd = elementsToAdd.length;
	numToErase =
		numToErase === undefined
			? maxNumToErase
			: numToErase > maxNumToErase
			? maxNumToErase
			: Math.max(numToErase, 0);
	const capacity = Math.max(numToErase, 4);
	const output = new DoubleEndedQueue(capacity);

	let startDeletedIndex = null;
	let endDeletedIndex = null;

	//first delete elements specified by the 2nd argument (this will leave null values in the list)
	for (let i = 0; i < numToErase; ++i) {
		const currIndex = (i + startIndex + this.head) % this.list.length;
		output.push(this.list[currIndex]);
		this.list[currIndex] = undefined;

		if (startDeletedIndex === null) startDeletedIndex = currIndex;
		endDeletedIndex = currIndex;

		if (currIndex === this.tail) {
			this.tail = (startIndex + this.head - 1 + this.list.length) % this.list.length;
		}
	}
	this.length = this._recalculateLength();

	//better to be safe by increasing the size of the list as it might cause an issue during insertion
	if (this.length + 1 >= this.list.length) {
		this.handleExceededSize();
	}

	const pastTailIndex = (this.tail + 1) % this.list.length;
	let hasDeletedThisRange = false;

	//new elements need to be inserted at the startIndex that will push the rest backwards
	for (let i = 0; i < elementsToAdd.length; ++i) {
		const currIndex = (i + startIndex + this.head) % this.list.length;
		if (currIndex >= pastTailIndex) {
			this.push(elementsToAdd[i]);
		} else {
			//can't use gte or lte to do a range check as it's a wrapping list
			if (currIndex === startDeletedIndex) hasDeletedThisRange = true;
			if (!hasDeletedThisRange) elementsToAdd.push(this.list[currIndex]);
			if (hasDeletedThisRange && currIndex === endDeletedIndex) {
				hasDeletedThisRange = false;
			}
			this.list[currIndex] = elementsToAdd[i];
		}
	}

	//if too many elements were deleted in between, they need to be compressed
	if (numToAdd < numToErase && startDeletedIndex !== null) {
		let replace = (startDeletedIndex + numToAdd) % this.list.length;
		for (let k = 0; k < this.length; ++k) {
			const next = (endDeletedIndex + k + 1) % this.list.length;
			this.list[replace] = this.list[next];
			this.list[next] = undefined;
			if (next === this.tail) {
				this.tail = replace;
				this.length = this._recalculateLength();
				break;
			}
			replace++;
		}
	}
	return output;
};

DoubleEndedQueue.prototype.toArray = function (startIndex, endIndex) {
	if (startIndex === undefined) startIndex = 0;
	if (endIndex === undefined) endIndex = this.length;

	const array = [];
	const length = endIndex - startIndex;

	for (let i = 0; i < length; ++i) {
		const ni = (i + startIndex + this.head) % this.list.length;
		if (ni === this.tail) break;
		array.push(this.list[ni]);
	}
	return array;
};

DoubleEndedQueue.prototype.getIndexAt = function (index) {
	if (index >= this.length) return -1;
	return (this.head + index) % this.length;
};

DoubleEndedQueue.prototype.getElementAt = function (index) {
	return this.list[this.getIndexAt(index)];
};

DoubleEndedQueue.prototype.swap = function (i, j) {
	const _i = this.getIndexAt(i);
	const _j = this.getIndexAt(j);
	const tmp = this.list[_i];
	this.list[_i] = this.list[_j];
	this.list[_j] = tmp;
};

DoubleEndedQueue.prototype.print = function () {
	console.log(this.list);
	const startIndex = (this.tail - this.length + 1 + this.list.length) % this.list.length;
	console.log({
		head: this.head,
		tail: this.tail,
		size: this.length,
		capacity: this.list.length,
		startIndex,
		front: this.front(),
		back: this.back(),
	});
	const newList = [];
	for (let i = 0; i < this.length; ++i) {
		const index = (i + this.head) % this.list.length;
		newList[i] = this.list[index];
	}
	console.log({ newList });
};

/**********************************************************************************************
 * Alternate Definition
 **********************************************************************************************/
export function Deque(capacity = 8) {
	this.capacity = capacity;
	this.list = new Array(capacity);
	this.head = 0;
	this.tail = -1;
	this.length = 0;

	this.handleExceededSize = function () {
		const nextList = new Array(this.capacity * 2);
		for (let i = 0; i < this.length; ++i) {
			nextList[i] = this.list[(this.head + i) % this.list.length];
		}
		this.head = 0;
		this.tail = this.length - 1;
		this.list = nextList;
		this.capacity = nextList.length;
	};

	this.unshift = function (e) {
		if (this.length === this.capacity) {
			this.handleExceededSize();
		}
		this.head = (this.head - 1 + this.list.length) % this.list.length;
		this.list[this.head] = e;
		this.length++;
	};

	this.push = function (e) {
		if (this.length === this.capacity) {
			this.handleExceededSize();
		}
		this.tail = (this.tail + 1) % this.list.length;
		this.list[this.tail] = e;
		this.length++;
	};

	this.shift = function () {
		if (this.length === 0) return;
		this.length--;
		this.list[this.head] = null;
		this.head = (this.head + 1) % this.list.length;
	};

	this.pop = function () {
		if (this.length === 0) return;
		this.length--;
		this.list[this.tail] = null;
		this.tail = (this.tail - 1 + this.list.length) % this.list.length;
	};

	this.front = function () {
		return this.list[this.head] ?? null;
	};

	this.back = function () {
		return this.list[this.tail] ?? null;
	};
}
