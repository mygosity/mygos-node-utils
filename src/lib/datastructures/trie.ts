export function TrieNode() {
	this.isEndOfWord = false;
	this.children = new Array(26);
}

export function Trie() {
	this.root = new TrieNode();
}

Trie.prototype.insert = function (word) {
	let target = this.root;
	for (let k = 0; k < word.length; ++k) {
		const c = word[k].charCodeAt(0) - 'a'.charCodeAt(0);
		if (target.children[c] === undefined) target.children[c] = new TrieNode();
		target = target.children[c];
	}
	target.isEndOfWord = true;
};

Trie.prototype.search = function (word) {
	let target = this.root;
	for (let k = 0; k < word.length; ++k) {
		const c = word[k].charCodeAt(0) - 'a'.charCodeAt(0);
		if (target.children[c] === undefined) return false;
		target = target.children[c];
	}
	return target.isEndOfWord;
};

Trie.prototype.startsWith = function (word) {
	let target = this.root;
	for (let k = 0; k < word.length; ++k) {
		const c = word[k].charCodeAt(0) - 'a'.charCodeAt(0);
		if (target.children[c] === undefined) return false;
		target = target.children[c];
	}
	return true;
};
