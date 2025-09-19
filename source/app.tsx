import {Box, Text, useApp} from 'ink';
import WelcomeMessage from './components/welcome-message.js';
import React from 'react';
import {getThemeColors} from './config/themes.js';
import {ThemeContext} from './hooks/useTheme.js';
import UserInput from './components/user-input.js';
import Status from './components/status.js';
import ChatQueue from './components/chat-queue.js';
import ModelSelector from './components/model-selector.js';
import ProviderSelector from './components/provider-selector.js';
import ThemeSelector from './components/theme-selector.js';
import ThinkingIndicator from './components/thinking-indicator.js';
import CancellingIndicator from './components/cancelling-indicator.js';
import ToolConfirmation from './components/tool-confirmation.js';
import ToolExecutionIndicator from './components/tool-execution-indicator.js';
import BashExecutionIndicator from './components/bash-execution-indicator.js';
import {setGlobalMessageQueue} from './utils/message-queue.js';
import Spinner from 'ink-spinner';
import SecurityDisclaimer from './components/security-disclaimer.js';

// Import extracted hooks and utilities
import {useAppState} from './app/hooks/useAppState.js';
import {useChatHandler} from './app/hooks/useChatHandler.js';
import {useToolHandler} from './app/hooks/useToolHandler.js';
import {useModeHandlers} from './app/hooks/useModeHandlers.js';
import {useAppInitialization} from './app/hooks/useAppInitialization.js';
import {useDirectoryTrust} from './app/hooks/useDirectoryTrust.js';
import {
	createClearMessagesHandler,
	handleMessageSubmission,
} from './app/utils/appUtils.js';

// Provide shared UI state to components
import {UIStateProvider} from './hooks/useUIState.js';

export default function App() {
	// Use extracted hooks
	const appState = useAppState();
	const {exit} = useApp();
	const {isTrusted, handleConfirmTrust, isTrustLoading, isTrustedError} =
		useDirectoryTrust();

	const handleExit = () => {
		exit();
	};

	// Create theme context value
	const themeContextValue = {
		currentTheme: appState.currentTheme,
		colors: getThemeColors(appState.currentTheme),
		setCurrentTheme: appState.setCurrentTheme,
	};

	// Initialize global message queue on component mount
	React.useEffect(() => {
		setGlobalMessageQueue(appState.addToChatQueue);
	}, []);

	// Setup chat handler
	const chatHandler = useChatHandler({
		client: appState.client,
		toolManager: appState.toolManager,
		messages: appState.messages,
		setMessages: appState.updateMessages,
		getMessageTokens: appState.getMessageTokens,
		currentModel: appState.currentModel,
		setIsThinking: appState.setIsThinking,
		setIsCancelling: appState.setIsCancelling,
		setThinkingStats: appState.setThinkingStats,
		addToChatQueue: appState.addToChatQueue,
		componentKeyCounter: appState.componentKeyCounter,
		abortController: appState.abortController,
		setAbortController: appState.setAbortController,
		onStartToolConfirmationFlow: (
			toolCalls,
			updatedMessages,
			assistantMsg,
			systemMessage,
		) => {
			appState.setPendingToolCalls(toolCalls);
			appState.setCurrentToolIndex(0);
			appState.setCompletedToolResults([]);
			appState.setCurrentConversationContext({
				updatedMessages,
				assistantMsg,
				systemMessage,
			});
			appState.setIsToolConfirmationMode(true);
		},
	});

	// Setup tool handler
	const toolHandler = useToolHandler({
		pendingToolCalls: appState.pendingToolCalls,
		currentToolIndex: appState.currentToolIndex,
		completedToolResults: appState.completedToolResults,
		currentConversationContext: appState.currentConversationContext,
		setPendingToolCalls: appState.setPendingToolCalls,
		setCurrentToolIndex: appState.setCurrentToolIndex,
		setCompletedToolResults: appState.setCompletedToolResults,
		setCurrentConversationContext: appState.setCurrentConversationContext,
		setIsToolConfirmationMode: appState.setIsToolConfirmationMode,
		setIsToolExecuting: appState.setIsToolExecuting,
		setMessages: appState.updateMessages,
		addToChatQueue: appState.addToChatQueue,
		componentKeyCounter: appState.componentKeyCounter,
		resetToolConfirmationState: appState.resetToolConfirmationState,
		onProcessAssistantResponse: chatHandler.processAssistantResponse,
	});

	// Setup mode handlers
	const modeHandlers = useModeHandlers({
		client: appState.client,
		currentModel: appState.currentModel,
		currentProvider: appState.currentProvider,
		setClient: appState.setClient,
		setCurrentModel: appState.setCurrentModel,
		setCurrentProvider: appState.setCurrentProvider,
		setCurrentTheme: appState.setCurrentTheme,
		setMessages: appState.updateMessages,
		setIsModelSelectionMode: appState.setIsModelSelectionMode,
		setIsProviderSelectionMode: appState.setIsProviderSelectionMode,
		setIsThemeSelectionMode: appState.setIsThemeSelectionMode,
		addToChatQueue: appState.addToChatQueue,
		componentKeyCounter: appState.componentKeyCounter,
	});

	// Setup initialization
	useAppInitialization({
		setClient: appState.setClient,
		setCurrentModel: appState.setCurrentModel,
		setCurrentProvider: appState.setCurrentProvider,
		setToolManager: appState.setToolManager,
		setCustomCommandLoader: appState.setCustomCommandLoader,
		setCustomCommandExecutor: appState.setCustomCommandExecutor,
		setCustomCommandCache: appState.setCustomCommandCache,
		setStartChat: appState.setStartChat,
		setMcpInitialized: appState.setMcpInitialized,
		addToChatQueue: appState.addToChatQueue,
		componentKeyCounter: appState.componentKeyCounter,
		customCommandCache: appState.customCommandCache,
	});

	// Memoize handlers to prevent unnecessary re-renders
	const clearMessages = React.useMemo(
		() => createClearMessagesHandler(appState.updateMessages, appState.client),
		[appState.updateMessages, appState.client],
	);

	const handleCancel = React.useCallback(() => {
		if (appState.abortController) {
			appState.setIsCancelling(true);
			appState.abortController.abort();
		}
	}, [appState.abortController, appState.setIsCancelling]);

	const handleMessageSubmit = React.useCallback(
		async (message: string) => {
			await handleMessageSubmission(message, {
				customCommandCache: appState.customCommandCache,
				customCommandLoader: appState.customCommandLoader,
				customCommandExecutor: appState.customCommandExecutor,
				onClearMessages: clearMessages,
				onEnterModelSelectionMode: modeHandlers.enterModelSelectionMode,
				onEnterProviderSelectionMode: modeHandlers.enterProviderSelectionMode,
				onEnterThemeSelectionMode: modeHandlers.enterThemeSelectionMode,
				onHandleChatMessage: chatHandler.handleChatMessage,
				onAddToChatQueue: appState.addToChatQueue,
				componentKeyCounter: appState.componentKeyCounter,
				setMessages: appState.updateMessages,
				messages: appState.messages,
				setIsBashExecuting: appState.setIsBashExecuting,
				setCurrentBashCommand: appState.setCurrentBashCommand,
			});
		},
		[
			appState.customCommandCache,
			appState.customCommandLoader,
			appState.customCommandExecutor,
			clearMessages,
			modeHandlers.enterModelSelectionMode,
			modeHandlers.enterProviderSelectionMode,
			chatHandler.handleChatMessage,
			appState.addToChatQueue,
			appState.componentKeyCounter,
			appState.updateMessages,
			appState.messages,
			appState.setIsBashExecuting,
			appState.setCurrentBashCommand,
		],
	);

	// Memoize static components to prevent unnecessary re-renders
	const staticComponents = React.useMemo(
		() => [
			<Status
				key="status"
				provider={appState.currentProvider}
				model={appState.currentModel}
			/>,
		],
		[appState.currentProvider, appState.currentModel],
	);

	// Handle loading state for directory trust check
	if (isTrustLoading) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color={themeContextValue.colors.secondary}>
					<Spinner type="dots2" /> Checking directory trust...
				</Text>
			</Box>
		);
	}

	// Handle error state for directory trust
	if (isTrustedError) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color={themeContextValue.colors.error}>
					⚠️ Error checking directory trust: {isTrustedError}
				</Text>
				<Text color={themeContextValue.colors.secondary}>
					Please restart the application or check your permissions.
				</Text>
			</Box>
		);
	}

	// Show security disclaimer if directory is not trusted
	if (!isTrusted) {
		return (
			<SecurityDisclaimer onConfirm={handleConfirmTrust} onExit={handleExit} />
		);
	}

	return (
		<ThemeContext.Provider value={themeContextValue}>
			<UIStateProvider>
				<Box flexDirection="column" padding={1} width="100%">
					<Box flexGrow={1} flexDirection="column" minHeight={0}>
						<WelcomeMessage />
						{appState.startChat && (
							<ChatQueue
								staticComponents={staticComponents}
								queuedComponents={appState.chatComponents}
							/>
						)}
					</Box>
					{appState.startChat && (
						<Box flexDirection="column">
							{appState.isCancelling ? (
								<CancellingIndicator />
							) : appState.isThinking ? (
								<ThinkingIndicator
									contextSize={appState.thinkingStats.contextSize}
									totalTokensUsed={appState.thinkingStats.totalTokensUsed}
									tokensPerSecond={appState.thinkingStats.tokensPerSecond}
								/>
							) : null}
							{appState.isModelSelectionMode ? (
								<ModelSelector
									client={appState.client}
									currentModel={appState.currentModel}
									onModelSelect={modeHandlers.handleModelSelect}
									onCancel={modeHandlers.handleModelSelectionCancel}
								/>
							) : appState.isProviderSelectionMode ? (
								<ProviderSelector
									currentProvider={appState.currentProvider}
									onProviderSelect={modeHandlers.handleProviderSelect}
									onCancel={modeHandlers.handleProviderSelectionCancel}
								/>
							) : appState.isThemeSelectionMode ? (
								<ThemeSelector
									onThemeSelect={modeHandlers.handleThemeSelect}
									onCancel={modeHandlers.handleThemeSelectionCancel}
								/>
							) : appState.isToolConfirmationMode &&
							  appState.pendingToolCalls[appState.currentToolIndex] ? (
								<ToolConfirmation
									toolCall={
										appState.pendingToolCalls[appState.currentToolIndex]
									}
									onConfirm={toolHandler.handleToolConfirmation}
									onCancel={toolHandler.handleToolConfirmationCancel}
								/>
							) : appState.isToolExecuting &&
							  appState.pendingToolCalls[appState.currentToolIndex] ? (
								<ToolExecutionIndicator
									toolName={
										appState.pendingToolCalls[appState.currentToolIndex]
											.function.name
									}
									currentIndex={appState.currentToolIndex}
									totalTools={appState.pendingToolCalls.length}
								/>
							) : appState.isBashExecuting ? (
								<BashExecutionIndicator command={appState.currentBashCommand} />
							) : appState.mcpInitialized && appState.client ? (
								<UserInput
									customCommands={Array.from(
										appState.customCommandCache.keys(),
									)}
									onSubmit={handleMessageSubmit}
									disabled={
										appState.isThinking ||
										appState.isToolExecuting ||
										appState.isBashExecuting
									}
									onCancel={handleCancel}
								/>
							) : appState.mcpInitialized && !appState.client ? (
								<Text color={themeContextValue.colors.secondary}>
									⚠️ No LLM provider available. Chat is disabled. Please fix
									your provider configuration and restart.
								</Text>
							) : (
								<Text color={themeContextValue.colors.secondary}>
									<Spinner type="dots2" /> Loading...
								</Text>
							)}
						</Box>
					)}
				</Box>
			</UIStateProvider>
		</ThemeContext.Provider>
	);
}
