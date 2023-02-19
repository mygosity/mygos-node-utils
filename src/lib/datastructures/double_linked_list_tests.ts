import {
	DoubleLinkedList,
	DoubleLinkedListNode,
	DoubleLinkedList_Lean,
	DoubleLinkedListSentinel,
} from './double_linked_list';

function testMyDll() {
	const nodesToAdd = [
		new DoubleLinkedListNode({ value: 0 }),
		new DoubleLinkedListNode({ value: 3 }),
		new DoubleLinkedListNode({ value: 5 }),
	];
	const dll = new DoubleLinkedList();
	dll.add(nodesToAdd[0]);
	dll.add(nodesToAdd[1]);
	dll.add(nodesToAdd[2]);
	// dll.print();
	dll.remove(nodesToAdd[0]);
	// dll.print();
	dll.remove(nodesToAdd[1]);
	// dll.print();
	dll.remove(nodesToAdd[2]);
	// dll.print();
}

function testSentinelDll() {
	const nodesToAdd = [
		new DoubleLinkedListNode({ value: 0 }),
		new DoubleLinkedListNode({ value: 3 }),
		new DoubleLinkedListNode({ value: 5 }),
	];
	// const dll = new DoubleLinkedList_Lean();
	const dll = new DoubleLinkedListSentinel();
	dll.add(nodesToAdd[0]);
	dll.add(nodesToAdd[1]);
	dll.add(nodesToAdd[2]);
	dll.print();
	dll.remove(nodesToAdd[0]);
	dll.print();
	dll.remove(nodesToAdd[1]);
	dll.print();
	dll.remove(nodesToAdd[2]);
	dll.print();

	// dll.add(nodesToAdd[0]);
	// dll.add(nodesToAdd[1]);
	// dll.add(nodesToAdd[2]);
	// dll.print();
	// dll.remove(nodesToAdd[0]);
	// dll.print();
	// dll.remove(nodesToAdd[1]);
	// dll.print();
	// dll.remove(nodesToAdd[2]);
	// dll.print();
}

export function testDoubleLinkedList() {
	console.log('\ntestMyDll::\n');
	testMyDll();
	console.log('\ntestSentinelDll::\n');
	testSentinelDll();
}
