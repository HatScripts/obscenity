import { describe, expect, it } from 'vitest';
import { patternEscape } from '../../../src/dsl/syntax/escape';

const r = String.raw;

describe('patternEscape', () => {
	it('should leave input without metachars as is', () => {
		const input = 'abc dαf  g! =~';
		expect(patternEscape(input)).toBe(input);
	});

	it("should escape '\\'", () => {
		expect(patternEscape(r`\aβc\Ξe`)).toBe(r`\\aβc\\Ξe`);
	});

	it("should escape '[' and ']'", () => {
		expect(patternEscape('[f00]')).toBe(r`\[f00\]`);
	});

	it("should escape '{' and '}'", () => {
		expect(patternEscape('hello {wo}rld')).toBe(r`hello \{wo\}rld`);
	});

	it("should escape '?'", () => {
		expect(patternEscape('?')).toBe(r`\?`);
	});

	it("should escape '|'", () => {
		expect(patternEscape('|foo|bar|baz|')).toBe(r`\|foo\|bar\|baz\|`);
	});
});
