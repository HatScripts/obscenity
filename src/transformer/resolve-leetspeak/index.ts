import { remapCharactersTransformer } from '../remap-characters';
import { dictionary } from './dictionary';

/**
 * Creates a transformer that maps "leet-speak" characters to their normalized equivalent.
 * For example, `$` would be transformed into `s` using this transformer.
 *
 * **Application order**
 *
 * It is recommended that this transformer be applied near the start of the transformer chain,
 * but after similar transformers that map characters to other characters, such as the
 * [[resolveConfusablesTransformer | transformer that resolves confusable Unicode characters]].
 *
 * @example
 * ```typescript
 * const transformer = resolveLeetSpeakTransformer();
 * const matcher = new PatternMatcher({ ..., blacklistMatcherTransformer: [transformer] });
 * ```
 *
 * @returns A container holding the transformer, which can then be passed to the [[PatternMatcher]].
 */
export function resolveLeetSpeakTransformer() {
	return remapCharactersTransformer(dictionary);
}
