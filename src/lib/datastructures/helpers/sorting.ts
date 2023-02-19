//https://leetcode.com/problems/subsets-ii/ taken from public solution there, can test it there
export function quicksort_public_weird_recursive(arr: number[], start: number, end: number) {
	// base case
	if (start >= end) {
		return;
	}

	// recursive case
	// find random index
	let randIdx = start + Math.floor(Math.random() * (end - start + 1));
	[arr[start], arr[randIdx]] = [arr[randIdx], arr[start]];
	let pivot = arr[start];

	let smaller = start;
	for (let larger = start + 1; larger <= end; larger++) {
		if (arr[larger] < pivot) {
			smaller++;
			[arr[smaller], arr[larger]] = [arr[larger], arr[smaller]];
		}
	}
	[arr[smaller], arr[start]] = [arr[start], arr[smaller]];

	quicksort_public_weird_recursive(arr, start, smaller - 1);
	quicksort_public_weird_recursive(arr, smaller + 1, end);
}

export function quicksort_public_weird_iterative(arr, start, end) {
	start = 0;
	end = arr.length - 1;
	const stack = [[start, end]];
	while (stack.length) {
		const [left, right] = stack.pop();
		if (left >= right) continue;

		const randomIndex = left + Math.floor(Math.random() * (right - left + 1));
		[arr[left], arr[randomIndex]] = [arr[randomIndex], arr[left]];
		const pivot = arr[left];

		let smaller = left;
		for (let larger = left + 1; larger <= right; larger++) {
			if (arr[larger] < pivot) {
				smaller++;
				if (smaller === larger) continue;
				[arr[smaller], arr[larger]] = [arr[larger], arr[smaller]];
			}
		}
		[arr[smaller], arr[left]] = [arr[left], arr[smaller]];
		stack.push([left, smaller - 1]);
		stack.push([smaller + 1, right]);
	}
	return arr;
}

// source: https://www.guru99.com/quicksort-in-javascript.html
export function quickSort_public(items, left, right) {
	function swap(items, leftIndex, rightIndex) {
		var temp = items[leftIndex];
		items[leftIndex] = items[rightIndex];
		items[rightIndex] = temp;
	}
	function partition(items, left, right) {
		var pivot = items[Math.floor((right + left) / 2)], //middle element
			i = left, //left pointer
			j = right; //right pointer
		while (i <= j) {
			while (items[i] < pivot) {
				i++;
			}
			while (items[j] > pivot) {
				j--;
			}
			if (i <= j) {
				swap(items, i, j);
				i++;
				j--;
			}
		}
		return i;
	}
	let index;
	left = left ?? 0;
	right = right ?? items.length - 1;
	if (items.length > 1) {
		index = partition(items, left, right); //index returned from partition
		if (left < index - 1) {
			//more elements on the left side of the pivot
			quickSort_public(items, left, index - 1);
		}
		if (index < right) {
			//more elements on the right side of the pivot
			quickSort_public(items, index, right);
		}
	}
	return items;
}

//iterative version of quickSort_public
export function quicksortIterative(items) {
	function swap(items, leftIndex, rightIndex) {
		var temp = items[leftIndex];
		items[leftIndex] = items[rightIndex];
		items[rightIndex] = temp;
	}

	let stack = [[0, items.length - 1]];
	while (stack.length) {
		const [left, right] = stack.pop();
		if (left >= right) continue;
		let pivot = items[Math.floor((right + left) / 2)], //middle element
			i = left, //left pointer
			j = right; //right pointer

		while (i <= j) {
			while (items[i] < pivot) {
				i++;
			}
			while (items[j] > pivot) {
				j--;
			}
			if (i <= j) {
				swap(items, i, j);
				i++;
				j--;
			}
		}
		if (left < i - 1) {
			//more elements on the left side of the pivot
			stack.push([left, i - 1]);
		}
		if (i < right) {
			//more elements on the right side of the pivot
			stack.push([i, right]);
		}
	}
}
