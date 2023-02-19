export function DoubleLinkedListSentinel() {
	this.head = new DoubleLinkedListNode(null);
	this.tail = new DoubleLinkedListNode(null);
	this.head.prev = this.tail;
	this.tail.next = this.head;
	this.size = 0;

	this.add = function (node) {
		node.next = this.head;
		node.prev = this.head.prev;
		this.head.prev.next = node;
		this.head.prev = node;
		this.size++;
	};

	this.remove = function (node) {
		const nextNode = node.next;
		const prevNode = node.prev;
		nextNode.prev = prevNode;
		prevNode.next = nextNode;
		--this.size;
	};

	this.moveToHead = function (node) {
		this.remove(node);
		this.add(node);
	};

	this.popTail = function () {
		const res = this.back();
		this.remove(res);
		return res;
	};

	this.front = function () {
		return this.head.prev;
	};

	this.back = function () {
		return this.tail.next;
	};

	this.findNodeFromHead = function (data) {
		let target = this.front();
		if (target?.data === data) return target;
		while (target && target !== this.tail) {
			target = target.prev;
			if (target?.data === data) return target;
		}
		if (target?.data === data) return target;
	};

	this.findNodeFromTail = function (data) {
		let target = this.back();
		if (target?.data === data) return target;
		while (target && target !== this.head) {
			target = target.next;
			if (target.data === data) return target;
		}
		if (target.data === data) return target;
	};

	this.print = function () {
		let list = [];
		let target = this.back();
		while (target && target !== this.head) {
			list.push(target.data);
			target = target.next;
		}
		console.log({
			list,
			head: this.front()?.data ?? null,
			tail: this.back()?.data ?? null,
		});
	};
}

export function DoubleLinkedList_Lean() {
	this.head = new DoubleLinkedListNode(null);
	this.tail = new DoubleLinkedListNode(null);
	this.head.next = this.tail;
	this.tail.prev = this.head;
	this.size = 0;

	this.add = function (node) {
		node.prev = this.head;
		node.next = this.head.next;
		this.head.next.prev = node;
		this.head.next = node;
		++this.size;
	};

	this.remove = function (node) {
		const prev = node.prev;
		const next = node.next;
		prev.next = next;
		next.prev = prev;
		--this.size;
	};

	this.moveToHead = function (node) {
		this.remove(node);
		this.add(node);
	};

	this.popTail = function () {
		const res = this.tail.prev;
		this.remove(res);
		return res;
	};

	this.front = function () {
		return this.head.next;
	};

	this.back = function () {
		return this.tail.prev;
	};

	this.print = function () {
		let list = [];
		let target = this.back();
		while (target && target !== this.head) {
			list.push(target.data);
			target = target.prev;
		}
		console.log({
			list,
			head: this.front()?.data ?? null,
			tail: this.back()?.data ?? null,
		});
	};
}

export class DoubleLinkedListNode<T> {
	data: T = null;
	next: DoubleLinkedListNode<T> = null;
	prev: DoubleLinkedListNode<T> = null;
	constructor(data: T) {
		this.data = data;
	}
}

export class DoubleLinkedList<T> {
	size: number = 0;
	head: DoubleLinkedListNode<T> = null;
	tail: DoubleLinkedListNode<T> = null;

	add(newNode: DoubleLinkedListNode<T>) {
		if (this.size === 0) {
			this.head = newNode;
			this.tail = newNode;
			this.size++;
			return;
		}

		newNode.prev = this.head;
		this.head.next = newNode;
		this.head = newNode;
		this.head.next = null;

		this.size++;
	}

	remove(node: DoubleLinkedListNode<T>) {
		if (this.size === 1) {
			this.head = null;
			this.tail = null;
			this.size = 0;
			return;
		}

		const nextNode = node.next;
		const prevNode = node.prev;

		//if it was the tail then assign a new tail
		if (prevNode == null) {
			this.tail = nextNode;
			this.tail.prev = null;
		} else {
			prevNode.next = nextNode;
		}

		//if it was the head then assign a new head
		if (nextNode == null) {
			this.head = prevNode;
			this.head.next = null;
		} else {
			nextNode.prev = prevNode;
		}

		--this.size;
	}

	front() {
		return this.head;
	}

	back() {
		return this.tail;
	}

	print() {
		let list = [];
		let target = this.tail;
		while (target) {
			list.push(target.data);
			target = target.next;
		}
		console.log({
			list,
			head: this.head?.data ?? null,
			tail: this.tail?.data ?? null,
		});
	}
}
