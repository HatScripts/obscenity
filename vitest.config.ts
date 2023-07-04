import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.ts'],
		exclude: ['test/**/__helpers__/**/*.ts'],
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: ['text', 'lcov', 'clover'],
		},
	},
});
