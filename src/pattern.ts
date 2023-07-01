type TODO = unknown;

export interface Pattern {
	matchFirst(text: string): TODO;
	matchAll(text: string): TODO[];
	test(text: string): boolean;
}
