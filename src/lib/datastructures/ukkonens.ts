// chat-gpt's version of the algo

// Constructs a suffix tree for the given string.
function ukkonen(string) {
	// The root node of the suffix tree.
	const root = {};

	// The active point is a pair (node, edge) that represents the current
	// position in the suffix tree. Initially, the active point is set to
	// the root node.
	let activePoint = [root, null];

	// The remaining suffix is the part of the string that has not yet been
	// added to the suffix tree. Initially, the remaining suffix is the
	// entire input string.
	let remainingSuffix = string;

	// The phase is the number of characters that have been added to the
	// suffix tree so far.
	let phase = 0;

	// The extension is the number of characters that have been added to
	// the suffix tree in the current phase.
	let extension = 0;

	// This loop continues until all characters in the input string have
	// been added to the suffix tree.
	while (remainingSuffix.length > 0) {
		// Add the next character in the remaining suffix to the suffix tree.
		const nextChar = remainingSuffix[0];
		addSuffix(activePoint, nextChar);
		extension += 1;

		// If the active point is at the root node and the extension is greater
		// than zero, then the phase is incremented and the extension is reset
		// to zero.
		if (activePoint[0] === root && extension > 0) {
			phase += 1;
			extension = 0;
		}

		// Move the active point to the next position in the suffix tree.
		activePoint = nextActivePoint(root, activePoint, nextChar, phase);

		// Remove the first character from the remaining suffix.
		remainingSuffix = remainingSuffix.substring(1);
	}

	// Return the root node of the suffix tree.
	return root;
}

// Adds a suffix to the suffix tree starting at the given active point.
function addSuffix(activePoint, nextChar) {
	// Get the node and edge at the active point.
	const [node, edge] = activePoint;

	// If the edge is null, then the active point is at a node, so we can
	// simply add a new child node for the next character.
	if (edge === null) {
		node[nextChar] = {};
		return;
	}

	// If the edge is not null, then the active point is on an edge. In this
	// case, we need to split the edge at the active point and add a new
	// child node for the next character.

	// First, we create a new internal node to split the edge.
	const internalNode = {};

	// Then, we split the edge by adding the internal node as a child of
	// the current node, and adding the existing child node of the current
	// node as a child of the internal node.
	const existingChild = node[edge];
	internalNode[edge.substring(1)] = existingChild;
	node[edge] = internalNode;

	// Finally, we add the next character as a child of the internal node.
	internalNode[nextChar] = {};
}

// Returns the next active point in the suffix tree after adding the given
// character.
function nextActivePoint(root, activePoint, nextChar, phase) {
	// Get the node and edge at the active point.
	const [node, edge] = activePoint;

	// If the edge is null, then the active point is at a node, so we simply
	// move to the next character along the edge labeled with the next character.
	if (edge === null) {
		return [node[nextChar], null];
	}

	// If the edge is not null, then the active point is on an edge. In this
	// case, we need to check if the next character matches the next character
	// on the edge.
	const nextEdgeChar = edge[0];
	if (nextEdgeChar === nextChar) {
		// If the next character matches the next character on the edge, then
		// we simply move to the next character along the edge.
		return [node, edge.substring(1)];
	} else {
		// If the next character does not match the next character on the edge,
		// then we need to split the edge at the active point and move to the
		// next character along the newly created edge.

		// First, we split the edge by adding a new child node for the next
		// character.
		addSuffix(activePoint, nextChar);

		// Then, we check if the active point is at the root node and the
		// phase is greater than zero.
		if (node === root && phase > 0) {
			// If the active point is at the root node and the phase is greater
			// than zero, then we need to decrement the phase by one and move
			// to the next character along the edge labeled with the next
			// character.
			return [node[nextChar], edge.substring(1)];
		} else {
			// If the active point is not at the root node or the phase is zero,
			// then we can simply move to the next character along the edge
			// labeled with the next character.
			return [node[nextChar], null];
		}
	}
}
