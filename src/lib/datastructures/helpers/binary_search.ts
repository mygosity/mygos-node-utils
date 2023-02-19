export function binarySearchNumbers_better(arr: any[], target: any, left: number, right: number) {
	if (left === undefined) left = 0;
	if (right === undefined) right = arr.length - 1;
	while (left <= right) {
		let pivot = Math.floor((left + right) / 2);
		if (arr[pivot] === target) {
			return pivot;
		} else if (target < arr[pivot]) {
			right = pivot - 1;
		} else {
			left = pivot + 1;
		}
	}
	return -1;
}

export function binarySearchNumbers(arr: any[], target: any, left: number, right: number) {
	if (left === undefined) left = 0;
	if (right === undefined) right = arr.length - 1;
	while (left <= right) {
		const middle = left + Math.floor((right - left) / 2);
		if (arr[middle] === target) {
			return middle;
		}
		if (arr[middle] < target) {
			left = middle + 1;
		} else {
			right = middle - 1;
		}
	}
	return -1;
}

//finding the last number greater than or equal to a target
export function findGTE(arr, target) {
	let left = 0;
	let right = arr.length - 1;
	let ans = -1;
	while (left <= right) {
		const mid = Math.floor((left + right) / 2);
		if (arr[mid] >= target) {
			right = mid - 1;
			ans = mid;
		} else {
			left = mid + 1;
		}
	}
	return ans;
}

export function binarySearchList(arr: any[], target: any, diffs: (current: any, target: any) => number, left: number, right: number) {
	if (left === undefined) left = 0;
	if (right === undefined) right = arr.length - 1;
	while (left <= right) {
		const middle = left + Math.floor((right - left) / 2);
		const diff = diffs(arr[middle], target);
		if (diff === 0) {
			return middle;
		}
		if (diff < 0) {
			left = middle + 1;
		} else {
			right = middle - 1;
		}
	}
	return -1;
}

export function binarySearchNumbers_old_convoluted_solution(nums: number[], target: number, start: number) {
	let k = start ?? 0;
	let minIndex = nums[k] < target ? k - 1 : -1,
		maxIndex = nums[k] < target ? nums.length : k + 1,
		lastK = -1;

	while (k < maxIndex && k > minIndex && nums[k] !== target && lastK !== k) {
		lastK = k;
		if (nums[k] < target) {
			minIndex = k - 1;
			const midwayUp = Math.floor((maxIndex - k + 1) / 2) + k;
			k = Math.min(midwayUp, maxIndex - 1);
		} else {
			maxIndex = k + 1;
			const midwayDown = Math.floor((k - minIndex + 1) / 2) + minIndex;
			k = Math.max(midwayDown, minIndex + 1);
		}
	}
	return nums[k] === target ? k : -1;
}

export function binarySearchList_old_convoluted_solution(
	list: any[],
	target: any,
	diffs: (current: any, target: any) => number,
	start: number
) {
	let k = start ?? 0;
	let minIndex = diffs(list[k], target) < 0 ? k - 1 : -1,
		maxIndex = diffs(list[k], target) < 0 ? list.length : k + 1,
		lastK = -1;

	while (k < maxIndex && k > minIndex && list[k] !== target && lastK !== k) {
		lastK = k;
		if (diffs(list[k], target) < 0) {
			minIndex = k - 1;
			const midwayUp = Math.floor((maxIndex - k + 1) / 2) + k;
			k = Math.min(midwayUp, maxIndex - 1);
		} else {
			maxIndex = k + 1;
			const midwayDown = Math.floor((k - minIndex + 1) / 2) + minIndex;
			k = Math.max(midwayDown, minIndex + 1);
		}
	}
	return list[k] === target ? k : -1;
}

export function fareysAlgo(num: number): string {
	let output = '';
	const remainder = num % 1;
	output += num - remainder;

	const epsilon = 0.0000001;
	let left = 0;
	let leftDenom = 1;
	let right = 1;
	let rightDenom = 1;

	for (let i = 0; i < 10000; ++i) {
		const mid = (left + right) / (leftDenom + rightDenom);
		if (remainder + epsilon >= mid && remainder - epsilon <= mid) {
			//console.log({i})
			break;
		}
		if (remainder < mid) {
			right = left + right;
			rightDenom = leftDenom + rightDenom;
		} else {
			left = left + right;
			leftDenom = leftDenom + rightDenom;
		}
	}
	output += ` and ${left + right}/${leftDenom + rightDenom}`;
	return output;
	// https://www.youtube.com/watch?v=7LKy3lrkTRA
	// var test1 = Math.pow(11, 6) / 13;
	// var test2 = 156158413 / 3600;
	// var test3 = 3 / 8;
	// console.log(fareysAlgo(test1));
}

export function insertSortedElementWith(list, target, compare) {
	let left = 0;
	let right = list.length - 1;
	let insertIndex = list.length;
	while (left <= right) {
		const mid = left + ((right - left) >> 1);
		if (compare(list[mid], target)) {
			insertIndex = mid;
			right = mid - 1;
		} else {
			left = mid + 1;
		}
	}
	list.splice(insertIndex, 0, target);
}

export function insertSortedElement(list, target) {
	let left = 0;
	let right = list.length - 1;
	let insertIndex = list.length;
	while (left <= right) {
		const mid = left + ((right - left) >> 1);
		if (list[mid] >= target) {
			insertIndex = mid;
			right = mid - 1;
		} else {
			left = mid + 1;
		}
	}
	list.splice(insertIndex, 0, target);
}

export function removeSortedElement(list, target) {
	let left = 0;
	let right = list.length - 1;
	while (left <= right) {
		const mid = left + ((right - left) >> 1);
		if (list[mid] === target) {
			list.splice(mid, 1);
			return;
		}
		if (list[mid] > target) {
			right = mid - 1;
		} else {
			left = mid + 1;
		}
	}
}

export function getBoundedSearchItem(list, target, predicate) {
	let lo = 0;
	let hi = list.length - 1;
	let best = list.length;
	while (lo <= hi) {
		const mi = (lo + hi) >> 1;
		if (predicate(list[mi])) {
			hi = mi - 1;
			best = mi;
		} else {
			lo = mi + 1;
		}
	}
	return best;
}

export function getLowerBound(list, target, predicate = null) {
	return getBoundedSearchItem(list, target, predicate || ((x) => x >= target));
}

export function getUpperBound(list, target, predicate = null) {
	return getBoundedSearchItem(list, target, predicate || ((x) => x > target));
}

export function test_lower_bounds() {
	[
		function test1() {
			console.log('test1');
			const indx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
			const list = [1, 2, 3, 3, 3, 3, 4, 5, 5, 6];
			console.log({
				test1: getLowerBound(list, 3),
				test2: getLowerBound(list, 5),
				test3: getUpperBound(list, 3),
				test4: getUpperBound(list, 5),
			});
		},
		function test2() {
			console.log('test2');
			const indx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
			const list = [1, 3, 5, 5, 5, 7, 7, 7, 7, 9];
			console.log({
				test1: getLowerBound(list, 4),
				test2: getLowerBound(list, 5),
				test3: getLowerBound(list, 6),
				test4: getLowerBound(list, 10),
				test5: getUpperBound(list, 3),
				test6: getUpperBound(list, 5),
			});
		},
	].forEach((el) => el());
}
