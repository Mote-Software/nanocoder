import React from 'react';
import {CustomCommandLoader} from '../custom-commands/loader.js';
import {CustomCommandExecutor} from '../custom-commands/executor.js';

export interface MessageSubmissionOptions {
	customCommandCache: Map<string, any>;
	customCommandLoader: CustomCommandLoader | null;
	customCommandExecutor: CustomCommandExecutor | null;
	onClearMessages: () => Promise<void>;
	onEnterModelSelectionMode: () => void;
	onEnterProviderSelectionMode: () => void;
	onEnterThemeSelectionMode: () => void;
	onHandleChatMessage: (message: string) => Promise<void>;
	onAddToChatQueue: (component: React.ReactNode) => void;
	componentKeyCounter: number;
	setMessages: (messages: any[]) => void;
	messages: any[];
	setIsBashExecuting: (executing: boolean) => void;
	setCurrentBashCommand: (command: string) => void;
	provider: string;
	model: string;
	getMessageTokens: (message: any) => number;
}

export interface ThinkingStats {
	totalTokens: number;
	totalCost: number;
	elapsedTime: number;
	isThinking: boolean;
}

export interface ConversationContext {
	currentTokenCount: number;
	maxTokens: number;
	tokenPercentage: number;
}

export interface UseAppInitializationProps {
	isInitialized: boolean;
	client: any | null;
	currentProvider: string;
	currentModel: string;
	availableModels: any[];
	preferences: any;
	hasUpdate: boolean;
	updateInfo: any;
	isLoading: boolean;
	initError: string | null;
}
