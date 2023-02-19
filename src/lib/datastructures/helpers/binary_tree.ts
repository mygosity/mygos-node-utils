/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */

export function TreeNode(val = null, left = null, right = null) {
	this.val = val;
	this.left = left;
	this.right = right;
}

/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
export function getBinaryTreeAsList(root) {
	let list: any[] = [];
	let stack = [[root, 0]];

	while (stack.length) {
		const [currentNode, depth] = stack.pop();

		if (!currentNode) continue;

		if (!list[depth]) list[depth] = [];

		list[depth].push(currentNode.val);

		if (currentNode.right) {
			stack.push([currentNode.right, depth + 1]);
		}

		if (currentNode.left) {
			stack.push([currentNode.left, depth + 1]);
		}
	}

	return list;
}

//inorder traversal
export function getSortedBinaryTreeValues(root) {
	const sorted = [];
	const stack = [];
	while (root != null || stack.length) {
		while (root) {
			stack.push(root);
			root = root.left;
		}
		root = stack.pop();
		sorted.push(root);
		root = root.right;
	}
	return sorted;
}

//preorder traversal
export function getPreOrderTree(root) {
	const preorder = [];
	let stack = [root];
	while (stack.length) {
		const t = stack.pop();
		if (!t) continue;
		preorder.push(t);
		t.right && stack.push(t.right);
		t.left && stack.push(t.left);
	}
	return preorder;
}

//postorder traversal - gives the tree in reverse order though, as the first element is the root
export function getPostOrderTree(root) {
	const postorder = [];
	let stack = [root];
	while (stack.length) {
		const t = stack.pop();
		if (!t) continue;
		postorder.push(t);
		t.left && stack.push(t.left);
		t.right && stack.push(t.right);
	}
	return postorder;
}

export function isValidBST(root) {
	let stack = [[root, -Number.MAX_VALUE, Number.MAX_VALUE]];
	while (stack.length) {
		const [target, leftBoundary, rightBoundary] = stack.pop();
		if (target.val <= leftBoundary) return false;
		if (target.val >= rightBoundary) return false;
		if (target.left) {
			if (target.left.val >= target.val) return false;
			stack.push([target.left, leftBoundary, target.val]);
		}
		if (target.right) {
			if (target.right.val <= target.val) return false;
			stack.push([target.right, target.val, rightBoundary]);
		}
	}
	return true;
}

function getTreeFromPreorderInorder(preorder, inorder) {
	let preorderIndex = 0;
	// build a hashmap to store value -> its index relations
	const inorderIndexMap = new Map();

	for (let i = 0; i < inorder.length; i++) {
		inorderIndexMap.set(inorder[i], i);
	}

	function arrayToTree(preorder, left, right) {
		// if there are no elements to construct the tree
		if (left > right) return null;

		// select the preorder_index element as the root and increment it
		let rootValue = preorder[preorderIndex++];
		let root = new TreeNode(rootValue);

		// build left and right subtree
		// excluding inorderIndexMap[rootValue] element because it's the root
		root.left = arrayToTree(preorder, left, inorderIndexMap.get(rootValue) - 1);
		root.right = arrayToTree(preorder, inorderIndexMap.get(rootValue) + 1, right);
		return root;
	}

	return arrayToTree(preorder, 0, preorder.length - 1);
}
