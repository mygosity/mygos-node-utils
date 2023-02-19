export function getPalindromeStartAndEnd(s, leftLimit, rightLimit, start) {
	let left = start;
	let right = start;
	while (left - 1 >= leftLimit && s[left] === s[left - 1]) {
		--left;
	}
	while (right + 1 <= rightLimit && s[right] === s[right + 1]) {
		++right;
	}
	while (left - 1 >= leftLimit && right + 1 <= rightLimit && s[left - 1] === s[right + 1]) {
		--left;
		++right;
	}
	return [left, right];
}

export function findlargestPalindrome(s, leftLimit = null, rightLimit = null) {
	leftLimit = leftLimit ?? 0;
	rightLimit = rightLimit ?? s.length - 1;
	let mid = Math.floor((rightLimit + leftLimit) / 2);
	let left = mid;
	let right = mid;
	while (left - 1 >= leftLimit && s[left] === s[left - 1]) {
		--left;
	}

	while (right + 1 <= rightLimit && s[right] === s[right + 1]) {
		++right;
	}

	while (left - 1 >= leftLimit && right + 1 <= rightLimit && s[left - 1] === s[right + 1]) {
		--left;
		++right;
	}
	return [left, right];
}

export function removePalindrome(s) {
	const [start, end] = findlargestPalindrome(s);
	const front = s.substring(0, start);
	const back = s.substring(end + 1);
	return front + back;
}
