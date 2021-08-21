/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
const repl = require('repl');

const {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	PatternMatcher,
	englishDataset,
	englishRecommendedBlacklistMatcherTransformers,
	englishRecommendedWhitelistMatcherTransformers,
} = require('../dist/index');

const matcher = new PatternMatcher({
	...englishDataset.build(),
	blacklistMatcherTransformers: englishRecommendedBlacklistMatcherTransformers,
	whitelistMatcherTransformers: englishRecommendedWhitelistMatcherTransformers,
});

console.log(`Welcome to the REPL example for Obscenity.
Type ".help" for more information.`);

const replServer = repl.start({
	prompt: '> ',
	eval: (input, _ctx, _file, cb) => {
		const matches = matcher //
			.setInput(input)
			.getAllMatches(true)
			.map((match) => englishDataset.getPayloadWithPhraseMetadata(match));
		cb(undefined, matches);
	},
});

replServer.defineCommand('help', {
	help: 'View a help message',
	action() {
		console.log(`To try out Obscenity with the English preset, simply type a phrase.
Obscene words found in the string will be displayed when you click enter.

Press ^D to exit the REPL`);
		this.displayPrompt();
	},
});

// Override some special commands that aren't useful for this example.
function invalidCommand() {
	console.log('Invalid REPL keyword');
	this.displayPrompt();
}

replServer.defineCommand('save', { action: invalidCommand });
replServer.defineCommand('load', { action: invalidCommand });
