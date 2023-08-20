export interface Ast {
	source: string;
	nodes: Node[];
	boundaryAssertions: BoundaryAssertion;
}

export enum BoundaryAssertion {
	None = 0,
	Start = 1 << 0,
	End = 1 << 1,
}

export enum SyntaxKind {
	Literal,
	Wildcard,
	Optional,
	CharSet,
}

export type Node = Literal | Wildcard | Optional | CharSet;

export interface Literal {
	kind: SyntaxKind.Literal;
	chars: number[];
}

export interface Wildcard {
	kind: SyntaxKind.Wildcard;
}

export interface Optional {
	kind: SyntaxKind.Optional;
	children: Node[];
}

export interface CharSet {
	kind: SyntaxKind.CharSet;
	ranges: CharRange[];
}

/**
 * A range of characters, including both endpoints.
 */
export interface CharRange {
	lo: number;
	hi: number;
}
