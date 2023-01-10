export function randomItemInArray<T>(arr: T[]) {
	const index = Math.floor(Math.random() * arr.length);
	return arr[index];
}
