import { TrieNode } from './trie';

export function WordDictionary() {
	this.root = new TrieNode();
}

WordDictionary.prototype.addWord = function (word) {
	let target = this.root;
	for (let k = 0; k < word.length; ++k) {
		const c = word[k].charCodeAt(0) - 'a'.charCodeAt(0);
		if (target.children[c] === undefined) target.children[c] = new TrieNode();
		target = target.children[c];
	}
	target.isEndOfWord = true;
};

WordDictionary.prototype.search = function (word, startIndex = 0, startPoint = undefined) {
	let target = this.root;
	if (startPoint !== undefined) target = startPoint;

	for (let k = startIndex; k < word.length; ++k) {
		if (word[k] !== '.') {
			const c = word[k].charCodeAt(0) - 'a'.charCodeAt(0);
			if (target.children[c] === undefined) return false;
			target = target.children[c];
		} else {
			let foundWord = false;
			for (let i = 0; i < target.children.length; ++i) {
				if (target.children[i] !== undefined) {
					foundWord = foundWord || this.search(word, k + 1, target.children[i]);
					if (foundWord) return true;
				}
			}
			return foundWord;
		}
	}
	return target.isEndOfWord;
};

WordDictionary.prototype.startsWith = function (word) {
	let target = this.root;
	for (let k = 0; k < word.length; ++k) {
		const c = word[k].charCodeAt(0) - 'a'.charCodeAt(0);
		if (target.children[c] === undefined) return false;
		target = target.children[c];
	}
	return true;
};
