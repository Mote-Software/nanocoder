import {Command} from './types/index.js';
import React from 'react';
import ErrorMessage from './components/error-message.js';

export class CommandRegistry {
	private commands = new Map<string, Command>();

	register(command: Command | Command[]): void {
		if (Array.isArray(command)) {
			command.forEach(cmd => this.register(cmd));
			return;
		}
		this.commands.set(command.name, command);
	}

	get(name: string): Command | undefined {
		return this.commands.get(name);
	}

	getAll(): Command[] {
		return Array.from(this.commands.values());
	}

	getCompletions(prefix: string): string[] {
		return Array.from(this.commands.keys())
			.filter(name => name.startsWith(prefix))
			.sort();
	}

	async execute(
		input: string,
		messages: import('./types/index.js').Message[],
		metadata: {provider: string; model: string; tokens: number},
	): Promise<void | string | React.ReactNode> {
		const parts = input.trim().split(/\s+/);
		const commandName = parts[0];
		if (!commandName) {
			return React.createElement(ErrorMessage, {
				key: `error-${Date.now()}`,
				message: 'Invalid command. Type /help for available commands.',
				hideBox: true,
			});
		}

		const args = parts.slice(1);

		const command = this.get(commandName);
		if (!command) {
			return React.createElement(ErrorMessage, {
				key: `error-${Date.now()}`,
				message: `Unknown command: ${commandName}. Type /help for available commands.`,
				hideBox: true,
			});
		}

		return await command.handler(args, messages, metadata);
	}
}

export const commandRegistry = new CommandRegistry();
