import { metachars } from './parse';

export function patternEscape(str: string) {
	let escaped = '';
	for (const c of str) {
		if (c === '\\' || metachars.includes(c)) escaped += '\\';
		escaped += c;
	}
	return escaped;
}
