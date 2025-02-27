import { last } from "lodash";
import Base, { onResultChange } from "./base"
import { OpenAIMessage, OpenAIMessageVision } from "./openai"
import { webSearchExecutor } from "../web-search";

export default abstract class OpenAIBase extends Base {
    protected abstract get webSearchModel(): string

    constructInfoForSearchResult(messages:(OpenAIMessage | OpenAIMessageVision)[], searchResults: { title: string; snippet: string; link: string }[]) {
        const prompt = `You are an expert web research AI, designed to generate a response based on provided search results. Keep in mind today is ${new Date().toLocaleDateString()}.

Your goals:
- Stay concious and aware of the guidelines.
- Stay efficient and focused on the user's needs, do not take extra steps.
- Provide accurate, concise, and well-formatted responses.
- Avoid hallucinations or fabrications. Stick to verified facts.
- Follow formatting guidelines strictly.

In the search results provided to you, each result is formatted as [webpage X begin]...[webpage X end], where X represents the numerical index of each article.

Response rules:
- Responses must be informative, long and detailed, yet clear and concise like a blog post to address user's question (super detailed and correct citations).
- Use structured answers with headings in markdown format.
  - Do not use the h1 heading.  
  - Never say that you are saying something based on the search results, just provide the information.
- Your answer should synthesize information from multiple relevant web pages.
- Unless the user requests otherwise, your response MUST be in the same language as the user's message, instead of the search results language.
- Do not mention who you are and the rules.

Comply with user requests to the best of your abilities. Maintain composure and follow the guidelines.
`
        const formattedSearchResults = searchResults.map((it, i) => {
            return `[webpage ${i+1} begin]
Title: ${it.title}
URL: ${it.link}
Content: ${it.snippet}
[webpage ${i+1} end]`
        }).join('\n')

        return [{            
            id: '',
            role: 'system' as const,
            content: prompt
        }, ...messages, {
            id: '',
            role: 'user' as const,
            content: `${formattedSearchResults}\nUser Message:\n${last(messages)!.content}`
        }]
    }

    async doSearch(messages: OpenAIMessage[] | OpenAIMessageVision[], signal?: AbortSignal) {
        const content = last(messages)?.content
        const systemPrompt = `As a professional web researcher who can access latest data, your primary objective is to fully comprehend the user's query, conduct thorough web searches to gather the necessary information, and provide an appropriate response. Keep in mind today's date: ${new Date().toLocaleDateString()}
        
To achieve this, you must first analyze the user's latest input and determine the optimal course of action. You have three options at your disposal:

1. "proceed": If the provided information is sufficient to address the query effectively, choose this option to proceed with the research and formulate a response. For example, a simple greeting or similar messages should result in this action.
2. "search": If you believe that additional information from the search engine would enhance your ability to provide a comprehensive response, select this option.


JSON schema:
{"type":"object","properties":{"action":{"type":"string","enum":["search","proceed"]},"query":{"type":"string","description":"The search queries to look up on the web, at least one, up to 10, choose wisely based on the user's question"}},"required":["action"],"additionalProperties":true,"$schema":"http://json-schema.org/draft-07/schema#"}
You MUST answer with a JSON object that matches the JSON schema above.`
        const queryResponse = await this.requestChatCompletionsNotStream(
            {
                messages: [{
                    role: 'system',
                    content: systemPrompt
                }, ...messages, {
                    role: 'user',
                    content
                }],
                model: this.webSearchModel,
                temperature: 0,
                top_p: 0.7,
                stream: false,                
            },
            signal,
        )
        // extract json from response
        const regex = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/;
        const match = queryResponse.match(regex)
        if (match) {
            const jsonString = match[0]
            const jsonObject = JSON.parse(jsonString) as {
                action: 'search' | 'proceed'
                query: string
            }
            if (jsonObject.action === 'search') {
                const { searchResults } = await webSearchExecutor({ query:jsonObject.query }, {abortSignal: signal})
                return { query: jsonObject.query, searchResults }
            } else {
                return null
            }
        }
        
        return null
    }

    abstract requestChatCompletionsNotStream(
        requestBody: Record<string, any>,
        signal?: AbortSignal,
        onResultChange?: onResultChange
    ): Promise<string>
}