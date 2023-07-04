import { describe, expect, it } from 'vitest';
import { Parser } from '../../../src/dsl/syntax/parse';
import { B, ast, charSet, lit, opt, rep, wildcard } from './__helpers__/ast';

const r = String.raw;

function parse(pattern: string) {
	return new Parser().parse(pattern);
}

describe('special cases', () => {
	it('should parse an empty string', () => {
		const pattern = '';
		const expected = ast([], pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});
});

describe('literals', () => {
	it('should parse a simple literal', () => {
		const pattern = 'bar';
		const expected = ast(lit('bar'), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse a literal containing multibyte characters', () => {
		const pattern = 'foo 𝌆';
		const expected = ast(lit('foo 𝌆'), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse a literal containing lone surrogate pairs', () => {
		const pattern = 'foo \ud83d bar \ude00';
		const expected = ast(lit('foo \ud83d bar \ude00'), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	describe('escapes', () => {
		it('should parse a literal with escaped characters', () => {
			const pattern = r`hello \world`;
			const expected = ast(lit('hello world'), pattern, B.None);
			expect(parse(pattern)).toStrictEqual(expected);
		});

		it('should parse a literal with escaped metachars', () => {
			const pattern = r`hello \? \{def\} \[abc\]`;
			const expected = ast(lit('hello ? {def} [abc]'), pattern, B.None);
			expect(parse(pattern)).toStrictEqual(expected);
		});

		describe('syntax errors', () => {
			it("should reject a literal with a trailing '\\'", () => {
				const pattern = ' \\';
				expect(() => parse(pattern)).toThrow('1:1: lone \\');
			});
		});
	});
});

describe('repetitions', () => {
	it('should parse a simple repetition', () => {
		const pattern = 'f+';
		const expected = ast(rep('f'), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse repetition of an escaped metachar', () => {
		const pattern = r`\]+`;
		const expected = ast(rep(']'), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse repetitions following literals', () => {
		const pattern = 'abcdefg+';
		const expected = ast([lit('abcdef'), rep('g')], pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	describe('syntax errors', () => {
		it("should reject a lone '+' at the start of a pattern", () => {
			const pattern = '+bar';
			expect(() => parse(pattern)).toThrow("1:0: '+'");
		});

		it("should reject '+' used after a wildcard", () => {
			const pattern = '?+';
			expect(() => parse(pattern)).toThrow("1:1: '+'");
		});

		it("should reject '+' used after an optional", () => {
			const pattern = '[foo]+';
			expect(() => parse(pattern)).toThrow("1:5: '+'");
		});

		it("should reject '+' used after a char set", () => {
			const pattern = '{a,b}+';
			expect(() => parse(pattern)).toThrow("1:5: '+'");
		});

		it('should reject multiple + in sequence', () => {
			const pattern = 'a+++';
			expect(() => parse(pattern)).toThrow("1:2: '+'");
		});
	});
});

describe('wildcards', () => {
	it('should parse a single wildcard', () => {
		const pattern = '?';
		const expected = ast(wildcard(), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse multiple wildcards', () => {
		const pattern = '???';
		const expected = ast([wildcard(), wildcard(), wildcard()], pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse wildcards following literals', () => {
		const pattern = 'foo?bar';
		const expected = ast([lit('foo'), wildcard(), lit('bar')], pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});
});

describe('optionals', () => {
	it('should parse a simple optional containing a single literal', () => {
		const pattern = '[abc]';
		const expected = ast(opt(lit('abc')), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse an optional containing a wildcard', () => {
		const pattern = '[?]';
		const expected = ast(opt(wildcard()), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse an optional containing a repetition', () => {
		const pattern = '[d+]';
		const expected = ast(opt(rep('d')), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse an optional containing a literal and repetition in sequence', () => {
		const pattern = '[foobar+]';
		const expected = ast(opt([lit('fooba'), rep('r')]), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse an optional containing a literal and wildcard in sequence', () => {
		const pattern = '[foo?bar]';
		const expected = ast(opt([lit('foo'), wildcard(), lit('bar')]), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse nested optionals', () => {
		const pattern = '[[[foo]]]';
		const expected = ast(opt(opt(opt(lit('foo')))), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	describe('syntax errors', () => {
		it('should reject empty optionals', () => {
			const pattern = '[]';
			expect(() => parse(pattern)).toThrow('1:1: empty optional expressions are not permitted');
		});

		it('should reject unclosed optionals', () => {
			const pattern = '[foo';
			expect(() => parse(pattern)).toThrow('1:0: unclosed optional expression');
		});

		it("should reject unmatched ']'", () => {
			const pattern = 'foobar]';
			expect(() => parse(pattern)).toThrow("1:6: lone ']'");
		});
	});
});

describe('character sets', () => {
	it('should parse a character set containing one specific character', () => {
		const pattern = '{a}';
		const expected = ast(charSet(['a']), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse a character set containing multiple specific characters', () => {
		const pattern = '{a,b,c,d}';
		const expected = ast(charSet(['a', 'b', 'c', 'd']), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse a character set containing multibyte characters', () => {
		const pattern = '{a,𝌆,c}';
		const expected = ast(charSet(['a', '𝌆', 'c']), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse a character set containing one character range', () => {
		const pattern = '{a-z}';
		const expected = ast(charSet([['a', 'z']]), pattern, B.None);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	describe('syntax errors', () => {
		it('should reject unclosed character sets', () => {
			const pattern = '{a,b';
			expect(() => parse(pattern)).toThrow('1:0: unclosed character set');
		});

		it('should reject empty character sets', () => {
			const pattern = '{}';
			expect(() => parse(pattern)).toThrow('1:1: empty character sets are not permitted');
		});

		it('should reject character sets with no comma separator', () => {
			const pattern = '{ab}';
			expect(() => parse(pattern)).toThrow('1:2: expected comma');
		});

		it('should reject character sets containing incomplete ranges', () => {
			const pattern = '{a-';
			expect(() => parse(pattern)).toThrow("1:3: expected character following '-'");
		});

		it("should reject unmatched '}'", () => {
			const pattern = 'hi}';
			expect(() => parse(pattern)).toThrow("1:2: lone '}'");
		});
	});
});

describe('boundary assertions', () => {
	it('should parse a boundary assertion at the start', () => {
		const pattern = '|hi';
		const expected = ast(lit('hi'), pattern, B.Start);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse a boundary assertion at the end', () => {
		const pattern = 'hi|';
		const expected = ast(lit('hi'), pattern, B.End);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it('should parse boundary assertions at both start, end', () => {
		const pattern = '|hi|';
		const expected = ast(lit('hi'), pattern, B.Start | B.End);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	it("should parse '|' as having a boundary assertion at the start only", () => {
		const pattern = '|';
		const expected = ast([], pattern, B.Start);
		expect(parse(pattern)).toStrictEqual(expected);
	});

	describe('syntax errors', () => {
		it('should reject boundary assertions not at start/end', () => {
			const pattern = 'hi| there';
			expect(() => parse(pattern)).toThrow('1:2: boundary assertions are only permitted at start/end');
		});
	});
});

it('should support parsing multiple patterns with same Parser instance', () => {
	const parser = new Parser();

	const pattern0 = '|{h,i,𝌆} [[there+]] wor?d';
	const expected0 = ast(
		[charSet(['h', 'i', '𝌆']), lit(' '), opt(opt([lit('ther'), rep('e')])), lit(' wor'), wildcard(), lit('d')],
		pattern0,
		B.Start,
	);
	expect(parser.parse(pattern0)).toStrictEqual(expected0);

	const pattern1 = 'bar+|';
	const expected1 = ast([lit('ba'), rep('r')], pattern1, B.End);
	expect(parser.parse(pattern1)).toStrictEqual(expected1);
});

describe('error positions', () => {
	it('should have correct position info after newline', () => {
		const pattern = 'a\n}';
		expect(() => parse(pattern)).toThrow("2:0: lone '}'");
	});
});
