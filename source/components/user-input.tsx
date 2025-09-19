import {Box, Text, useFocus, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {useCallback, useEffect} from 'react';
import {useTheme} from '../hooks/useTheme.js';
import {promptHistory} from '../prompt-history.js';
import {commandRegistry} from '../commands.js';
import {useTerminalWidth} from '../hooks/useTerminalWidth.js';
import {useUIStateContext} from '../hooks/useUIState.js';
import {useInputState} from '../hooks/useInputState.js';
import {Completion} from '../types/index.js';

interface ChatProps {
	onSubmit?: (message: string) => void;
	placeholder?: string;
	customCommands?: string[]; // List of custom command names and aliases
	disabled?: boolean; // Disable input when AI is processing
	onCancel?: () => void; // Callback when user presses escape while thinking
}

export default function UserInput({
	onSubmit,
	placeholder = 'Type `/` and then press Tab for command suggestions or `!` to execute bash commands. Use ↑/↓ for history.',
	customCommands = [],
	disabled = false,
	onCancel,
}: ChatProps) {
	const {isFocused, focus} = useFocus({autoFocus: !disabled, id: 'user-input'});
	const {colors} = useTheme();
	const inputState = useInputState();
	const uiState = useUIStateContext();
	const boxWidth = useTerminalWidth();

	const {
		input,
		hasLargeContent,
		originalInput,
		historyIndex,
		setOriginalInput,
		setHistoryIndex,
		updateInput,
		resetInput,
		cachedLineCount,
	} = inputState;

	const {
		showClearMessage,
		showFullContent,
		showCompletions,
		completions,
		setShowClearMessage,
		setShowFullContent,
		setShowCompletions,
		setCompletions,
		resetUIState,
	} = uiState;

	// Check if we're in bash mode (input starts with !)
	const isBashMode = input.trim().startsWith('!');

	// Load history on mount
	useEffect(() => {
		promptHistory.loadHistory();
	}, []);

	// Helper functions

	const getExpandKey = () => 'Ctrl+B';

	// Command completion logic
	const handleCommandCompletion = useCallback(
		(commandPrefix: string) => {
			const builtInCompletions = commandRegistry.getCompletions(commandPrefix);
			const customCompletions = customCommands.filter(cmd =>
				cmd.startsWith(commandPrefix),
			);

			const allCompletions: Completion[] = [
				...builtInCompletions.map(cmd => ({name: cmd, isCustom: false})),
				...customCompletions.map(cmd => ({name: cmd, isCustom: true})),
			];

			if (allCompletions.length === 1) {
				// Auto-complete when there's exactly one match
				const completion = allCompletions[0];
				updateInput(`/${completion.name}`);
			} else if (allCompletions.length > 1) {
				// Show completions when there are multiple matches
				setCompletions(allCompletions);
				setShowCompletions(true);
			}
		},
		[customCommands, setCompletions, setShowCompletions, updateInput],
	);

	// Handle form submission
	const handleSubmit = useCallback(() => {
		if (input.trim() && onSubmit) {
			const message = input.trim();
			promptHistory.addPrompt(message);
			onSubmit(message);
			resetInput();
			resetUIState();
			promptHistory.resetIndex();
		}
	}, [input, onSubmit, resetInput, resetUIState]);

	// Handle escape key logic
	const handleEscape = useCallback(() => {
		if (showClearMessage) {
			resetInput();
			resetUIState();
			focus('user-input');
		} else {
			setShowClearMessage(true);
		}
	}, [showClearMessage, resetInput, resetUIState, setShowClearMessage, focus]);

	// History navigation
	const handleHistoryNavigation = useCallback(
		(direction: 'up' | 'down') => {
			const history = promptHistory.getHistory();
			if (history.length === 0) return;

			if (direction === 'up') {
				if (historyIndex === -1) {
					setOriginalInput(input);
					setHistoryIndex(history.length - 1);
					updateInput(history[history.length - 1]);
				} else if (historyIndex > 0) {
					const newIndex = historyIndex - 1;
					setHistoryIndex(newIndex);
					updateInput(history[newIndex]);
				} else {
					setHistoryIndex(-2);
					updateInput('');
				}
			} else {
				if (historyIndex >= 0 && historyIndex < history.length - 1) {
					const newIndex = historyIndex + 1;
					setHistoryIndex(newIndex);
					updateInput(history[newIndex]);
				} else if (historyIndex === history.length - 1) {
					setHistoryIndex(-1);
					updateInput(originalInput);
					setOriginalInput('');
				} else if (historyIndex === -2) {
					setHistoryIndex(0);
					updateInput(history[0]);
				}
			}
		},
		[
			historyIndex,
			input,
			originalInput,
			setHistoryIndex,
			setOriginalInput,
			updateInput,
		],
	);

	useInput((inputChar, key) => {
		// Handle escape for cancellation even when disabled
		if (key.escape && disabled && onCancel) {
			onCancel();
			return;
		}

		// Block all other input when disabled
		if (disabled) {
			return;
		}

		// Handle special keys
		if (key.escape) {
			handleEscape();
			return;
		}

		if (key.ctrl && inputChar === 'b') {
			if (hasLargeContent && input.length > 150) {
				setShowFullContent(prev => !prev);
			}
			return;
		}

		if (key.tab && input.startsWith('/')) {
			const commandPrefix = input.slice(1).split(' ')[0];
			handleCommandCompletion(commandPrefix);
			return;
		}

		// Clear UI state on other input
		if (showCompletions) {
			setShowCompletions(false);
			setCompletions([]);
		}
		if (showClearMessage) {
			setShowClearMessage(false);
			focus('user-input');
		}

		// Handle return keys
		if (key.return && key.shift) {
			updateInput(input + '\n');
			return;
		}

		// Handle navigation
		if (key.upArrow) {
			handleHistoryNavigation('up');
			return;
		}

		if (key.downArrow) {
			handleHistoryNavigation('down');
			return;
		}
	});

	// Render function - NEVER modifies state, only for display
	const renderDisplayContent = () => {
		if (!input) return placeholder;

		if (hasLargeContent && input.length > 150 && !showFullContent) {
			// Use cached line count from the hook (debounced)
			return (
				<>
					{`[${input.length} characters, ${cachedLineCount} lines] `}
					<Text color={colors.secondary}>({getExpandKey()} to expand)</Text>
				</>
			);
		}

		return input;
	};

	const textColor = disabled || !input ? colors.secondary : colors.primary;

	return (
		<Box flexDirection="column" paddingY={1} width="100%" marginTop={1}>
			<Box
				flexDirection="column"
				borderStyle={isBashMode ? 'round' : undefined}
				borderColor={isBashMode ? colors.tool : undefined}
				paddingX={isBashMode ? 1 : 0}
				width={isBashMode ? boxWidth : undefined}
			>
				{!isBashMode && (
					<>
						<Text color={disabled ? colors.secondary : colors.primary} bold>
							{disabled
								? 'Please wait, AI is thinking...'
								: 'What would you like me to help with?'}
						</Text>
					</>
				)}

				{/* Input row */}
				{hasLargeContent && input.length > 150 && !showFullContent ? (
					<Text color={textColor}>
						{'>'} {renderDisplayContent()}
					</Text>
				) : (
					<Box>
						<Text color={textColor}>{'>'} </Text>
						{disabled ? (
							<Text color={colors.secondary}>...</Text>
						) : (
							<TextInput
								value={input}
								onChange={updateInput}
								onSubmit={handleSubmit}
								placeholder={placeholder}
								focus={isFocused}
							/>
						)}
					</Box>
				)}

				{isBashMode && (
					<Text color={colors.tool} dimColor>
						Bash Mode
					</Text>
				)}
				{showClearMessage && (
					<Text color={colors.secondary} dimColor>
						Press escape again to clear
					</Text>
				)}
				{showCompletions && completions.length > 0 && (
					<Box flexDirection="column" marginTop={1}>
						<Text color={colors.secondary}>Available commands:</Text>
						{completions.map((completion, index) => (
							<Text
								key={index}
								color={completion.isCustom ? colors.info : colors.primary}
							>
								/{completion.name}
							</Text>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
}
