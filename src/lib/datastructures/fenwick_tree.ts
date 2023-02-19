// https://www.geeksforgeeks.org/binary-indexed-tree-or-fenwick-tree-2/
// https://www.youtube.com/watch?v=uSFzHCZ4E-8&t=71s
function FenwickTree(nums) {
	this.tree = new Array(nums.length + 1);
	let i = 0;
	for (const num of nums) {
		//fenwick trees are 1 base indexed and push the numbers forwards in order to use clever bitwise ops
		this.tree[++i] = num;
	}
	for (let i = 1; i < nums.length; ++i) {
		let p = i + (i & -i);
		if (p < this.tree.length) {
			this.tree[p] = this.tree[p] + this.tree[i];
		}
	}

	this.getSum = function (i) {
		let sum = 0;
		while (i > 0) {
			sum += this.tree[i];
			//(flip the last set bit)
			//this takes a bit like 0001111 and makes it go down one step to 0001110
			i -= i & -i;
		}
		return sum;
	};

	this.updateIndex = function (i, nextNumber) {
		const diff = nextNumber - this.tree[i];
		while (i < this.tree.length) {
			this.tree[i] += diff;
			i += i & -i;
		}
	};
}

//0-indexed based fenwick tree
(function () {
	class FenwickTree {
		n = 0;
		tree = [];

		constructor(n) {
			this.n = n;
			this.tree = new Array(n).fill(0);
		}
		add(i, delta) {
			for (; i < this.n; i = i | (i + 1)) {
				this.tree[i] += delta;
			}
		}
		sum(r) {
			let ans = 0;
			for (; r >= 0; r = (r & (r + 1)) - 1) {
				ans += this.tree[r];
			}
			return ans;
		}
	}
})();
