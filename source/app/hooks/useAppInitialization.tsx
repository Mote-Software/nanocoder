import React, {useEffect} from 'react';
import {LLMClient, ProviderType} from '../../types/core.js';
import {ToolManager} from '../../tools/tool-manager.js';
import {CustomCommandLoader} from '../../custom-commands/loader.js';
import {CustomCommandExecutor} from '../../custom-commands/executor.js';
import {createLLMClient} from '../../client-factory.js';
import {
	getLastUsedModel,
	loadPreferences,
	updateLastUsed,
} from '../../config/preferences.js';
import type {MCPInitResult, UserPreferences} from '../../types/index.js';
import {
	setToolManagerGetter,
	setToolRegistryGetter,
} from '../../message-handler.js';
import {commandRegistry} from '../../commands.js';
import {shouldLog} from '../../config/logging.js';
import {appConfig} from '../../config/index.js';
import {
	clearCommand,
	commandsCommand,
	debugCommand,
	exitCommand,
	exportCommand,
	helpCommand,
	initCommand,
	mcpCommand,
	modelCommand,
	providerCommand,
	themeCommand,
} from '../../commands/index.js';
import SuccessMessage from '../../components/success-message.js';
import ErrorMessage from '../../components/error-message.js';
import InfoMessage from '../../components/info-message.js';

interface UseAppInitializationProps {
	setClient: (client: LLMClient | null) => void;
	setCurrentModel: (model: string) => void;
	setCurrentProvider: (provider: ProviderType) => void;
	setToolManager: (manager: ToolManager | null) => void;
	setCustomCommandLoader: (loader: CustomCommandLoader | null) => void;
	setCustomCommandExecutor: (executor: CustomCommandExecutor | null) => void;
	setCustomCommandCache: (cache: Map<string, any>) => void;
	setStartChat: (start: boolean) => void;
	setMcpInitialized: (initialized: boolean) => void;
	addToChatQueue: (component: React.ReactNode) => void;
	componentKeyCounter: number;
	customCommandCache: Map<string, any>;
}

export function useAppInitialization({
	setClient,
	setCurrentModel,
	setCurrentProvider,
	setToolManager,
	setCustomCommandLoader,
	setCustomCommandExecutor,
	setCustomCommandCache,
	setStartChat,
	setMcpInitialized,
	addToChatQueue,
	componentKeyCounter,
	customCommandCache,
}: UseAppInitializationProps) {
	// Initialize LLM client and model
	const initializeClient = async (preferredProvider?: ProviderType) => {
		const {client, actualProvider} = await createLLMClient(preferredProvider);
		setClient(client);
		setCurrentProvider(actualProvider);

		// Try to use the last used model for this provider
		const lastUsedModel = getLastUsedModel(actualProvider);

		let finalModel: string;
		if (lastUsedModel) {
			const availableModels = await client.getAvailableModels();
			if (availableModels.includes(lastUsedModel)) {
				client.setModel(lastUsedModel);
				finalModel = lastUsedModel;
			} else {
				finalModel = client.getCurrentModel();
			}
		} else {
			finalModel = client.getCurrentModel();
		}

		setCurrentModel(finalModel);

		// Save the preference - use actualProvider and the model that was actually set
		updateLastUsed(actualProvider, finalModel);
	};

	// Load and cache custom commands
	const loadCustomCommands = async (loader: CustomCommandLoader) => {
		await loader.loadCommands();
		const customCommands = loader.getAllCommands() || [];

		// Populate command cache for better performance
		customCommandCache.clear();
		for (const command of customCommands) {
			customCommandCache.set(command.name, command);
			// Also cache aliases for quick lookup
			if (command.metadata?.aliases) {
				for (const alias of command.metadata.aliases) {
					customCommandCache.set(alias, command);
				}
			}
		}

		if (customCommands.length > 0 && shouldLog('info')) {
			addToChatQueue(
				<InfoMessage
					key={`custom-commands-loaded-${componentKeyCounter}`}
					message={`Loaded ${customCommands.length} custom commands from .nanocoder/commands`}
					hideBox={true}
				/>,
			);
		}
	};

	// Initialize MCP servers if configured
	const initializeMCPServers = async (toolManager: ToolManager) => {
		if (appConfig.mcpServers && appConfig.mcpServers.length > 0) {
			// Add connecting message to chat queue
			addToChatQueue(
				<InfoMessage
					key={`mcp-connecting-${componentKeyCounter}`}
					message={`Connecting to ${appConfig.mcpServers.length} MCP server${
						appConfig.mcpServers.length > 1 ? 's' : ''
					}...`}
					hideBox={true}
				/>,
			);

			// Define progress callback to show live updates
			const onProgress = (result: MCPInitResult) => {
				if (result.success) {
					addToChatQueue(
						<SuccessMessage
							key={`mcp-success-${result.serverName}-${componentKeyCounter}`}
							message={`Connected to MCP server "${result.serverName}" with ${result.toolCount} tools`}
							hideBox={true}
						/>,
					);
				} else {
					addToChatQueue(
						<ErrorMessage
							key={`mcp-error-${result.serverName}-${componentKeyCounter}`}
							message={`Failed to connect to MCP server "${result.serverName}": ${result.error}`}
							hideBox={true}
						/>,
					);
				}
			};

			try {
				await toolManager.initializeMCP(appConfig.mcpServers, onProgress);
			} catch (error) {
				addToChatQueue(
					<ErrorMessage
						key={`mcp-fatal-error-${componentKeyCounter}`}
						message={`Failed to initialize MCP servers: ${error}`}
						hideBox={true}
					/>,
				);
			}
			// Mark MCP as initialized whether successful or not
			setMcpInitialized(true);
		} else {
			// No MCP servers configured, mark as initialized immediately
			setMcpInitialized(true);
		}
	};

	const start = async (
		newToolManager: ToolManager,
		newCustomCommandLoader: CustomCommandLoader,
		preferences: UserPreferences,
	): Promise<void> => {
		try {
			await initializeClient(preferences.lastProvider);
		} catch (error) {
			// Don't crash the app - just show the error and continue without a client
			addToChatQueue(
				<ErrorMessage
					key={`init-error-${componentKeyCounter}`}
					message={`No providers available: ${error}`}
					hideBox={true}
				/>,
			);
			// Leave client as null - the UI will handle this gracefully
		}

		try {
			await loadCustomCommands(newCustomCommandLoader);
		} catch (error) {
			addToChatQueue(
				<ErrorMessage
					key={`commands-error-${componentKeyCounter}`}
					message={`Failed to load custom commands: ${error}`}
					hideBox={true}
				/>,
			);
		}
	};

	useEffect(() => {
		const initializeApp = async () => {
			setClient(null);
			setCurrentModel('');

			const newToolManager = new ToolManager();
			const newCustomCommandLoader = new CustomCommandLoader();
			const newCustomCommandExecutor = new CustomCommandExecutor();

			setToolManager(newToolManager);
			setCustomCommandLoader(newCustomCommandLoader);
			setCustomCommandExecutor(newCustomCommandExecutor);

			// Load preferences - we'll pass them directly to avoid state timing issues
			const preferences = loadPreferences();

			// Add info message to chat queue when preferences are loaded
			addToChatQueue(
				<SuccessMessage
					key="preferences-loaded"
					message="User preferences loaded..."
					hideBox={true}
				/>,
			);

			// Set up the tool registry getter for the message handler
			setToolRegistryGetter(() => newToolManager.getToolRegistry());

			// Set up the tool manager getter for commands that need it
			setToolManagerGetter(() => newToolManager);

			commandRegistry.register([
				helpCommand,
				exitCommand,
				clearCommand,
				modelCommand,
				providerCommand,
				commandsCommand,
				debugCommand,
				mcpCommand,
				initCommand,
				themeCommand,
				exportCommand,
			]);

			// Now start with the properly initialized objects (excluding MCP)
			await start(newToolManager, newCustomCommandLoader, preferences);
			setStartChat(true);

			// Initialize MCP servers after UI is shown
			await initializeMCPServers(newToolManager);
		};

		initializeApp();
	}, []);

	return {
		initializeClient,
		loadCustomCommands,
		initializeMCPServers,
	};
}
