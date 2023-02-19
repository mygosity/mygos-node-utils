export function SegmentTree(size) {
	this.size = size;
	this.list = new Array(size * 4).fill(0);

	this.query = function (queryLeft, queryRight, left, right, node) {
		left = left ?? 0;
		right = right ?? this.size;
		node = node ?? 1; //using 1 as base index allows for traversal of nodes by 2n without adding 2

		if (queryLeft <= left && queryRight >= right) {
			return this.list[node];
		}

		if (queryLeft > right || queryRight < left) {
			return 0;
		}

		const mid = Math.floor((left + right) / 2);
		const leftSide = this.query(queryLeft, queryRight, left, mid, node * 2);
		const rightSide = this.query(queryLeft, queryRight, mid + 1, right, node * 2 + 1);
		return leftSide + rightSide;
	};

	this.update = function (pos, value, left, right, node) {
		left = left ?? 0;
		right = right ?? this.size;
		node = node ?? 1;

		if (left === right) {
			this.list[node] = value;
			return;
		}

		const mid = Math.floor((left + right) / 2);
		if (pos <= mid) {
			this.update(pos, value, left, mid, node * 2);
		} else {
			this.update(pos, value, mid + 1, right, node * 2 + 1);
		}
		this.list[node] = this.list[node * 2] + this.list[node * 2 + 1];
	};
}

(function () {
	function SegmentTree(size) {
		this.size = size;
		this.sums = new Array(size * 4).fill(0);

		this.query = function (ql, qr, left, right, node) {
			left = left ?? 0;
			right = right ?? this.size - 1;
			node = node ?? 0;

			if (ql <= left && qr >= right) {
				return this.sums[node];
			}
			if (ql > right || qr < left) {
				return 0;
			}
			const mid = Math.floor((left + right) / 2);
			return (
				this.query(ql, qr, left, mid, 2 * node + 1) +
				this.query(ql, qr, mid + 1, right, 2 * node + 2)
			);
		};

		this.update = function (pos, val, left, right, node) {
			left = left ?? 0;
			right = right ?? this.size - 1;
			node = node ?? 0;

			if (left === right) {
				this.sums[node] = val;
				return;
			}
			const mid = Math.floor((left + right) / 2);
			if (pos <= mid) {
				this.update(pos, val, left, mid, 2 * node + 1);
			} else {
				this.update(pos, val, mid + 1, right, 2 * node + 2);
			}
			this.sums[node] = this.sums[2 * node + 1] + this.sums[2 * node + 2];
		};
	}
})();

//errichto's segment tree WIP
(function () {
	function SegmentTree(data) {
		this.data = data;

		const f = (node, left, right, queryLeft, queryRight) => {
			if (queryLeft <= left && right <= queryRight) {
				return this.tree[node];
			}
			if (right < queryLeft || queryRight < left) {
				return 0;
			}
			const mid = Math.floor((left + right) / 2);
			return (
				f(2 * node, left, mid, queryLeft, queryRight) +
				f(2 * node + 1, mid, right, queryLeft, queryRight)
			);
		};

		const change = (node, left, right, queryLeft, queryRight, v) => {
			if (queryLeft <= left && right <= queryRight) {
				this.tree[node] = v;
				return;
			}
			if (right < queryLeft || queryRight < left) {
				return;
			}
			const mid = Math.floor((left + right) / 2);
			change(2 * node, left, mid, queryLeft, queryRight, v);
			change(2 * node + 1, mid, right, queryLeft, queryRight, v);
			this.tree[node] = this.tree[node * 2] + this.tree[node * 2 + 1];
		};

		const changeIterative = (i, v, n) => {
			this.tree[n + i] = v;
			for (let j = Math.floor((n + i) / 2); j >= 1; j = Math.floor(j / 2)) {
				this.tree[j] = this.tree[j * 2] + this.tree[j * 2 + 1];
			}
		};

		let n = 0;
		// while(__builtin_popcount(n) != 1) {
		//     a.push_back(0);
		//     n++;
		// }
		n = data.length * 2;
		this.tree = new Array(data.length * 2);
		// const queries = [[0, 10]];
		// for (let i = 0; i < queries.length; ++i) {
		// 	let low = 0,
		// 		high = 0;
		// 	low--;
		// 	high--;
		// 	f(1, 0, n - 1, low, high);
		// }
	}

	(function () {
		//
	})();
})();
