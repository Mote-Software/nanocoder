import {Message} from './core.js';

export interface Command<T = React.ReactElement> {
  name: string;
  description: string;
  handler: (args: string[], messages: Message[], metadata: {provider: string, model: string, tokens: number}) => Promise<T>;
}

export interface ParsedCommand {
  isCommand: boolean;
  command?: string;
  args?: string[];
  fullCommand?: string;
  // Bash command properties
  isBashCommand?: boolean;
  bashCommand?: string;
}

export interface CustomCommandMetadata {
  description?: string;
  aliases?: string[];
  parameters?: string[];
}

export interface CustomCommand {
  name: string;
  path: string;
  namespace?: string;
  fullName: string; // e.g., "refactor:dry" or just "test"
  metadata: CustomCommandMetadata;
  content: string; // The markdown content without frontmatter
}

export interface ParsedCustomCommand {
  metadata: CustomCommandMetadata;
  content: string;
}