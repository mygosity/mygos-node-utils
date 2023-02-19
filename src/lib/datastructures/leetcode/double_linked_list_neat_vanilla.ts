//SOURCE: 146. LRU Cache - solution

export function DoubleLinkedListNode(data) {
	this.data = data;
	this.next = null;
	this.prev = null;
}

export function DoubleLinkedList() {
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
}
