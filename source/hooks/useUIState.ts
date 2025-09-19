import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import {Completion} from '../types/index.js';

export type UIState = {
	showClearMessage: boolean;
	showFullContent: boolean;
	showCompletions: boolean;
	completions: Completion[];
	setShowClearMessage: React.Dispatch<React.SetStateAction<boolean>>;
	setShowFullContent: React.Dispatch<React.SetStateAction<boolean>>;
	setShowCompletions: React.Dispatch<React.SetStateAction<boolean>>;
	setCompletions: React.Dispatch<React.SetStateAction<Completion[]>>;
	resetUIState: () => void;
};

const UIStateContext = createContext<UIState | undefined>(undefined);

// Existing hook that builds the UI state (kept to separate creation from context)
export function useUIState(): UIState {
	const [showClearMessage, setShowClearMessage] = useState(false);
	const [showFullContent, setShowFullContent] = useState(false);
	const [showCompletions, setShowCompletions] = useState(false);
	const [completions, setCompletions] = useState<Completion[]>([]);

	const resetUIState = useCallback(() => {
		setShowClearMessage(false);
		setShowFullContent(false);
		setShowCompletions(false);
		setCompletions([]);
	}, []);

	return useMemo(
		() => ({
			showClearMessage,
			showFullContent,
			showCompletions,
			completions,
			setShowClearMessage,
			setShowFullContent,
			setShowCompletions,
			setCompletions,
			resetUIState,
		}),
		[
			showClearMessage,
			showFullContent,
			showCompletions,
			completions,
			resetUIState,
		],
	);
}

// Provider to expose a single shared UI state instance to the subtree
export function UIStateProvider({children}: {children: React.ReactNode}) {
	const state = useUIState();
	return React.createElement(UIStateContext.Provider, {value: state}, children);
}

// Hook to consume the shared UI state from context (preferred for consumers)
export function useUIStateContext(): UIState {
	const ctx = useContext(UIStateContext);
	if (!ctx) {
		throw new Error('useUIStateContext must be used within a UIStateProvider');
	}
	return ctx;
}
