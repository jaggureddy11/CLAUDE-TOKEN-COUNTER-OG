(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	CC.DOM = Object.freeze({
		CHAT_MENU_TRIGGER: '[data-testid="chat-menu-trigger"]',
		MODEL_SELECTOR_DROPDOWN: '[data-testid="model-selector-dropdown"]',
		CHAT_PROJECT_WRAPPER: '.chat-project-wrapper',
		BRIDGE_SCRIPT_ID: 'cc-bridge-script'
	});

	CC.CONST = Object.freeze({
		CACHE_WINDOW_MS: 5 * 60 * 1000,
		CONTEXT_LIMIT_TOKENS: 200000
	});

	CC.COLORS = Object.freeze({
		PROGRESS_FILL_DARK: '#faf9f5',
		PROGRESS_FILL_LIGHT: '#191919',
		PROGRESS_OUTLINE_DARK: 'transparent',
		PROGRESS_OUTLINE_LIGHT: 'transparent',
		PROGRESS_MARKER_DARK: '#faf9f5',
		PROGRESS_MARKER_LIGHT: '#191919',
		RED_WARNING: '#e26a6a',
		BOLD_LIGHT: '#141413',
		BOLD_DARK: '#faf9f5'
	});
})();
