// Knuth-Morris-Pratt algorithm
// https://leetcode.com/problems/shortest-palindrome/solution/ -- good challenge to implement KMP to solve
// https://leetcode.com/problems/implement-strstr/discuss/12956/C%2B%2B-Brute-Force-and-KMP
export function strStr(haystack, needle) {
	let m = haystack.length,
		n = needle.length;

	if (!n) return 0;

	// https://www.youtube.com/watch?v=JoF0Z7nVSrA&t=1340s
	//longest prefix suffix
	function generateLPS(needle) {
		if (!needle?.length) return [];
		let lps = new Array(needle.length).fill(0);
		for (let i = 1, lastLPS = 0; i < needle.length; ++i) {
			while (lastLPS > 0 && needle[i] !== needle[lastLPS]) {
				lastLPS = lps[lastLPS - 1];
			}
			lps[i] = needle[i] === needle[lastLPS] ? ++lastLPS : 0;
		}
		return lps;
	}

	const lps = generateLPS(needle);

	for (let i = 0, j = 0; i < m; ) {
		if (haystack[i] == needle[j]) {
			i++, j++;
		}
		if (j === n) {
			return i - j;
		}
		if (i < m && haystack[i] !== needle[j]) {
			j ? (j = lps[j - 1]) : i++;
		}
	}
	return -1;
}

// https://cp-algorithms.com/string/prefix-function.html#implementation
//this can be used in the above kmpProcess function as a replacement
function prefix_function(s) {
	let n = s.length;
	let pi = new Array(n).fill(0);
	for (let i = 1; i < n; i++) {
		let j = pi[i - 1];
		while (j > 0 && s[i] != s[j]) {
			j = pi[j - 1];
		}
		if (s[i] == s[j]) {
			j++;
		}
		pi[i] = j;
	}
	return pi;
}

//Rabin karp algorithm
// https://github.com/pramish/rabin-karp/blob/master/rabin_karp.js
class RabinKarp {
	constructor(mySentence, stringToSearch) {
		//@ts-ignore
		this.mySentence = mySentence;
		//@ts-ignore
		this.stringToSearch = stringToSearch;
	}
}
const calculateHash = function (myText, largePrime, randomNumber) {
	let hash = 0;
	for (let i = 0; i <= myText.length - 1; i++) {
		hash = (hash * randomNumber + myText.charCodeAt(i)) % largePrime;
	}
	return hash;
};
const areStringEqual = function (firstString, secondString) {
	if (firstString !== secondString) {
		return false;
	}
	for (let i = 0; i < firstString.length; i++) {
		if (firstString[i] !== secondString[i]) {
			return false;
		}
	}
	return true;
};
//@ts-ignore
RabinKarp.prototype.searchText = function (sentence, stringToSearch) {
	let largePrime = 337;
	let randomNumber = 50;
	let stringPositions = [];
	let stringToSearchHash = calculateHash(stringToSearch, largePrime, randomNumber);
	let text;
	let sentenceHash;
	// Loop through our sentence
	for (let i = 0; i <= sentence.length - stringToSearch.length; i++) {
		text = sentence.slice(i, i + stringToSearch.length);
		sentenceHash = calculateHash(text, largePrime, randomNumber);
		if (areStringEqual(text, stringToSearch)) {
			stringPositions.push({ position: i });
		}
		// If the hash is not same, then continue to next step
		if (stringToSearchHash !== sentenceHash) continue;
	}
	return stringPositions;
};

//this is taken from public source, I made my own which is much more understandable than this
(function () {
	// https://github.com/BrunoRB/ahocorasick/blob/master/src/main.js
	'use strict';

	var AhoCorasick = function (keywords) {
		this._buildTables(keywords);
	};

	AhoCorasick.prototype._buildTables = function (keywords) {
		var gotoFn = {
			0: {},
		};
		var output = {};

		var state = 0;
		keywords.forEach(function (word) {
			var curr = 0;
			for (var i = 0; i < word.length; i++) {
				var l = word[i];
				if (gotoFn[curr] && l in gotoFn[curr]) {
					curr = gotoFn[curr][l];
				} else {
					state++;
					gotoFn[curr][l] = state;
					gotoFn[state] = {};
					curr = state;
					output[state] = [];
				}
			}

			output[curr].push(word);
		});

		var failure = {};
		var xs = [];

		// f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
		for (var l in gotoFn[0]) {
			var state = gotoFn[0][l];
			failure[state] = 0;
			xs.push(state);
		}

		while (xs.length) {
			var r = xs.shift();
			// for each symbol a such that g(r, a) = s
			for (var l in gotoFn[r]) {
				var s = gotoFn[r][l];
				xs.push(s);

				// set state = f(r)
				var state = failure[r];
				while (state > 0 && !(l in gotoFn[state])) {
					state = failure[state];
				}

				if (l in gotoFn[state]) {
					var fs = gotoFn[state][l];
					failure[s] = fs;
					output[s] = output[s].concat(output[fs]);
				} else {
					failure[s] = 0;
				}
			}
		}

		this.gotoFn = gotoFn;
		this.output = output;
		this.failure = failure;
	};

	AhoCorasick.prototype.search = function (string) {
		var state = 0;
		var results = [];
		for (var i = 0; i < string.length; i++) {
			var l = string[i];
			while (state > 0 && !(l in this.gotoFn[state])) {
				state = this.failure[state];
			}
			if (!(l in this.gotoFn[state])) {
				continue;
			}

			state = this.gotoFn[state][l];

			if (this.output[state].length) {
				var foundStrs = this.output[state];
				results.push([i, foundStrs]);
			}
		}

		return results;
	};
})();
