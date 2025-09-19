import React from 'react';
import {commandRegistry} from '../../commands.js';
import {parseInput} from '../../command-parser.js';
import {toolRegistry} from '../../tools/index.js';
import InfoMessage from '../../components/info-message.js';
import ToolMessage from '../../components/tool-message.js';
import ErrorMessage from '../../components/error-message.js';
import type {MessageSubmissionOptions} from '../../types/index.js';

export async function handleMessageSubmission(
	message: string,
	options: MessageSubmissionOptions,
): Promise<void> {
	const {
		customCommandCache,
		customCommandLoader,
		customCommandExecutor,
		onClearMessages,
		onEnterModelSelectionMode,
		onEnterProviderSelectionMode,
		onEnterThemeSelectionMode,
		onHandleChatMessage,
		onAddToChatQueue,
		componentKeyCounter,
		setMessages,
		messages,
		setIsBashExecuting,
		setCurrentBashCommand,
	} = options;

	// Parse the input to determine its type
	const parsedInput = parseInput(message);

	// Handle bash commands (prefixed with !)
	if (parsedInput.isBashCommand && parsedInput.bashCommand) {
		const bashCommand = parsedInput.bashCommand;

		// Set bash execution state to show spinner
		setCurrentBashCommand(bashCommand);
		setIsBashExecuting(true);

		try {
			// Execute the bash command
			const resultString = await toolRegistry.execute_bash({
				command: bashCommand,
			});

			// Parse the result
			let result: {fullOutput: string; llmContext: string};
			try {
				result = JSON.parse(resultString);
			} catch (e) {
				// If parsing fails, treat as plain string
				result = {
					fullOutput: resultString,
					llmContext:
						resultString.length > 4000
							? resultString.substring(0, 4000)
							: resultString,
				};
			}

			// Create a proper display of the command and its full output
			const commandOutput = `$ ${bashCommand}
${result.fullOutput || '(No output)'}`;

			// Add the command and its output to the chat queue
			onAddToChatQueue(
				React.createElement(ToolMessage, {
					key: `bash-result-${componentKeyCounter}`,
					message: commandOutput,
					hideBox: true,
					isBashMode: true,
				}),
			);

			// Add the truncated output to the LLM context for future interactions
			if (result.llmContext) {
				const toolMessage = {
					role: 'tool',
					content: result.llmContext,
					name: 'execute_bash',
				};
				setMessages([...messages, toolMessage]);
			}

			// Clear bash execution state
			setIsBashExecuting(false);
			setCurrentBashCommand('');
			return;
		} catch (error: any) {
			// Show error message if command fails
			onAddToChatQueue(
				React.createElement(ErrorMessage, {
					key: `bash-error-${componentKeyCounter}`,
					message: `Error executing command: ${error.message}`,
				}),
			);

			// Clear bash execution state
			setIsBashExecuting(false);
			setCurrentBashCommand('');

			// Don't send to LLM - just return here
			return;
		}
	}

	// Handle regular commands (prefixed with /)
	if (message.startsWith('/')) {
		const commandName = message.slice(1).split(' ')[0];

		// Check for custom command first
		const customCommand =
			customCommandCache.get(commandName) ||
			customCommandLoader?.getCommand(commandName);

		if (customCommand) {
			// Execute custom command with any arguments
			const args = message
				.slice(commandName.length + 1)
				.trim()
				.split(/\s+/)
				.filter(arg => arg);
			const processedPrompt = await customCommandExecutor?.execute(
				customCommand,
				args,
			);

			// Send the processed prompt to the AI
			if (processedPrompt) {
				await onHandleChatMessage(processedPrompt);
			}
		} else {
			// Handle special commands that need app state access
			if (commandName === 'clear') {
				await onClearMessages();
				// Still show the clear command result
			} else if (commandName === 'model') {
				onEnterModelSelectionMode();
				return;
			} else if (commandName === 'provider') {
				onEnterProviderSelectionMode();
				return;
			} else if (commandName === 'theme') {
				onEnterThemeSelectionMode();
				return;
			}

			// Execute built-in command
			const totalTokens = messages.reduce(
				(sum, msg) => sum + options.getMessageTokens(msg),
				0,
			);
			const result = await commandRegistry.execute(message.slice(1), messages, {
				provider: options.provider,
				model: options.model,
				tokens: totalTokens,
			});
			if (result) {
				// Check if result is JSX (React element)
				if (React.isValidElement(result)) {
					onAddToChatQueue(result);
				} else if (typeof result === 'string' && result.trim()) {
					onAddToChatQueue(
						React.createElement(InfoMessage, {
							key: `command-result-${componentKeyCounter}`,
							message: result,
							hideBox: true,
						}),
					);
				}
			}
		}

		// Return here to avoid sending to LLM
		return;
	}

	// Regular chat message - process with AI
	await onHandleChatMessage(message);
}

export function createClearMessagesHandler(
	setMessages: (messages: any[]) => void,
	client: any,
) {
	return async () => {
		// Clear message history and client context
		setMessages([]);
		if (client) {
			await client.clearContext();
		}
	};
}
