import {Command} from '../types/index.js';
import {commandRegistry} from '../commands.js';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import React from 'react';
import {TitledBox, titleStyles} from '@mishieck/ink-titled-box';
import {Box, Text} from 'ink';
import {useTerminalWidth} from '../hooks/useTerminalWidth.js';
import {useTheme} from '../hooks/useTheme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
	fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
);

function Help({
	version,
	commands,
}: {
	version: string;
	commands: Array<{name: string; description: string}>;
}) {
	const boxWidth = useTerminalWidth();
	const {colors} = useTheme();
	return (
		<TitledBox
			key={colors.primary}
			borderStyle="round"
			titles={['/help']}
			titleStyles={titleStyles.pill}
			width={boxWidth}
			borderColor={colors.primary}
			paddingX={2}
			paddingY={1}
			flexDirection="column"
			marginBottom={1}
		>
			<Box marginBottom={1}>
				<Text color={colors.primary} bold>
					Nanocoder – {version}
				</Text>
			</Box>

			<Text color={colors.white}>
				A local-first CLI coding agent that brings the power of agentic coding
				tools like Claude Code and Gemini CLI to local models or controlled APIs
				like OpenRouter.
			</Text>

			<Box marginTop={1}>
				<Text color={colors.secondary}>
					Always review model responses, especially when running code. Models
					have read access to files in the current directory and can run
					commands and edit files with your permission.
				</Text>
			</Box>

			<Box marginTop={1}>
				<Text color={colors.primary} bold>
					Common Tasks:
				</Text>
			</Box>
			<Text color={colors.white}>
				{' '}
				• Ask questions about your codebase {'>'} How does foo.py work?
			</Text>
			<Text color={colors.white}> • Edit files {'>'} Update bar.ts to...</Text>
			<Text color={colors.white}> • Fix errors {'>'} cargo build</Text>
			<Text color={colors.white}> • Run commands {'>'} /help</Text>

			<Box marginTop={1}>
				<Text color={colors.primary} bold>
					Commands:
				</Text>
			</Box>
			{commands.length === 0 ? (
				<Text color={colors.white}> No commands available.</Text>
			) : (
				commands.map((cmd, index) => (
					<Text key={index} color={colors.white}>
						{' '}
						• /{cmd.name} - {cmd.description}
					</Text>
				))
			)}
		</TitledBox>
	);
}

export const helpCommand: Command = {
	name: 'help',
	description: 'Show available commands',
	handler: async (_args: string[], _messages, _metadata) => {
		const commands = commandRegistry.getAll();

		return React.createElement(Help, {
			key: `help-${Date.now()}`,
			version: packageJson.version,
			commands: commands,
		});
	},
};
