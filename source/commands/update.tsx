import {Command} from '../types/index.js';
import React from 'react';
import UpdateMessage from '../components/update-message.js';

export const updateCommand: Command = {
	name: 'update',
	description: 'Update Nanocoder to the latest version',
	handler: async (_args: string[]) => {
		return React.createElement(UpdateMessage);
	},
};
