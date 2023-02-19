//SOURCE: 146. LRU Cache - solution

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

	constructor() {
		this.head = new DoubleLinkedListNode(null);
		this.tail = new DoubleLinkedListNode(null);
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}

	add(node: DoubleLinkedListNode<T>) {
		node.prev = this.head;
		node.next = this.head.next;
		this.head.next.prev = node;
		this.head.next = node;
		++this.size;
	}

	remove(node: DoubleLinkedListNode<T>) {
		const prev = node.prev;
		const next = node.next;
		prev.next = next;
		next.prev = prev;
		--this.size;
	}

	moveToHead(node: DoubleLinkedListNode<T>) {
		this.remove(node);
		this.add(node);
	}

	popTail(): DoubleLinkedListNode<T> {
		const res = this.tail.prev;
		this.remove(res);
		return res;
	}

	front() {
		return this.head.next;
	}

	back() {
		return this.tail.prev;
	}
}
