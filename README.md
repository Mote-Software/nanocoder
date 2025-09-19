# Nanocoder

A local-first CLI coding agent that brings the power of agentic coding tools like Claude Code and Gemini CLI to local models or controlled APIs like OpenRouter. Built with privacy and control in mind, Nanocoder supports multiple AI providers with tool support for file operations and command execution.

![Example](./.github/assets/example.gif)

## Table of Contents

- [FAQs](#faqs)
- [Installation](#installation)
  - [For Users (Recommended)](#for-users-recommended)
  - [For Development](#for-development)
- [Configuration](#configuration)
  - [AI Provider Setup](#ai-provider-setup)
  - [MCP (Model Context Protocol) Servers](#mcp-model-context-protocol-servers)
  - [User Preferences](#user-preferences)
  - [Commands](#commands)
    - [Built-in Commands](#built-in-commands)
    - [Custom Commands](#custom-commands)
- [Features](#features)
  - [Multi-Provider Support](#-multi-provider-support)
  - [Advanced Tool System](#️-advanced-tool-system)
  - [Custom Command System](#-custom-command-system)
  - [Enhanced User Experience](#-enhanced-user-experience)
  - [Developer Features](#️-developer-features)
- [Community](#community)

## FAQs

### What is Nanocoder?

Nanocoder is a local-first CLI coding agent that brings the power of agentic coding tools like Claude Code and Gemini CLI to local models or controlled APIs like OpenRouter. Built with privacy and control in mind, Nanocoder supports any AI provider that has an OpenAI compatible end-point, tool and non-tool calling models.

### How is this different to OpenCode?

This comes down to philosophy. OpenCode is a great tool, but it's owned and managed by a venture-backed company that restricts community and open-source involvement to the outskirts. With Nanocoder, the focus is on building a true community-led project where anyone can contribute openly and directly. We believe AI is too powerful to be in the hands of big corporations and everyone should have access to it.

We also strongly believe in the "local-first" approach, where your data, models, and processing stay on your machine whenever possible to ensure maximum privacy and user control. Beyond that, we're actively pushing to develop advancements and frameworks for small, local models to be effective at coding locally.

Not everyone will agree with this philosophy, and that's okay. We believe in fostering an inclusive community that's focused on open collaboration and privacy-first AI coding tools.

### I want to be involved, how do I start?

Firstly, we would love for you to be involved. You can get started contributing to Nanocoder in several ways, check out the [Community](#community) section of this README.

## Installation

### For Users (Recommended)

Install globally and use anywhere:

```bash
npm install -g @motesoftware/nanocoder
```

Then run in any directory:

```bash
nanocoder
```

### For Development

If you want to contribute or modify Nanocoder:

**Prerequisites:**

- Node.js 18+
- npm

**Setup:**

1. Clone and install dependencies:

```bash
git clone [repo-url]
cd nanocoder
npm install
```

2. Build the project:

```bash
npm run build
```

3. Run locally:

```bash
npm run start
```

Or build and run in one command:

```bash
npm run dev
```

## Configuration

### AI Provider Setup

Nanocoder supports any OpenAI-compatible API through a unified provider configuration. Create `agents.config.json` in your **working directory** (where you run `nanocoder`):

```json
{
	"nanocoder": {
		"providers": [
			{
				"name": "llama-cpp",
				"baseUrl": "http://localhost:8080/v1",
				"models": ["qwen3-coder:a3b", "deepseek-v3.1"]
			},
			{
				"name": "Ollama",
				"baseUrl": "http://localhost:11434/v1",
				"models": ["qwen2.5-coder:14b", "llama3.2"]
			},
			{
				"name": "OpenRouter",
				"baseUrl": "https://openrouter.ai/api/v1",
				"apiKey": "your-openrouter-api-key",
				"models": ["openai/gpt-4o-mini", "anthropic/claude-3-haiku"]
			},
			{
				"name": "LM Studio",
				"baseUrl": "http://localhost:1234/v1",
				"models": ["local-model"]
			}
		]
	}
}
```

**Common Provider Examples:**

- **llama.cpp server**: `"baseUrl": "http://localhost:8080/v1"`
- **llama-swap**: `"baseUrl": "http://localhost:9292/v1"`
- **Ollama (Local)**:

  - First run: `ollama pull qwen2.5-coder:14b`
  - Use: `"baseUrl": "http://localhost:11434/v1"`

- **OpenRouter (Cloud)**:

  - Use: `"baseUrl": "https://openrouter.ai/api/v1"`
  - Requires: `"apiKey": "your-api-key"`

- **LM Studio**: `"baseUrl": "http://localhost:1234/v1"`
- **vLLM**: `"baseUrl": "http://localhost:8000/v1"`
- **LocalAI**: `"baseUrl": "http://localhost:8080/v1"`
- **OpenAI**: `"baseUrl": "https://api.openai.com/v1"`

**Provider Configuration:**

- `name`: Display name used in `/provider` command
- `baseUrl`: OpenAI-compatible API endpoint
- `apiKey`: API key (optional for local servers)
- `models`: Available model list for `/model` command

### MCP (Model Context Protocol) Servers

Nanocoder supports connecting to MCP servers to extend its capabilities with additional tools. Configure MCP servers in your `agents.config.json`:

```json
{
	"nanocoder": {
		"mcpServers": [
			{
				"name": "filesystem",
				"command": "npx",
				"args": [
					"@modelcontextprotocol/server-filesystem",
					"/path/to/allowed/directory"
				]
			},
			{
				"name": "github",
				"command": "npx",
				"args": ["@modelcontextprotocol/server-github"],
				"env": {
					"GITHUB_TOKEN": "your-github-token"
				}
			},
			{
				"name": "custom-server",
				"command": "python",
				"args": ["path/to/server.py"],
				"env": {
					"API_KEY": "your-api-key"
				}
			}
		]
	}
}
```

When MCP servers are configured, Nanocoder will:

- Automatically connect to all configured servers on startup
- Make all server tools available to the AI model
- Show connected servers and their tools with the `/mcp` command

Popular MCP servers:

- **Filesystem**: Enhanced file operations
- **GitHub**: Repository management
- **Brave Search**: Web search capabilities
- **Memory**: Persistent context storage
- [View more MCP servers](https://github.com/modelcontextprotocol/servers)

> **Note**: The `agents.config.json` file should be placed in the directory where you run Nanocoder, allowing for project-by-project configuration with different models or API keys per repository.

### User Preferences

Nanocoder automatically saves your preferences to remember your choices across sessions. Preferences are stored in `~/.nanocoder-preferences.json` in your home directory.

**What gets saved automatically:**

- **Last provider used**: The AI provider you last selected (by name from your configuration)
- **Last model per provider**: Your preferred model for each provider
- **Session continuity**: Automatically switches back to your preferred provider/model when restarting

**How it works:**

- When you switch providers with `/provider`, your choice is saved
- When you switch models with `/model`, the selection is saved for that specific provider
- Next time you start Nanocoder, it will use your last provider and model
- Each provider remembers its own preferred model independently

**Manual management:**

- View current preferences: The file is human-readable JSON
- Reset preferences: Delete `~/.nanocoder-preferences.json` to start fresh
- No manual editing needed: Use the `/provider` and `/model` commands instead

### Commands

#### Built-in Commands

- `/help` - Show available commands
- `/init` - Initialize project with intelligent analysis, create AGENTS.md and configuration files
- `/clear` - Clear chat history
- `/model` - Switch between available models
- `/provider` - Switch between configured AI providers
- `/mcp` - Show connected MCP servers and their tools
- `/debug` - Toggle logging levels (silent/normal/verbose)
- `/custom-commands` - List all custom commands
- `/exit` - Exit the application
- `/export` - Export current session to markdown file
- `!command` - Execute bash commands directly without leaving Nanocoder (output becomes context for the LLM)

#### Custom Commands

Nanocoder supports custom commands defined as markdown files in the `.nanocoder/commands` directory. Like `agents.config.json`, this directory is created per codebase, allowing you to create reusable prompts with parameters and organize them by category specific to each project.

**Example custom command** (`.nanocoder/commands/test.md`):

```markdown
---
description: 'Generate comprehensive unit tests for the specified component'
aliases: ['testing', 'spec']
parameters:
  - name: 'component'
    description: 'The component or function to test'
    required: true
---

Generate comprehensive unit tests for {{component}}. Include:

- Happy path scenarios
- Edge cases and error handling
- Mock dependencies where appropriate
- Clear test descriptions
```

**Usage**: `/test component="UserService"`

**Features**:

- YAML frontmatter for metadata (description, aliases, parameters)
- Template variable substitution with `{{parameter}}` syntax
- Namespace support through directories (e.g., `/refactor:dry`)
- Autocomplete integration for command discovery
- Parameter validation and prompting

**Pre-installed Commands**:

- `/test` - Generate comprehensive unit tests for components
- `/review` - Perform thorough code reviews with suggestions
- `/refactor:dry` - Apply DRY (Don't Repeat Yourself) principle
- `/refactor:solid` - Apply SOLID design principles

## Features

### 🔌 Multi-Provider Support

- **Universal OpenAI compatibility**: Works with any OpenAI-compatible API
- **Local providers**: Ollama, LM Studio, vLLM, LocalAI, llama.cpp
- **Cloud providers**: OpenRouter, OpenAI, and other hosted services
- **Smart fallback**: Automatically switches to available providers if one fails
- **Per-provider preferences**: Remembers your preferred model for each provider
- **Dynamic configuration**: Add any provider with just a name and endpoint

### 🛠️ Advanced Tool System

- **Built-in tools**: File operations, bash command execution
- **MCP (Model Context Protocol) servers**: Extend capabilities with any MCP-compatible tool
- **Dynamic tool loading**: Tools are loaded on-demand from configured MCP servers
- **Tool approval**: Optional confirmation before executing potentially destructive operations

### 📝 Custom Command System

- **Markdown-based commands**: Define reusable prompts in `.nanocoder/commands/`
- **Template variables**: Use `{{parameter}}` syntax for dynamic content
- **Namespace organization**: Organize commands in folders (e.g., `refactor/dry.md`)
- **Autocomplete support**: Tab completion for command discovery
- **Rich metadata**: YAML frontmatter for descriptions, aliases, and parameters

### 🎯 Enhanced User Experience

- **Smart autocomplete**: Tab completion for commands with real-time suggestions
- **Prompt history**: Access and reuse previous prompts with `/history`
- **Configurable logging**: Silent, normal, or verbose output levels
- **Colorized output**: Syntax highlighting and structured display
- **Session persistence**: Maintains context and preferences across sessions
- **Real-time indicators**: Shows token usage, timing, and processing status
- **First-time directory security disclaimer**: Prompts on first run and stores a per-project trust decision to prevent accidental exposure of local code or secrets.

### ⚙️ Developer Features

- **TypeScript-first**: Full type safety and IntelliSense support
- **Extensible architecture**: Plugin-style system for adding new capabilities
- **Project-specific config**: Different settings per project via `agents.config.json`
- **Debug tools**: Built-in debugging commands and verbose logging
- **Error resilience**: Graceful handling of provider failures and network issues

## Community

We're a small community-led team building Nanocoder and would love your help! Whether you're interested in contributing code, documentation, or just being part of our community, there are several ways to get involved.

**If you want to contribute to the code:**

- Read our detailed [CONTRIBUTING.md](CONTRIBUTING.md) guide for information on development setup, coding standards, and how to submit your changes.

**If you want to be part of our community or help with other aspects like design or marketing:**

- Join our Discord server to connect with other users, ask questions, share ideas, and get help: [Join our Discord server](https://discord.gg/ktPDV6rekE)

- Head to our GitHub issues or discussions to open and join current conversations with others in the community.

**What does Nanocoder you need help with?**

Nanocoder could benefit from help all across the board. Such as:

- Adding support for new AI providers
- Improving tool functionality
- Enhancing the user experience
- Writing documentation
- Reporting bugs or suggesting features
- Marketing and getting the word out
- Design and building more great software

All contributions and community participation are welcome!
