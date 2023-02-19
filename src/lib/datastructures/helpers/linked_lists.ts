export function reverseLinkedList(head) {
	let ptr = head;
	let newHead = null;
	while (ptr) {
		let nextNode = ptr.next;
		ptr.next = newHead;
		newHead = ptr;
		ptr = nextNode;
	}
	return newHead;
}
