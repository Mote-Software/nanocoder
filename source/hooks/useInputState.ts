import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

export function useInputState() {
	const [input, setInput] = useState('');
	const [hasLargeContent, setHasLargeContent] = useState(false);
	const [originalInput, setOriginalInput] = useState('');
	const [historyIndex, setHistoryIndex] = useState(-1);
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const [cachedLineCount, setCachedLineCount] = useState(1);

	// Cache the line count
	const updateInput = useCallback((newInput: string) => {
		setInput(newInput);

		// Compute and set line count immediately so UI doesn't show stale values
		const immediateLineCount = Math.max(1, newInput.split(/\r\n|\r|\n/).length);
		setCachedLineCount(immediateLineCount);

		// Clear any previous debounce timer before setting a new one
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			setHasLargeContent(newInput.length > 150);
		}, 50);
	}, []);

	const resetInput = useCallback(() => {
		// Clear any pending debounce timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = null;
		}
		setInput('');
		setHasLargeContent(false);
		setOriginalInput('');
		setHistoryIndex(-1);
		setCachedLineCount(1);
	}, []);

	// Cleanup on unmount to avoid leaked timers
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
				debounceTimerRef.current = null;
			}
		};
	}, []);

	return useMemo(
		() => ({
			input,
			hasLargeContent,
			originalInput,
			historyIndex,
			setInput,
			setHasLargeContent,
			setOriginalInput,
			setHistoryIndex,
			updateInput,
			resetInput,
			cachedLineCount,
		}),
		[
			input,
			hasLargeContent,
			originalInput,
			historyIndex,
			updateInput,
			resetInput,
			cachedLineCount,
		],
	);
}
