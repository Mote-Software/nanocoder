import type {Command} from '../types/index.js';
import {ToolManager} from '../tools/tool-manager.js';
import {getToolManager} from '../message-handler.js';
import React from 'react';
import {TitledBox, titleStyles} from '@mishieck/ink-titled-box';
import {Box, Text} from 'ink';
import {useTerminalWidth} from '../hooks/useTerminalWidth.js';
import {useTheme} from '../hooks/useTheme.js';

interface MCPProps {
	toolManager: ToolManager | null;
}

export function MCP({toolManager}: MCPProps) {
	const boxWidth = useTerminalWidth();
	const {colors} = useTheme();
	const connectedServers = toolManager?.getConnectedServers() || [];

	return (
		<TitledBox
			key={colors.primary}
			borderStyle="round"
			titles={['/mcp']}
			titleStyles={titleStyles.pill}
			width={boxWidth}
			borderColor={colors.primary}
			paddingX={2}
			paddingY={1}
			flexDirection="column"
			marginBottom={1}
		>
			{connectedServers.length === 0 ? (
				<>
					<Box marginBottom={1}>
						<Text color={colors.white} bold>
							No MCP servers connected
						</Text>
					</Box>

					<Text color={colors.white}>
						To connect MCP servers, add them to your{' '}
						<Text color={colors.primary}>agents.config.json</Text> file:
					</Text>

					<Box marginTop={1} marginBottom={1}>
						<Text color={colors.secondary}>
							{`{
  "nanocoder": {
    "mcpServers": [
      {
        "name": "example-server",
        "command": "node",
        "args": ["path/to/server.js"],
        "env": {
          "API_KEY": "your-key"
        }
      }
    ]
  }
}`}
						</Text>
					</Box>
				</>
			) : (
				<>
					<Box marginBottom={1}>
						<Text color={colors.primary}>
							Connected MCP Servers ({connectedServers.length}):
						</Text>
					</Box>

					{connectedServers.map((serverName, index) => {
						const serverTools = toolManager?.getServerTools(serverName) || [];
						return (
							<Box key={index} marginBottom={1}>
								<Box flexDirection="column">
									<Text color={colors.white}>
										• <Text color={colors.primary}>{serverName}</Text>:{' '}
										{serverTools.length} tool
										{serverTools.length !== 1 ? 's' : ''}
									</Text>
									{serverTools.length > 0 && (
										<Text color={colors.secondary}>
											Tools: {serverTools.map((t: any) => t.name).join(', ')}
										</Text>
									)}
								</Box>
							</Box>
						);
					})}
				</>
			)}
		</TitledBox>
	);
}

export const mcpCommand: Command = {
	name: 'mcp',
	description: 'Show connected MCP servers and their tools',
	handler: async (_args: string[], _messages, _metadata) => {
		const toolManager = getToolManager();

		return React.createElement(MCP, {
			key: `mcp-${Date.now()}`,
			toolManager: toolManager,
		});
	},
};
