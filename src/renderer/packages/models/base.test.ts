import { Message } from 'src/shared/types'
import Base from './base'

// Define your tests
describe('SequenceMessages', () => {
    // Each test case
    const cases: {
        name: string
        input: Message[]
        expected: Message[]
    }[] = [
        {
            name: 'should sequence messages correctly',
            input: [
                { id: '', role: 'system', content: 'S1' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A1' },
                { id: '', role: 'assistant', content: 'A2' },
                { id: '', role: 'user', content: 'U2' },
                { id: '', role: 'assistant', content: 'A3' },
                { id: '', role: 'system', content: 'S2' },
            ],
            expected: [
                { id: '', role: 'system', content: 'S1\n\nS2' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A1\n\nA2' },
                { id: '', role: 'user', content: 'U2' },
                { id: '', role: 'assistant', content: 'A3' },
            ],
        },
        {
            name: '助手先于用户发言',
            input: [
                { id: '', role: 'system', content: 'S1' },
                {
                    id: '',
                    role: 'assistant',
                    content: `L1
L2
L3

`,
                },
                { id: '', role: 'assistant', content: 'A2' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A3' },
            ],
            expected: [
                { id: '', role: 'system', content: 'S1' },
                {
                    id: '',
                    role: 'user',
                    content: `> L1
> L2
> L3
> 
> 
`,
                },
                { id: '', role: 'assistant', content: 'A2' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A3' },
            ],
        },
        {
            name: '没有系统消息',
            input: [
                { id: '', role: 'assistant', content: 'A1' },
                { id: '', role: 'assistant', content: 'A2' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A3' },
            ],
            expected: [
                { id: '', role: 'user', content: '> A1\n' },
                { id: '', role: 'assistant', content: 'A2' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A3' },
            ],
        },
        {
            name: '没有系统消息 2',
            input: [
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A1' },
                { id: '', role: 'user', content: 'U2' },
                { id: '', role: 'assistant', content: 'A2' },
            ],
            expected: [
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A1' },
                { id: '', role: 'user', content: 'U2' },
                { id: '', role: 'assistant', content: 'A2' },
            ],
        },
        {
            name: '去除空消息',
            input: [
                { id: '', role: 'system', content: '' },
                { id: '', role: 'user', content: '' },
                { id: '', role: 'assistant', content: 'A1' },
                { id: '', role: 'user', content: '' },
                { id: '', role: 'assistant', content: 'A2' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A3' },
            ],
            expected: [
                { id: '', role: 'user', content: '> A1\n' },
                { id: '', role: 'assistant', content: 'A2' },
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'assistant', content: 'A3' },
            ],
        },
        {
            name: '只有 user 消息',
            input: [
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'user', content: 'U2' },
            ],
            expected: [{ id: '', role: 'user', content: 'U1\n\nU2' }],
        },
        {
            name: '只有 assistant 消息',
            input: [
                { id: '', role: 'assistant', content: 'A1' },
                { id: '', role: 'assistant', content: 'A2' },
            ],
            expected: [
                { id: '', role: 'user', content: '> A1\n' },
                { id: '', role: 'assistant', content: 'A2' },
            ],
        },
        {
            name: '只有一条 assistant 消息，应该转化成 user 消息',
            input: [{ id: '', role: 'assistant', content: 'A1' }],
            expected: [{ id: '', role: 'user', content: '> A1\n' }],
        },
        {
            name: '只有一条不为空的 assistant 消息，应该转化成 user 消息',
            input: [
                { id: '', role: 'user', content: '' },
                { id: '', role: 'assistant', content: 'A1' },
                { id: '', role: 'user', content: '' },
            ],
            expected: [{ id: '', role: 'user', content: '> A1\n' }],
        },
        {
            name: '只有一条 system 消息，应该转化成 user 消息',
            input: [{ id: '', role: 'system', content: 'S1' }],
            expected: [{ id: '', role: 'user', content: 'S1' }],
        },
        {
            name: '只有一条不为空的 system 消息，应该转化成 user 消息',
            input: [
                { id: '', role: 'system', content: '' },
                { id: '', role: 'user', content: '' },
                { id: '', role: 'system', content: 'S1' },
                { id: '', role: 'user', content: '' },
                { id: '', role: 'user', content: '' },
                { id: '', role: 'assistant', content: '' },
            ],
            expected: [{ id: '', role: 'user', content: 'S1' }],
        },
        {
            name: '合并图片',
            input: [
                { id: '', role: 'user', content: 'U1' },
                { id: '', role: 'user', content: 'U2', pictures: [{ url: 'url1' }] },
                { id: '', role: 'user', content: 'U3', pictures: [{ url: 'url2' }] },
                { id: '', role: 'user', content: 'U4', pictures: [] },
            ],
            expected: [
                { id: '', role: 'user', content: 'U1\n\nU2\n\nU3\n\nU4', pictures: [{ url: 'url1' }, { url: 'url2' }] },
            ],
        },
    ]
    cases.forEach(({ name, input, expected }) => {
        test(name, () => {
            const base = new Base()
            const got = base.sequenceMessages(input as any)

            expect(got.length).toBe(expected.length)

            got.forEach((gotMessage, index) => {
                const expectedMessage = expected[index]
                // If you have an isEqual method, you can use it here, or manually compare properties like this:
                expect(gotMessage).toEqual(expectedMessage)
            })
        })
    })
})
