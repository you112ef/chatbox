import { MCPVirtualService, MCPVirtualTool, MCPVirtualResource, MCPVirtualPrompt } from './enhanced-types'

export class VirtualMCPServiceFactory {
  static createFilesystemService(): MCPVirtualService {
    return {
      id: 'virtual-filesystem',
      name: 'Virtual Filesystem',
      description: 'A comprehensive virtual filesystem service for testing and development',
      version: '1.0.0',
      category: 'development',
      capabilities: ['file_operations', 'directory_traversal', 'file_search', 'permissions'],
      tools: [
        {
          name: 'read_file',
          description: 'Read contents of a file from the virtual filesystem',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file to read' },
              encoding: { type: 'string', description: 'File encoding (default: utf-8)', default: 'utf-8' },
            },
            required: ['path'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'File contents' },
              size: { type: 'number', description: 'File size in bytes' },
              encoding: { type: 'string', description: 'File encoding' },
              lastModified: { type: 'number', description: 'Last modified timestamp' },
            },
          },
          category: 'file',
          examples: [
            {
              name: 'Read text file',
              description: 'Read a simple text file',
              input: { path: '/documents/readme.txt' },
              expectedOutput: { 
                content: '# Virtual Filesystem\nThis is a virtual file.', 
                size: 45, 
                encoding: 'utf-8',
                lastModified: Date.now()
              },
            },
          ],
          isAsync: false,
          timeout: 5000,
        },
        {
          name: 'write_file',
          description: 'Write content to a file in the virtual filesystem',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path where to write the file' },
              content: { type: 'string', description: 'Content to write' },
              encoding: { type: 'string', description: 'File encoding (default: utf-8)', default: 'utf-8' },
              createDirectories: { type: 'boolean', description: 'Create parent directories if they don\'t exist', default: true },
            },
            required: ['path', 'content'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', description: 'Whether the operation succeeded' },
              size: { type: 'number', description: 'Number of bytes written' },
              path: { type: 'string', description: 'Actual path where file was written' },
            },
          },
          category: 'file',
          examples: [
            {
              name: 'Write text file',
              description: 'Write content to a new file',
              input: { 
                path: '/documents/example.txt', 
                content: 'Hello, Virtual World!',
                createDirectories: true
              },
              expectedOutput: { 
                success: true, 
                size: 20, 
                path: '/documents/example.txt'
              },
            },
          ],
          isAsync: false,
          timeout: 5000,
        },
        {
          name: 'list_directory',
          description: 'List contents of a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the directory to list' },
              recursive: { type: 'boolean', description: 'Whether to list recursively', default: false },
              includeHidden: { type: 'boolean', description: 'Whether to include hidden files', default: false },
            },
            required: ['path'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              files: { 
                type: 'array', 
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    path: { type: 'string' },
                    type: { type: 'string', enum: ['file', 'directory'] },
                    size: { type: 'number' },
                    lastModified: { type: 'number' },
                    permissions: { type: 'string' },
                  },
                },
              },
              totalFiles: { type: 'number' },
              totalDirectories: { type: 'number' },
            },
          },
          category: 'file',
          examples: [
            {
              name: 'List directory contents',
              description: 'List files and directories in a folder',
              input: { path: '/documents', recursive: false },
              expectedOutput: { 
                files: [
                  { name: 'readme.txt', path: '/documents/readme.txt', type: 'file', size: 45, lastModified: Date.now(), permissions: 'rw-r--r--' },
                  { name: 'subfolder', path: '/documents/subfolder', type: 'directory', size: 0, lastModified: Date.now(), permissions: 'rwxr-xr-x' }
                ],
                totalFiles: 1,
                totalDirectories: 1
              },
            },
          ],
          isAsync: false,
          timeout: 10000,
        },
        {
          name: 'search_files',
          description: 'Search for files by name or content',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              path: { type: 'string', description: 'Directory to search in', default: '/' },
              searchContent: { type: 'boolean', description: 'Whether to search file contents', default: false },
              caseSensitive: { type: 'boolean', description: 'Whether search is case sensitive', default: false },
              filePattern: { type: 'string', description: 'File pattern to match (e.g., *.txt)' },
            },
            required: ['query'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              results: { 
                type: 'array', 
                items: {
                  type: 'object',
                  properties: {
                    path: { type: 'string' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    size: { type: 'number' },
                    matchType: { type: 'string', enum: ['filename', 'content'] },
                    snippet: { type: 'string' },
                    score: { type: 'number' },
                  },
                },
              },
              totalResults: { type: 'number' },
              searchTime: { type: 'number' },
            },
          },
          category: 'file',
          examples: [
            {
              name: 'Search by filename',
              description: 'Search for files by name',
              input: { query: 'readme', path: '/documents' },
              expectedOutput: { 
                results: [
                  { path: '/documents/readme.txt', name: 'readme.txt', type: 'file', size: 45, matchType: 'filename', snippet: '', score: 1.0 }
                ],
                totalResults: 1,
                searchTime: 50
              },
            },
          ],
          isAsync: true,
          timeout: 30000,
        },
        {
          name: 'delete_file',
          description: 'Delete a file or directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file or directory to delete' },
              recursive: { type: 'boolean', description: 'Whether to delete directories recursively', default: false },
            },
            required: ['path'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              deletedItems: { type: 'number', description: 'Number of items deleted' },
            },
          },
          category: 'file',
          examples: [
            {
              name: 'Delete file',
              description: 'Delete a single file',
              input: { path: '/documents/example.txt' },
              expectedOutput: { success: true, deletedItems: 1 },
            },
          ],
          isAsync: false,
          timeout: 5000,
        },
      ],
      resources: [
        {
          uri: 'virtual://filesystem/root',
          name: 'Virtual Filesystem Root',
          description: 'Root directory of the virtual filesystem',
          mimeType: 'application/x-directory',
          metadata: {
            type: 'directory',
            permissions: 'rwxr-xr-x',
            owner: 'virtual',
            group: 'virtual',
          },
        },
      ],
      prompts: [
        {
          name: 'file_analysis',
          description: 'Analyze file contents and provide insights',
          arguments: [
            {
              name: 'file_path',
              description: 'Path to the file to analyze',
              required: true,
              type: 'string',
            },
            {
              name: 'analysis_type',
              description: 'Type of analysis to perform',
              required: false,
              type: 'string',
            },
          ],
          template: 'Analyze the file at {{file_path}} and provide {{analysis_type || "general"}} insights about its contents, structure, and purpose.',
          examples: [
            {
              name: 'Code analysis',
              description: 'Analyze a code file',
              arguments: { file_path: '/src/main.js', analysis_type: 'code quality' },
              template: 'Analyze the code file at /src/main.js and provide code quality insights about its contents, structure, and purpose.',
            },
          ],
        },
      ],
      status: 'available',
      configuration: {
        transport: {
          type: 'stdio',
          command: 'node',
          args: ['-e', 'console.log("Virtual Filesystem Service")'],
        },
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedExtensions: ['.txt', '.js', '.ts', '.json', '.md', '.py', '.html', '.css'],
        rootPath: '/virtual',
      },
      metadata: {
        author: 'Chatbox Team',
        homepage: 'https://github.com/chatboxai/chatbox',
        repository: 'https://github.com/chatboxai/chatbox',
        license: 'MIT',
        tags: ['filesystem', 'virtual', 'development', 'testing'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  }

  static createDatabaseService(): MCPVirtualService {
    return {
      id: 'virtual-database',
      name: 'Virtual Database',
      description: 'A virtual database service for testing SQL operations and data management',
      version: '1.0.0',
      category: 'development',
      capabilities: ['database_operations', 'query_execution', 'schema_management', 'transactions'],
      tools: [
        {
          name: 'execute_query',
          description: 'Execute a SQL query on the virtual database',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL query to execute' },
              params: { 
                type: 'array', 
                description: 'Query parameters',
                items: { type: 'string' }
              },
              database: { type: 'string', description: 'Database name', default: 'default' },
            },
            required: ['query'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              rows: { type: 'array', description: 'Query result rows' },
              rowCount: { type: 'number', description: 'Number of rows returned' },
              columns: { type: 'array', description: 'Column names' },
              executionTime: { type: 'number', description: 'Query execution time in ms' },
            },
          },
          category: 'database',
          examples: [
            {
              name: 'Select query',
              description: 'Execute a SELECT query',
              input: { query: 'SELECT * FROM users WHERE age > ?', params: ['18'], database: 'test' },
              expectedOutput: { 
                rows: [
                  { id: 1, name: 'John', age: 25, email: 'john@example.com' },
                  { id: 2, name: 'Jane', age: 30, email: 'jane@example.com' }
                ],
                rowCount: 2,
                columns: ['id', 'name', 'age', 'email'],
                executionTime: 15
              },
            },
          ],
          isAsync: true,
          timeout: 30000,
        },
        {
          name: 'create_table',
          description: 'Create a new table in the virtual database',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: { type: 'string', description: 'Name of the table to create' },
              columns: { 
                type: 'array', 
                description: 'Table column definitions',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    nullable: { type: 'boolean', default: true },
                    primaryKey: { type: 'boolean', default: false },
                    unique: { type: 'boolean', default: false },
                  },
                },
              },
              database: { type: 'string', description: 'Database name', default: 'default' },
            },
            required: ['tableName', 'columns'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              tableName: { type: 'string' },
              columns: { type: 'number' },
            },
          },
          category: 'database',
          examples: [
            {
              name: 'Create users table',
              description: 'Create a users table with basic columns',
              input: { 
                tableName: 'users',
                columns: [
                  { name: 'id', type: 'INTEGER', primaryKey: true, nullable: false },
                  { name: 'name', type: 'VARCHAR(100)', nullable: false },
                  { name: 'email', type: 'VARCHAR(255)', unique: true, nullable: false },
                  { name: 'age', type: 'INTEGER', nullable: true }
                ],
                database: 'test'
              },
              expectedOutput: { success: true, tableName: 'users', columns: 4 },
            },
          ],
          isAsync: false,
          timeout: 10000,
        },
        {
          name: 'insert_data',
          description: 'Insert data into a table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: { type: 'string', description: 'Name of the table' },
              data: { 
                type: 'array', 
                description: 'Data rows to insert',
                items: { type: 'object' }
              },
              database: { type: 'string', description: 'Database name', default: 'default' },
            },
            required: ['tableName', 'data'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              insertedRows: { type: 'number' },
              generatedIds: { type: 'array', items: { type: 'number' } },
            },
          },
          category: 'database',
          examples: [
            {
              name: 'Insert user data',
              description: 'Insert user records into the users table',
              input: { 
                tableName: 'users',
                data: [
                  { name: 'John Doe', email: 'john@example.com', age: 25 },
                  { name: 'Jane Smith', email: 'jane@example.com', age: 30 }
                ],
                database: 'test'
              },
              expectedOutput: { success: true, insertedRows: 2, generatedIds: [1, 2] },
            },
          ],
          isAsync: false,
          timeout: 10000,
        },
        {
          name: 'get_schema',
          description: 'Get database schema information',
          inputSchema: {
            type: 'object',
            properties: {
              database: { type: 'string', description: 'Database name', default: 'default' },
              tableName: { type: 'string', description: 'Specific table name (optional)' },
            },
          },
          outputSchema: {
            type: 'object',
            properties: {
              tables: { 
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    columns: { type: 'array' },
                    indexes: { type: 'array' },
                    rowCount: { type: 'number' },
                  },
                },
              },
            },
          },
          category: 'database',
          examples: [
            {
              name: 'Get all tables',
              description: 'Get schema for all tables in the database',
              input: { database: 'test' },
              expectedOutput: { 
                tables: [
                  {
                    name: 'users',
                    columns: [
                      { name: 'id', type: 'INTEGER', primaryKey: true },
                      { name: 'name', type: 'VARCHAR(100)' },
                      { name: 'email', type: 'VARCHAR(255)' },
                      { name: 'age', type: 'INTEGER' }
                    ],
                    indexes: [],
                    rowCount: 2
                  }
                ]
              },
            },
          ],
          isAsync: false,
          timeout: 5000,
        },
      ],
      resources: [
        {
          uri: 'virtual://database/default',
          name: 'Default Database',
          description: 'Default virtual database instance',
          mimeType: 'application/x-sqlite3',
          metadata: {
            type: 'database',
            engine: 'sqlite',
            version: '3.40.0',
          },
        },
      ],
      prompts: [
        {
          name: 'query_optimization',
          description: 'Optimize a SQL query for better performance',
          arguments: [
            {
              name: 'query',
              description: 'SQL query to optimize',
              required: true,
              type: 'string',
            },
            {
              name: 'context',
              description: 'Additional context about the query',
              required: false,
              type: 'string',
            },
          ],
          template: 'Analyze and optimize the following SQL query for better performance:\n\n{{query}}\n\nContext: {{context || "No additional context provided"}}',
          examples: [
            {
              name: 'Optimize SELECT query',
              description: 'Optimize a complex SELECT query',
              arguments: { 
                query: 'SELECT * FROM users WHERE age > 18 AND city = "New York"',
                context: 'Large table with millions of records'
              },
              template: 'Analyze and optimize the following SQL query for better performance:\n\nSELECT * FROM users WHERE age > 18 AND city = "New York"\n\nContext: Large table with millions of records',
            },
          ],
        },
      ],
      status: 'available',
      configuration: {
        transport: {
          type: 'stdio',
          command: 'node',
          args: ['-e', 'console.log("Virtual Database Service")'],
        },
        maxQueryTime: 30000,
        maxResults: 10000,
        enableTransactions: true,
        defaultDatabase: 'default',
      },
      metadata: {
        author: 'Chatbox Team',
        homepage: 'https://github.com/chatboxai/chatbox',
        repository: 'https://github.com/chatboxai/chatbox',
        license: 'MIT',
        tags: ['database', 'sql', 'virtual', 'development', 'testing'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  }

  static createWebService(): MCPVirtualService {
    return {
      id: 'virtual-web',
      name: 'Virtual Web Service',
      description: 'A virtual web service for testing HTTP operations and web scraping',
      version: '1.0.0',
      category: 'development',
      capabilities: ['http_requests', 'web_scraping', 'api_testing', 'content_parsing'],
      tools: [
        {
          name: 'http_request',
          description: 'Make HTTP requests to virtual endpoints',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to request' },
              method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
              headers: { type: 'object', description: 'HTTP headers' },
              body: { type: 'string', description: 'Request body' },
              timeout: { type: 'number', description: 'Request timeout in ms', default: 10000 },
            },
            required: ['url'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              status: { type: 'number', description: 'HTTP status code' },
              headers: { type: 'object', description: 'Response headers' },
              body: { type: 'string', description: 'Response body' },
              size: { type: 'number', description: 'Response size in bytes' },
              duration: { type: 'number', description: 'Request duration in ms' },
            },
          },
          category: 'web',
          examples: [
            {
              name: 'GET request',
              description: 'Make a GET request to a virtual API',
              input: { url: 'https://api.virtual.com/users', method: 'GET' },
              expectedOutput: { 
                status: 200, 
                headers: { 'content-type': 'application/json' },
                body: '{"users": [{"id": 1, "name": "John"}]}',
                size: 35,
                duration: 150
              },
            },
          ],
          isAsync: true,
          timeout: 30000,
        },
        {
          name: 'scrape_website',
          description: 'Scrape content from a virtual website',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to scrape' },
              selectors: { type: 'object', description: 'CSS selectors for content extraction' },
              waitFor: { type: 'number', description: 'Wait time in ms before scraping', default: 1000 },
            },
            required: ['url'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Page title' },
              content: { type: 'string', description: 'Extracted content' },
              links: { type: 'array', description: 'Found links' },
              images: { type: 'array', description: 'Found images' },
            },
          },
          category: 'web',
          examples: [
            {
              name: 'Scrape news article',
              description: 'Scrape content from a virtual news website',
              input: { 
                url: 'https://news.virtual.com/article/123',
                selectors: { title: 'h1', content: '.article-content' }
              },
              expectedOutput: { 
                title: 'Virtual News Article',
                content: 'This is a virtual news article content...',
                links: ['https://news.virtual.com/related'],
                images: ['https://news.virtual.com/image.jpg']
              },
            },
          ],
          isAsync: true,
          timeout: 30000,
        },
      ],
      resources: [
        {
          uri: 'virtual://web/api',
          name: 'Virtual API Endpoint',
          description: 'Virtual REST API for testing',
          mimeType: 'application/json',
          metadata: {
            type: 'api',
            version: 'v1',
            baseUrl: 'https://api.virtual.com',
          },
        },
      ],
      prompts: [
        {
          name: 'api_documentation',
          description: 'Generate API documentation from endpoint analysis',
          arguments: [
            {
              name: 'endpoint',
              description: 'API endpoint to document',
              required: true,
              type: 'string',
            },
            {
              name: 'method',
              description: 'HTTP method',
              required: false,
              type: 'string',
            },
          ],
          template: 'Generate comprehensive API documentation for the {{method || "GET"}} {{endpoint}} endpoint, including request/response schemas, examples, and usage guidelines.',
          examples: [
            {
              name: 'Document users endpoint',
              description: 'Document the users API endpoint',
              arguments: { endpoint: '/api/users', method: 'GET' },
              template: 'Generate comprehensive API documentation for the GET /api/users endpoint, including request/response schemas, examples, and usage guidelines.',
            },
          ],
        },
      ],
      status: 'available',
      configuration: {
        transport: {
          type: 'stdio',
          command: 'node',
          args: ['-e', 'console.log("Virtual Web Service")'],
        },
        maxResponseSize: 10 * 1024 * 1024, // 10MB
        userAgent: 'Virtual-Web-Service/1.0',
        followRedirects: true,
        maxRedirects: 5,
      },
      metadata: {
        author: 'Chatbox Team',
        homepage: 'https://github.com/chatboxai/chatbox',
        repository: 'https://github.com/chatboxai/chatbox',
        license: 'MIT',
        tags: ['web', 'http', 'scraping', 'api', 'virtual', 'development'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  }

  static createAIService(): MCPVirtualService {
    return {
      id: 'virtual-ai',
      name: 'Virtual AI Service',
      description: 'A virtual AI service for testing AI operations and model interactions',
      version: '1.0.0',
      category: 'development',
      capabilities: ['text_generation', 'text_analysis', 'embeddings', 'classification'],
      tools: [
        {
          name: 'generate_text',
          description: 'Generate text using virtual AI models',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'Text prompt for generation' },
              model: { type: 'string', description: 'AI model to use', default: 'virtual-gpt' },
              maxTokens: { type: 'number', description: 'Maximum tokens to generate', default: 100 },
              temperature: { type: 'number', description: 'Generation temperature', default: 0.7 },
            },
            required: ['prompt'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Generated text' },
              tokens: { type: 'number', description: 'Number of tokens generated' },
              model: { type: 'string', description: 'Model used' },
              finishReason: { type: 'string', description: 'Reason for completion' },
            },
          },
          category: 'ai',
          examples: [
            {
              name: 'Generate story',
              description: 'Generate a short story',
              input: { 
                prompt: 'Write a short story about a robot learning to paint',
                model: 'virtual-gpt',
                maxTokens: 200
              },
              expectedOutput: { 
                text: 'Once upon a time, there was a robot named ARIA who discovered the joy of painting...',
                tokens: 45,
                model: 'virtual-gpt',
                finishReason: 'stop'
              },
            },
          ],
          isAsync: true,
          timeout: 30000,
        },
        {
          name: 'analyze_text',
          description: 'Analyze text for sentiment, topics, and other insights',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to analyze' },
              analysisType: { 
                type: 'string', 
                enum: ['sentiment', 'topics', 'entities', 'summary', 'all'],
                default: 'all'
              },
            },
            required: ['text'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              sentiment: { type: 'object', description: 'Sentiment analysis results' },
              topics: { type: 'array', description: 'Detected topics' },
              entities: { type: 'array', description: 'Named entities' },
              summary: { type: 'string', description: 'Text summary' },
            },
          },
          category: 'ai',
          examples: [
            {
              name: 'Analyze sentiment',
              description: 'Analyze sentiment of customer feedback',
              input: { 
                text: 'I love this product! It works perfectly and exceeded my expectations.',
                analysisType: 'sentiment'
              },
              expectedOutput: { 
                sentiment: { 
                  score: 0.9, 
                  label: 'positive', 
                  confidence: 0.95 
                },
                topics: ['product', 'satisfaction'],
                entities: [],
                summary: 'Positive customer feedback about product satisfaction'
              },
            },
          ],
          isAsync: true,
          timeout: 15000,
        },
      ],
      resources: [
        {
          uri: 'virtual://ai/models',
          name: 'Virtual AI Models',
          description: 'Available virtual AI models',
          mimeType: 'application/json',
          metadata: {
            type: 'model_registry',
            models: ['virtual-gpt', 'virtual-claude', 'virtual-gemini'],
          },
        },
      ],
      prompts: [
        {
          name: 'creative_writing',
          description: 'Generate creative content based on prompts',
          arguments: [
            {
              name: 'genre',
              description: 'Writing genre or style',
              required: true,
              type: 'string',
            },
            {
              name: 'theme',
              description: 'Theme or topic',
              required: false,
              type: 'string',
            },
          ],
          template: 'Write a {{genre}} piece about {{theme || "a compelling story"}}. Make it engaging, creative, and well-structured.',
          examples: [
            {
              name: 'Science fiction story',
              description: 'Generate a science fiction story',
              arguments: { genre: 'science fiction short story', theme: 'time travel' },
              template: 'Write a science fiction short story piece about time travel. Make it engaging, creative, and well-structured.',
            },
          ],
        },
      ],
      status: 'available',
      configuration: {
        transport: {
          type: 'stdio',
          command: 'node',
          args: ['-e', 'console.log("Virtual AI Service")'],
        },
        maxTokens: 4000,
        defaultModel: 'virtual-gpt',
        enableStreaming: true,
        cacheResponses: true,
      },
      metadata: {
        author: 'Chatbox Team',
        homepage: 'https://github.com/chatboxai/chatbox',
        repository: 'https://github.com/chatboxai/chatbox',
        license: 'MIT',
        tags: ['ai', 'nlp', 'generation', 'analysis', 'virtual', 'development'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  }

  static getAllVirtualServices(): MCPVirtualService[] {
    return [
      this.createFilesystemService(),
      this.createDatabaseService(),
      this.createWebService(),
      this.createAIService(),
    ]
  }
}