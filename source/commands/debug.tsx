import type {Command, LogLevel} from '../types/index.js';
import {getLogLevel, setLogLevel} from '../config/logging.js';
import React from 'react';
import {TitledBox, titleStyles} from '@mishieck/ink-titled-box';
import {Box, Text} from 'ink';
import {useTerminalWidth} from '../hooks/useTerminalWidth.js';
import {useTheme} from '../hooks/useTheme.js';
import {getColors} from '../config/index.js';

interface DebugProps {
	currentLevel: LogLevel;
	newLevel?: LogLevel;
	action: 'changed' | 'set' | 'show' | 'invalid';
	invalidArg?: string;
}

function getLogLevelDescription(level: LogLevel): React.ReactNode {
	const colors = getColors();

	switch (level) {
		case 'silent':
			return (
				<>
					Silent mode:{' '}
					<Text color={colors.white}>
						Only showing errors and essential messages
					</Text>
					.
				</>
			);
		case 'normal':
			return (
				<>
					Normal mode:{' '}
					<Text color={colors.white}>
						Showing standard output without debug info
					</Text>
					.
				</>
			);
		case 'verbose':
			return (
				<>
					Verbose mode:{' '}
					<Text color={colors.white}>
						Showing all debug and diagnostic information
					</Text>
					.
				</>
			);
		default:
			return <></>;
	}
}

function Debug({currentLevel, newLevel, action, invalidArg}: DebugProps) {
	const boxWidth = useTerminalWidth();
	const {colors} = useTheme();
	return (
		<TitledBox
			key={colors.primary}
			borderStyle="round"
			titles={['/debug']}
			titleStyles={titleStyles.pill}
			width={boxWidth}
			borderColor={colors.info}
			paddingX={2}
			paddingY={1}
			flexDirection="column"
			marginBottom={1}
		>
			{action === 'changed' && newLevel ? (
				<>
					<Text color={colors.info}>
						Logging level changed from{' '}
						<Text color={colors.white}>{currentLevel}</Text> to{' '}
						<Text color={colors.white}>{newLevel}</Text>.
					</Text>
					<Box>
						<Text color={colors.info}>{getLogLevelDescription(newLevel)}</Text>
					</Box>
				</>
			) : action === 'set' && newLevel ? (
				<>
					<Text color={colors.info}>
						Logging level set to <Text color={colors.white}>{newLevel}</Text>.
					</Text>
					<Box marginTop={1}>
						<Text color={colors.info}>{getLogLevelDescription(newLevel)}</Text>
					</Box>
				</>
			) : (
				<Box flexDirection="column">
					<Text color={colors.error}>Invalid log level: {invalidArg}</Text>
					<Box marginTop={1} flexDirection="column">
						<Text color={colors.info}>
							Current logging level:{' '}
							<Text color={colors.white}>{currentLevel}</Text>
						</Text>
						<Text color={colors.info}>
							{getLogLevelDescription(currentLevel)}
						</Text>
					</Box>
					<Box marginTop={1} flexDirection="column">
						<Text color={colors.info}>Available levels:</Text>
						<Text color={colors.secondary}>
							{' '}
							• <Text color={colors.white}>silent</Text> - Minimal output
							(errors only)
						</Text>
						<Text color={colors.secondary}>
							{' '}
							• <Text color={colors.white}>normal</Text> - Standard output
							(default)
						</Text>
						<Text color={colors.secondary}>
							{' '}
							• <Text color={colors.white}>verbose</Text> - Debug output (all
							logs)
						</Text>
					</Box>
					<Box marginTop={1}>
						<Text color={colors.info}>
							Usage:{' '}
							<Text color={colors.white}>/debug [silent|normal|verbose]</Text>{' '}
							or just <Text color={colors.white}>/debug</Text> to cycle
						</Text>
					</Box>
				</Box>
			)}
		</TitledBox>
	);
}

export const debugCommand: Command = {
	name: 'debug',
	description: 'Toggle debug/verbose logging output',
	handler: async (args: string[], _messages, _metadata) => {
		const currentLevel = getLogLevel();

		// If no argument provided, cycle through levels
		if (args.length === 0) {
			let newLevel: LogLevel;
			switch (currentLevel) {
				case 'silent':
					newLevel = 'normal';
					break;
				case 'normal':
					newLevel = 'verbose';
					break;
				case 'verbose':
					newLevel = 'silent';
					break;
				default:
					newLevel = 'normal';
			}

			setLogLevel(newLevel);
			return React.createElement(Debug, {
				key: `debug-changed-${Date.now()}`,
				currentLevel: currentLevel,
				newLevel: newLevel,
				action: 'changed',
			});
		}

		// If argument provided, set specific level
		const requestedLevel = args[0]?.toLowerCase();
		if (
			requestedLevel === 'silent' ||
			requestedLevel === 'normal' ||
			requestedLevel === 'verbose'
		) {
			setLogLevel(requestedLevel as LogLevel);
			return React.createElement(Debug, {
				key: `debug-set-${Date.now()}`,
				currentLevel: currentLevel,
				newLevel: requestedLevel as LogLevel,
				action: 'set',
			});
		}

		// Invalid argument provided
		if (args[0]) {
			return React.createElement(Debug, {
				key: `debug-invalid-${Date.now()}`,
				currentLevel: currentLevel,
				action: 'invalid',
				invalidArg: args[0],
			});
		}

		// Show current level and available options
		return React.createElement(Debug, {
			key: `debug-show-${Date.now()}`,
			currentLevel: currentLevel,
			action: 'show',
		});
	},
};
