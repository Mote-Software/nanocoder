import React from 'react';
import type {Command} from '../types/index.js';

export const themeCommand: Command = {
	name: 'theme',
	description: 'Select a theme for the Nanocoder CLI',
	handler: async (_args: string[], _messages, _metadata) => {
		// This command is handled specially in app.tsx
		// This handler exists only for registration purposes
		return React.createElement(React.Fragment);
	},
};
