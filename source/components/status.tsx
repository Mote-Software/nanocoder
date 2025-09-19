import {Text} from 'ink';
import {memo, useEffect, useState} from 'react';
import {existsSync} from 'fs';

import {useTheme} from '../hooks/useTheme.js';
import {TitledBox, titleStyles} from '@mishieck/ink-titled-box';
import {useTerminalWidth} from '../hooks/useTerminalWidth.js';
import {checkForUpdates} from '../utils/update-checker.js';
import {themes} from '../config/themes.js';

// Get CWD once at module load time
const cwd = process.cwd();

interface UpdateInfo {
	hasUpdate: boolean;
	currentVersion: string;
	latestVersion?: string;
	updateCommand?: string;
}

export default memo(function Status({
	provider,
	model,
}: {
	provider: string;
	model: string;
}) {
	const boxWidth = useTerminalWidth();
	const {colors, currentTheme} = useTheme();
	const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
	const [agentsMdLoaded, setAgentsMdLoaded] = useState(false);

	useEffect(() => {
		const performUpdateCheck = async () => {
			try {
				const info = await checkForUpdates();
				setUpdateInfo(info);
			} catch (error) {
				// Silent failure - don't show errors for update checks
				setUpdateInfo(null);
			}
		};

		performUpdateCheck();
	}, []);
	useEffect(() => {
		setAgentsMdLoaded(existsSync(`${cwd}/AGENTS.md`));
	}, []);

	return (
		<TitledBox
			key={colors.primary}
			borderStyle="round"
			titles={['Status']}
			titleStyles={titleStyles.pill}
			width={boxWidth}
			borderColor={colors.info}
			paddingX={2}
			paddingY={1}
			flexDirection="column"
			marginBottom={1}
		>
			<Text color={colors.info}>
				<Text bold={true}>CWD: </Text>
				{cwd}
			</Text>
			<Text color={colors.success}>
				<Text bold={true}>Provider: </Text>
				{provider}, <Text bold={true}>Model: </Text>
				{model}
			</Text>
			<Text color={colors.primary}>
				<Text bold={true}>Theme: </Text>
				{themes[currentTheme].displayName}
			</Text>
			{agentsMdLoaded ? (
				<Text color={colors.secondary} italic>
					<Text>↳ Using AGENTS.md. Project initialized</Text>
				</Text>
			) : (
				<Text color={colors.secondary} italic>
					↳ No AGENTS.md file found, run `/init` to initialize this directory
				</Text>
			)}
			{updateInfo?.hasUpdate && (
				<>
					<Text color={colors.warning}>
						<Text bold={true}>Update Available: </Text>v
						{updateInfo.currentVersion} → v{updateInfo.latestVersion}
					</Text>
					{updateInfo.updateCommand && (
						<Text color={colors.secondary}>
							↳ Run: /update or {updateInfo.updateCommand}
						</Text>
					)}
				</>
			)}
		</TitledBox>
	);
});
