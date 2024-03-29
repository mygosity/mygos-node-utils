// https://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
export function getNextPowerOf2(v) {
	v--;
	v |= v >> 1;
	v |= v >> 2;
	v |= v >> 4;
	v |= v >> 8;
	v |= v >> 16;
	v++;
	return v;
}
