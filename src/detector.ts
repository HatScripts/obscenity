export interface Match<T = unknown> {
	startIndex: number;
	endIndex: number;
	meta: Readonly<T>;
}

export interface Pattern<T = unknown> {
	matchFirst(chars: number[]): Match<T>;
	appendAllMatches(dst: Match<T>[], chars: number[]): void;
	test(chars: number[]): boolean;
}

export class ObscenityDetector<T = unknown> {}
