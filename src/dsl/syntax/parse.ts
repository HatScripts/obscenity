import type { Ast, CharRange, CharSet, Node, Optional, Wildcard } from './ast';
import { BoundaryAssertion, SyntaxKind } from './ast';
import * as assert from 'node:assert';

export class PatternSyntaxError extends Error {
	public readonly pos: Position;

	public constructor(msg: string, pos: Position) {
		super(`${pos.line}:${pos.col}: ${msg}`);
		this.pos = pos;
	}
}

export interface Position {
	line: number;
	col: number;
	offset: number;
}

export const metachars = ['{', '}', '[', ']', '+', '?', '|'];

export class Parser {
	private chars: string[] = [];
	private offset = 0;
	private line = 1;
	private col = 0;

	public constructor() {
		this.reset();
	}

	public parse(pattern: string): Ast {
		this.reset();

		const chars = [...pattern];
		const boundaryAssertions = this.stripBoundaryAssertions(chars);
		this.chars = chars;

		const nodes: Node[] = [];
		while (!this.done()) nodes.push(...this.parseAny());
		return { source: pattern, nodes, boundaryAssertions };
	}

	private stripBoundaryAssertions(chars: string[]): BoundaryAssertion {
		let assertions = 0;
		if (chars.length > 0 && chars[0] === '|') {
			chars.shift();
			assertions |= BoundaryAssertion.Start;
		}
		if (chars.length > 0 && chars.at(-1) === '|') {
			chars.pop();
			assertions |= BoundaryAssertion.End;
		}
		return assertions;
	}

	private *parseAny(): Generator<Node> {
		if (this.at('?')) return yield this.parseWildcard();
		if (this.at('[')) return yield this.parseOpt();
		if (this.at('{')) return yield this.parseCharSet();

		/* eslint-disable no-fallthrough */
		switch (this.peek()) {
			case ']':
				this.error("lone ']' with no matching '['; use a backslash '\\' to escape if a literal ']' is desired");
			case '}':
				this.error("lone '}' with no matching '{'; use a backslash '\\' to escape if a literal '}' is desired");
			case '|':
				this.error(
					"boundary assertions are only permitted at start/end of pattern; use a backslash '\\' to escape if a literal '|' is desired",
				);
			case '+':
				if (this.offset > 0) {
					this.error(
						"'+' can only be used after a character, not a wildcard/optional/char set; use a backslash '\\' to escape if a literal '+' is desired",
					);
				} else {
					this.error(
						"'+' is a special character denoting repetition; use a backslash '\\' to escape if a literal '+' is desired",
					);
				}
			default: {
				const chars: string[] = [];
				while (!this.done() && !metachars.includes(this.peek())) chars.push(this.nextSkipEscape());
				if (this.eat('+')) {
					const last = chars.pop()!;
					if (chars.length > 0) yield { kind: SyntaxKind.Literal, chars };
					yield { kind: SyntaxKind.Repetition, char: last };
				} else {
					yield { kind: SyntaxKind.Literal, chars };
				}
			}
		}
		/* eslint-enable no-fallthrough */
	}

	private nextSkipEscape() {
		const c = this.next();
		if (c === '\\') {
			if (this.done()) this.error('lone \\', { col: this.col - 1, offset: this.offset - 1 });
			return this.next();
		}
		return c;
	}

	private parseWildcard(): Wildcard {
		assert.ok(this.eat('?'));
		return { kind: SyntaxKind.Wildcard };
	}

	private parseOpt(): Optional {
		const openPos = this.pos();
		assert.ok(this.eat('['));

		const inner: Node[] = [];
		while (!this.done()) {
			if (this.eat(']')) {
				if (inner.length === 0) {
					this.error('empty optional expressions are not permitted', { col: this.col - 1, offset: this.offset - 1 });
				}
				return { kind: SyntaxKind.Optional, inner };
			}
			inner.push(...this.parseAny());
		}
		this.error('unclosed optional expression', openPos);
	}

	private parseCharSet(): CharSet {
		const openPos = this.pos();
		assert.ok(this.eat('{'));

		let needComma = false;
		const ranges: CharRange[] = [];
		while (!this.done()) {
			if (this.eat('}')) {
				if (ranges.length === 0) {
					this.error('empty character sets are not permitted', { col: this.col - 1, offset: this.offset - 1 });
				}
				return { kind: SyntaxKind.CharSet, ranges };
			}
			if (needComma && !this.eat(',')) this.error('expected comma separating elements of character set');

			const lo = this.next();
			let hi = lo;
			if (this.eat('-')) {
				// next char is upper bound
				if (this.done()) this.error("expected character following '-' in character set");
				hi = this.next();
			}

			ranges.push({ lo, hi });
			needComma = true;
		}
		this.error('unclosed character set', openPos);
	}

	private peek() {
		return this.chars[this.offset];
	}

	private next() {
		const c = this.chars[this.offset++];
		this.col++;
		if (c === '\n') {
			this.line++;
			this.col = 0;
		}
		return c;
	}

	private at(c: string) {
		return !this.done() && this.peek() === c;
	}

	private eat(c: string) {
		if (this.at(c)) {
			this.next();
			return true;
		}
		return false;
	}

	private error(msg: string, pos: Partial<Position> = {}): never {
		throw new PatternSyntaxError(msg, { ...this.pos(), ...pos });
	}

	private pos() {
		return { line: this.line, col: this.col, offset: this.offset };
	}

	private done() {
		return this.offset >= this.chars.length;
	}

	private reset() {
		this.line = 1;
		this.col = 0;
		this.offset = 0;
	}
}
