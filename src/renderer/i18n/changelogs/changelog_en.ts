const changelog = `
### v1.2.5

1. Added new model series for version 0125 (gpt-3.5-turbo-0125, gpt-4-0125-preview, gpt-4-turbo-preview).
2. Optimized mobile adaptation for some dialogs.

### v1.2.4

1. You can now use the ⬆️⬇️ arrow keys in the input field to select and quickly enter previous messages.
2. Fixed the spell check feature, which can now be turned off in settings.
3. Text copied from Chatbox will be copied to the clipboard as plain text without background color — a longstanding minor bug that has finally been resolved.

### v1.2.2

1. **Thread Archiving** (refreshes context) and Thread History List.
2. Introduced support for the **Google Gemini** model.
3. Introduced support for the **Ollama**, enabling easy access to locally deployed models such as llama2, mistral, mixtral, codellama, vicuna, yi, and solar.
4. Fixed an issue where the fullscreen window would not restore to fullscreen on the second launch.

### v1.2.1

1. Redesigned the message editing dialog
2. Fixed an issue where token configurations could not be saved
3. Fixed the positioning issue with newly copied conversations
4. Simplified the tips in settings
5. Optimized some interaction issues
6. Fixed several other issues

### v1.2.0

- Added an image generation feature (Image Creator); you can now generate images within Chatbox, powered by the Dall-E-3 model.
- Improved some usability issues.

### v1.1.4

- Added direct support for the gpt-3.5-turbo-1106 and gpt-4-1106-preview models.
- Updated the method for calculating message tokens to be more accurate.
- Introduced the Top P parameter option.
- The temperature parameter now supports two decimal places.
- The software now retains the last conversation upon startup.

### v1.1.2

- Optimized the interaction experience of the search box
- Fixed the scrolling issue with new messages
- Fixed some network related issues

### v1.1.1

- Fixed an issue where message content cannot be selected during generation process
- Improved the performance of the search function, making it faster and more accurate
- Adjusted the layout style of messages
- Fixed some other minor issues

### v1.1.0

- Now you can search messages from current chat or all chats
- Data backup and restore (data import/export)
- Fixed some minor issues

### v1.0.4

- Keep the previous window size and position upon startup (#30)
- Hide the system menu bar (for Windows, Linux)
- Fixed an issue with session-specific settings causing license and other settings abnormalities (#31)
- Adjusted some UI details

### v1.0.2

- Automatically move cursor to the bottom of the input box when quoting a message.
- Fixed the issue of resetting context length setting when switching models (#956).
- Automatically compatible with various Azure Endpoint configurations (#952).

### v1.0.0

- Support OpenAI custom models (#28)
- The up arrow key can quickly input the previously sent message.
- Added x64 and arm64 architecture versions to Windows and Linux installation packages.
- Fixed issue in session settings of Azure OpenAI where the model deployment name could not be modified (#927).
- Fixed issue with inability to enter spaces and line breaks when modifying default prompt (#942).
- Fixed scrolling issue after editing long messages.
- Fixed various other minor issues.

### v0.6.7

- Action buttons on messages now remain visible during list scrolling
- Added support for the Claude series models (beta)
- Language support expanded to include more countries
- Fixed some minor issues

### v0.6.5

- Added application shortcuts for quickly showing/hiding windows, switching conversations, etc. See the settings page for details.
- Introduced a new setting for the maximum amount of context messages, allowing more flexible control of the context message count and saving token usage.
- Added support for OpenAI 0301 and 0314 model series.
- Added a temperature setting in the conversation special settings.
- Fixed some minor issues.

### v0.6.3

- Added support for modifying model settings for each conversation (this allows different sessions to use different models)
- Optimized performance when handling large amounts of data
- Made the UI more compact
- Fixed several minor issues

### v0.6.2

- Added bulk cleaning feature for conversation lists
- Support for displaying token usage of messages
- Support for modifying the default prompt for new conversations
- Support for setting smaller font sizes
- Fixed a few other minor issues

### v0.6.1

- Improved software stability and performance
- More user-friendly error messages
- Use system language during initialization
- Fixed occasional installation errors and white screen issues on Windows
- Fixed compatibility issues related to configuration saving on MacOS 10
- Fixed performance issues on Linux
- Fixed network issues with API Host when using the HTTP protocol

### v0.5.6

- Improved window selection strategy for message contexts
- Enhanced settings for message context and generated message max tokens
- Fixed some minor issues

### v0.5.2

- Fix settings saving issue on Windows 11
- Optimize loading animation for message generation
- Resolve some other issues

### v0.5.1

- Fixed the issue of saving settings in Windows 11

### v0.5.0

- Built-in AI service "Chatbox AI" - ready to use out of the box with fast, hassle-free setup.
- Fixed the issue where the night theme would not work after restarting
- Fix the issue of being unable to switch sessions while generating answers
- Fixed lag issues when editing messages
- Fixed issues with conversation name changes and cleared messages reappearing after clearing messages
- Fixed several other minor issues

### 0.4.5

- Added "My Copilots" feature 🚀🚀🚀
- A large number of AI copilots are ready to work with you
- You can also create your own AI copilot through prompts
- Added support for ChatGLM-6B
- Fixed some known minor issues

### v0.4.4

- Added support for Microsoft Azure OpenAI API
- Fixed some minor known issues

`

export default changelog
