// Test helpers for building AST nodes.
import type {
	Ast,
	BoundaryAssertion,
	CharRange,
	CharSet,
	Literal,
	Node,
	Optional,
	Repetition,
	Wildcard,
} from '../../../../src/dsl/syntax/ast';
import { SyntaxKind } from '../../../../src/dsl/syntax/ast';

export { BoundaryAssertion as B } from '../../../../src/dsl/syntax/ast';

export function ast(nodes: Node | Node[], source: string, boundaryAssertions: BoundaryAssertion): Ast {
	return { source, nodes: Array.isArray(nodes) ? nodes : [nodes], boundaryAssertions: boundaryAssertions };
}

export function lit(content: string): Literal {
	return { kind: SyntaxKind.Literal, chars: [...content] };
}

export function wildcard(): Wildcard {
	return { kind: SyntaxKind.Wildcard };
}

export function opt(inner: Node | Node[]): Optional {
	return { kind: SyntaxKind.Optional, inner: Array.isArray(inner) ? inner : [inner] };
}

export function charSet(elements: ([string, string] | string)[]): CharSet {
	const ranges: CharRange[] = [];
	for (const elem of elements) {
		if (typeof elem === 'string') ranges.push({ lo: elem, hi: elem });
		else ranges.push({ lo: elem[0], hi: elem[1] });
	}
	return { kind: SyntaxKind.CharSet, ranges };
}

export function rep(char: string): Repetition {
	return { kind: SyntaxKind.Repetition, char };
}
