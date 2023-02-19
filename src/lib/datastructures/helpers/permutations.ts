export function testPermutations() {
	const permutationList = [
		['a', 'b', 'c'],
		['d', 'e', 'f'],
		['g', 'h', 'i'],
	];
	let test = getListPermutationsIncludingAllSizes(permutationList, 3);
	console.log('getListPermutationsIncludingAllSizes', test);

	const wordTest = 'abcdef';
	//@ts-ignore
	test = getContiguousCombosOfCharacters(wordTest);
	console.log('getContiguousCombosOfCharacters', test);

	//@ts-ignore
	test = getAllCombosOfCharacters(wordTest);
	console.log('getAllCombosOfCharacters', test);
}

//this will mutate an input and return the unique combinations of that input
export function generateUniqCombinations(input) {
	const answer = [];
	const n = input.length;

	function backtrack(first) {
		if (first === n) {
			answer.push([...input]);
		}
		for (let i = first; i < n; i++) {
			[input[i], input[first]] = [input[first], input[i]];
			backtrack(first + 1);
			[input[i], input[first]] = [input[first], input[i]];
		}
	}

	backtrack(0);
	return answer;
}

//iterative version of generating unique combinations with limit of k size
export function generateUniqCombinationsIterative(input, k) {
	const combos = [];
	const curr = new Array(k);

	let stack = [[0, 0]];
	while (stack.length) {
		const [i, index] = stack.pop();
		if (index === k) {
			combos.push([...curr]);
		} else if (i < input.length) {
			curr[index] = input[i];
			stack.push([i + 1, index]);
			stack.push([i + 1, index + 1]);
		}
	}

	return combos;
}

//recursive version of generating unique combinations with limit of k size
export function generateUniqCombinationsRecursive(input, k) {
	if (input.length <= k) return [input];
	const combos = [];
	const curr = new Array(k);

	function iterateCombos(i, index) {
		if (index === k) {
			combos.push([...curr]);
		} else if (i < input.length) {
			curr[index] = input[i];
			iterateCombos(i + 1, index + 1);
			iterateCombos(i + 1, index);
		}
	}
	iterateCombos(0, 0);

	return combos;
}

export function generateUniqueCombinations(data, maxSize) {
	if (data.length <= maxSize) return [data];
	let combos = [];
	let temp = new Array(maxSize);
	function helper(start, replaceIndex) {
		if (replaceIndex === maxSize) {
			combos.push([...temp]);
		} else {
			if (start < data.length) {
				temp[replaceIndex] = data[start];
				helper(start + 1, replaceIndex + 1); //copies in literal order
				helper(start + 1, replaceIndex); //counts up step by step after, see the print below:
				//if queue = [1, 2, 3, 4, 5, 6] and k = 4
				//{start: 4, index: 4, t: '1,2,3,4'}
				//{start: 5, index: 4, t: '1,2,3,5'}
				//{start: 6, index: 4, t: '1,2,3,6'}
				//{start: 5, index: 4, t: '1,2,4,5'}
				//{start: 6, index: 4, t: '1,2,4,6'}
				//{start: 6, index: 4, t: '1,2,5,6'}
				//{start: 5, index: 4, t: '1,3,4,5'}
				//{start: 6, index: 4, t: '1,3,4,6'}
				//{start: 6, index: 4, t: '1,3,5,6'}
				//{start: 6, index: 4, t: '1,4,5,6'}
				//{start: 5, index: 4, t: '2,3,4,5'}
				//{start: 6, index: 4, t: '2,3,4,6'}
				//{start: 6, index: 4, t: '2,3,5,6'}
				//{start: 6, index: 4, t: '2,4,5,6'}
				//{start: 6, index: 4, t: '3,4,5,6'}
			}
		}
	}
	helper(0, 0);
	return combos;
}

export function generateCombos() {
	const combos = [];
	const targetList = [1, 2, 3, 4, 5];
	const maxLength = 3;

	let v = new Set();
	let seen = new Set();
	let temp = [];

	// 1,2,3,4,5,
	// 1,2,3,5,3,
	// 1,2,4,3,5,
	// 1,2,4,5,3,
	// 1,2,5,3,4,
	// 1,2,5,4,3,

	function dfs() {
		if (temp.length === maxLength) {
			const temp2 = [...temp];
			temp2.sort((x, y) => x - y);
			const comboKey = temp2.join(':');
			if (seen.has(comboKey)) return;
			seen.add(comboKey);
			combos.push([...temp2]);
		}
		for (let j = 0; j < targetList.length; ++j) {
			if (!v.has(j)) {
				v.add(j);
				temp.push(targetList[j]);
				dfs();
				v.delete(j);
				temp.pop();
			}
		}
	}
	dfs();
	console.log(combos);
	return combos;
}

export function getListPermutationsIncludingAllSizes(listOfLists, n) {
	let output = [['']];
	for (let i = 0; i < n; ++i) {
		let next = [];
		for (const outList of output) {
			for (const word of outList) {
				for (const list of listOfLists) {
					for (const letter of list) {
						next.push(word + letter);
					}
				}
			}
		}
		output.push(next);
	}
	return output;
}

export function getListPermutations(listOfLists, n) {
	let output = [['']];
	for (let i = 0; i < n; ++i) {
		let nextOut = [];
		let next = [];
		for (let i = 0; i < output.length; ++i) {
			const outList = output[i];
			for (const word of outList) {
				for (const list of listOfLists) {
					for (const letter of list) {
						next.push(word + letter);
					}
				}
			}
		}
		nextOut.push(next);
		output = nextOut;
	}
	return output;
}

export function getContiguousCombosOfCharacters(inputWord) {
	let output = [];
	let uniqs = new Set();
	for (let i = 0; i < inputWord.length; ++i) {
		output.push([inputWord[i], i + 1]);
		let currentLen = output.length;
		for (let j = 0; j < currentLen; ++j) {
			const [word, start] = output[j];
			if (inputWord[start]) {
				const nextWord = word + inputWord[start];
				if (!uniqs.has(nextWord)) {
					uniqs.add(nextWord);
					output.push([nextWord, start + 1]);
				}
			}
		}
	}
	return Array.from(uniqs);
}

export function getAllCombosOfCharacters(inputWord) {
	let output = [];
	let uniqs = new Set();
	for (let i = 0; i < inputWord.length; ++i) {
		output.push([inputWord[i], i + 1]);
		let currentLen = output.length;
		for (let j = 0; j < currentLen; ++j) {
			const [word, start] = output[j];
			for (let k = start; k < inputWord.length; ++k) {
				const nextWord = word + inputWord[k];
				if (!uniqs.has(nextWord)) {
					uniqs.add(nextWord);
					output.push([nextWord, k + 1]);
				}
			}
		}
	}
	return Array.from(uniqs);
}

//range 1 to n, pick only k numbers example, (3, 2) would be [1,2], [1,3], [2,3]
export function uniqueDigitCombos(n, k) {
	const output = [];
	function bt(i, arr) {
		if (arr.length === k) {
			output.push([...arr]);
			return;
		}
		for (let j = i + 1; j <= n; ++j) {
			arr.push(j);
			bt(j, arr);
			arr.pop();
		}
	}
	for (let i = 1; i <= n; ++i) {
		bt(i, [i]);
	}
	return output;
}
