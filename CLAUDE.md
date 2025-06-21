# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `npm run dev` - Start Electron development environment (also serves web version at http://localhost:1212)
- `npm run dev:web` - Start web-only development mode
- `npm run dev:debug` - Start development with debugging enabled

### Code Quality
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code using Biome
- `npm run check` - TypeScript type checking
- `npm run check:biome` - Full Biome check (format + lint)
- `npm run test` - Run Jest tests

### Building
- `npm run build` - Build main and renderer processes
- `npm run build:web` - Build web version only
- `npm run package` - Package app for current platform
- `npm run package:all` - Package for all platforms (Windows, Mac, Linux)

### Mobile Development
- `npm run mobile:sync` - Sync code to both iOS and Android
- `npm run mobile:ios` - Sync and open iOS project in Xcode
- `npm run mobile:android` - Sync and open Android project in Android Studio
- `npm run mobile:assets` - Generate mobile app icons and splash screens

## Architecture Overview

This is **Chatbox**, a cross-platform AI chat client built with Electron, React, and Capacitor for mobile support. The application supports multiple AI model providers and includes advanced features like RAG (Retrieval-Augmented Generation) knowledge bases and MCP (Model Context Protocol) servers.

### Key Architecture Components

**Electron Multi-Process Architecture:**
- `src/main/` - Main process (Node.js environment) handles system operations, file I/O, knowledge base, MCP servers
- `src/renderer/` - Renderer process (browser environment) contains the React UI
- `src/shared/` - Shared types and utilities between main and renderer processes

**Cross-Platform Support:**
- **Desktop**: Electron app (Windows, macOS, Linux)
- **Web**: Standalone web application 
- **Mobile**: Capacitor-wrapped apps (iOS, Android)

**State Management:**
- **Jotai** for atomic state management
- **TanStack Router** for routing
- **TanStack Query** for server state management

**UI Framework:**
- **React 18** with TypeScript
- **Mantine** component library
- **Tailwind CSS** for styling
- **Emotion** for CSS-in-JS

### Core Features Architecture

**Multi-Provider AI Models:**
Located in `src/shared/models/`, supports OpenAI, Claude, Gemini, ChatGLM, DeepSeek, Groq, Perplexity, Azure, Ollama, LM Studio, and custom providers. Each provider implements a standardized interface for chat and embedding models.

**Knowledge Base (RAG) System:**
- `src/main/knowledge-base/` - SQLite-based vector database using libsql
- Supports multiple file formats via different loaders (Mastra, officeparser, unstructured API)
- Uses Vercel AI SDK for embeddings
- Provides semantic search capabilities for chat enhancement

**MCP (Model Context Protocol) Integration:**
- `src/main/mcp/` - Handles MCP server communication
- `src/renderer/components/mcp/` - UI for MCP server management
- Supports both built-in and custom MCP servers

**Internationalization:**
- `src/renderer/i18n/` - i18next-based localization
- Default language is English, with comprehensive translation support
- Translation files auto-generated, do not edit manually

## Important Development Guidelines

### Code Style and Formatting
- **Biome** is used for all formatting and linting (configured in `biome.json`)
- Line width: 120 characters
- Use single quotes for JavaScript/TypeScript
- 2-space indentation
- Always run `npm run format` before committing

### File Organization Patterns
- Atomic components in `src/renderer/components/`
- Page components in `src/renderer/routes/`
- Jotai atoms in `src/renderer/stores/atoms/`
- Shared types in `src/shared/types.ts`
- Model implementations in `src/shared/models/`

### Platform-Specific Considerations
- Knowledge base features disabled on Windows ARM64 (libsql limitation)
- Conditional imports used for platform-specific features
- Build target determined by `CHATBOX_BUILD_PLATFORM` and `CHATBOX_BUILD_TARGET` environment variables

### Testing
- Jest configured for unit testing
- Test files located alongside source files with `.test.ts` extension
- Run tests with `npm run test`

### Release Process
- Versions managed in `package.json`
- Uses GitHub Actions for automated building and releases
- Create git tags (`git tag v1.0.0`) to trigger releases
- Electron-builder handles packaging with code signing and notarization

## Project-Specific Notes

- **Cursor Rules**: Located in `.cursorrules` - this project emphasizes internationalization and uses English as default UI language
- **RAG Documentation**: See `docs/rag.md` for detailed RAG system architecture
- **Webpack Configuration**: Complex multi-target build system in `.erb/configs/`
- **Native Dependencies**: Handled through electron-rebuild, must be installed in `release/app/` directory
- **Memory Management**: Large codebase requires careful attention to bundle size and performance