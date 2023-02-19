export function BitStateMachine(maxStateValue) {
	const MAX_BIT_SHIFT = 30;
	const MAX_STATE = maxStateValue;
	const MAX_SLOTS = Math.ceil(MAX_STATE / MAX_BIT_SHIFT);

	this.bitStates = new Array(MAX_SLOTS).fill(0);

	this.add = (stateValue) => {
		const slot = Math.floor(stateValue / MAX_BIT_SHIFT);
		const shift = stateValue % MAX_BIT_SHIFT;
		const mask = 1 << shift;
		this.bitStates[slot] |= mask;
	};

	this.remove = (stateValue) => {
		const slot = Math.floor(stateValue / MAX_BIT_SHIFT);
		const shift = stateValue % MAX_BIT_SHIFT;
		const mask = 1 << shift;
		this.bitStates[slot] ^= mask;
	};

	this.has = (stateValue) => {
		const slot = Math.floor(stateValue / MAX_BIT_SHIFT);
		const shift = stateValue % MAX_BIT_SHIFT;
		const mask = 1 << shift;
		return (this.bitStates[slot] & mask) > 0;
	};

	this.snapshot = () => {
		this.originalState = [...this.bitStates];
	};

	this.reset = () => (this.bitStates = [...this.originalState]);

	this.isFull = () => {
		for (let i = 0; i < this.bitStates.length - 1; ++i) {
			const maxValue = (1 << MAX_BIT_SHIFT) - 1;
			if (this.bitStates[i] !== maxValue) {
				return false;
			}
		}
		const maxLastStateValue = 1 << MAX_STATE % MAX_BIT_SHIFT;
		return this.bitStates[this.bitStates.length - 1] === maxLastStateValue - 1;
	};

	this.clone = () => {
		const clone = new BitStateMachine(MAX_STATE);
		for (const state of this.bitStates) {
			for (let i = 0; i < clone.bitStates.length; ++i) {
				clone.bitStates[i] = state;
			}
		}
		return clone;
	};

	this.getSerializedState = () => {
		let result = 0n;
		for (let i = 0; i < this.bitStates.length; ++i) {
			const currState = this.bitStates[i];
			for (let j = 0; j <= MAX_BIT_SHIFT; ++j) {
				const mask = 1 << j;
				if (currState & mask) {
					result += 1n << BigInt(j + i * MAX_BIT_SHIFT);
				}
			}
		}
		return result;
	};

	this.printSet = function () {
		let set = new Set();
		for (let i = 0; i < this.bitStates.length; ++i) {
			const currState = this.bitStates[i];
			for (let j = 0; j <= MAX_BIT_SHIFT; ++j) {
				const mask = 1 << j;
				if (currState & mask) {
					set.add(j + i * MAX_BIT_SHIFT);
				}
			}
		}
		return set;
	};
}
