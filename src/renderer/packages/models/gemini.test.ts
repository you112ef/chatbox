import { Message } from 'src/shared/types'
import { populateGeminiMessages } from './gemini'

describe('populateGeminiMessages', () => {
  it('should populate Gemini messages correctly', async () => {
    const messages: Message[] = [
      { id: '', role: 'system', content: 'S1' },
      { id: '', role: 'user', content: 'U1' },
      { id: '', role: 'assistant', content: 'A1' },
      { id: '', role: 'user', content: 'U2' },
      { id: '', role: 'assistant', content: 'A2' },
      { id: '', role: 'user', content: 'U3' },
    ]
    const result = await populateGeminiMessages(messages, 'gemini-1.5-pro-latest')
    expect(result).toEqual({
      contents: [
        { role: 'user', parts: [{ text: 'U1' }] },
        { role: 'model', parts: [{ text: 'A1' }] },
        { role: 'user', parts: [{ text: 'U2' }] },
        { role: 'model', parts: [{ text: 'A2' }] },
        { role: 'user', parts: [{ text: 'U3' }] },
      ],
      systemInstruction: 'S1',
    })
  })

  it('should handle empty messages array correctly', async () => {
    const messages: Message[] = []
    const result = await populateGeminiMessages(messages, 'gemini-1.5-pro-latest')
    expect(result).toEqual({
      contents: [],
      systemInstruction: '',
    })
  })

  it('should populate Gemini messages correctly', async () => {
    const messages: Message[] = [
      { id: '', role: 'assistant', content: 'A1' },
      { id: '', role: 'user', content: 'U1' },
      { id: '', role: 'system', content: 'S1' },
      { id: '', role: 'user', content: 'U2.1' },
      { id: '', role: 'user', content: 'U2.2' },
      { id: '', role: 'user', content: 'U2.3' },
      { id: '', role: 'assistant', content: 'A2' },
      { id: '', role: 'user', content: 'U3' },
    ]
    const result = await populateGeminiMessages(messages, 'gemini-1.5-pro-latest')
    expect(result).toEqual({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'U1' }, { text: 'U2.1' }, { text: 'U2.2' }, { text: 'U2.3' }],
        },
        { role: 'model', parts: [{ text: 'A2' }] },
        { role: 'user', parts: [{ text: 'U3' }] },
      ],
      systemInstruction: 'S1',
    })
  })
})
