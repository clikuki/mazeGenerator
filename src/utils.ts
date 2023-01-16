export function randomItemInArray<T>(arr: T[]) {
	if (arr.length === 1) return arr[0];
	const index = Math.floor(Math.random() * arr.length);
	return arr[index];
}
