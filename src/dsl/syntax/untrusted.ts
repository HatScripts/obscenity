import type { Ast, Node } from './ast';
import { BoundaryAssertion, SyntaxKind } from './ast';
import { Parser } from './parse';

export enum SpecialPatternSyntax {
	None = 0,
	Wildcards = 1 << 0,
	Optionals = 1 << 1,
	CharSets = 1 << 2,
	Repetitions = 1 << 3,
	BoundaryAssertions = 1 << 4,
	All = Optionals | Wildcards | CharSets | Repetitions | BoundaryAssertions,
}

export function printSyntax(syntax: SpecialPatternSyntax) {
	const items: string[] = [];
	if (syntax & SpecialPatternSyntax.Wildcards) items.push('wildcards');
	if (syntax & SpecialPatternSyntax.Optionals) items.push('optional expressions');
	if (syntax & SpecialPatternSyntax.CharSets) items.push('character sets');
	if (syntax & SpecialPatternSyntax.Repetitions) items.push('repetitions');
	if (syntax & SpecialPatternSyntax.BoundaryAssertions) items.push('boundary assertions');
	return items.join(', ');
}

export interface ParseOptions {
	allowedSyntax?: SpecialPatternSyntax;
	maxOptionalNestingDepth?: number;
	maxLength?: number;
}

export function parseUntrustedPattern(
	pattern: string,
	{ allowedSyntax = SpecialPatternSyntax.All, maxOptionalNestingDepth = 3, maxLength = 64 }: ParseOptions = {},
) {
	if (pattern.length > maxLength) throw new PatternTooLongError(pattern, maxLength, pattern.length);

	const ast = new Parser().parse(pattern);
	const disallowedSyntax = detectUsedSyntax(ast) & ~allowedSyntax;
	if (disallowedSyntax !== SpecialPatternSyntax.None) throw new DisallowedSyntaxError(pattern, disallowedSyntax);

	const depth = determineOptionalNestingDepth(ast);
	if (depth > maxOptionalNestingDepth) {
		throw new ExcessiveOptionalNestingError(pattern, maxOptionalNestingDepth, depth);
	}
	return ast;
}

export class PatternTooLongError extends Error {
	public readonly pattern: string;
	public readonly maxLength: number;
	public readonly actualLength: number;

	public constructor(pattern: string, maxLength: number, actualLength: number) {
		super(`pattern '${pattern}' exceeds max length of ${maxLength}`);
		this.pattern = pattern;
		this.maxLength = maxLength;
		this.actualLength = actualLength;
	}
}

export function detectUsedSyntax(ast: Ast) {
	function visit(node: Node): SpecialPatternSyntax {
		switch (node.kind) {
			case SyntaxKind.Optional:
				return node.inner.reduce((syntax, node) => syntax | visit(node), SpecialPatternSyntax.Optionals);
			case SyntaxKind.Wildcard:
				return SpecialPatternSyntax.Wildcards;
			case SyntaxKind.CharSet:
				return SpecialPatternSyntax.CharSets;
			case SyntaxKind.Repetition:
				return SpecialPatternSyntax.Repetitions;
			case SyntaxKind.Literal:
				return SpecialPatternSyntax.None;
		}
	}

	let syntax = SpecialPatternSyntax.None;
	if (ast.boundaryAssertions !== BoundaryAssertion.None) syntax |= SpecialPatternSyntax.BoundaryAssertions;
	return syntax | ast.nodes.reduce((syntax, node) => syntax | visit(node), SpecialPatternSyntax.None);
}

export class DisallowedSyntaxError extends Error {
	public readonly pattern: string;
	public readonly syntax: SpecialPatternSyntax;

	public constructor(pattern: string, syntax: SpecialPatternSyntax) {
		super(
			`pattern '${pattern}' contains disallowed syntax constructs (${printSyntax(
				syntax,
			)}); either remove them from the pattern or enable them using the 'allowedSyntax' option`,
		);
		this.pattern = pattern;
		this.syntax = syntax;
	}
}

export function determineOptionalNestingDepth(ast: Ast) {
	function visit(node: Node): number {
		if (node.kind === SyntaxKind.Optional) return node.inner.reduce((max, node) => Math.max(max, visit(node)), 0) + 1;
		return 0;
	}
	return ast.nodes.reduce((max, node) => Math.max(max, visit(node)), 0);
}

export class ExcessiveOptionalNestingError extends Error {
	public readonly pattern: string;
	public readonly depthLimit: number;
	public readonly actualDepth: number;

	public constructor(pattern: string, depthLimit: number, actualDepth: number) {
		super(
			`pattern '${pattern}' contains ${actualDepth} layers of nested optional expressions, exceeding limit of ${depthLimit}`,
		);
		this.pattern = pattern;
		this.depthLimit = depthLimit;
		this.actualDepth = actualDepth;
	}
}
