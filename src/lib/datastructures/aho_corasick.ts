// Aho-Corasick solution
function AhoCorasick(words) {
	this.initWords(words);
}
AhoCorasick.prototype.Trie = function () {
	this.suffixLink = null;
	this.id = -1;
	this.next = new Map();
};
AhoCorasick.prototype.initWords = function (words) {
	this.root = new this.Trie();
	this.uniqueIds = 0;
	this.words = words;
	for (const word of words) {
		let p = this.root;
		for (const c of word) {
			if (!p.next.has(c)) {
				p.next.set(c, new this.Trie());
			}
			p = p.next.get(c);
		}
		if (p.id === -1) {
			p.id = this.uniqueIds++;
		}
	}
	this.buildAutomata();
};
AhoCorasick.prototype.buildAutomata = function () {
	let q = [];
	for (const [c, node] of this.root.next) {
		q.push(node);
		node.suffixLink = this.root;
	}
	while (q.length) {
		let nq = [];
		for (const curr of q) {
			for (const [c, node] of curr.next) {
				let ptr = curr.suffixLink;
				while (ptr !== this.root && !ptr.next.has(c)) {
					ptr = ptr.suffixLink;
				}
				node.suffixLink = ptr.next.get(c) ?? this.root;
				if (node.suffixLink.id !== -1) {
					node.id = node.suffixLink.id;
				}
				nq.push(node);
			}
		}
		q = nq;
	}
};
AhoCorasick.prototype.findMatches = function (target) {
	const matchMap = new Map();
	let ptr = this.root;
	for (let i = 0; i < target.length; ++i) {
		const c = target[i];
		while (ptr !== this.root && !ptr.next.has(c)) {
			ptr = ptr.suffixLink;
		}
		ptr = ptr.next.get(c) ?? this.root;
		if (ptr.id !== -1) {
			matchMap.set(i, this.words[ptr.id]);
		}
	}
	return matchMap;
};
export { AhoCorasick };

//alternative version of aho corasick
(function () {
	function AhoCorasick2(words) {
		this.root = new this.Trie();
		this.uniqueIds = 0;
		this.insert(words);
		this.buildAutomata();
	}
	AhoCorasick2.prototype.Trie = function () {
		this.suffixLink = null;
		this.id = -1;
		this.list = new Map();
	};
	AhoCorasick2.prototype.insert = function (words) {
		for (const word of words) {
			let p = this.root;
			for (const c of word) {
				if (!p.list.has(c)) {
					p.list.set(c, new this.Trie());
				}
				p = p.list.get(c);
			}
			if (p.id === -1) {
				p.id = this.uniqueIds++;
			}
		}
	};
	AhoCorasick2.prototype.buildAutomata = function () {
		let q = [];
		for (const [c, trie] of this.root.list) {
			q.push(trie);
			trie.suffixLink = this.root;
		}
		while (q.length) {
			let nq = [];
			for (const curr of q) {
				for (const [c, trie] of curr.list) {
					let ptr = curr.suffixLink;
					while (ptr !== this.root && !ptr.list.has(c)) {
						ptr = ptr.suffixLink;
					}
					trie.suffixLink = ptr.list.get(c) ?? this.root;
					if (trie.suffixLink.id !== -1) {
						trie.id = trie.suffixLink.id;
					}
					nq.push(trie);
				}
			}
			q = nq;
		}
	};
	AhoCorasick2.prototype.findMatches = function (target) {
		const matchMap = new Map();
		let ptr = this.root;
		for (let i = 0; i < target.length; ++i) {
			const c = target[i];
			while (ptr !== this.root && !ptr.list.has(c)) {
				ptr = ptr.suffixLink;
			}
			ptr = ptr.list.get(c) ?? this.root;
			if (ptr.id !== -1) {
				matchMap.set(i, ptr.id);
			}
		}
		return matchMap;
	};
})();
