import { MinPriorityQueue } from '../priority_queue';

//n is the number of edges in a graph
export function unionFindHelper(n) {
	let rank = new Array(n).fill(1); //at first all ranks are equal at 1
	let parent = new Array(n);
	for (let i = 0; i < n; ++i) {
		parent[i] = i; //parent of any node is itself at first
	}

	function find(target) {
		let p = parent[target];
		while (p !== parent[p]) {
			parent[p] = parent[parent[p]]; //parent compression
			p = parent[p];
		}
		return p;
	}

	function union(n1, n2) {
		const p1 = find(n1);
		const p2 = find(n2);

		if (p1 === p2) return 0;

		const rank1 = rank[p1];
		const rank2 = rank[p2];

		if (rank1 > rank2) {
			parent[p2] = p1; //p2 is now a subordinate of p1
			rank[p1] += rank[p2]; //rank of p2 is absorbed fully into rank1
		} else {
			parent[p1] = p2;
			rank[p2] += rank[p1];
		}
		return 1;
	}
}

export function UnionFind(size) {
	this.group = new Array(size).fill(0);
	this.rank = new Array(size).fill(0);
	for (let i = 0; i < size; ++i) {
		this.group[i] = i;
	}

	this.find = function (node) {
		let t = this.group[node];
		while (t !== this.group[t]) {
			this.group[t] = this.group[this.group[t]];
			t = this.group[t];
		}
		return t;
	};

	this.union = function (node1, node2) {
		let group1 = this.find(node1);
		let group2 = this.find(node2);

		// node1 and node2 already belong to same group.
		if (group1 == group2) {
			return false;
		}

		if (this.rank[group1] > this.rank[group2]) {
			this.group[group2] = group1;
		} else if (this.rank[group1] < this.rank[group2]) {
			this.group[group1] = group2;
		} else {
			this.group[group1] = group2;
			this.rank[group2] += 1;
		}

		return true;
	};
}

//Kruskal's algo - sort edges by distance and use union find to find the minimum span
export function getMinimumSpanningTree(n, connections) {
	const parent = new Array(n + 1).fill(0).map((el, i) => i);
	const find = (t) => (t === parent[t] ? t : (parent[t] = find(parent[t])));
	connections.sort((x, y) => x[2] - y[2]);
	let cost = 0;
	let edges = 1;
	for (const [from, to, dist] of connections) {
		if (find(from) !== find(to)) {
			parent[find(from)] = find(to);
			cost += dist;
			++edges;
		}
	}
	if (edges !== n) return -1;
	return cost;
}

//Tarjan's strongly connected components algo, rank each connection as discovered, when an existing rank is rediscovered, we can flag this position as a strong connection
export function getRankedGraph(edges) {
	const map = new Map();
	const ranks = new Map();
	for (const [a, b] of edges) {
		if (!map.has(a)) map.set(a, new Set());
		if (!map.has(b)) map.set(b, new Set());
		map.get(a).add(b);
		map.get(b).add(a);
	}
	function search(i, rank, parent = -1) {
		if (ranks.has(i)) {
			return ranks.get(i);
		}
		let currentRank = rank;
		ranks.set(i, currentRank);
		for (const node of map.get(i)) {
			if (ranks.has(node) && ranks.get(node) === rank - 1) {
				continue;
			}
			const recursiveRank = search(node, rank + 1, i);
			currentRank = Math.min(currentRank, recursiveRank);
		}
		return currentRank;
	}
	search(0, 0);
	return { graph: map, ranks };
}

//Tarjan's strongly connected components algo to identify strongly connected components
export function getCriticalConnections(n, connections) {
	const map = new Map();
	const ranks = new Map();
	for (const [a, b] of connections) {
		if (!map.has(a)) map.set(a, new Set());
		if (!map.has(b)) map.set(b, new Set());
		map.get(a).add(b);
		map.get(b).add(a);
	}
	let output = [];
	function search(i, rank, parent = -1) {
		if (ranks.has(i)) {
			return ranks.get(i);
		}
		let currentRank = rank;
		ranks.set(i, currentRank);
		for (const node of map.get(i)) {
			//ignore parent as it would be the rank just below this one
			if (ranks.has(node) && ranks.get(node) === rank - 1) {
				continue;
			}
			const recursiveRank = search(node, rank + 1, i);
			currentRank = Math.min(currentRank, recursiveRank);
		}
		if (ranks.get(i) === currentRank && parent >= 0) {
			output.push([parent, i]);
		}
		return currentRank;
	}
	search(0, 0);
	return output;
}

//Floyd-Warshall's algo O(n)^3, mapping the shortest path from point a to b by comparing all the permutations of edge distances
export function getMemoizedShortestPath(n, edges) {
	const dp = new Array(n).fill(0).map((el, i) => new Array(n).fill(Number.MAX_VALUE));
	for (let i = 0; i < n; ++i) {
		dp[i][i] = 0;
	}
	for (const [from, to, dist] of edges) {
		dp[from][to] = dist;
		dp[to][from] = dist;
	}
	for (let k = 0; k < n; ++k) {
		for (let from = 0; from < n; ++from) {
			for (let to = 0; to < n; ++to) {
				if (dp[from][to] > dp[from][k] + dp[k][to]) {
					dp[from][to] = dp[from][k] + dp[k][to];
				}
			}
		}
	}
}

//Bellman-Ford's algo vs probability weighted path
export function getBestProbabilityFromStartEnd(n, edges, start, end) {
	let weights = new Array(n).fill(0);
	weights[start] = 1;
	for (let j = 0; j < n; j++) {
		let noChange = true;
		for (let i = 0; i < edges.length; i++) {
			let [one, two, probability] = edges[i];
			if (weights[one] < weights[two] * probability) {
				noChange = false;
				weights[one] = weights[two] * probability;
			}
			if (weights[two] < weights[one] * probability) {
				noChange = false;
				weights[two] = weights[one] * probability;
			}
		}
		if (noChange) break;
	}
	return weights[end];
}

//Bellman-Ford's algo vs cheapest flights with k max iterations
export function getCheapestPathFromStartEnd(n, flights, src, dst, k) {
	let prices = new Array(n).fill(Number.MAX_VALUE);
	prices[src] = 0;
	for (let i = 0; i < k + 1; ++i) {
		let nextPrices = [...prices];
		for (const [from, to, cost] of flights) {
			if (prices[from] !== Number.MAX_VALUE) {
				nextPrices[to] = Math.min(prices[from] + cost, nextPrices[to]);
			}
		}
		prices = nextPrices;
	}
	return prices[dst] === Number.MAX_VALUE ? -1 : prices[dst];
}

//gets the shortest distances from each node to nth node
export function getShortestPathsFromNthNode(n, edges) {
	const graph = [];
	for (let i = 1; i <= n; ++i) {
		graph[i] = [];
	}
	for (const [from, to, weight] of edges) {
		graph[from].push([to, weight]);
		graph[to].push([from, weight]);
	}
	const q = new MinPriorityQueue();
	const shortestDistance = new Array(n + 1).fill(Infinity);
	shortestDistance[n] = 0;
	q.enqueue(n, 0);
	while (q.size()) {
		const { element, priority } = q.front();
		q.dequeue();
		for (const [nextNode, weight] of graph[element]) {
			const nextDist = weight + priority;
			if (nextDist < shortestDistance[nextNode]) {
				q.enqueue(nextNode, nextDist);
				shortestDistance[nextNode] = nextDist;
			}
		}
	}
	return shortestDistance;
}

//Prim's algo, using priority queue to add up the lowest cost to connect all points
export function getMinCost(n, connections) {
	const graph = new Map();
	for (let i = 1; i <= n; ++i) {
		graph.set(i, new Map());
	}
	for (const [from, to, dist] of connections) {
		let bestDist = dist;
		if (graph.get(from).has(to)) {
			bestDist = Math.min(bestDist, graph.get(from).get(to));
		}
		graph.get(from).set(to, bestDist);
		graph.get(to).set(from, bestDist);
	}
	let cost = 0;
	let v = new Set();
	const min = new MinPriorityQueue();
	min.enqueue(1, 0);
	while (min.front()) {
		const { element, priority } = min.front();
		min.dequeue();
		if (v.size === n) return cost;
		if (v.has(element)) continue;
		v.add(element);
		cost += priority;
		for (const [node, dist] of graph.get(element)) {
			min.enqueue(node, dist);
		}
	}
	return -1;
}

//Djikstra's algo - note only difference between this and prim's is that prim only needs to have visited all nodes, and Djikstra's ends when it meets the destination
export function getCheapestPath(n, flights, src, dst) {
	function GNode(index) {
		this.index = index;
		this.list = [];
	}
	const graphs = new Map();
	for (let i = 0; i < flights.length; ++i) {
		const [from, to, cost] = flights[i];
		if (!graphs.has(from)) {
			graphs.set(from, new GNode(i));
		}
		graphs.get(from).list.push([to, cost]);
	}
	const seen = new Map();
	const frontier = new MinPriorityQueue();
	frontier.enqueue({ steps: 0, id: src }, 0);
	while (frontier.size()) {
		const { element, priority: cost } = frontier.front();
		const { id, steps } = element;
		frontier.dequeue();
		if (id === dst) {
			return cost;
		}
		if (
			seen.get(id) === true ||
			(seen.has(id) && cost >= seen.get(id).cost && steps >= seen.get(id).steps)
		) {
			continue;
		}
		seen.set(id, { cost, steps });
		const nodes = graphs.get(id)?.list ?? [];
		for (const [nextTo, nextCost] of nodes) {
			const next = { id: nextTo, steps: steps + 1 };
			frontier.enqueue(next, nextCost + cost);
		}
	}
	return -1;
}

//AStar algo
export function getBestPathViaAStar(grid) {
	const n = grid.length;
	const directions = [
		[1, 1],
		[1, 0],
		[0, 1],
		[-1, 1],
		[-1, 0],
		[0, -1],
		[1, -1],
		[-1, -1],
	];

	// Candidate represents a possible option for travelling to the cell
	// at (row, col).
	function Candidate(row, col, distanceSoFar, totalEstimate) {
		this.row = row;
		this.col = col;
		this.distanceSoFar = distanceSoFar;
		this.totalEstimate = totalEstimate;
	}

	function getNeighbours(row, col, grid) {
		let neighbours = [];
		for (let i = 0; i < directions.length; i++) {
			let newRow = row + directions[i][0];
			let newCol = col + directions[i][1];
			if (
				newRow < 0 ||
				newCol < 0 ||
				newRow >= grid.length ||
				newCol >= grid[0].length ||
				grid[newRow][newCol] != 0
			) {
				continue;
			}
			neighbours.push([newRow, newCol]);
		}
		return neighbours;
	}

	// Get the best case estimate of how much further it is to the bottom-right cell.
	function getEstimate(row, col, grid) {
		let remainingRows = grid.length - row - 1;
		let remainingCols = grid[0].length - col - 1;
		return Math.max(remainingRows, remainingCols);
	}

	// Firstly, we need to check that the start and target cells are open.
	if (grid[0][0] != 0 || grid[grid.length - 1][grid[0].length - 1] != 0) {
		return -1;
	}

	// Set up the A* search.
	// Queue<Candidate> pq = new MinPriorityQueue<>((a,b) -> a.totalEstimate - b.totalEstimate);
	const pq = new MinPriorityQueue();
	const start = new Candidate(0, 0, 1, getEstimate(0, 0, grid));
	pq.enqueue(start, start.totalEstimate);

	const v = [];

	// Carry out the A* search.
	while (pq.size()) {
		const { element, priority } = pq.front();
		const best = element;
		pq.dequeue();

		// Is this for the target cell?
		if (best.row == grid.length - 1 && best.col == grid[0].length - 1) {
			return best.distanceSoFar;
		}

		const key = best.row * n + best.col;
		// Have we already found the best path to this cell?
		if (v[key]) {
			continue;
		}
		v[key] = true;

		const neighbors = getNeighbours(best.row, best.col, grid);
		for (const neighbor of neighbors) {
			let neighbourRow = neighbor[0];
			let neighbourCol = neighbor[1];
			const nkey = neighbourRow * n + neighbourCol;

			// This check isn't necessary for correctness, but it greatly
			// improves performance.
			if (v[nkey]) {
				continue;
			}

			// Otherwise, we need to create a Candidate object for the option
			// of going to neighbor through the current cell.
			let newDistance = best.distanceSoFar + 1;
			let totalEstimate = newDistance + getEstimate(neighbourRow, neighbourCol, grid);
			let candidate = new Candidate(neighbourRow, neighbourCol, newDistance, totalEstimate);
			pq.enqueue(candidate, totalEstimate);
		}
	}
	// The target was unreachable.
	return -1;
}
